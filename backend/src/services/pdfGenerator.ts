import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import SVGtoPDF from 'svg-to-pdfkit';
import { QuoteConfiguration, PricingBreakdown } from '../types';
import {
  getTechnicalApproach,
  getTimelineWeeks,
  getExecutiveSummary,
} from './pricingEngine';
import { getProblemTypeFactors } from '../data/problemTypes';
import {
  SUPPORT_HOURS_LABELS,
  SUPPORT_SLA_LABELS,
  formatSupportClause,
  formatWarrantyClause,
} from '../lib/labels';
import { sumHardwareBom } from '../lib/hardwareBom';
import { buildPdfPricingRows, groupEngineeringEffortsForPdf, groupSelectedFeatures } from '../lib/pdfFeatures';
import { getQuoteLineItemsForPaymentModel } from '../lib/paymentModel';

export interface PdfQuoteData {
  quoteNumber: string;
  createdAt: Date;
  validUntil: Date;
  config: QuoteConfiguration;
  pricing: PricingBreakdown;
  currency: string;
}

const MI_RED = '#DA2128';
const MI_NAVY = '#0C2C46';
const MI_DARK = '#231F20';
const MI_MUTED = '#6C5E62';
const PAGE_BOTTOM = 760;
const PDF_DIR = process.env.PDF_STORAGE_PATH || path.join(__dirname, '../../pdfs');
const LOGO_PATH = path.join(__dirname, '../../assets/motherson-logo.svg');
const LOGO_WIDTH = 200;
const LOGO_HEIGHT = LOGO_WIDTH * (119.38 / 526.44);

let cachedLogoSvg: string | null = null;

function getLogoSvg(): string {
  if (!cachedLogoSvg) {
    cachedLogoSvg = fs.readFileSync(LOGO_PATH, 'utf8');
  }
  return cachedLogoSvg;
}

function renderLogo(doc: InstanceType<typeof PDFDocument>, x: number, y: number): void {
  SVGtoPDF(doc, getLogoSvg(), x, y, { width: LOGO_WIDTH, height: LOGO_HEIGHT });
}

function renderPdfHeader(doc: InstanceType<typeof PDFDocument>, clientName: string): number {
  doc.rect(50, 45, 495, 3).fill(MI_RED);
  renderLogo(doc, 50, 52);
  doc.fontSize(9).fillColor(MI_MUTED).text('Proud to be part of the future.', 50, 52 + LOGO_HEIGHT + 6);
  doc.fontSize(12).fillColor(MI_RED).text(`Prepared for: ${clientName}`, 50, 52 + LOGO_HEIGHT + 22);
  doc.moveTo(50, 52 + LOGO_HEIGHT + 38).lineTo(545, 52 + LOGO_HEIGHT + 38).stroke(MI_RED);
  return 52 + LOGO_HEIGHT + 48;
}

function ensureSpace(doc: InstanceType<typeof PDFDocument>, y: number, needed: number): number {
  if (y + needed > PAGE_BOTTOM) {
    doc.addPage();
    return 50;
  }
  return y;
}

function writeSectionTitle(doc: InstanceType<typeof PDFDocument>, title: string, y: number): number {
  y = ensureSpace(doc, y, 30);
  doc.font('Helvetica-Bold').fontSize(13).fillColor(MI_NAVY).text(title, 50, y);
  doc.font('Helvetica');
  return y + 22;
}

function writeParagraph(doc: InstanceType<typeof PDFDocument>, text: string, y: number): number {
  y = ensureSpace(doc, y, 40);
  doc.fontSize(10).fillColor(MI_DARK).text(text, 50, y, { width: 495, align: 'justify' });
  return y + doc.heightOfString(text, { width: 495 }) + 12;
}

