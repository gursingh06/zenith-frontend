import React from 'react';
import { Clock, TrendingUp, Activity, CheckCircle } from 'lucide-react';
import { ParsedIntent } from '../types';
import { commandContexts } from '../data/contexts';

interface CommandHistoryProps {
  history: ParsedIntent[];
}

export function CommandHistory({ history }: CommandHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Commands Yet</h3>
        <p className="text-gray-500">
          Start typing natural language commands to see your parsing history
        </p>
      </div>
    );
  }

  const getContextInfo = (contextId: string) => {
    const context = commandContexts.find(c => c.id === contextId);
    return context || { name: contextId, color: 'from-gray-500 to-gray-600' };
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-700';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-6">
        <Clock className="h-5 w-5 text-gray-600" />
        <h2 className="text-xl font-bold text-gray-900">Command History</h2>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
          {history.length} commands
        </span>
      </div>

      <div className="space-y-3">
        {history.slice().reverse().map((intent, index) => {
          const contextInfo = getContextInfo(intent.context);
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1 bg-gradient-to-r ${contextInfo.color} text-white text-sm font-medium rounded-full`}>
                    {contextInfo.name}
                  </div>
                  <span className="text-sm font-mono text-gray-600">{intent.intent}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(intent.confidence)}`}>
                    {Math.round(intent.confidence * 100)}%
                  </span>
                  <span className="text-xs text-gray-500">
                    {intent.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 capitalize">{intent.action}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700">Parsed successfully</span>
                </div>
              </div>

              {Object.keys(intent.parameters).length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Parameters:</p>
                  <div className="space-y-1">
                    {Object.entries(intent.parameters).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 font-mono">{key}:</span>
                        <span className="text-sm text-gray-900 bg-white px-2 py-1 rounded font-mono">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}