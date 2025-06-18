export interface ParsedIntent {
  intent: string;
  confidence: number;
  context: string;
  parameters: Record<string, any>;
  action: string;
  timestamp: Date;
  api?: ApiEndpoint;
}

export interface IntentPattern {
  pattern: RegExp;
  intent: string;
  context: string;
  action: string;
  parameters: string[];
  examples: string[];
  api?: ApiEndpoint;
}

export interface ApiEndpoint {
  url: string;
  method: string;
}

export interface CommandContext {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  patterns: IntentPattern[];
}

export interface ParseResult {
  success: boolean;
  intent?: ParsedIntent;
  suggestions?: string[];
  error?: string;
}

export interface ApiDefinition {
  automation_id: string;
  name: string;
  description: string;
  contexts: ApiContext[];
  common_parameters: Record<string, ParameterDefinition>;
  api_base_url: string;
  version: string;
}

export interface ApiContext {
  id: string;
  name: string;
  triggers: string[];
  context_tags: string[];
  parameters: ParameterDefinition[];
  api: ApiEndpoint;
}

export interface ParameterDefinition {
  name?: string;
  type: string;
  required: boolean;
  default?: any;
  enum?: string[];
  description?: string;
}