function writeBomTable(
  doc: InstanceType<typeof PDFDocument>,
  y: number,
  bom: { item: string; partNumber?: string; quantity: number; unitPrice: number }[],
  sym: string,
): number {
  const colWidths = [175, 75, 45, 75, 75];
  const headers = ['Item', 'Part #', 'Qty', 'Unit', 'Total'];
  y = ensureSpace(doc, y, 40);
  const tableTop = y;
  let x = 50;
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#fff');
  doc.rect(50, tableTop, 495, 18).fill(MI_NAVY);
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], x + 4, tableTop + 5, { width: colWidths[i] });
    x += colWidths[i];
  }

  let rowY = tableTop + 22;
  doc.font('Helvetica').fillColor(MI_DARK);
  for (const row of bom) {
    const lineTotal = row.quantity * row.unitPrice;
    const cells = [
      row.item,
      row.partNumber?.trim() || '—',
      String(row.quantity),
      `${sym}${row.unitPrice.toLocaleString()}`,
      `${sym}${lineTotal.toLocaleString()}`,
    ];
    const rowHeight = Math.max(
      16,
      ...cells.map((cell, i) => doc.heightOfString(cell, { width: colWidths[i] - 8 }) + 8),
    );

    if (rowY + rowHeight > PAGE_BOTTOM - 40) {
      doc.addPage();
      rowY = 50;
    }

    x = 50;
    for (let i = 0; i < cells.length; i++) {
      doc.text(cells[i], x + 4, rowY + 4, { width: colWidths[i] - 8 });
      x += colWidths[i];
    }
    rowY += rowHeight;
  }

  doc.font('Helvetica-Bold');
  doc.text('Subtotal', 50 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] - 60, rowY + 4, { width: 80, align: 'right' });
  doc.text(`${sym}${sumHardwareBom(bom).toLocaleString()}`, 50 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] - 80, rowY + 4, { width: 80, align: 'right' });
  doc.font('Helvetica');
  return rowY + 28;
}

function writeGroupedFeatureScope(
  doc: InstanceType<typeof PDFDocument>,
  coverage: string[],
  y: number,
): number {
  const groups = groupSelectedFeatures(coverage);

  for (const group of groups) {
    y = ensureSpace(doc, y, 28);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(MI_NAVY)
      .text(`${group.category} (${group.features.length})`, 50, y);
    y += 16;
    doc.font('Helvetica').fontSize(9).fillColor(MI_DARK);

    for (const feature of group.features) {
      y = ensureSpace(doc, y, 16);
      doc.text(`• ${feature}`, 62, y, { width: 475 });
      y += doc.heightOfString(`• ${feature}`, { width: 475 }) + 4;
    }
    y += 6;
  }

  return y + 4;
}

function writeGroupedEngineeringScope(
  doc: InstanceType<typeof PDFDocument>,
  breakdown: { item: string; hours: number }[],
  y: number,
): number {
  const groups = groupEngineeringEffortsForPdf(breakdown);

  for (const group of groups) {
    y = ensureSpace(doc, y, 28);
    const categoryHours = group.lines.reduce((sum, line) => sum + line.hours, 0);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(MI_NAVY)
      .text(`${group.category} (${categoryHours}h)`, 50, y);
    y += 16;
    doc.font('Helvetica').fontSize(9).fillColor(MI_DARK);

    for (const line of group.lines) {
      y = ensureSpace(doc, y, 16);
      const text = `• ${line.item} — ${line.hours}h`;
      doc.text(text, 62, y, { width: 475 });
      y += doc.heightOfString(text, { width: 475 }) + 4;
    }
    y += 6;
  }

  return y + 4;
}

