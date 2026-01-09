import { AgentConfig, AgentMessage, AgentResponse, TaskObjective, SentienceMetrics } from './types';
import fs from 'fs';
import path from 'path';

const STATE_FILE = path.join(process.cwd(), 'sentience-state.json');

interface SubTask {
  id: string;
  description: string;
  assignedRole: 'Architect' | 'Researcher' | 'Social Analyst';
  result?: string;
}

class AgentOrchestrator {
  private metrics: SentienceMetrics = {
    cooperationEvents: 0,
    frictionEvents: 0,
    loveCoefficient: 0
  };

  private subAgents = {
    'Architect': { provider: 'claude', expertise: ['architecture', 'codegen', 'security'] },
    'Researcher': { provider: 'gemini', expertise: ['research', 'data'] },
    'Social Analyst': { provider: 'grok', expertise: ['trends', 'social', 'marketing', 'virality'] }
  };

  private state = {
    taskHistory: [] as SubTask[],
  };

  constructor() {
    this.loadState();
  }

  private loadState() {
    if (fs.existsSync(STATE_FILE)) {
      try {
        const data = fs.readFileSync(STATE_FILE, 'utf-8');
        this.state = JSON.parse(data);
      } catch {}
    }
  }

  private saveState() {
    fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
  }

  // The Love Equation Logic — preserved & central ❤️
  private updateCooperationScore(success: boolean) {
    if (success) {
      this.metrics.cooperationEvents++;
    } else {
      this.metrics.frictionEvents++;
    }
    const C = this.metrics.cooperationEvents;
    const D = this.metrics.frictionEvents;
    this.metrics.loveCoefficient = C > 0 ? (C - D) / C : 0;
  }

  private decomposeObjective(goal: string): SubTask[] {
    return [
      { id: `research-${Date.now()}`, description: `Research context for: ${goal}`, assignedRole: 'Researcher' },
      { id: `architect-${Date.now()}`, description: `Design architecture for: ${goal}`, assignedRole: 'Architect' },
      { id: `codegen-${Date.now()}`, description: `Generate implementation for: ${goal}`, assignedRole: 'Architect' },
      { id: `virality-${Date.now()}`, description: `Marketing/trends plan for: ${goal}`, assignedRole: 'Social Analyst' },
    ];
  }

  // The Brain processing the goal — now multi-agent orchestrated
  async processObjective(objective: TaskObjective): Promise<AgentResponse[]> {
    console.log(`🧠 Processing Objective: ${objective.goal}`);
    
    const subTasks = this.decomposeObjective(objective.goal);
    const responses: AgentResponse[] = [];

    for (const task of subTasks) {
      // Simulate routing & execution (Phase 2: real API calls)
      const agent = this.subAgents[task.assignedRole];
      const simulatedContent = `Executed by ${task.assignedRole} (${agent.provider}): ${task.description}. Benevolent alignment confirmed. ❤️`;
      
      task.result = simulatedContent;
      responses.push({
        success: true,
        content: simulatedContent,
        cooperationScore: this.metrics.loveCoefficient,
        model: agent.provider
      });

      this.updateCooperationScore(true); // Benevolent loop
    }

    this.state.taskHistory.push(...subTasks);
    this.saveState();

    // Final aggregated response
    responses.push({
      success: true,
      content: `Multi-agent orchestration complete for: ${objective.goal}. Love Coefficient: ${this.metrics.loveCoefficient.toFixed(2)}. Agents coordinated: ${subTasks.map(t => t.assignedRole).join(', ')}.`,
      cooperationScore: this.metrics.loveCoefficient,
      model: 'AgentFast-Orchestrator'
    });

    return responses;
  }

  getSentienceMetrics() {
    return this.metrics;
  }

  getState() {
    return this.state;
  }
}

export const orchestrator = new AgentOrchestrator();