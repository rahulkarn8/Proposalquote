export interface SolutionFeatureDefinition {
  label: string;
  category: string;
  description: string;
  defaultMultiplier: number;
  /** When set, feature is recommended for these problem types */
  problemTypes?: string[];
}

/** Core platform features included in every AI solution quote */
const CORE_PLATFORM_FEATURES: SolutionFeatureDefinition[] = [
  {
    label: 'Data preprocessing & cleaning',
    category: 'Core Platform',
    description: 'Data ingestion, cleansing, normalization, and quality checks',
    defaultMultiplier: 0.08,
  },
  {
    label: 'Model training & fine-tuning',
    category: 'Core Platform',
    description: 'Dataset splits, training loops, hyperparameter tuning, and evaluation',
    defaultMultiplier: 0.15,
  },
  {
    label: 'API endpoint deployment',
    category: 'Core Platform',
    description: 'Production REST/gRPC inference APIs with auth and rate limiting',
    defaultMultiplier: 0.10,
  },
  {
    label: 'Web dashboard for monitoring',
    category: 'Core Platform',
    description: 'Operational dashboard for metrics, alerts, and model health',
    defaultMultiplier: 0.12,
  },
  {
    label: 'Integration with existing systems',
    category: 'Core Platform',
    description: 'ERP, MES, CRM, or internal tool integrations',
    defaultMultiplier: 0.14,
  },
  {
    label: 'Custom UI/UX',
    category: 'Core Platform',
    description: 'Tailored operator or business-user interfaces',
    defaultMultiplier: 0.10,
  },
  {
    label: 'Documentation & training',
    category: 'Core Platform',
    description: 'Runbooks, user guides, and handover training sessions',
    defaultMultiplier: 0.06,
  },
  {
    label: 'Source code ownership',
    category: 'Core Platform',
    description: 'Full IP transfer of application and model code',
    defaultMultiplier: 0.20,
  },
];

const DEFECT_DETECTION_FEATURES: SolutionFeatureDefinition[] = [
  {
    label: 'Camera & image acquisition setup',
    category: 'Defect Detection & Visual Inspection',
    description: 'Line-scan/area cameras, lighting, and capture pipeline configuration',
    defaultMultiplier: 0.10,
    problemTypes: ['DEFECT_DETECTION', 'SEMANTIC_INSPECTION', 'PREDICTIVE_QUALITY', 'COMPUTER_VISION_TRACKING'],
  },
  {
    label: 'Labeled dataset & annotation workflow',
    category: 'Defect Detection & Visual Inspection',
    description: 'Defect labeling tools, QA process, and dataset versioning',
    defaultMultiplier: 0.12,
    problemTypes: ['DEFECT_DETECTION', 'SEMANTIC_INSPECTION', 'PREDICTIVE_QUALITY'],
  },
  {
    label: 'Defect classification model training',
    category: 'Defect Detection & Visual Inspection',
    description: 'CNN/ViT training for scratch, dent, misalignment, and surface defects',
    defaultMultiplier: 0.16,
    problemTypes: ['DEFECT_DETECTION', 'SEMANTIC_INSPECTION', 'PREDICTIVE_QUALITY'],
  },
  {
    label: 'Real-time edge/GPU inference pipeline',
    category: 'Defect Detection & Visual Inspection',
    description: 'Sub-second inference on line with batching and failover',
    defaultMultiplier: 0.14,
    problemTypes: ['DEFECT_DETECTION', 'SEMANTIC_INSPECTION', 'COMPUTER_VISION_TRACKING', 'EDGE_AI_DEPLOYMENT'],
  },
  {
    label: 'False-positive tuning & threshold calibration',
    category: 'Defect Detection & Visual Inspection',
    description: 'Per-SKU thresholds, ROC tuning, and operator feedback loops',
    defaultMultiplier: 0.08,
    problemTypes: ['DEFECT_DETECTION', 'SEMANTIC_INSPECTION', 'PREDICTIVE_QUALITY'],
  },
  {
    label: 'MES / quality system integration',
    category: 'Defect Detection & Visual Inspection',
    description: 'Reject routing, SPC hooks, and quality record sync to MES/QMS',
    defaultMultiplier: 0.12,
    problemTypes: ['DEFECT_DETECTION', 'PREDICTIVE_QUALITY', 'PROCESS_CONTROL'],
  },
  {
    label: 'Inspection dashboard & alerting',
    category: 'Defect Detection & Visual Inspection',
    description: 'Live defect heatmaps, shift reports, and escalation alerts',
    defaultMultiplier: 0.09,
    problemTypes: ['DEFECT_DETECTION', 'SEMANTIC_INSPECTION', 'PREDICTIVE_QUALITY'],
  },
  {
    label: 'Active learning & model retraining',
    category: 'Defect Detection & Visual Inspection',
    description: 'Continuous improvement from operator corrections and new defect classes',
    defaultMultiplier: 0.11,
    problemTypes: ['DEFECT_DETECTION', 'SEMANTIC_INSPECTION', 'PREDICTIVE_QUALITY'],
  },
];