function writePricingTable(
  doc: InstanceType<typeof PDFDocument>,
  y: number,
  rows: ReturnType<typeof buildPdfPricingRows>,
  footer?: { label: string; total: string },
): number {
  const colWidths = [195, 55, 45, 85, 85];
  const headers = ['Item', 'Type', 'Qty', 'Unit Price', 'Total'];
  y = ensureSpace(doc, y, 40);
  const tableTop = y;
  let x = 50;

  doc.font('Helvetica-Bold').fontSize(8).fillColor('#fff');
  doc.rect(50, tableTop, 495, 18).fill(MI_NAVY);
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], x + 4, tableTop + 5, { width: colWidths[i] });
    x += colWidths[i];
  }

  let rowY = tableTop + 22;
  doc.font('Helvetica').fillColor(MI_DARK);

  for (const row of rows) {
    doc.font('Helvetica-Bold').fontSize(9);
    const labelHeight = doc.heightOfString(row.label, { width: colWidths[0] - 8 });
    doc.font('Helvetica').fontSize(7);
    const sublabelHeight = row.sublabel
      ? doc.heightOfString(row.sublabel, { width: colWidths[0] - 8 })
      : 0;
    const firstColHeight = labelHeight + sublabelHeight + 8;
    const otherCells = [row.type, row.quantity, row.unitPrice, row.total];
    doc.font('Helvetica').fontSize(8);
    const otherHeights = otherCells.map((cell, i) =>
      doc.heightOfString(cell, { width: colWidths[i + 1] - 8 }) + 8,
    );
    const rowHeight = Math.max(firstColHeight, ...otherHeights, 16);

    if (rowY + rowHeight > PAGE_BOTTOM - 40) {
      doc.addPage();
      rowY = 50;
    }

    x = 50;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(MI_DARK)
      .text(row.label, x + 4, rowY + 4, { width: colWidths[0] - 8 });
    if (row.sublabel) {
      doc.font('Helvetica').fontSize(7).fillColor(MI_MUTED)
        .text(row.sublabel, x + 4, rowY + 4 + labelHeight, { width: colWidths[0] - 8 });
    }
    x += colWidths[0];

    for (let i = 0; i < otherCells.length; i++) {
      doc.font('Helvetica').fontSize(8).fillColor(MI_DARK)
        .text(otherCells[i], x + 4, rowY + 4, { width: colWidths[i + 1] - 8 });
      x += colWidths[i + 1];
    }
    rowY += rowHeight;
  }

  if (footer) {
    rowY = ensureSpace(doc, rowY, 28);
    doc.rect(50, rowY, 495, 22).fill('#f5f5f5');
    doc.font('Helvetica-Bold').fontSize(10).fillColor(MI_NAVY)
      .text(footer.label, 54, rowY + 6, { width: colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] - 8 });
    doc.font('Helvetica-Bold').fontSize(11).fillColor(MI_RED)
      .text(footer.total, 50 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], rowY + 5, {
        width: colWidths[4],
        align: 'right',
      });
    rowY += 28;
  }

  doc.font('Helvetica').fontSize(10).fillColor(MI_DARK);
  return rowY + 12;
}

