import type { EngineeringEffortCatalogItem } from '@/types';

/** Offline fallback when engineering-efforts API is unavailable */
export const FALLBACK_ENGINEERING_EFFORTS: EngineeringEffortCatalogItem[] = [
  { label: 'Requirements & discovery workshops', category: 'Discovery & Design', description: 'Stakeholder interviews, use-case mapping, and success criteria', defaultShare: 0.08 },
  { label: 'Solution architecture & design', category: 'Discovery & Design', description: 'System design, data flows, and technical specification', defaultShare: 0.12 },
  { label: 'Project planning & estimation', category: 'Discovery & Design', description: 'Sprint planning, milestones, and delivery roadmap', defaultShare: 0.05 },
  { label: 'Data ingestion & preprocessing', category: 'Data & Machine Learning', description: 'Pipelines, cleansing, labelling, and dataset preparation', defaultShare: 0.14 },
  { label: 'Feature engineering', category: 'Data & Machine Learning', description: 'Feature selection, transformation, and validation datasets', defaultShare: 0.10 },
  { label: 'Model training & evaluation', category: 'Data & Machine Learning', description: 'Training, hyperparameter tuning, and benchmark evaluation', defaultShare: 0.18 },
  { label: 'Model optimization & hardening', category: 'Data & Machine Learning', description: 'Performance tuning, edge cases, and production readiness', defaultShare: 0.08 },
  { label: 'API & service development', category: 'Integration & Deployment', description: 'Inference APIs, business logic, and service orchestration', defaultShare: 0.12 },
  { label: 'System integration', category: 'Integration & Deployment', description: 'ERP/MES/CRM hooks, auth, and enterprise connectivity', defaultShare: 0.10 },
  { label: 'Testing & quality assurance', category: 'Integration & Deployment', description: 'Unit, integration, UAT support, and regression testing', defaultShare: 0.08 },
  { label: 'Deployment & DevOps setup', category: 'Integration & Deployment', description: 'CI/CD, environments, monitoring, and release automation', defaultShare: 0.07 },
  { label: 'Documentation & runbooks', category: 'Handover & Support Readiness', description: 'Technical docs, operator guides, and support playbooks', defaultShare: 0.05 },
  { label: 'Training & knowledge transfer', category: 'Handover & Support Readiness', description: 'Workshops, handover sessions, and admin training', defaultShare: 0.05 },
];

export const FALLBACK_ENGINEERING_CATEGORIES = [
  'Discovery & Design',
  'Data & Machine Learning',
  'Integration & Deployment',
  'Handover & Support Readiness',
];