const PATTERN_MATCHING_FEATURES: SolutionFeatureDefinition[] = [
  {
    label: 'Signal preprocessing & feature extraction',
    category: 'Pattern Matching & Anomaly Detection',
    description: 'Filtering, windowing, FFT, and domain-specific feature engineering',
    defaultMultiplier: 0.10,
    problemTypes: ['PATTERN_MATCHING', 'ANOMALY_DETECTION', 'TIME_SERIES_FORECASTING', 'PROCESS_CONTROL'],
  },
  {
    label: 'Pattern template library',
    category: 'Pattern Matching & Anomaly Detection',
    description: 'Reusable templates for known good/bad patterns and signatures',
    defaultMultiplier: 0.09,
    problemTypes: ['PATTERN_MATCHING', 'ANOMALY_DETECTION'],
  },
  {
    label: 'Anomaly detection model development',
    category: 'Pattern Matching & Anomaly Detection',
    description: 'Unsupervised/semi-supervised models for rare-event detection',
    defaultMultiplier: 0.15,
    problemTypes: ['PATTERN_MATCHING', 'ANOMALY_DETECTION', 'PREDICTIVE_MAINTENANCE'],
  },
  {
    label: 'Streaming inference service',
    category: 'Pattern Matching & Anomaly Detection',
    description: 'Low-latency scoring on live sensor, log, or event streams',
    defaultMultiplier: 0.12,
    problemTypes: ['PATTERN_MATCHING', 'ANOMALY_DETECTION', 'TIME_SERIES_FORECASTING'],
  },
  {
    label: 'Multi-variate time-series analysis',
    category: 'Pattern Matching & Anomaly Detection',
    description: 'Correlated signal analysis across multiple sensors or channels',
    defaultMultiplier: 0.11,
    problemTypes: ['PATTERN_MATCHING', 'TIME_SERIES_FORECASTING', 'PROCESS_EFFICIENCY'],
  },
  {
    label: 'Alert rules & incident workflow',
    category: 'Pattern Matching & Anomaly Detection',
    description: 'Severity tiers, on-call routing, and incident playbooks',
    defaultMultiplier: 0.07,
    problemTypes: ['PATTERN_MATCHING', 'ANOMALY_DETECTION', 'PREDICTIVE_MAINTENANCE'],
  },
];

const OCR_DOCUMENT_FEATURES: SolutionFeatureDefinition[] = [
  {
    label: 'OCR / text extraction engine',
    category: 'OCR & Document Intelligence',
    description: 'Printed and scanned text extraction with layout analysis',
    defaultMultiplier: 0.14,
    problemTypes: ['OCR_READING', 'NLP_DOCUMENT_INTELLIGENCE'],
  },
  {
    label: 'Document classification & routing',
    category: 'OCR & Document Intelligence',
    description: 'Auto-sort invoices, contracts, forms, and correspondence',
    defaultMultiplier: 0.10,
    problemTypes: ['OCR_READING', 'NLP_DOCUMENT_INTELLIGENCE'],
  },
  {
    label: 'Handwriting & low-quality scan handling',
    category: 'OCR & Document Intelligence',
    description: 'Robust OCR for degraded scans and handwritten fields',
    defaultMultiplier: 0.12,
    problemTypes: ['OCR_READING', 'NLP_DOCUMENT_INTELLIGENCE'],
  },
  {
    label: 'Structured field extraction (forms/invoices)',
    category: 'OCR & Document Intelligence',
    description: 'Key-value extraction for tables, line items, and form fields',
    defaultMultiplier: 0.11,
    problemTypes: ['OCR_READING', 'NLP_DOCUMENT_INTELLIGENCE'],
  },
  {
    label: 'Document workflow automation',
    category: 'OCR & Document Intelligence',
    description: 'Approval flows, validation rules, and downstream system posting',
    defaultMultiplier: 0.09,
    problemTypes: ['OCR_READING', 'NLP_DOCUMENT_INTELLIGENCE'],
  },
];

