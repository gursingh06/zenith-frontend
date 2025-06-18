import { ApiDefinition, CommandContext, IntentPattern } from '../types';

export class ApiMapper {
  /**
   * Parse API definition and generate command contexts
   */
  public parseApiDefinition(apiDef: ApiDefinition): CommandContext[] {
    const contexts: CommandContext[] = [];
    
    // Group contexts by their primary domain
    const contextGroups = this.groupContextsByDomain(apiDef.contexts);
    
    for (const [domain, apiContexts] of Object.entries(contextGroups)) {
      const context: CommandContext = {
        id: domain,
        name: this.formatContextName(domain),
        description: this.generateContextDescription(apiContexts),
        color: this.getContextColor(domain),
        icon: this.getContextIcon(domain),
        patterns: []
      };

      // Generate patterns for each API context
      for (const apiContext of apiContexts) {
        const patterns = this.generatePatternsFromContext(apiContext, apiDef.api_base_url);
        context.patterns.push(...patterns);
      }

      contexts.push(context);
    }

    return contexts;
  }

  /**
   * Group API contexts by their primary domain/service
   */
  private groupContextsByDomain(contexts: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};

    for (const context of contexts) {
      // Determine primary domain from context tags or ID
      const domain = this.extractDomain(context);
      if (!groups[domain]) {
        groups[domain] = [];
      }
      groups[domain].push(context);
    }

