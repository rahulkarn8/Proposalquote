/**
 * Generates the end-user guide PDF for the AI Quote Generator.
 * Run: npm run generate:user-guide --workspace=backend
 */
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import SVGtoPDF from 'svg-to-pdfkit';

const MI_RED = '#DA2128';
const MI_NAVY = '#0C2C46';
const MI_DARK = '#231F20';
const MI_MUTED = '#6C5E62';
const PAGE_BOTTOM = 760;
const MARGIN = 50;
const CONTENT_WIDTH = 495;

const BACKEND_ROOT = path.join(__dirname, '../..');
const PROJECT_ROOT = path.join(BACKEND_ROOT, '..');
const LOGO_PATH = path.join(BACKEND_ROOT, 'assets/motherson-logo.svg');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'docs');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'Motherson-AI-Quote-Generator-User-Guide.pdf');

const LOGO_WIDTH = 220;
const LOGO_HEIGHT = LOGO_WIDTH * (119.38 / 526.44);

type Doc = InstanceType<typeof PDFDocument>;

interface Section {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  numbered?: string[];
  subsections?: { title: string; paragraphs?: string[]; bullets?: string[]; numbered?: string[] }[];
}

const GUIDE_SECTIONS: Section[] = [
  {
    title: '1. Introduction',
    paragraphs: [
      'The Motherson AI Quote Generator is a web application for creating professional subscription and one-time pricing proposals for AI and software services. Sales engineers and solution architects use it to configure client requirements, receive real-time pricing, save quotes, and deliver branded PDF proposals to customers.',
      'This guide walks through every feature — from signing in to generating and emailing a finalized proposal.',
    ],
    bullets: [
      'Multi-step quote wizard with live pricing preview',
      'One-time payment or monthly subscription pricing models',
      'Branded PDF proposal generation',
      'Draft and finalized quote management',
      'Scenario comparison on the Review step',
      'Admin panel for rates, problem types, and analytics (admin users only)',
    ],
  },
  {
    title: '2. Accessing the Application',
    paragraphs: [
      'Open the application URL provided by your administrator in a modern web browser (Chrome, Edge, Firefox, or Safari). You must sign in before accessing the quote wizard.',
    ],
    subsections: [
      {
        title: 'Development / local deployment',
        bullets: [
          'Frontend: http://localhost:5173 (development) or http://localhost:8080 (Docker)',
          'API health check: GET /api/health returns {"status":"ok"}',
        ],
      },
      {
        title: 'Default local accounts (AUTH_MODE=local)',
        bullets: [
          'Admin — admin@motherson.com / Admin123!',
          'User — user@motherson.com / User123!',
          'Change these credentials in production before sharing the application.',
        ],
      },
      {
        title: 'AWS Cognito (AUTH_MODE=cognito)',
        bullets: [
          'Sign in with your corporate email and password configured in Cognito.',
          'Admin panel access requires membership in the admin Cognito group.',
          'Standard users belong to the user group and can create quotes but cannot open /admin.',
        ],
      },
    ],
  },
  {
    title: '3. Signing In',
    numbered: [
      'Navigate to the application URL. If you are not authenticated, you are redirected to the Sign In page (/login).',
      'Enter your email address and password.',
      'Click Sign In. On success you return to the home page with the quote wizard.',
      'Use Sign Out in the header when finished, especially on shared computers.',
    ],
    paragraphs: [
      'If your session expires (typically after 8 hours with local JWT auth), you will see "Session expired. Please sign in again." when performing an action. Sign in again to continue.',
    ],
  },
  {
    title: '4. Main Screen Layout',
    paragraphs: [
      'After signing in, the home page displays the quote wizard. The layout has three main areas:',
      'The step indicator at the top shows your progress through seven steps: Client → Volume → Coverage → Warranty → Cloud → Review → Complete. Completed steps show a checkmark; the current step is highlighted in red.',
    ],
    bullets: [
      'Top header — Motherson logo, application title, Admin link (admins only), signed-in user email, Sign Out.',
      'Left column (main) — Step indicator, current wizard step form, navigation buttons.',
      'Right sidebar — Live Quote Preview (pricing breakdown) and Saved Quotes list.',
    ],
  },
  {
    title: '5. Quote Wizard — Step 1: Client & Problem',
    paragraphs: [
      'The first step captures who the proposal is for and what problem you are solving. These details appear prominently in the generated PDF.',
      'After selecting a problem type, an information card shows typical effort hours, effort range, volume unit, and cloud cost multiplier for that use case. Use this to validate your inputs on the next step.',
    ],
    bullets: [
      'Client Name (required) — The customer or prospect name. Example: "Acme Manufacturing Ltd." Appears as "Prepared for:" on the PDF cover.',
      'Problem Statement (required) — A brief description of the business challenge, pain points, and desired outcome. This becomes the Problem Statement and Executive Summary sections in the PDF.',
      'Problem Type (required) — Select from categorized AI use cases (OCR, Defect Detection, CAD, Pattern Matching, or custom types added by admin). Selecting a type auto-fills typical engineering effort and volume unit.',
    ],
  },
  {
    title: '6. Quote Wizard — Step 2: Volume & Complexity',
    paragraphs: [
      'This step defines scale and technical difficulty, which drive processing fees and engineering rates.',
    ],
    bullets: [
      'Volume — Number of items processed (e.g. documents, images, parts). Higher volumes may trigger tier discounts (10% at 1,001–10,000; 20% at 10,001–100,000; custom pricing above 100,000).',
      'Volume Unit — Unit of measure (documents/month, images/day, etc.). Auto-set from problem type but can be changed.',
      'Complexity — Slider from Low to Very High. Affects hourly engineering rates ($50 / $100 / $150 / $250 by default) and processing fees.',
      'Engineering Effort — Estimated hours for custom development and integration.',
      'Currency — USD, EUR, GBP, or INR. All preview and PDF amounts use the selected currency.',
      'Start Date — Project commencement date for timeline calculations in the proposal.',
    ],
  },
  {
    title: '7. Quote Wizard — Step 3: Coverage & Requirements',
    paragraphs: [
      'Select which solution components and compliance standards apply to the engagement.',
    ],
    bullets: [
      'Solution Coverage — Check one or more: Data Ingestion, Pre-processing, AI/ML Model, Post-processing, Integration API, Dashboard/UI, Training & Documentation, Deployment & DevOps. Add custom items with the text field and Add button.',
      'Compliance Requirements — GDPR, HIPAA, SOC 2, ISO 27001, or None. Selecting a compliance standard adds cost multipliers.',
      'Required Languages & Frameworks — Free text for technology stack expectations.',
      'Integration Complexity — Low, Medium, or High. Higher complexity increases engineering and integration line items.',
    ],
  },
  {
    title: '8. Quote Wizard — Step 4: Warranty & Support',
    paragraphs: [
      'Configure post-delivery warranty and ongoing support tiers. A live summary panel shows readable support clause text (not raw codes).',
    ],
    bullets: [
      'Warranty Period & Unit — Days or months of included bug fixes at no extra cost. Extended warranty over 12 months adds 10% to the monthly fee.',
      'Coverage Type — Defects Only, Performance Guarantee, or Full Maintenance.',
      'Support Hours — Business Hours, 24×7, or Custom Schedule.',
      'Support SLA — Response time commitment: 4-hour, 8-hour, next business day, or best effort.',
      'Support Cost Model — Included in subscription, separate monthly fee, or pay-per-incident.',
    ],
  },
  {
    title: '9. Quote Wizard — Step 5: Cloud, Contract & Pricing Model',
    paragraphs: [
      'This step is critical: you choose how the client pays, and the entire quote is built for that single model only.',
      'Changing the payment model immediately recalculates the live preview on the right. You will not see both options side by side — only the selected model is quoted, reviewed, and included in the PDF.',
    ],
    subsections: [
      {
        title: 'Payment Model (choose one)',
        bullets: [
          'One-Time Payment — Single upfront amount for the full contract value. No recurring invoices. Best for capital purchases or fixed-scope projects.',
          'Monthly Subscription — Setup fee due at signing, then a fixed monthly fee for the contract term. Best for SaaS-style engagements.',
        ],
      },
      {
        title: 'Cloud & contract fields',
        bullets: [
          'Cloud Provider — AWS, Azure, GCP, On-Premise, or Hybrid.',
          'Estimated Monthly Cloud Cost — Infrastructure spend estimate; markup applied per admin settings.',
          'Cloud Cost Model — Pass-through, fixed fee, or included in subscription.',
          'Expected Lifetime (months) — Contract duration; drives total contract value and subscription term.',
        ],
      },
    ],
  },
  {
    title: '10. Quote Wizard — Step 6: Review',
    paragraphs: [
      'Review all entered values and the pricing summary before finalizing. This step shows a read-only summary of client, problem, volume, coverage, warranty, cloud, and payment model selections.',
    ],
    bullets: [
      'Save Draft — Saves the quote with DRAFT status. You can reload it later from Saved Quotes without finalizing.',
      'Finalize & Continue — Validates all fields, saves the quote as FINAL, assigns a quote number, and advances to the Complete step.',
      'Scenario Comparison — Below the form, compare the base configuration against alternative scenarios (e.g. different volume or complexity) to show pricing deltas to the client.',
    ],
  },
  {
    title: '11. Quote Wizard — Step 7: Complete',
    paragraphs: [
      'The quote is finalized. This screen confirms the quote number, client name, total contract value, and selected payment structure.',
      'Workflow progress tracks: Configure → Review → Finalize → Deliver (PDF or email). The Deliver step is marked complete once you download the PDF or open the email dialog.',
    ],
    numbered: [
      'Download PDF — Generates and downloads the branded proposal PDF. If the quote was not yet saved, it is auto-finalized first.',
      'Email Proposal — Opens your default email client with a pre-filled subject and summary (attach the downloaded PDF manually).',
      'Edit Quote — Returns to the Review step to change configuration.',
      'New Quote — Resets the wizard to start a fresh quote.',
    ],
  },
  {
    title: '12. Live Quote Preview (Sidebar)',
    paragraphs: [
      'The right sidebar updates automatically as you change form values (with a short debounce). It shows:',
    ],
    bullets: [
      'Total Contract Value — Headline figure for the engagement.',
      'Selected payment option — Either one-time upfront or setup + monthly breakdown.',
      'Line item breakdown — Engineering, processing, cloud, support, warranty, setup fee, tax.',
      'Volume tier discount indicator when applicable.',
      'Loading state while pricing is recalculating.',
    ],
  },
  {
    title: '13. Saved Quotes',
    paragraphs: [
      'The Saved Quotes card lists your previously saved quotes (draft and final). Click Refresh to reload the list.',
    ],
    bullets: [
      'Each row shows quote number, client/problem summary, status badge (DRAFT, FINAL, EXPIRED), total price, and date.',
      'Click a quote to load it into the wizard. FINAL quotes open on the Complete step; drafts open on Step 1.',
      'Loaded quotes retain their saved ID so PDF download works without re-saving.',
    ],
  },
  {
    title: '14. PDF Proposal Contents',
    paragraphs: [
      'The generated PDF is a client-ready proposal branded with Motherson Innovations styling. It includes:',
      'PDFs download directly to your browser. Ensure pop-up blockers allow downloads from the application domain.',
    ],
    bullets: [
      'Header with logo, tagline, and "Prepared for: [Client Name]"',
      'Executive Summary — Derived from your problem statement and configuration',
      'Problem Statement — Your entered text',
      'Proposed Solution & Technical Approach',
      'Scope & Deliverables',
      'Project Timeline (weeks)',
      'Support & Warranty — Human-readable clauses',
      'Investment Summary — Single payment model only (one-time OR subscription)',
      'Detailed Pricing Breakdown',
      'Terms & Conditions — Payment terms match the selected model',
    ],
  },
  {
    title: '15. Admin Panel (Administrators Only)',
    paragraphs: [
      'Navigate to /admin or click Admin in the header. Available only to users with the ADMIN role.',
      'Click Save Settings after making changes. Settings apply immediately to new pricing calculations.',
    ],
    subsections: [
      {
        title: 'Analytics tab',
        bullets: [
          'Total quotes, revenue, average TCV, breakdowns by problem type and currency.',
          'List of recent quotes with status and amounts.',
        ],
      },
      {
        title: 'Setup Fee tab',
        bullets: [
          'Configure how setup fees are calculated: base amount, complexity multipliers, coverage add-ons.',
        ],
      },
      {
        title: 'Coverage tab',
        bullets: ['Edit per-component multipliers for solution coverage checkboxes.'],
      },
      {
        title: 'Support tab',
        bullets: ['Edit support tier pricing and SLA multipliers.'],
      },
      {
        title: 'Problem Types tab',
        bullets: [
          'Add or remove custom problem types with label, description, volume unit, and processing rate.',
        ],
      },
      {
        title: 'General tab',
        bullets: [
          'Default currency, tax rate, cloud markup, volume tier thresholds.',
          'Reset settings to defaults or seed three sample quotes for demonstration.',
        ],
      },
    ],
  },
  {
    title: '16. End-to-End Workflow Example',
    numbered: [
      'Sign in as a sales user.',
      'Step 1: Enter "Global Auto Parts", describe OCR digitization needs, select OCR problem type.',
      'Step 2: Set 5,000 documents/month, Medium complexity, 120 engineering hours, USD, start date next month.',
      'Step 3: Check Data Ingestion, AI/ML Model, Integration API; select GDPR compliance.',
      'Step 4: Set 12-month warranty, Business Hours support, 8-hour SLA, support included in subscription.',
      'Step 5: Choose Monthly Subscription, AWS cloud, $800/month cloud estimate, 24-month contract.',
      'Review the sidebar preview — confirm TCV and monthly fee.',
      'Step 6: Optionally run scenario comparison; click Finalize & Continue.',
      'Step 7: Download PDF and email to the client with the attachment.',
      'Click New Quote to start the next opportunity.',
    ],
  },
  {
    title: '17. Tips & Best Practices',
    bullets: [
      'Write a clear problem statement — it drives the executive summary clients read first.',
      'Choose the payment model early on Step 5; switching later changes all totals.',
      'Save drafts frequently on long quotes so work is not lost.',
      'Use scenario comparison on Review to justify volume or complexity trade-offs.',
      'Verify currency before finalizing — changing currency after review requires re-checking amounts.',
      'Attach the PDF manually when using Email Proposal — the app opens your mail client with a template only.',
      'Admins should update hourly rates and setup fee config before major quoting campaigns.',
    ],
  },
  {
    title: '18. Troubleshooting',
    subsections: [
      {
        title: 'Cannot sign in',
        bullets: [
          'Verify email and password. For Cognito, confirm your account exists and is confirmed.',
          'Contact admin if you need Admin panel access.',
        ],
      },
      {
        title: 'Validation failed when saving or downloading PDF',
        bullets: [
          'Complete all required fields on each step. Use Next to trigger step validation.',
          'Ensure numeric fields (volume, effort, cloud cost) contain valid numbers.',
        ],
      },
      {
        title: 'PDF button does nothing or fails',
        bullets: [
          'Check browser download permissions and pop-up blockers.',
          'Ensure you are signed in — PDF download requires authentication.',
          'Read the error message banner below the wizard for details.',
        ],
      },
      {
        title: 'Pricing shows $0 or does not update',
        bullets: [
          'Wait for the preview to finish loading. Check that problem type and volume are set.',
          'If admin settings were reset, refresh the page.',
        ],
      },
      {
        title: 'Session expired',
        bullets: ['Sign in again. Unsaved form changes may be lost — use Save Draft regularly.'],
      },
    ],
  },
  {
    title: '19. Support & Further Reading',
    bullets: [
      'Technical deployment: see DEPLOYMENT.md in the project repository.',
      'API reference: see README.md for endpoint list.',
      'Repository: https://github.com/rahulkarn8/Proposalquote',
    ],
    paragraphs: [
      'For application support, contact your Motherson Innovations platform administrator.',
    ],
  },
];

