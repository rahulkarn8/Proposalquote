export interface EngineeringEffortDefinition {
  label: string;
  category: string;
  description: string;
  /** Default share of typical project hours (0–1) */
  defaultShare: number;
}

const DISCOVERY_DESIGN: EngineeringEffortDefinition[] = [
  {
    label: 'Requirements & discovery workshops',
    category: 'Discovery & Design',
    description: 'Stakeholder interviews, use-case mapping, and success criteria',
    defaultShare: 0.08,
  },
  {
    label: 'Solution architecture & design',
    category: 'Discovery & Design',
    description: 'System design, data flows, and technical specification',
    defaultShare: 0.12,
  },
  {
    label: 'Project planning & estimation',
    category: 'Discovery & Design',
    description: 'Sprint planning, milestones, and delivery roadmap',
    defaultShare: 0.05,
  },
];

const DATA_ML: EngineeringEffortDefinition[] = [
  {
    label: 'Data ingestion & preprocessing',
    category: 'Data & Machine Learning',
    description: 'Pipelines, cleansing, labelling, and dataset preparation',
    defaultShare: 0.14,
  },
  {
    label: 'Feature engineering',
    category: 'Data & Machine Learning',
    description: 'Feature selection, transformation, and validation datasets',
    defaultShare: 0.10,
  },
  {
    label: 'Model training & evaluation',
    category: 'Data & Machine Learning',
    description: 'Training, hyperparameter tuning, and benchmark evaluation',
    defaultShare: 0.18,
  },
  {
    label: 'Model optimization & hardening',
    category: 'Data & Machine Learning',
    description: 'Performance tuning, edge cases, and production readiness',
    defaultShare: 0.08,
  },
];

const INTEGRATION_DEPLOYMENT: EngineeringEffortDefinition[] = [
  {
    label: 'API & service development',
    category: 'Integration & Deployment',
    description: 'Inference APIs, business logic, and service orchestration',
    defaultShare: 0.12,
  },
  {
    label: 'System integration',
    category: 'Integration & Deployment',
    description: 'ERP/MES/CRM hooks, auth, and enterprise connectivity',
    defaultShare: 0.10,
  },
  {
    label: 'Testing & quality assurance',
    category: 'Integration & Deployment',
    description: 'Unit, integration, UAT support, and regression testing',
    defaultShare: 0.08,
  },
  {
    label: 'Deployment & DevOps setup',
    category: 'Integration & Deployment',
    description: 'CI/CD, environments, monitoring, and release automation',
    defaultShare: 0.07,
  },
];

const HANDOVER: EngineeringEffortDefinition[] = [
  {
    label: 'Documentation & runbooks',
    category: 'Handover & Support Readiness',
    description: 'Technical docs, operator guides, and support playbooks',
    defaultShare: 0.05,
  },
  {
    label: 'Training & knowledge transfer',
    category: 'Handover & Support Readiness',
    description: 'Workshops, handover sessions, and admin training',
    defaultShare: 0.05,
  },
];

export const ALL_ENGINEERING_EFFORTS: EngineeringEffortDefinition[] = [
  ...DISCOVERY_DESIGN,
  ...DATA_ML,
  ...INTEGRATION_DEPLOYMENT,
  ...HANDOVER,
];

export function getEngineeringCategoryOrder(): string[] {
  return [
    'Discovery & Design',
    'Data & Machine Learning',
    'Integration & Deployment',
    'Handover & Support Readiness',
  ];
}

export function buildDefaultEngineeringBreakdown(typicalHours: number): { item: string; hours: number }[] {
  return ALL_ENGINEERING_EFFORTS.map((effort) => ({
    item: effort.label,
    hours: Math.max(1, Math.round(typicalHours * effort.defaultShare)),
  }));
}

export function sumEngineeringBreakdown(breakdown: { hours: number }[]): number {
  return breakdown.reduce((sum, line) => sum + line.hours, 0);
}

export function groupEngineeringBreakdown(
  breakdown: { item: string; hours: number }[],
): { category: string; lines: { item: string; hours: number }[] }[] {
  const lookup = new Map(ALL_ENGINEERING_EFFORTS.map((e) => [e.label, e.category]));
  const groups = new Map<string, { item: string; hours: number }[]>();

  for (const line of breakdown) {
    if (line.hours <= 0) continue;
    const category = lookup.get(line.item) ?? 'Other Engineering';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)!.push(line);
  }

  const order = getEngineeringCategoryOrder();
  const result: { category: string; lines: { item: string; hours: number }[] }[] = [];
  for (const category of order) {
    const lines = groups.get(category);
    if (lines?.length) result.push({ category, lines });
  }
  for (const [category, lines] of groups) {
    if (!order.includes(category)) result.push({ category, lines });
  }
  return result;
}