    return groups;
  }

  /**
   * Extract primary domain from context
   */
  private extractDomain(context: any): string {
    // Check context tags for primary domain
    const primaryTags = ['kafka', 'storage', 'service', 'database', 'kubernetes'];
    
    for (const tag of context.context_tags) {
      if (primaryTags.includes(tag.toLowerCase())) {
        return tag.toLowerCase();
      }
    }

    // Fallback to extracting from ID
    if (context.id.includes('kafka')) return 'kafka';
    if (context.id.includes('storage') || context.id.includes('disk')) return 'storage';
    if (context.id.includes('service')) return 'service';
    
    return 'general';
  }

  /**
   * Generate regex patterns from API context triggers
   */
  private generatePatternsFromContext(apiContext: any, baseUrl: string): IntentPattern[] {
    const patterns: IntentPattern[] = [];

    // Create a comprehensive pattern that matches all triggers
    const triggerPattern = this.buildTriggerPattern(apiContext.triggers, apiContext.parameters);
    
    const pattern: IntentPattern = {
      pattern: triggerPattern,
      intent: apiContext.id,
      context: this.extractDomain(apiContext),
      action: this.extractAction(apiContext.triggers[0]),
      parameters: apiContext.parameters.map((p: any) => p.name),
      examples: this.generateExamples(apiContext),
      api: {
        url: apiContext.api.url,
        method: apiContext.api.method
      }
    };

    patterns.push(pattern);
    return patterns;
  }

  /**
   * Build regex pattern from triggers and parameters
   */
  private buildTriggerPattern(triggers: string[], parameters: any[]): RegExp {
    // Create alternation of all triggers
    const triggerAlts = triggers.map(trigger => 
      trigger.replace(/\s+/g, '\\s+').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    ).join('|');

    let pattern = `(?:${triggerAlts})`;

    // Add parameter capture groups
    const paramGroups: string[] = [];
    
    for (const param of parameters) {
      switch (param.name) {
        case 'hostname':
          paramGroups.push('(?:\\s+(?:on|host)\\s+([^\\s]+))?');
          break;
        case 'service_name':
          paramGroups.push('(?:\\s+(?:service\\s+)?([^\\s]+))?');
          break;
        case 'cluster':
          paramGroups.push('(?:\\s+(?:in\\s+)?cluster\\s+([^\\s]+))?');
          break;
        case 'rack_id':
          paramGroups.push('(?:\\s+rack\\s+([^\\s]+))?');
          break;
        case 'disk_paths':
          paramGroups.push('(?:\\s+paths?\\s+([^,\\s]+(?:,\\s*[^,\\s]+)*))?');
          break;
        case 'cleanup_type':
          paramGroups.push('(?:\\s+(temp_files|log_files|cache|all))?');
          break;
        case 'dry_run':
          paramGroups.push('(?:\\s+(dry[_\\s]?run))?');
          break;
        case 'force':
          paramGroups.push('(?:\\s+(force))?');
          break;
        default:
          paramGroups.push(`(?:\\s+([^\\s]+))?`);
      }
    }

    pattern += paramGroups.join('');
    
    return new RegExp(pattern, 'i');
  }

  /**
   * Extract action from trigger
   */
  private extractAction(trigger: string): string {
    const actionMap: Record<string, string> = {
      'restart': 'restart',
      'bounce': 'restart',
      'reboot': 'restart',
      'start': 'start',
      'stop': 'stop',
      'clean': 'clean',
      'wipe': 'clean',
      'clear': 'clean',
      'create': 'create',
      'delete': 'delete',
      'scale': 'scale'
    };

    for (const [key, action] of Object.entries(actionMap)) {
      if (trigger.toLowerCase().includes(key)) {
        return action;
      }
    }

    return 'execute';
  }

  /**
   * Generate example commands
   */
  private generateExamples(apiContext: any): string[] {
    const examples: string[] = [];
    const baseTrigger = apiContext.triggers[0];
    
    // Generate examples with different parameter combinations
    if (apiContext.parameters.some((p: any) => p.name === 'hostname')) {
      examples.push(`${baseTrigger} on server-01`);
      examples.push(`${baseTrigger} on host-prod-02`);
    }

    if (apiContext.parameters.some((p: any) => p.name === 'service_name')) {
      examples.push(`${baseTrigger} nginx on web-01`);
      examples.push(`${baseTrigger} api-gateway on server-02`);
    }

    if (apiContext.parameters.some((p: any) => p.name === 'cluster')) {
      examples.push(`${baseTrigger} on server-01 in production`);
    }

    // Add specific examples based on context
    if (apiContext.id.includes('clean_disks')) {
      examples.push(`${baseTrigger} on storage-01 temp_files`);
      examples.push(`${baseTrigger} on server-02 paths /tmp,/var/log dry run`);
    }

    return examples.slice(0, 4);
  }

  /**
   * Format context name for display
   */
  private formatContextName(domain: string): string {
    const nameMap: Record<string, string> = {
      'kafka': 'Apache Kafka',
      'storage': 'Storage Management',
      'service': 'Service Management',
      'database': 'Database Operations',
      'kubernetes': 'Kubernetes',
      'general': 'General Operations'
    };

    return nameMap[domain] || domain.charAt(0).toUpperCase() + domain.slice(1);
  }

  /**
   * Generate context description
   */
  private generateContextDescription(contexts: any[]): string {
    const operations = contexts.map(c => c.name.toLowerCase()).join(', ');
    return `Infrastructure operations including ${operations}`;
  }

  /**
   * Get context color scheme
   */
  private getContextColor(domain: string): string {
    const colorMap: Record<string, string> = {
      'kafka': 'from-orange-500 to-red-500',
      'storage': 'from-blue-500 to-cyan-500',
      'service': 'from-green-500 to-emerald-500',
      'database': 'from-purple-500 to-indigo-500',
      'kubernetes': 'from-indigo-500 to-purple-500',
      'general': 'from-gray-500 to-gray-600'
    };

    return colorMap[domain] || 'from-gray-500 to-gray-600';
  }

  /**
   * Get context icon
   */
  private getContextIcon(domain: string): string {
    const iconMap: Record<string, string> = {
      'kafka': 'Zap',
      'storage': 'Database',
      'service': 'Container',
      'database': 'Database',
      'kubernetes': 'Boxes',
      'general': 'Settings'
    };

    return iconMap[domain] || 'Settings';
  }
}

export const apiMapper = new ApiMapper();