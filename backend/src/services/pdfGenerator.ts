import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import SVGtoPDF from 'svg-to-pdfkit';
import { QuoteConfiguration, PricingBreakdown } from '../types';
import {
  getTechnicalApproach,
  getTimelineWeeks,
  getExecutiveSummary,
  getScopeDeliverables,
} from './pricingEngine';
import { getProblemTypeFactors } from '../data/problemTypes';
import {
  SUPPORT_HOURS_LABELS,
  SUPPORT_SLA_LABELS,
  formatSupportClause,
  formatWarrantyClause,
} from '../lib/labels';

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
    const deliverables = getScopeDeliverables(data.config);
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
    y = writeBullets(doc, deliverables, y);

    y = writeSectionTitle(doc, 'Project Timeline', y);
    y = writeBullets(doc, [
      `Phase 1 — Setup & Engineering: ${timeline.setup} weeks (${data.config.engineeringEffort} engineering hours)`,
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
    ], y);

    // Pricing page
    doc.addPage();
    y = 50;

    const option = data.pricing.paymentOption;

    y = writeSectionTitle(doc, 'Investment Summary', y);

    if (option) {
      y = ensureSpace(doc, y, 80);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(MI_DARK).text(option.label, 50, y);
      doc.font('Helvetica').fontSize(10);
      y += 18;
      doc.text(option.description, 50, y, { width: 495 });
      y += doc.heightOfString(option.description, { width: 495 }) + 12;

      if (option.type === 'ONE_TIME') {
        doc.text(`Due at signing: ${sym}${option.upfrontPayment.toLocaleString()}`, 50, y);
        y += 15;
      } else {
        doc.text(`Setup fee (upfront): ${sym}${option.upfrontPayment.toLocaleString()}`, 50, y);
        y += 15;
        doc.text(
          `Monthly subscription: ${sym}${option.recurringPayment.toLocaleString()}/mo × ${option.recurringMonths} months`,
          50,
          y
        );
        y += 15;
      }
      doc.text(`Total contract value: ${sym}${option.totalContractValue.toLocaleString()}`, 50, y);
      y += option.taxAmount > 0 ? 30 : 20;
    }

    if (option?.type === 'MONTHLY_SUBSCRIPTION') {
      doc.fontSize(9).fillColor(MI_MUTED);
      doc.text(`Quarterly billing (5% discount): ${sym}${data.pricing.quarterlyFee.toLocaleString()}`, 50, y);
      y += 14;
      doc.text(`Annual billing (15% discount): ${sym}${data.pricing.annualFee.toLocaleString()}`, 50, y);
      y += 14;
      doc.text(`Year 1 total cost: ${sym}${data.pricing.year1Cost.toLocaleString()}`, 50, y);
      y += 28;
    } else {
      y += 10;
    }

    y = writeSectionTitle(doc, 'Pricing Breakdown', y);
    const tableTop = y;
    const colWidths = [130, 70, 60, 80, 80];
    const headers = ['Item', 'Type', 'Quantity', 'Unit Price', 'Total'];
    let x = 50;
    doc.fontSize(8).fillColor('#fff');
    doc.rect(50, tableTop, 495, 18).fill(MI_NAVY);
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], x + 4, tableTop + 5, { width: colWidths[i] });
      x += colWidths[i];
    }

    let rowY = tableTop + 22;
    doc.fillColor(MI_DARK);
    for (const item of data.pricing.lineItems) {
      if (rowY > PAGE_BOTTOM - 40) {
        doc.addPage();
        rowY = 50;
      }
      x = 50;
      const row = [
        item.category,
        item.recurring ? 'Monthly' : 'One-time',
        String(item.quantity),
        `${sym}${item.unitPrice.toLocaleString()}`,
        `${sym}${item.total.toLocaleString()}`,
      ];
      for (let i = 0; i < row.length; i++) {
        doc.text(row[i], x + 4, rowY, { width: colWidths[i] });
        x += colWidths[i];
      }
      rowY += 18;
    }

    y = rowY + 20;
    y = writeSectionTitle(doc, 'Terms & Conditions', y);
    const warrantyText = formatWarrantyClause(data.config.warrantyPeriod, data.config.warrantyUnit, data.config.coverageType);
    const terms = [
      `This proposal is prepared exclusively for ${clientName} and is valid until ${formatDate(data.validUntil)}.`,
      `Warranty: ${warrantyText}${data.config.warrantyPeriod > 0 ? ' — bug fixes included at no additional cost' : ''}`,
      `Support: ${SUPPORT_HOURS_LABELS[data.config.supportHours]} with ${SUPPORT_SLA_LABELS[data.config.supportSLA]} response SLA`,
      `Payment Terms: ${data.config.paymentModel === 'ONE_TIME' ? 'Full contract value due upfront at signing' : 'Setup fee due at signing, then monthly subscription for the contract term'}`,
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
