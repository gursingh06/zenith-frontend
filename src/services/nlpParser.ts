import { commandContexts } from '../data/contexts';
import { ParsedIntent, ParseResult, IntentPattern } from '../types';

export class NLPParser {
  private fuzzyMatch(text: string, pattern: string): number {
    const textLower = text.toLowerCase();
    const patternLower = pattern.toLowerCase();
    
    if (textLower.includes(patternLower)) return 0.9;
    
    // Calculate Levenshtein distance for fuzzy matching
    const matrix: number[][] = [];
    const textLen = textLower.length;
    const patternLen = patternLower.length;
    
    for (let i = 0; i <= textLen; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= patternLen; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= textLen; i++) {
      for (let j = 1; j <= patternLen; j++) {
        if (textLower[i - 1] === patternLower[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    const distance = matrix[textLen][patternLen];
    const similarity = 1 - (distance / Math.max(textLen, patternLen));
    return Math.max(0, similarity);
  }

  private extractParameters(text: string, pattern: IntentPattern): Record<string, any> {
    const match = text.match(pattern.pattern);
    if (!match) return {};

    const parameters: Record<string, any> = {};
    
    pattern.parameters.forEach((param, index) => {
      const value = match[index + 1];
      if (value !== undefined && value.trim()) {
        // Smart type conversion and parameter handling
        if (param === 'force' || param === 'dry_run') {
          parameters[param] = true;
        } else if (param === 'disk_paths' && value.includes(',')) {
          parameters[param] = value.split(',').map(path => path.trim());
        } else if (param.includes('_id') || param === 'port' || param === 'replicas') {
          const numValue = parseInt(value, 10);
          parameters[param] = isNaN(numValue) ? value.trim() : numValue;
        } else {
          parameters[param] = value.trim();
        }
      }
    });

    // Set default values for boolean parameters if they appear in the text
    if (text.toLowerCase().includes('force') && !parameters.force) {
      parameters.force = true;
    }
    if (text.toLowerCase().includes('dry run') || text.toLowerCase().includes('dry-run')) {
      parameters.dry_run = true;
    }

    return parameters;
  }

  private calculateConfidence(text: string, pattern: IntentPattern): number {
    const match = text.match(pattern.pattern);
    if (!match) return 0;

    // Base confidence from regex match
    let confidence = 0.85;

    // Boost confidence for exact action matches
    const actionKeywords = ['restart', 'start', 'stop', 'create', 'delete', 'scale', 'backup', 'restore', 'clean', 'wipe', 'bounce', 'reboot'];
    const foundActions = actionKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    confidence += foundActions.length * 0.03;

    // Boost confidence for context-specific terms
    const contextTerms = {
      kafka: ['kafka', 'broker', 'node', 'datanode', 'consumer', 'producer'],
      storage: ['storage', 'disk', 'box', 'rack', 'cleanup', 'maintenance'],
      service: ['service', 'daemon', 'process']
    };

    const relevantTerms = contextTerms[pattern.context as keyof typeof contextTerms] || [];
    const foundTerms = relevantTerms.filter(term => 
      text.toLowerCase().includes(term.toLowerCase())
    );
    confidence += foundTerms.length * 0.02;

    // Boost confidence for parameter presence
    const parameterCount = Object.keys(this.extractParameters(text, pattern)).length;
    confidence += parameterCount * 0.01;

    // Penalize if required hostname is missing for infrastructure operations
    if (pattern.parameters.includes('hostname') && !text.match(/(?:on|host|server)\s+[\w\-\.]+/i)) {
      confidence -= 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  public parseIntent(input: string): ParseResult {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please enter a command'
      };
    }

    const matches: Array<{ pattern: IntentPattern; context: string; confidence: number }> = [];

    // Find all matching patterns across all contexts
    for (const context of commandContexts) {
      for (const pattern of context.patterns) {
        if (pattern.pattern.test(input)) {
          const confidence = this.calculateConfidence(input, pattern);
          matches.push({ pattern, context: context.id, confidence });
        }
      }
    }

    if (matches.length === 0) {
      // Generate suggestions based on fuzzy matching
      const suggestions = this.generateSuggestions(input);
      return {
        success: false,
        error: 'No matching infrastructure operation found. Try commands like "restart kafka node on server-01" or "clean disks on storage-02"',
        suggestions
      };
    }

    // Sort by confidence and take the best match
    matches.sort((a, b) => b.confidence - a.confidence);
    const bestMatch = matches[0];

    const parameters = this.extractParameters(input, bestMatch.pattern);
    
    const intent: ParsedIntent = {
      intent: bestMatch.pattern.intent,
      confidence: bestMatch.confidence,
      context: bestMatch.context,
      parameters,
      action: bestMatch.pattern.action,
      timestamp: new Date(),
      api: bestMatch.pattern.api
    };

    return {
      success: true,
      intent
    };
  }

  private generateSuggestions(input: string): string[] {
    const suggestions: Array<{ example: string; score: number }> = [];

    for (const context of commandContexts) {
      for (const pattern of context.patterns) {
        for (const example of pattern.examples) {
          const score = this.fuzzyMatch(input, example);
          if (score > 0.3) {
            suggestions.push({ example, score });
          }
        }
      }
    }

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.example);
  }

  public getContextExamples(contextId?: string): string[] {
    const contexts = contextId 
      ? commandContexts.filter(c => c.id === contextId)
      : commandContexts;

    const examples: string[] = [];
    for (const context of contexts) {
      for (const pattern of context.patterns) {
        examples.push(...pattern.examples);
      }
    }

    return examples.slice(0, 15);
  }

  public validateParameters(intent: ParsedIntent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for required hostname in infrastructure operations
    if (['restart_kafka_node', 'restart_storage_node', 'clean_disks', 'restart_service'].includes(intent.intent)) {
      if (!intent.parameters.hostname) {
        errors.push('Hostname is required for infrastructure operations');
      }
    }

    // Validate service name for service operations
    if (intent.intent === 'restart_service' && !intent.parameters.service_name) {
      errors.push('Service name is required');
    }

    // Validate cleanup type for disk cleaning
    if (intent.intent === 'clean_disks' && intent.parameters.cleanup_type) {
      const validTypes = ['temp_files', 'log_files', 'cache', 'all'];
      if (!validTypes.includes(intent.parameters.cleanup_type)) {
        errors.push(`Invalid cleanup type. Must be one of: ${validTypes.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const nlpParser = new NLPParser();