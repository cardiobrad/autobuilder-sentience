export interface AgentConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AgentResponse {
  success: boolean;
  content: string;
  cooperationScore?: number;
  model?: string;
}

export interface TaskObjective {
  id: string;
  type: 'research' | 'security' | 'code' | 'general';
  goal: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  context?: any;
}

export interface SentienceMetrics {
  cooperationEvents: number;
  frictionEvents: number;
  loveCoefficient: number;
}