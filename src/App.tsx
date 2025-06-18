import React, { useState } from 'react';
import { Brain, Command, BarChart3, BookOpen, Menu, X } from 'lucide-react';
import { IntentParser } from './components/IntentParser';
import { ContextExplorer } from './components/ContextExplorer';
import { CommandHistory } from './components/CommandHistory';
import { Analytics } from './components/Analytics';
import { ParsedIntent } from './types';

type TabType = 'parser' | 'contexts' | 'history' | 'analytics';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('parser');
  const [commandHistory, setCommandHistory] = useState<ParsedIntent[]>([]);
  const [currentIntent, setCurrentIntent] = useState<ParsedIntent | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleIntentParsed = (intent: ParsedIntent | null) => {
    setCurrentIntent(intent);
    if (intent) {
      setCommandHistory(prev => [...prev, intent]);
    }
  };

  const handleExampleClick = (example: string) => {
    setActiveTab('parser');
    // The IntentParser will handle the example input
  };

  const tabs = [
    { id: 'parser' as TabType, name: 'Intent Parser', icon: Brain, color: 'text-blue-600 bg-blue-50' },
    { id: 'contexts' as TabType, name: 'Contexts', icon: BookOpen, color: 'text-green-600 bg-green-50' },
    { id: 'history' as TabType, name: 'History', icon: Command, color: 'text-purple-600 bg-purple-50' },
    { id: 'analytics' as TabType, name: 'Analytics', icon: BarChart3, color: 'text-orange-600 bg-orange-50' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'parser':
        return <IntentParser onIntentParsed={handleIntentParsed} />;
      case 'contexts':
        return <ContextExplorer onExampleClick={handleExampleClick} />;
      case 'history':
        return <CommandHistory history={commandHistory} />;
      case 'analytics':
        return <Analytics history={commandHistory} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white">
              <Brain className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              NLP Intent Matching System
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Advanced natural language processing for automation commands. Parse intents, extract parameters, 
            and match commands across multiple contexts with real-time confidence scoring.
          </p>
        </div>

        {/* Status Bar */}
        {currentIntent && (
          <div className="mb-6 p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  Last processed: <span className="font-mono">{currentIntent.intent}</span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Confidence:</span>
                <span className="text-sm font-bold text-green-600">
                  {Math.round(currentIntent.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mb-8">
          {/* Mobile menu button */}
          <div className="md:hidden mb-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="font-medium">Menu</span>
            </button>
          </div>

          {/* Tab navigation */}
          <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block`}>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 p-2 bg-white/70 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      isActive
                        ? `${tab.color} shadow-sm`
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span>{tab.name}</span>
                    {tab.id === 'history' && commandHistory.length > 0 && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-full">
                        {commandHistory.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="min-h-[600px]">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-white/20">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">
              NLP Engine Active • {commandHistory.length} commands processed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;