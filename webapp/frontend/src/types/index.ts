export type Role = "intern" | "manager" | "cto" | "dev";

export type FieldType = "text" | "textarea" | "select" | "secret";

export type ValidatorType = "command" | "regex" | "http" | "file";

export type OS = "mac" | "win" | "linux";

export interface Field {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
}

export interface Validator {
  id: string;
  type: ValidatorType;
  os: OS[];
  params: Record<string, string>;
}

export interface TemplatePart {
  id: string;
  title: string;
  description: string;
  role: Role;
  tags: string[];
  fields: Field[];
  validators: Validator[];
  updatedAt: string;
}

export interface TemplateStep {
  id: string;
  partId: string;
  order: number;
}

export interface Template {
  id: string;
  name: string;
  version: string;
  role: Role;
  status: "draft" | "published";
  steps: TemplateStep[];
  updatedAt: string;
}

export interface Integration {
  id: string;
  name: string;
  icon: string;
  description: string;
  connected: boolean;
  clientId?: string;
  clientSecret?: string;
  scopes?: string[];
}

export interface Repository {
  id: string;
  provider: string;
  org: string;
  name: string;
  defaultBranch: string;
  lastScanStatus: "done" | "pending" | "failed";
  lastScanTime: string;
  artifacts?: {
    dependencies: string[];
    makefileTargets: string[];
    packageManagers: string[];
  };
}

export type OnboardingStepStatus = "not_started" | "in_progress" | "passed" | "failed" | "skipped";

export interface OnboardingStep {
  id: string;
  partId: string;
  title: string;
  status: OnboardingStepStatus;
}

export interface Onboarding {
  id: string;
  developerId: string;
  developerName: string;
  developerAvatar: string;
  role: Role;
  templateId: string;
  templateVersion: string;
  progress: number;
  status: "active" | "completed" | "paused";
  startedAt: string;
  updatedAt: string;
  steps: OnboardingStep[];
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: "admin" | "dev";
  status: "active" | "pending";
}

export interface Event {
  id: string;
  timestamp: string;
  actor: string;
  entity: string;
  action: string;
  summary: string;
}