let cachedLogo: string | null = null;

function getLogoSvg(): string {
  if (!cachedLogo) cachedLogo = fs.readFileSync(LOGO_PATH, 'utf8');
  return cachedLogo;
}

function ensureSpace(doc: Doc, y: number, needed: number): number {
  if (y + needed > PAGE_BOTTOM) {
    doc.addPage();
    addPageFooter(doc);
    return 60;
  }
  return y;
}

function addPageFooter(doc: Doc): void {
  const bottom = doc.page.height - 40;
  doc.fontSize(8).fillColor(MI_MUTED)
    .text('Motherson AI Quote Generator — User Guide', MARGIN, bottom, { width: CONTENT_WIDTH, align: 'center' });
}

function writeSectionTitle(doc: Doc, title: string, y: number): number {
  y = ensureSpace(doc, y, 36);
  doc.font('Helvetica-Bold').fontSize(14).fillColor(MI_NAVY).text(title, MARGIN, y);
  doc.moveTo(MARGIN, y + 18).lineTo(MARGIN + CONTENT_WIDTH, y + 18).lineWidth(0.5).stroke(MI_RED);
  doc.font('Helvetica');
  return y + 28;
}

function writeSubTitle(doc: Doc, title: string, y: number): number {
  y = ensureSpace(doc, y, 24);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(MI_DARK).text(title, MARGIN, y);
  doc.font('Helvetica');
  return y + 16;
}

