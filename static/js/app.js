class NLPApp {
    constructor() {
        this.currentTab = 'parser';
        this.commandHistory = [];
        this.currentIntent = null;
        this.mobileMenuOpen = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadContexts();
        lucide.createIcons();
    }
    
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Mobile menu
        document.getElementById('mobile-menu-btn').addEventListener('click', () => {
            this.toggleMobileMenu();
        });
        
        // Command input
        const commandInput = document.getElementById('command-input');
        let debounceTimer;
        commandInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.processCommand(e.target.value);
            }, 500);
        });
    }
    
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('text-blue-600', 'bg-blue-50', 'shadow-sm');
            btn.classList.add('text-gray-600', 'hover:text-gray-900', 'hover:bg-white/50');
        });
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.remove('text-gray-600', 'hover:text-gray-900', 'hover:bg-white/50');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('text-blue-600', 'bg-blue-50', 'shadow-sm');
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${tabName}-tab`).classList.remove('hidden');
        
        // Load tab-specific content
        switch (tabName) {
            case 'contexts':
                this.loadContexts();
                break;
            case 'history':
                this.loadHistory();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
        }
        
        this.mobileMenuOpen = false;
        document.getElementById('tab-navigation').classList.add('hidden');
    }
    
    toggleMobileMenu() {
        this.mobileMenuOpen = !this.mobileMenuOpen;
        const navigation = document.getElementById('tab-navigation');
        const menuBtn = document.getElementById('mobile-menu-btn');
        
        if (this.mobileMenuOpen) {
            navigation.classList.remove('hidden');
            menuBtn.innerHTML = '<i data-lucide="x" class="h-5 w-5"></i><span class="font-medium">Close</span>';
        } else {
            navigation.classList.add('hidden');
            menuBtn.innerHTML = '<i data-lucide="menu" class="h-5 w-5"></i><span class="font-medium">Menu</span>';
        }
        
        lucide.createIcons();
    }
    
    async processCommand(input) {
        if (!input.trim()) {
            document.getElementById('results-section').innerHTML = '';
            this.updateStatusBar(null);
            return;
        }
        
        document.getElementById('processing-spinner').classList.remove('hidden');
        
        try {
            const response = await fetch('/api/parse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input })
            });
            
            const result = await response.json();
            this.displayResults(result);
            
            if (result.success && result.intent) {
                this.currentIntent = result.intent;
                this.commandHistory.push(result.intent);
                this.updateStatusBar(result.intent);
                this.updateHistoryCount();
            } else {
                this.updateStatusBar(null);
            }
        } catch (error) {
            console.error('Error processing command:', error);
            this.displayError('Error processing command. Please try again.');
        } finally {
            document.getElementById('processing-spinner').classList.add('hidden');
        }
    }
    
    displayResults(result) {
        const resultsSection = document.getElementById('results-section');
        
        if (result.success) {
            const intent = result.intent;
            const validation = result.validation || { valid: true, errors: [] };
            
            resultsSection.innerHTML = `
                <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center space-x-3">
                                <div class="p-2 bg-green-100 rounded-lg">
                                    <i data-lucide="check-circle" class="h-5 w-5 text-green-600"></i>
                                </div>
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900">Infrastructure Operation Detected</h3>
                                    <p class="text-sm text-gray-500">Ready to execute automation command</p>
                                </div>
                            </div>
                            <div class="px-3 py-1 rounded-full text-xs font-medium ${this.getConfidenceColor(intent.confidence)}">
                                ${this.getConfidenceLabel(intent.confidence)} (${Math.round(intent.confidence * 100)}%)
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div class="p-4 bg-gray-50 rounded-lg">
                                <div class="flex items-center space-x-2 mb-2">
                                    <i data-lucide="zap" class="h-4 w-4 text-blue-500"></i>
                                    <span class="text-sm font-medium text-gray-700">Operation</span>
                                </div>
                                <p class="text-sm text-gray-900 font-mono">${intent.intent}</p>
                            </div>

                            <div class="p-4 bg-gray-50 rounded-lg">
                                <div class="flex items-center space-x-2 mb-2">
                                    <i data-lucide="trending-up" class="h-4 w-4 text-green-500"></i>
                                    <span class="text-sm font-medium text-gray-700">Action</span>
                                </div>
                                <p class="text-sm text-gray-900 capitalize">${intent.action}</p>
                            </div>

                            <div class="p-4 bg-gray-50 rounded-lg">
                                <div class="flex items-center space-x-2 mb-2">
                                    <i data-lucide="server" class="h-4 w-4 text-purple-500"></i>
                                    <span class="text-sm font-medium text-gray-700">Context</span>
                                </div>
                                <p class="text-sm text-gray-900 capitalize">${intent.context}</p>
                            </div>

                            <div class="p-4 bg-gray-50 rounded-lg">
                                <div class="flex items-center space-x-2 mb-2">
                                    <i data-lucide="clock" class="h-4 w-4 text-gray-500"></i>
                                    <span class="text-sm font-medium text-gray-700">Timestamp</span>
                                </div>
                                <p class="text-sm text-gray-900">
                                    ${new Date(intent.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>

                        ${intent.api ? `
                            <div class="mb-4 p-4 bg-blue-50 rounded-lg">
                                <div class="flex items-center space-x-2 mb-2">
                                    <i data-lucide="external-link" class="h-4 w-4 text-blue-600"></i>
                                    <span class="text-sm font-medium text-blue-900">API Endpoint</span>
                                </div>
                                <div class="flex items-center space-x-4">
                                    <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded">
                                        ${intent.api.method}
                                    </span>
                                    <span class="text-sm text-blue-700 font-mono">
                                        ${intent.api.url}
                                    </span>
                                </div>
                            </div>
                        ` : ''}

                        ${Object.keys(intent.parameters).length > 0 ? `
                            <div class="p-4 bg-green-50 rounded-lg">
                                <h4 class="text-sm font-medium text-green-900 mb-3">Extracted Parameters</h4>
                                <div class="space-y-2">
                                    ${Object.entries(intent.parameters).map(([key, value]) => `
                                        <div class="flex items-center justify-between">
                                            <span class="text-sm text-green-700 font-mono">${key}</span>
                                            <span class="text-sm text-green-900 bg-green-100 px-2 py-1 rounded font-mono">
                                                ${Array.isArray(value) ? value.join(', ') : String(value)}
                                            </span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${!validation.valid ? `
                            <div class="mt-4 p-4 bg-red-50 rounded-lg">
                                <div class="flex items-center space-x-2 mb-2">
                                    <i data-lucide="alert-circle" class="h-4 w-4 text-red-600"></i>
                                    <span class="text-sm font-medium text-red-900">Validation Errors</span>
                                </div>
                                <ul class="text-sm text-red-700 space-y-1">
                                    ${validation.errors.map(error => `<li>• ${error}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } else {
            resultsSection.innerHTML = `
                <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div class="p-6">
                        <div class="flex items-center space-x-3 mb-4">
                            <div class="p-2 bg-red-100 rounded-lg">
                                <i data-lucide="alert-circle" class="h-5 w-5 text-red-600"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">Operation Not Recognized</h3>
                                <p class="text-sm text-gray-500">${result.error}</p>
                            </div>
                        </div>

                        ${result.suggestions && result.suggestions.length > 0 ? `
                            <div class="mt-4">
                                <h4 class="text-sm font-medium text-gray-700 mb-3">Try these infrastructure commands:</h4>
                                <div class="space-y-2">
                                    ${result.suggestions.map(suggestion => `
                                        <button
                                            onclick="document.getElementById('command-input').value = '${suggestion}'; app.processCommand('${suggestion}');"
                                            class="block w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-150 text-sm font-mono"
                                        >
                                            ${suggestion}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        lucide.createIcons();
    }
    
    displayError(message) {
        document.getElementById('results-section').innerHTML = `
            <div class="bg-white rounded-xl border border-red-200 shadow-sm">
                <div class="p-6">
                    <div class="flex items-center space-x-3">
                        <div class="p-2 bg-red-100 rounded-lg">
                            <i data-lucide="alert-circle" class="h-5 w-5 text-red-600"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900">Error</h3>
                            <p class="text-sm text-gray-500">${message}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
    }
    
    updateStatusBar(intent) {
        const statusBar = document.getElementById('status-bar');
        
        if (intent) {
            document.getElementById('last-intent').textContent = intent.intent;
            document.getElementById('confidence-score').textContent = `${Math.round(intent.confidence * 100)}%`;
            statusBar.classList.remove('hidden');
        } else {
            statusBar.classList.add('hidden');
        }
    }
    
    updateHistoryCount() {
        const countElement = document.getElementById('history-count');
        const count = this.commandHistory.length;
        
        if (count > 0) {
            countElement.textContent = count;
            countElement.classList.remove('hidden');
        }
        
        document.getElementById('commands-processed').textContent = count;
    }
    
    getConfidenceColor(confidence) {
        if (confidence >= 0.8) return 'text-green-600 bg-green-50';
        if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    }
    
    getConfidenceLabel(confidence) {
        if (confidence >= 0.8) return 'High Confidence';
        if (confidence >= 0.6) return 'Medium Confidence';
        return 'Low Confidence';
    }
    
    async loadContexts() {
        if (this.currentTab !== 'contexts') return;
        
        try {
            const response = await fetch('/api/contexts');
            const contexts = await response.json();
            
            const contextsTab = document.getElementById('contexts-tab');
            contextsTab.innerHTML = `
                <div class="space-y-4">
                    <div class="text-center mb-6">
                        <h2 class="text-xl font-bold text-gray-900 mb-2">Automation Contexts</h2>
                        <p class="text-gray-600">
                            Explore available commands and click examples to try them
                        </p>
                    </div>
                    
                    ${contexts.map(context => this.renderContext(context)).join('')}
                </div>
            `;
            
            lucide.createIcons();
        } catch (error) {
            console.error('Error loading contexts:', error);
        }
    }
    
    renderContext(context) {
        return `
            <div class="border border-gray-200 rounded-xl bg-white shadow-sm">
                <button
                    onclick="app.toggleContext('${context.id}')"
                    class="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150 rounded-xl"
                >
                    <div class="flex items-center space-x-3">
                        <div class="p-2 bg-gradient-to-r ${context.color} rounded-lg text-white">
                            <i data-lucide="${context.icon.toLowerCase()}" class="h-5 w-5"></i>
                        </div>
                        <div class="text-left">
                            <h3 class="font-semibold text-gray-900">${context.name}</h3>
                            <p class="text-sm text-gray-500">${context.description}</p>
                        </div>
                    </div>
                    <i data-lucide="chevron-right" class="h-5 w-5 text-gray-400 context-chevron-${context.id}"></i>
                </button>

                <div id="context-content-${context.id}" class="border-t border-gray-100 p-4 hidden">
                    <div class="space-y-4">
                        ${context.patterns.map((pattern, index) => `
                            <div class="p-4 bg-gray-50 rounded-lg">
                                <div class="flex items-center justify-between mb-3">
                                    <h4 class="font-medium text-gray-900 capitalize">
                                        ${pattern.intent.replace(/_/g, ' ')}
                                    </h4>
                                    <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                        ${pattern.action}
                                    </span>
                                </div>
                                
                                <div class="space-y-2">
                                    <p class="text-sm text-gray-600 mb-3">Examples:</p>
                                    ${pattern.examples.map(example => `
                                        <button
                                            onclick="app.useExample('${example}')"
                                            class="flex items-center justify-between w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-150 text-left group"
                                        >
                                            <span class="text-sm font-mono text-gray-700 group-hover:text-blue-700">
                                                ${example}
                                            </span>
                                            <i data-lucide="copy" class="h-4 w-4 text-gray-400 group-hover:text-blue-500"></i>
                                        </button>
                                    `).join('')}
                                </div>

                                ${pattern.parameters.length > 0 ? `
                                    <div class="mt-3 pt-3 border-t border-gray-200">
                                        <p class="text-sm text-gray-600 mb-2">Parameters:</p>
                                        <div class="flex flex-wrap gap-2">
                                            ${pattern.parameters.map(param => `
                                                <span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-mono rounded">
                                                    ${param}
                                                </span>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    toggleContext(contextId) {
        const content = document.getElementById(`context-content-${contextId}`);
        const chevron = document.querySelector(`.context-chevron-${contextId}`);
        
        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            chevron.setAttribute('data-lucide', 'chevron-down');
        } else {
            content.classList.add('hidden');
            chevron.setAttribute('data-lucide', 'chevron-right');
        }
        
        lucide.createIcons();
    }
    
    useExample(example) {
        document.getElementById('command-input').value = example;
        this.switchTab('parser');
        this.processCommand(example);
    }
    
    async loadHistory() {
        if (this.currentTab !== 'history') return;
        
        const historyTab = document.getElementById('history-tab');
        
        if (this.commandHistory.length === 0) {
            historyTab.innerHTML = `
                <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                    <i data-lucide="activity" class="h-12 w-12 text-gray-300 mx-auto mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">No Commands Yet</h3>
                    <p class="text-gray-500">
                        Start typing natural language commands to see your parsing history
                    </p>
                </div>
            `;
        } else {
            historyTab.innerHTML = `
                <div class="space-y-4">
                    <div class="flex items-center space-x-2 mb-6">
                        <i data-lucide="clock" class="h-5 w-5 text-gray-600"></i>
                        <h2 class="text-xl font-bold text-gray-900">Command History</h2>
                        <span class="px-2 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                            ${this.commandHistory.length} commands
                        </span>
                    </div>

                    <div class="space-y-3">
                        ${this.commandHistory.slice().reverse().map((intent, index) => `
                            <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
                                <div class="flex items-center justify-between mb-3">
                                    <div class="flex items-center space-x-3">
                                        <div class="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium rounded-full">
                                            ${intent.context}
                                        </div>
                                        <span class="text-sm font-mono text-gray-600">${intent.intent}</span>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                        <span class="px-2 py-1 text-xs font-medium rounded-full ${this.getConfidenceColor(intent.confidence)}">
                                            ${Math.round(intent.confidence * 100)}%
                                        </span>
                                        <span class="text-xs text-gray-500">
                                            ${new Date(intent.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>

                                <div class="flex items-center space-x-4 mb-2">
                                    <div class="flex items-center space-x-2">
                                        <i data-lucide="trending-up" class="h-4 w-4 text-gray-500"></i>
                                        <span class="text-sm text-gray-700 capitalize">${intent.action}</span>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                        <i data-lucide="check-circle" class="h-4 w-4 text-green-500"></i>
                                        <span class="text-sm text-gray-700">Parsed successfully</span>
                                    </div>
                                </div>

                                ${Object.keys(intent.parameters).length > 0 ? `
                                    <div class="mt-3 p-3 bg-gray-50 rounded-lg">
                                        <p class="text-sm font-medium text-gray-700 mb-2">Parameters:</p>
                                        <div class="space-y-1">
                                            ${Object.entries(intent.parameters).map(([key, value]) => `
                                                <div class="flex items-center justify-between">
                                                    <span class="text-sm text-gray-600 font-mono">${key}:</span>
                                                    <span class="text-sm text-gray-900 bg-white px-2 py-1 rounded font-mono">
                                                        ${Array.isArray(value) ? value.join(', ') : String(value)}
                                                    </span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        lucide.createIcons();
    }
    
    async loadAnalytics() {
        if (this.currentTab !== 'analytics') return;
        
        try {
            const response = await fetch('/api/analytics');
            const analytics = await response.json();
            
            const analyticsTab = document.getElementById('analytics-tab');
            
            if (analytics.total_commands === 0) {
                analyticsTab.innerHTML = `
                    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                        <i data-lucide="bar-chart-3" class="h-12 w-12 text-gray-300 mx-auto mb-4"></i>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">No Analytics Yet</h3>
                        <p class="text-gray-500">
                            Process some commands to see analytics and insights
                        </p>
                    </div>
                `;
            } else {
                analyticsTab.innerHTML = `
                    <div class="space-y-6">
                        <div class="flex items-center space-x-2 mb-6">
                            <i data-lucide="bar-chart-3" class="h-5 w-5 text-gray-600"></i>
                            <h2 class="text-xl font-bold text-gray-900">Analytics Dashboard</h2>
                        </div>

                        <!-- Key Metrics -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm font-medium text-gray-600">Total Commands</p>
                                        <p class="text-3xl font-bold text-gray-900">${analytics.total_commands}</p>
                                    </div>
                                    <i data-lucide="target" class="h-8 w-8 text-blue-500"></i>
                                </div>
                            </div>

                            <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm font-medium text-gray-600">Avg Confidence</p>
                                        <p class="text-3xl font-bold text-gray-900">${Math.round(analytics.avg_confidence * 100)}%</p>
                                    </div>
                                    <i data-lucide="trending-up" class="h-8 w-8 text-green-500"></i>
                                </div>
                            </div>

                            <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm font-medium text-gray-600">High Confidence</p>
                                        <p class="text-3xl font-bold text-gray-900">${analytics.confidence_distribution.high}</p>
                                    </div>
                                    <div class="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                                        <div class="h-4 w-4 bg-green-500 rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm font-medium text-gray-600">Contexts Used</p>
                                        <p class="text-3xl font-bold text-gray-900">${Object.keys(analytics.context_stats).length}</p>
                                    </div>
                                    <i data-lucide="pie-chart" class="h-8 w-8 text-purple-500"></i>
                                </div>
                            </div>
                        </div>

                        <!-- Context Distribution -->
                        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Context Distribution</h3>
                            <div class="space-y-3">
                                ${Object.entries(analytics.context_stats)
                                    .sort(([,a], [,b]) => b - a)
                                    .map(([context, count]) => {
                                        const percentage = (count / analytics.total_commands) * 100;
                                        return `
                                            <div class="flex items-center justify-between">
                                                <div class="flex items-center space-x-3">
                                                    <div class="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded"></div>
                                                    <span class="font-medium text-gray-900 capitalize">${context}</span>
                                                </div>
                                                <div class="flex items-center space-x-3">
                                                    <div class="w-24 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            class="h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                                                            style="width: ${percentage}%"
                                                        ></div>
                                                    </div>
                                                    <span class="text-sm text-gray-600 w-12 text-right">${count}</span>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                            </div>
                        </div>

                        <!-- Action Distribution -->
                        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Action Types</h3>
                            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                ${Object.entries(analytics.action_stats)
                                    .sort(([,a], [,b]) => b - a)
                                    .map(([action, count]) => `
                                        <div class="p-4 bg-gray-50 rounded-lg text-center">
                                            <p class="text-2xl font-bold text-gray-900">${count}</p>
                                            <p class="text-sm text-gray-600 capitalize">${action}</p>
                                        </div>
                                    `).join('')}
                            </div>
                        </div>

                        <!-- Confidence Distribution -->
                        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Confidence Distribution</h3>
                            <div class="grid grid-cols-3 gap-4">
                                <div class="p-4 bg-green-50 rounded-lg text-center">
                                    <div class="flex items-center justify-center mb-2">
                                        <div class="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                                        <span class="text-sm font-medium text-green-700">High (80%+)</span>
                                    </div>
                                    <p class="text-2xl font-bold text-green-600">${analytics.confidence_distribution.high}</p>
                                </div>
                                <div class="p-4 bg-yellow-50 rounded-lg text-center">
                                    <div class="flex items-center justify-center mb-2">
                                        <div class="h-3 w-3 bg-yellow-500 rounded-full mr-2"></div>
                                        <span class="text-sm font-medium text-yellow-700">Medium (60-79%)</span>
                                    </div>
                                    <p class="text-2xl font-bold text-yellow-600">${analytics.confidence_distribution.medium}</p>
                                </div>
                                <div class="p-4 bg-red-50 rounded-lg text-center">
                                    <div class="flex items-center justify-center mb-2">
                                        <div class="h-3 w-3 bg-red-500 rounded-full mr-2"></div>
                                        <span class="text-sm font-medium text-red-700">Low (60%)</span>
                                    </div>
                                    <p class="text-2xl font-bold text-red-600">${analytics.confidence_distribution.low}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            lucide.createIcons();
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }
}

// Initialize the app
const app = new NLPApp();