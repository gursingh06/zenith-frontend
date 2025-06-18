import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Zap, Container, Database, Boxes, Copy, CheckCircle } from 'lucide-react';
import { commandContexts } from '../data/contexts';
import { CommandContext } from '../types';

interface ContextExplorerProps {
  onExampleClick: (example: string) => void;
}

export function ContextExplorer({ onExampleClick }: ContextExplorerProps) {
  const [expandedContexts, setExpandedContexts] = useState<Set<string>>(new Set(['kafka']));
  const [copiedExample, setCopiedExample] = useState<string | null>(null);

  const iconMap = {
    Zap,
    Container,
    Database,
    Boxes
  };

  const toggleContext = (contextId: string) => {
    const newExpanded = new Set(expandedContexts);
    if (newExpanded.has(contextId)) {
      newExpanded.delete(contextId);
    } else {
      newExpanded.add(contextId);
    }
    setExpandedContexts(newExpanded);
  };

  const handleExampleClick = (example: string) => {
    onExampleClick(example);
    setCopiedExample(example);
    setTimeout(() => setCopiedExample(null), 2000);
  };

  const renderContext = (context: CommandContext) => {
    const isExpanded = expandedContexts.has(context.id);
    const IconComponent = iconMap[context.icon as keyof typeof iconMap];

    return (
      <div key={context.id} className="border border-gray-200 rounded-xl bg-white shadow-sm">
        <button
          onClick={() => toggleContext(context.id)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150 rounded-xl"
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 bg-gradient-to-r ${context.color} rounded-lg text-white`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">{context.name}</h3>
              <p className="text-sm text-gray-500">{context.description}</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {isExpanded && (
          <div className="border-t border-gray-100 p-4">
            <div className="space-y-4">
              {context.patterns.map((pattern, patternIndex) => (
                <div key={patternIndex} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 capitalize">
                      {pattern.intent.replace(/_/g, ' ')}
                    </h4>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {pattern.action}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 mb-3">Examples:</p>
                    {pattern.examples.map((example, exampleIndex) => (
                      <button
                        key={exampleIndex}
                        onClick={() => handleExampleClick(example)}
                        className="flex items-center justify-between w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-150 text-left group"
                      >
                        <span className="text-sm font-mono text-gray-700 group-hover:text-blue-700">
                          {example}
                        </span>
                        <div className="flex items-center space-x-2">
                          {copiedExample === example ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {pattern.parameters.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">Parameters:</p>
                      <div className="flex flex-wrap gap-2">
                        {pattern.parameters.map((param, paramIndex) => (
                          <span
                            key={paramIndex}
                            className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-mono rounded"
                          >
                            {param}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Automation Contexts</h2>
        <p className="text-gray-600">
          Explore available commands and click examples to try them
        </p>
      </div>
      
      {commandContexts.map(renderContext)}
    </div>
  );
}