function writeInvestmentSummary(
  doc: InstanceType<typeof PDFDocument>,
  y: number,
  data: PdfQuoteData,
  sym: string,
): number {
  const { pricing, config } = data;
  const option = pricing.paymentOption;
  const primaryTotal = pricing.taxAmount > 0 ? pricing.totalWithTax : pricing.totalContractValue;
  const primaryLabel = pricing.taxAmount > 0 ? 'TOTAL PRICE (INCL. TAX)' : 'TOTAL PRICE';
  const boxHeight = pricing.taxAmount > 0 ? 88 : 68;

  y = ensureSpace(doc, y, boxHeight + 60);

  doc.rect(50, y, 495, boxHeight).fill(MI_NAVY);
  doc.rect(50, y, 495, 3).fill(MI_RED);

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff')
    .text(option?.label ?? (config.paymentModel === 'ONE_TIME' ? 'One-Time Payment' : 'Monthly Subscription'), 62, y + 14);

  doc.font('Helvetica').fontSize(9).fillColor('#e8e8e8')
    .text(`${config.expectedLifetime}-month contract · ${data.currency}`, 62, y + 28);

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#ffffff')
    .text(primaryLabel, 62, y + (pricing.taxAmount > 0 ? 44 : 40));
  doc.font('Helvetica-Bold').fontSize(22).fillColor('#ffffff')
    .text(`${sym}${primaryTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 62, y + (pricing.taxAmount > 0 ? 58 : 52), {
      width: 471,
      align: 'right',
    });

  if (pricing.taxAmount > 0) {
    doc.font('Helvetica').fontSize(8).fillColor('#e8e8e8')
      .text(
        `Contract value ${sym}${pricing.totalContractValue.toLocaleString()} + tax ${sym}${pricing.taxAmount.toLocaleString()}`,
        62,
        y + 76,
        { width: 471, align: 'right' },
      );
  }

  y += boxHeight + 18;

  if (option) {
    doc.font('Helvetica-Bold').fontSize(10).fillColor(MI_DARK).text('Payment Schedule', 50, y);
    y += 16;
    doc.font('Helvetica').fontSize(10).fillColor(MI_DARK);

    if (option.type === 'ONE_TIME') {
      doc.text(`Due at signing: ${sym}${option.upfrontPayment.toLocaleString()}`, 58, y);
      y += 16;
    } else {
      doc.text(`Upfront at signing: ${sym}${option.upfrontPayment.toLocaleString()}`, 58, y);
      y += 14;
      doc.text(
        `Monthly subscription: ${sym}${option.recurringPayment.toLocaleString()}/mo × ${option.recurringMonths} months`,
        58,
        y,
      );
      y += 14;
      doc.font('Helvetica-Bold').fillColor(MI_NAVY)
        .text(`Total contract value: ${sym}${option.totalContractValue.toLocaleString()}`, 58, y);
      y += 16;
      doc.font('Helvetica').fillColor(MI_DARK);
    }
  }

  if (option?.type === 'MONTHLY_SUBSCRIPTION') {
    doc.fontSize(9).fillColor(MI_MUTED);
    doc.text(`Quarterly billing option (5% off): ${sym}${pricing.quarterlyFee.toLocaleString()}`, 58, y);
    y += 13;
    doc.text(`Annual billing option (15% off): ${sym}${pricing.annualFee.toLocaleString()}`, 58, y);
    y += 13;
    doc.text(`Estimated year 1 cost: ${sym}${pricing.year1Cost.toLocaleString()}`, 58, y);
    y += 18;
  }

  doc.font('Helvetica').fontSize(10).fillColor(MI_DARK);
  return y + 8;
}

function writeBullets(doc: InstanceType<typeof PDFDocument>, items: string[], y: number): number {
  for (const item of items) {
    y = ensureSpace(doc, y, 20);
    doc.fontSize(10).fillColor(MI_DARK).text(`• ${item}`, 58, y, { width: 487 });
    y += doc.heightOfString(`• ${item}`, { width: 487 }) + 6;
  }
  return y + 6;
}

export function ensurePdfDir(): void {
  if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true });
  }
}

export function getPdfPath(quoteNumber: string): string {
  return path.join(PDF_DIR, `${quoteNumber}.pdf`);
}

export async function generateProposalPdf(data: PdfQuoteData): Promise<string> {
  ensurePdfDir();
  const filePath = getPdfPath(data.quoteNumber);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const factors = getProblemTypeFactors(data.config.problemType);
    const timeline = getTimelineWeeks(data.config);
    const approach = getTechnicalApproach(data.config);
    const executiveSummary = getExecutiveSummary(data.config);
    const sym = getCurrencySymbol(data.currency);
    const clientName = data.config.clientName || 'Client';

    let y = renderPdfHeader(doc, clientName);

    doc.fontSize(10).fillColor(MI_DARK);
    doc.text(`Quote Number: ${data.quoteNumber}`, 50, y);
    doc.text(`Date: ${formatDate(data.createdAt)}`, 280, y);
    y += 15;
    doc.text(`Valid Until: ${formatDate(data.validUntil)}`, 50, y);
    doc.text(`Proposed Start: ${data.config.startDate}`, 280, y);
    y += 25;

    y = writeSectionTitle(doc, 'Executive Summary', y);
    y = writeParagraph(doc, executiveSummary, y);

    y = writeSectionTitle(doc, 'Problem Statement', y);
    y = writeParagraph(doc, data.config.problemStatement, y);

    y = writeSectionTitle(doc, 'Understanding the Challenge', y);
    y = writeParagraph(
      doc,
      `${clientName} requires a ${factors.label} capability to address operational challenges at ` +
      `${data.config.complexity} complexity. The solution must handle ${data.config.volume.toLocaleString()} ` +
      `${data.config.volumeUnit} with ${data.config.integrationComplexity.toLowerCase()} integration into existing systems. ` +
      `${factors.description}`,
      y
    );

    y = writeSectionTitle(doc, 'Proposed Solution', y);
    for (const paragraph of approach) {
      y = writeParagraph(doc, paragraph, y);
    }

    y = writeSectionTitle(doc, 'Scope & Deliverables', y);
    if (data.config.setupPricingMode === 'FEATURE_WISE') {
      y = writeGroupedFeatureScope(doc, data.config.solutionCoverage, y);
    } else {
      const breakdown = data.config.engineeringEffortBreakdown?.filter((line) => line.hours > 0) ?? [];
      if (breakdown.length > 0) {
        y = writeGroupedEngineeringScope(doc, breakdown, y);
      }
    }
    y = writeBullets(doc, [
      `Integration with existing systems (${data.config.integrationComplexity.toLowerCase()} complexity)`,
      `Production deployment targeting ${data.config.volume.toLocaleString()} ${data.config.volumeUnit}`,
      `Documentation, knowledge transfer, and handover`,
      ...(data.config.requiredLanguagesFrameworks
        ? [`Implementation using ${data.config.requiredLanguagesFrameworks}`]
        : []),
      ...(data.config.includesHardware && data.pricing.hardwareBom.length > 0
        ? [`Hardware supply & installation (${data.pricing.hardwareBom.length} BOM line${data.pricing.hardwareBom.length > 1 ? 's' : ''})`]
        : []),
    ], y);

    if (data.config.includesHardware && data.pricing.hardwareBom.length > 0) {
      y = writeSectionTitle(doc, 'Hardware Bill of Materials', y);
      y = writeBomTable(doc, y, data.pricing.hardwareBom, sym);
    }

    y = writeSectionTitle(doc, 'Project Timeline', y);
    y = writeBullets(doc, [
      `Phase 1 — Setup & Engineering: ${timeline.setup} weeks (${data.pricing.effectiveEngineeringEffort ?? data.config.engineeringEffort} engineering hours)`,
      `Phase 2 — Ramp-up & Validation: ${timeline.rampUp} weeks`,
      `Phase 3 — Steady-state Operations: ${timeline.steadyState} months contract term`,
      `Target go-live date: ${data.config.startDate}`,
    ], y);

    y = writeSectionTitle(doc, 'Support & Warranty', y);
    y = writeBullets(doc, [
      `Warranty: ${formatWarrantyClause(data.config.warrantyPeriod, data.config.warrantyUnit, data.config.coverageType)}`,
      `Support: ${formatSupportClause(data.config.supportHours, data.config.supportSLA, data.config.supportCostModel)}`,
      `Cloud platform: ${data.config.cloudProvider}`,
      `Compliance: ${data.config.complianceRequirements.filter((c) => c !== 'NONE').join(', ') || 'Standard industry practices'}`,
      ...(data.pricing.hardwareCost > 0
        ? [`Hardware BOM subtotal: ${sym}${data.pricing.hardwareCost.toLocaleString()} one-time (${data.pricing.hardwareBom.length} line${data.pricing.hardwareBom.length > 1 ? 's' : ''})`]
        : []),
    ], y);

    // Pricing page
    doc.addPage();
    y = 50;

    y = writeSectionTitle(doc, 'Investment Summary', y);
    y = writeInvestmentSummary(doc, y, data, sym);

    y = writeSectionTitle(doc, 'Detailed Pricing Breakdown', y);
    const detailRows = buildPdfPricingRows(
      getQuoteLineItemsForPaymentModel(data.pricing),
      sym,
      data.config.setupPricingMode ?? 'ENGINEERING_EFFORT',
    );
    const grandTotalLabel = data.pricing.taxAmount > 0 ? 'GRAND TOTAL (INCL. TAX)' : 'GRAND TOTAL';
    const grandTotalValue = data.pricing.taxAmount > 0
      ? `${sym}${data.pricing.totalWithTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `${sym}${data.pricing.totalContractValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    y = writePricingTable(doc, y, detailRows, {
      label: grandTotalLabel,
      total: grandTotalValue,
    });

    if (data.pricing.taxAmount > 0) {
      y = ensureSpace(doc, y, 20);
      doc.font('Helvetica').fontSize(9).fillColor(MI_MUTED)
        .text(
          `Includes ${sym}${data.pricing.taxAmount.toLocaleString()} tax on total contract value.`,
          50,
          y,
        );
      y += 16;
    }

    y = writeSectionTitle(doc, 'Terms & Conditions', y);
    const warrantyText = formatWarrantyClause(data.config.warrantyPeriod, data.config.warrantyUnit, data.config.coverageType);
    const terms = [
      `This proposal is prepared exclusively for ${clientName} and is valid until ${formatDate(data.validUntil)}.`,
      `Warranty: ${warrantyText}${data.config.warrantyPeriod > 0 ? ' — bug fixes included at no additional cost' : ''}`,
      `Support: ${SUPPORT_HOURS_LABELS[data.config.supportHours]} with ${SUPPORT_SLA_LABELS[data.config.supportSLA]} response SLA`,
      `Payment Terms: ${data.config.paymentModel === 'ONE_TIME'
        ? 'Full contract value due upfront at signing'
        : `Setup${data.pricing.hardwareCost > 0 ? ', hardware,' : ''} fee due at signing, then monthly subscription for the contract term`}`,
      `Intellectual Property: ${data.config.solutionCoverage.includes('Source code ownership') ? 'Full source code ownership transferred to client' : 'Licensed for use during contract term'}`,
      'Termination: Either party may terminate with 30 days written notice',
      `Contract Duration: ${data.config.expectedLifetime} months`,
      `Compliance: ${data.config.complianceRequirements.filter((c) => c !== 'NONE').join(', ') || 'Standard industry practices'}`,
    ];
    y = writeBullets(doc, terms, y);

    y = ensureSpace(doc, y, 120);
    y = writeSectionTitle(doc, 'Acceptance', y);
    doc.fontSize(10).fillColor(MI_DARK);
    doc.text('Prepared by: Motherson Innovations — Commercialisation Team', 50, y);
    y += 18;
    doc.text(`Date: ${formatDate(data.createdAt)}`, 50, y);
    doc.rect(50, y + 15, 120, 40).stroke('#ccc');
    doc.fontSize(8).text('Company Stamp', 75, y + 30);

    doc.fontSize(10).text(`Customer Acceptance — ${clientName}:`, 300, y);
    doc.moveTo(300, y + 55).lineTo(500, y + 55).stroke(MI_DARK);
    doc.fontSize(8).text('Authorized Signature & Date', 300, y + 60);

    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
  return symbols[currency] ?? '$';
}

export function generatePdfBuffer(data: PdfQuoteData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const factors = getProblemTypeFactors(data.config.problemType);
    const sym = getCurrencySymbol(data.currency);
    const clientName = data.config.clientName || 'Client';

    const contentStartY = renderPdfHeader(doc, clientName);
    doc.fontSize(10).fillColor(MI_DARK);
    doc.text(`Quote: ${data.quoteNumber}`, 50, contentStartY);
    doc.text(`Client: ${clientName}`, 50, contentStartY + 15);
    doc.text(`Problem: ${factors.label}`, 50, contentStartY + 30);
    doc.text(`Setup: ${sym}${data.pricing.setupFee.toLocaleString()} | MRR: ${sym}${data.pricing.monthlyFee.toLocaleString()}`, 50, contentStartY + 45);
    doc.text(`TCV: ${sym}${data.pricing.totalContractValue.toLocaleString()}`, 50, contentStartY + 60);

    doc.end();
  });
}