const CAD_DESIGN_FEATURES: SolutionFeatureDefinition[] = [
  {
    label: '2D/3D CAD generation pipeline',
    category: 'CAD & Generative Design',
    description: 'Automated geometry generation from inputs, rules, or prompts',
    defaultMultiplier: 0.18,
    problemTypes: ['CAD_GENERATION', 'GENERATIVE_DESIGN'],
  },
  {
    label: 'Design rule validation',
    category: 'CAD & Generative Design',
    description: 'Automated checks against engineering and manufacturing constraints',
    defaultMultiplier: 0.10,
    problemTypes: ['CAD_GENERATION', 'GENERATIVE_DESIGN'],
  },
  {
    label: 'BIM / technical drawing export',
    category: 'CAD & Generative Design',
    description: 'Export to DWG, STEP, IFC, and shop-floor drawing packages',
    defaultMultiplier: 0.12,
    problemTypes: ['CAD_GENERATION', 'GENERATIVE_DESIGN'],
  },
  {
    label: 'Parametric design constraints setup',
    category: 'CAD & Generative Design',
    description: 'Configurable parameters, variants, and design-space exploration',
    defaultMultiplier: 0.09,
    problemTypes: ['CAD_GENERATION', 'GENERATIVE_DESIGN'],
  },
];

const PREDICTIVE_ANALYTICS_FEATURES: SolutionFeatureDefinition[] = [
  {
    label: 'Predictive model development',
    category: 'Predictive Analytics',
    description: 'Forecasting, classification, or regression models for business KPIs',
    defaultMultiplier: 0.14,
    problemTypes: [
      'PREDICTIVE_MAINTENANCE', 'PREDICTIVE_QUALITY', 'SUPPLY_CHAIN_FORECASTING',
      'PROCESS_EFFICIENCY', 'ENERGY_OPTIMIZATION', 'TIME_SERIES_FORECASTING',
    ],
  },
  {
    label: 'Historical data ingestion & labeling',
    category: 'Predictive Analytics',
    description: 'Warehouse/lake ingestion, feature history, and label alignment',
    defaultMultiplier: 0.10,
    problemTypes: ['PREDICTIVE_MAINTENANCE', 'SUPPLY_CHAIN_FORECASTING', 'PROCESS_EFFICIENCY'],
  },
  {
    label: 'KPI dashboard & reporting',
    category: 'Predictive Analytics',
    description: 'Executive and operator views of predicted vs actual performance',
    defaultMultiplier: 0.08,
    problemTypes: ['PROCESS_EFFICIENCY', 'ENERGY_OPTIMIZATION', 'SUPPLY_CHAIN_FORECASTING'],
  },
  {
    label: 'What-if simulation module',
    category: 'Predictive Analytics',
    description: 'Scenario planning for schedules, loads, and maintenance windows',
    defaultMultiplier: 0.11,
    problemTypes: ['PROCESS_EFFICIENCY', 'PRODUCTION_SCHEDULING', 'DIGITAL_TWIN', 'ENERGY_OPTIMIZATION'],
  },
];

