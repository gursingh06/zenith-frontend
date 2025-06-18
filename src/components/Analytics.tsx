import React from 'react';
import { BarChart3, PieChart, TrendingUp, Target } from 'lucide-react';
import { ParsedIntent } from '../types';
import { commandContexts } from '../data/contexts';

interface AnalyticsProps {
  history: ParsedIntent[];
}

export function Analytics({ history }: AnalyticsProps) {
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Yet</h3>
        <p className="text-gray-500">
          Process some commands to see analytics and insights
        </p>
      </div>
    );
  }

  // Calculate analytics
  const contextStats = history.reduce((acc, intent) => {
    acc[intent.context] = (acc[intent.context] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const actionStats = history.reduce((acc, intent) => {
    acc[intent.action] = (acc[intent.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgConfidence = history.reduce((sum, intent) => sum + intent.confidence, 0) / history.length;

  const highConfidenceCount = history.filter(intent => intent.confidence >= 0.8).length;
  const mediumConfidenceCount = history.filter(intent => intent.confidence >= 0.6 && intent.confidence < 0.8).length;
  const lowConfidenceCount = history.filter(intent => intent.confidence < 0.6).length;

  const getContextInfo = (contextId: string) => {
    const context = commandContexts.find(c => c.id === contextId);
    return context || { name: contextId, color: 'from-gray-500 to-gray-600' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <BarChart3 className="h-5 w-5 text-gray-600" />
        <h2 className="text-xl font-bold text-gray-900">Analytics Dashboard</h2>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commands</p>
              <p className="text-3xl font-bold text-gray-900">{history.length}</p>
            </div>
            <Target className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
              <p className="text-3xl font-bold text-gray-900">{Math.round(avgConfidence * 100)}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Confidence</p>
              <p className="text-3xl font-bold text-gray-900">{highConfidenceCount}</p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="h-4 w-4 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Contexts Used</p>
              <p className="text-3xl font-bold text-gray-900">{Object.keys(contextStats).length}</p>
            </div>
            <PieChart className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Context Distribution */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Context Distribution</h3>
        <div className="space-y-3">
          {Object.entries(contextStats)
            .sort(([,a], [,b]) => b - a)
            .map(([context, count]) => {
              const contextInfo = getContextInfo(context);
              const percentage = (count / history.length) * 100;
              return (
                <div key={context} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 bg-gradient-to-r ${contextInfo.color} rounded`}></div>
                    <span className="font-medium text-gray-900">{contextInfo.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 bg-gradient-to-r ${contextInfo.color} rounded-full`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Action Distribution */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(actionStats)
            .sort(([,a], [,b]) => b - a)
            .map(([action, count]) => (
              <div key={action} className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600 capitalize">{action}</p>
              </div>
            ))}
        </div>
      </div>

      {/* Confidence Distribution */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence Distribution</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-green-700">High (80%+)</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{highConfidenceCount}</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="h-3 w-3 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-yellow-700">Medium (60-79%)</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{mediumConfidenceCount}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="h-3 w-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-red-700">Low (60%)</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{lowConfidenceCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}