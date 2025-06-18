import React, { useState, useEffect } from 'react';
import { Search, Zap, AlertCircle, CheckCircle, Clock, TrendingUp, ExternalLink, Server } from 'lucide-react';
import { nlpParser } from '../services/nlpParser';
import { ParsedIntent } from '../types';

interface IntentParserProps {
  onIntentParsed: (intent: ParsedIntent | null) => void;
}

export function IntentParser({ onIntentParsed }: IntentParserProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!input.trim()) {
      setLastResult(null);
      setSuggestions([]);
      setValidationErrors([]);
      onIntentParsed(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsProcessing(true);
      
      setTimeout(() => {
        const result = nlpParser.parseIntent(input);
        setLastResult(result);
        setSuggestions(result.suggestions || []);
        
        if (result.success && result.intent) {
          const validation = nlpParser.validateParameters(result.intent);
          setValidationErrors(validation.errors);
          onIntentParsed(validation.valid ? result.intent : null);
        } else {
          setValidationErrors([]);
          onIntentParsed(null);
        }
        
        setIsProcessing(false);
      }, 300);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [input, onIntentParsed]);

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter infrastructure command (e.g., 'restart kafka node on server-01', 'clean disks on storage-02')"
            className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 placeholder-gray-400"
          />
          {isProcessing && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {lastResult && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {lastResult.success ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Infrastructure Operation Detected</h3>
                    <p className="text-sm text-gray-500">Ready to execute automation command</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(lastResult.intent.confidence)}`}>
                  {getConfidenceLabel(lastResult.intent.confidence)} ({Math.round(lastResult.intent.confidence * 100)}%)
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Operation</span>
                  </div>
                  <p className="text-sm text-gray-900 font-mono">{lastResult.intent.intent}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Action</span>
                  </div>
                  <p className="text-sm text-gray-900 capitalize">{lastResult.intent.action}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Server className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium text-gray-700">Context</span>
                  </div>
                  <p className="text-sm text-gray-900 capitalize">{lastResult.intent.context}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Timestamp</span>
                  </div>
                  <p className="text-sm text-gray-900">
                    {lastResult.intent.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* API Endpoint Info */}
              {lastResult.intent.api && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">API Endpoint</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded">
                      {lastResult.intent.api.method}
                    </span>
                    <span className="text-sm text-blue-700 font-mono">
                      {lastResult.intent.api.url}
                    </span>
                  </div>
                </div>
              )}

              {/* Parameters */}
              {Object.keys(lastResult.intent.parameters).length > 0 && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900 mb-3">Extracted Parameters</h4>
                  <div className="space-y-2">
                    {Object.entries(lastResult.intent.parameters).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-green-700 font-mono">{key}</span>
                        <span className="text-sm text-green-900 bg-green-100 px-2 py-1 rounded font-mono">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-900">Validation Errors</span>
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Operation Not Recognized</h3>
                  <p className="text-sm text-gray-500">{lastResult.error}</p>
                </div>
              </div>

              {suggestions.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Try these infrastructure commands:</h4>
                  <div className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="block w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-150 text-sm font-mono"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}