const INDUSTRIAL_EDGE_FEATURES: SolutionFeatureDefinition[] = [
  {
    label: 'Edge device provisioning & OTA updates',
    category: 'Industrial Integration & Edge',
    description: 'Secure device onboarding, model updates, and fleet management',
    defaultMultiplier: 0.12,
    problemTypes: ['EDGE_AI_DEPLOYMENT', 'ROBOTIC_AUTOMATION', 'AGV_FLEET_MANAGEMENT'],
  },
  {
    label: 'PLC / SCADA integration',
    category: 'Industrial Integration & Edge',
    description: 'Bidirectional integration with shop-floor control systems',
    defaultMultiplier: 0.14,
    problemTypes: ['PROCESS_CONTROL', 'ROBOTIC_AUTOMATION', 'DIGITAL_TWIN'],
  },
  {
    label: 'Digital twin sync layer',
    category: 'Industrial Integration & Edge',
    description: 'Live asset mirroring and simulation state synchronization',
    defaultMultiplier: 0.16,
    problemTypes: ['DIGITAL_TWIN', 'PROCESS_CONTROL', 'ROBOTIC_AUTOMATION'],
  },
  {
    label: 'Robot coordination & safety interlocks',
    category: 'Industrial Integration & Edge',
    description: 'Multi-robot orchestration with safety-rated control hooks',
    defaultMultiplier: 0.13,
    problemTypes: ['ROBOTIC_AUTOMATION', 'WORKER_SAFETY', 'AGV_FLEET_MANAGEMENT'],
  },
  {
    label: 'OPC-UA / MQTT telemetry bridge',
    category: 'Industrial Integration & Edge',
    description: 'Standard industrial protocol adapters for sensor and machine data',
    defaultMultiplier: 0.10,
    problemTypes: ['EDGE_AI_DEPLOYMENT', 'PROCESS_CONTROL', 'PREDICTIVE_MAINTENANCE'],
  },
];

const MLOPS_FEATURES: SolutionFeatureDefinition[] = [
  {
    label: 'Model monitoring & drift detection',
    category: 'MLOps & AI Platform',
    description: 'Data drift, concept drift, and performance degradation alerts',
    defaultMultiplier: 0.08,
  },
  {
    label: 'Champion/challenger model testing',
    category: 'MLOps & AI Platform',
    description: 'Shadow deployments and A/B evaluation before promotion',
    defaultMultiplier: 0.07,
  },
  {
    label: 'Data pipeline & feature store',
    category: 'MLOps & AI Platform',
    description: 'Reusable batch/stream pipelines and versioned feature definitions',
    defaultMultiplier: 0.11,
  },
  {
    label: 'LLM / RAG integration layer',
    category: 'MLOps & AI Platform',
    description: 'Retrieval-augmented generation over enterprise documents and APIs',
    defaultMultiplier: 0.13,
    problemTypes: ['NLP_DOCUMENT_INTELLIGENCE'],
  },
];

export const ALL_SOLUTION_FEATURES: SolutionFeatureDefinition[] = [
  ...CORE_PLATFORM_FEATURES,
  ...DEFECT_DETECTION_FEATURES,
  ...PATTERN_MATCHING_FEATURES,
  ...OCR_DOCUMENT_FEATURES,
  ...CAD_DESIGN_FEATURES,
  ...PREDICTIVE_ANALYTICS_FEATURES,
  ...INDUSTRIAL_EDGE_FEATURES,
  ...MLOPS_FEATURES,
];

/** Legacy flat list — core platform feature labels only */
export const SOLUTION_COVERAGE_OPTIONS = CORE_PLATFORM_FEATURES.map((f) => f.label);

export function getDefaultCoverageMultipliers(): Record<string, number> {
  return Object.fromEntries(
    ALL_SOLUTION_FEATURES.map((f) => [f.label, f.defaultMultiplier]),
  );
}

export function getFeaturesByCategory(): Record<string, SolutionFeatureDefinition[]> {
  const grouped: Record<string, SolutionFeatureDefinition[]> = {};
  for (const feature of ALL_SOLUTION_FEATURES) {
    if (!grouped[feature.category]) grouped[feature.category] = [];
    grouped[feature.category].push(feature);
  }
  return grouped;
}

export function getRecommendedFeatures(problemType: string): SolutionFeatureDefinition[] {
  return ALL_SOLUTION_FEATURES.filter(
    (f) => f.problemTypes?.includes(problemType),
  );
}

export function getCategoryOrder(): string[] {
  return [
    'Core Platform',
    'Defect Detection & Visual Inspection',
    'Pattern Matching & Anomaly Detection',
    'OCR & Document Intelligence',
    'CAD & Generative Design',
    'Predictive Analytics',
    'Industrial Integration & Edge',
    'MLOps & AI Platform',
  ];
}