function writeParagraph(doc: Doc, text: string, y: number): number {
  y = ensureSpace(doc, y, 30);
  doc.fontSize(10).fillColor(MI_DARK).text(text, MARGIN, y, { width: CONTENT_WIDTH, align: 'justify' });
  return y + doc.heightOfString(text, { width: CONTENT_WIDTH }) + 10;
}

function writeBullets(doc: Doc, items: string[], y: number): number {
  for (const item of items) {
    y = ensureSpace(doc, y, 18);
    doc.fontSize(10).fillColor(MI_DARK).text(`•  ${item}`, MARGIN + 8, y, { width: CONTENT_WIDTH - 8 });
    y += doc.heightOfString(`•  ${item}`, { width: CONTENT_WIDTH - 8 }) + 5;
  }
  return y + 4;
}

function writeNumbered(doc: Doc, items: string[], y: number): number {
  items.forEach((item, i) => {
    const line = `${i + 1}.  ${item}`;
    y = ensureSpace(doc, y, 18);
    doc.fontSize(10).fillColor(MI_DARK).text(line, MARGIN + 4, y, { width: CONTENT_WIDTH - 4 });
    y += doc.heightOfString(line, { width: CONTENT_WIDTH - 4 }) + 5;
  });
  return y + 4;
}

function renderCover(doc: Doc): void {
  doc.rect(MARGIN, 80, CONTENT_WIDTH, 4).fill(MI_RED);
  SVGtoPDF(doc, getLogoSvg(), MARGIN, 100, { width: LOGO_WIDTH, height: LOGO_HEIGHT });
  doc.fontSize(10).fillColor(MI_MUTED).text('Proud to be part of the future.', MARGIN, 100 + LOGO_HEIGHT + 10);

  doc.font('Helvetica-Bold').fontSize(26).fillColor(MI_NAVY)
    .text('AI Quote Generator', MARGIN, 260);
  doc.font('Helvetica-Bold').fontSize(18).fillColor(MI_RED)
    .text('User Guide', MARGIN, 295);

  doc.font('Helvetica').fontSize(12).fillColor(MI_DARK)
    .text('Detailed instructions for creating, reviewing, and delivering AI solution proposals.', MARGIN, 340, { width: CONTENT_WIDTH });

  doc.fontSize(10).fillColor(MI_MUTED)
    .text(`Document version 1.0  •  ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, MARGIN, 420);

  doc.fontSize(10).fillColor(MI_DARK)
    .text('Samvardhana Motherson Group — Motherson Innovations', MARGIN, 500);

  addPageFooter(doc);
}

function renderToc(doc: Doc): number {
  doc.addPage();
  let y = 60;
  y = writeSectionTitle(doc, 'Table of Contents', y);
  for (const section of GUIDE_SECTIONS) {
    y = ensureSpace(doc, y, 16);
    doc.fontSize(10).fillColor(MI_DARK).text(section.title, MARGIN + 8, y);
    y += 14;
  }
  addPageFooter(doc);
  return y;
}

function renderSection(doc: Doc, section: Section, y: number): number {
  if (y > 680) {
    doc.addPage();
    y = 60;
  } else if (y > 100) {
    y += 10;
  }

  y = writeSectionTitle(doc, section.title, y);

  if (section.paragraphs) {
    for (const p of section.paragraphs) y = writeParagraph(doc, p, y);
  }
  if (section.bullets) y = writeBullets(doc, section.bullets, y);
  if (section.numbered) y = writeNumbered(doc, section.numbered, y);

  if (section.subsections) {
    for (const sub of section.subsections) {
      y = writeSubTitle(doc, sub.title, y);
      if (sub.paragraphs) for (const p of sub.paragraphs) y = writeParagraph(doc, p, y);
      if (sub.bullets) y = writeBullets(doc, sub.bullets, y);
      if (sub.numbered) y = writeNumbered(doc, sub.numbered, y);
    }
  }

  return y;
}

function generateUserGuide(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: MARGIN, right: MARGIN } });
    const stream = fs.createWriteStream(OUTPUT_FILE);
    doc.pipe(stream);

    renderCover(doc);
    renderToc(doc);

    doc.addPage();
    let y = 60;
    for (const section of GUIDE_SECTIONS) {
      y = renderSection(doc, section, y);
    }

    addPageFooter(doc);
    doc.end();

    stream.on('finish', () => resolve(OUTPUT_FILE));
    stream.on('error', reject);
  });
}

generateUserGuide()
  .then((file) => {
    console.log(`User guide PDF created: ${file}`);
  })
  .catch((err) => {
    console.error('Failed to generate user guide:', err);
    process.exit(1);
  });
