// ===== CodeMind AI - Complete Working Version =====

// Configuration
const CONFIG = {
    APP_NAME: 'CodeMind AI',
    VERSION: '1.0.0',
    API: {
        GEMINI: {
            BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
            MODEL: 'gemini-pro'
        }
    },
    STORAGE: {
        PREFIX: 'codemind_',
        KEYS: {
            SETTINGS: 'settings',
            CHAT_HISTORY: 'chat_history',
            API_KEY: 'api_key'
        }
    },
    THEMES: {
        DARK: 'dark',
        LIGHT: 'light'
    }
};

// Simple Logger Class
class Logger {
    constructor(component = 'App') {
        this.component = component;
        this.colors = {
            debug: '#888',
            info: '#4A90E2',
            warn: '#F5A623',
            error: '#D0021B',
            success: '#7ED321'
        };
    }

    log(level, message, ...args) {
        const timestamp = new Date().toLocaleTimeString('ar-SA');
        const color = this.colors[level] || '#000';
        
        console.log(
            `%c[${timestamp}] [${this.component}] ${level.toUpperCase()}: ${message}`,
            `color: ${color}; font-weight: bold;`,
            ...args
        );
    }

    debug(message, ...args) { this.log('debug', message, ...args); }
    info(message, ...args) { this.log('info', message, ...args); }
    warn(message, ...args) { this.log('warn', message, ...args); }
    error(message, ...args) { this.log('error', message, ...args); }
    success(message, ...args) { this.log('success', message, ...args); }
}

// Storage Manager Class
class StorageManager {
    constructor() {
        this.prefix = CONFIG.STORAGE.PREFIX;
        this.isAvailable = this.checkAvailability();
        this.logger = new Logger('Storage');
    }

    checkAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            this.logger.warn('localStorage not available:', e);
            return false;
        }
    }

    getKey(key) {
        return this.prefix + key;
    }

    async get(key, defaultValue = null) {
        if (!this.isAvailable) return defaultValue;
        
        try {
            const item = localStorage.getItem(this.getKey(key));
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            this.logger.error('Failed to get item:', key, e);
            return defaultValue;
        }
    }

    async set(key, value) {
        if (!this.isAvailable) return false;
        
        try {
            localStorage.setItem(this.getKey(key), JSON.stringify(value));
            return true;
        } catch (e) {
            this.logger.error('Failed to set item:', key, e);
            return false;
        }
    }

    async remove(key) {
        if (!this.isAvailable) return false;
        
        try {
            localStorage.removeItem(this.getKey(key));
            return true;
        } catch (e) {
            this.logger.error('Failed to remove item:', key, e);
            return false;
        }
    }

    async clear() {
        if (!this.isAvailable) return false;
        
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (e) {
            this.logger.error('Failed to clear storage:', e);
            return false;
        }
    }
}

// Gemini API Class
class GeminiAPI {
    constructor() {
        this.apiKey = null;
        this.baseUrl = CONFIG.API.GEMINI.BASE_URL;
        this.model = CONFIG.API.GEMINI.MODEL;
        this.logger = new Logger('GeminiAPI');
        this.isConnected = false;
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
        this.isConnected = !!apiKey;
        this.logger.info('API key set:', !!apiKey);
    }

    async testConnection() {
        if (!this.apiKey) {
            throw new Error('API key not set');
        }

        try {
            const response = await this.generateContent('مرحبا');
            this.isConnected = true;
            this.logger.success('Connection test successful');
            return { success: true };
        } catch (error) {
            this.isConnected = false;
            this.logger.error('Connection test failed:', error);
            throw error;
        }
    }

    async generateContent(prompt, options = {}) {
        if (!this.apiKey) {
            throw new Error('API key not set');
        }

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: options.temperature || 0.7,
                topK: options.topK || 40,
                topP: options.topP || 0.95,
                maxOutputTokens: options.maxTokens || 2048,
            }
        };

        try {
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Invalid response format');
            }

            const text = data.candidates[0].content.parts[0].text;
            this.logger.info('Content generated successfully');
            
            return { text };
        } catch (error) {
            this.logger.error('Failed to generate content:', error);
            throw error;
        }
    }

    getStatus() {
        return {
            isConnected: this.isConnected,
            hasApiKey: !!this.apiKey,
            model: this.model
        };
    }
}

// Main Application Class
class CodeMindApp {
    constructor() {
        this.isInitialized = false;
        this.logger = new Logger('CodeMindApp');
        this.storage = new StorageManager();
        this.geminiAPI = new GeminiAPI();
        
        this.currentTheme = 'dark';
        this.settings = {};
        this.chatHistory = [];
        this.isProcessing = false;
        
        // DOM elements
        this.elements = {};
        
        this.logger.info('🚀 CodeMind AI initializing...');
    }

    // Initialize the application
    async initialize() {
        try {
            this.logger.info('Starting initialization...');
            
            // Load settings and data
            await this.loadSettings();
            await this.loadChatHistory();
            
            // Initialize DOM elements
            this.initializeElements();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Apply theme
            this.applyTheme(this.settings.theme || 'dark');
            
            // Load API key if exists
            const savedApiKey = await this.storage.get(CONFIG.STORAGE.KEYS.API_KEY);
            if (savedApiKey) {
                this.geminiAPI.setApiKey(savedApiKey);
                this.updateConnectionStatus();
                this.enableInputs();
            } else {
                this.enableInputs(); // This will disable inputs if no API key
            }
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            // Show welcome message
            this.showWelcomeMessage();
            
            this.isInitialized = true;
            this.logger.success('✅ Application initialized successfully!');
            
        } catch (error) {
            this.logger.error('❌ Initialization failed:', error);
            this.showError('فشل في تهيئة التطبيق: ' + error.message);
        }
    }

    // Initialize DOM elements
    initializeElements() {
        this.logger.info('Initializing DOM elements...');
        
        this.elements = {
            // Main containers
            loadingScreen: document.getElementById('loading-screen'),
            mainApp: document.getElementById('app'),
            
            // Header elements
            settingsButton: document.getElementById('settings-btn'),
            themeToggle: document.getElementById('theme-toggle'),
            statusIndicator: document.getElementById('status-indicator'),
            
            // Chat elements
            chatContainer: document.getElementById('chat-container'),
            userInput: document.getElementById('user-input'),
            sendButton: document.getElementById('send-btn'),
            
            // Settings panel
            settingsPanel: document.getElementById('settings-panel'),
            settingsOverlay: document.getElementById('settingsOverlay'),
            apiKeyInput: document.getElementById('api-key'),
            modelSelect: document.getElementById('model-select'),
            
            // Quick actions
            quickActions: document.querySelectorAll('.quick-action'),
            
            // Terminal
            commandTerminal: document.getElementById('command-terminal'),
            terminalToggle: document.getElementById('toggle-terminal')
        };

        // Validate critical elements
        const criticalElements = ['loadingScreen', 'mainApp', 'chatContainer', 'userInput', 'sendButton'];
        const missingElements = criticalElements.filter(key => !this.elements[key]);
        
        if (missingElements.length > 0) {
            throw new Error(`Missing critical DOM elements: ${missingElements.join(', ')}`);
        }
        
        this.logger.success('DOM elements initialized');
    }

    // Setup event listeners
    setupEventListeners() {
        this.logger.info('Setting up event listeners...');
        
        // Settings button
        if (this.elements.settingsButton) {
            this.elements.settingsButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSettingsPanel();
            });
        }

        // Close settings button
        const closeSettingsBtn = document.getElementById('closeSettings');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeSettingsPanel();
            });
        }

        // Theme toggle
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Send button
        if (this.elements.sendButton) {
            this.elements.sendButton.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        // User input
        if (this.elements.userInput) {
            this.elements.userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            this.elements.userInput.addEventListener('input', () => {
                this.adjustTextareaHeight();
            });
        }

        // API key input
        if (this.elements.apiKeyInput) {
            this.elements.apiKeyInput.addEventListener('change', async (e) => {
                const apiKey = e.target.value.trim();
                if (apiKey) {
                    await this.setApiKey(apiKey);
                }
            });
        }

        // Model selection
        if (this.elements.modelSelect) {
            this.elements.modelSelect.addEventListener('change', (e) => {
                this.settings.model = e.target.value;
                this.saveSettings();
            });
        }

        // Quick action buttons
        this.elements.quickActions.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Terminal toggle
        if (this.elements.terminalToggle) {
            this.elements.terminalToggle.addEventListener('click', () => {
                this.toggleTerminal();
            });
        }

        // Test connection button
        const testConnectionBtn = document.getElementById('testConnection');
        if (testConnectionBtn) {
            testConnectionBtn.addEventListener('click', async () => {
                await this.testConnection();
            });
        }

        // Save settings button
        const saveSettingsBtn = document.getElementById('saveSettings');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
                this.showNotification('تم حفظ الإعدادات', 'success');
            });
        }

        // Settings overlay click to close
        if (this.elements.settingsOverlay) {
            this.elements.settingsOverlay.addEventListener('click', () => {
                this.closeSettingsPanel();
            });
        }

        // Escape key to close settings
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.settingsPanel && 
                this.elements.settingsPanel.classList.contains('active')) {
                this.closeSettingsPanel();
            }
        });

        // Close settings panel when clicking outside
        document.addEventListener('click', (e) => {
            if (this.elements.settingsPanel && 
                this.elements.settingsPanel.classList.contains('active') &&
                !this.elements.settingsPanel.contains(e.target) && 
                !this.elements.settingsButton.contains(e.target)) {
                this.closeSettingsPanel();
            }
        });
        
        this.logger.success('Event listeners setup complete');
    }

    // Load settings from storage
    async loadSettings() {
        this.settings = await this.storage.get(CONFIG.STORAGE.KEYS.SETTINGS, {
            theme: 'dark',
            model: 'gemini-pro',
            autoScroll: true,
            soundEffects: false,
            saveHistory: true,
            language: 'ar'
        });
        
        this.logger.info('Settings loaded:', this.settings);
    }

    // Save settings to storage
    async saveSettings() {
        await this.storage.set(CONFIG.STORAGE.KEYS.SETTINGS, this.settings);
        this.logger.info('Settings saved');
    }

    // Load chat history
    async loadChatHistory() {
        this.chatHistory = await this.storage.get(CONFIG.STORAGE.KEYS.CHAT_HISTORY, []);
        this.logger.info('Chat history loaded:', this.chatHistory.length, 'messages');
        
        // Restore chat messages to UI
        if (this.chatHistory.length > 0) {
            this.chatHistory.forEach(message => {
                this.addMessageToChat(message.role, message.content, false);
            });
        }
    }

    // Save chat history
    async saveChatHistory() {
        if (this.settings.saveHistory) {
            await this.storage.set(CONFIG.STORAGE.KEYS.CHAT_HISTORY, this.chatHistory);
        }
    }

    // Set API key
    async setApiKey(apiKey) {
        try {
            this.geminiAPI.setApiKey(apiKey);
            await this.geminiAPI.testConnection();
            
            await this.storage.set(CONFIG.STORAGE.KEYS.API_KEY, apiKey);
            this.updateConnectionStatus();
            this.enableInputs();
            this.showNotification('تم حفظ مفتاح API بنجاح!', 'success');
            
        } catch (error) {
            this.logger.error('Failed to set API key:', error);
            this.showNotification('فشل في تعيين مفتاح API: ' + error.message, 'error');
        }
    }

    // Enable/disable inputs based on API key status
    enableInputs() {
        const hasApiKey = !!this.geminiAPI.apiKey;
        
        if (this.elements.userInput) {
            this.elements.userInput.disabled = !hasApiKey;
        }
        
        if (this.elements.sendButton) {
            this.elements.sendButton.disabled = !hasApiKey;
        }
        
        this.logger.info('Inputs enabled:', hasApiKey);
    }

    // Test API connection
    async testConnection() {
        if (!this.geminiAPI.apiKey) {
            this.showNotification('يرجى إدخال مفتاح API أولاً', 'warning');
            return;
        }

        try {
            this.showNotification('جاري اختبار الاتصال...', 'info');
            await this.geminiAPI.testConnection();
            this.updateConnectionStatus();
            this.showNotification('تم الاتصال بنجاح!', 'success');
        } catch (error) {
            this.logger.error('Connection test failed:', error);
            this.showNotification('فشل في الاتصال: ' + error.message, 'error');
        }
    }

    // Handle quick actions
    handleQuickAction(action) {
        this.logger.info('Quick action:', action);
        
        const prompts = {
            search: 'ابحث عن ',
            create: 'أنشئ مشروع ',
            ask: 'اشرح لي ',
            code: 'اكتب كود ',
            analyze: 'حلل ',
            help: 'ساعدني في '
        };

        if (prompts[action]) {
            this.elements.userInput.value = prompts[action];
            this.elements.userInput.focus();
            this.adjustTextareaHeight();
        }
    }

    // Send message
    async sendMessage() {
        const message = this.elements.userInput.value.trim();
        if (!message || this.isProcessing) return;

        this.logger.info('Sending message:', message);
        
        // Clear input
        this.elements.userInput.value = '';
        this.adjustTextareaHeight();
        
        // Add user message to chat
        this.addMessageToChat('user', message);
        
        // Show typing indicator
        this.showTypingIndicator();
        this.isProcessing = true;
        
        try {
            // Check if API key is set
            if (!this.geminiAPI.apiKey) {
                throw new Error('يرجى إدخال مفتاح API في الإعدادات أولاً');
            }

            // Generate response
            const response = await this.geminiAPI.generateContent(message);
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add AI response to chat
            this.addMessageToChat('assistant', response.text);
            
        } catch (error) {
            this.hideTypingIndicator();
            this.logger.error('Message processing failed:', error);
            
            let errorMessage = 'عذراً، حدث خطأ في معالجة طلبك.';
            if (error.message.includes('API key')) {
                errorMessage = 'يرجى التأكد من إدخال مفتاح API صحيح في الإعدادات.';
            } else if (error.message.includes('quota')) {
                errorMessage = 'تم تجاوز حد الاستخدام المسموح. يرجى المحاولة لاحقاً.';
            }
            
            this.addMessageToChat('assistant', errorMessage);
        } finally {
            this.isProcessing = false;
        }
    }

    // Add message to chat
    addMessageToChat(role, content, saveToHistory = true) {
        if (!this.elements.chatContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Handle markdown-like formatting
        const formattedContent = this.formatMessage(content);
        messageContent.innerHTML = formattedContent;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = new Date().toLocaleTimeString('ar-SA');
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        
        this.elements.chatContainer.appendChild(messageDiv);
        
        // Save to history
        if (saveToHistory) {
            this.chatHistory.push({
                role,
                content,
                timestamp: Date.now()
            });
            this.saveChatHistory();
        }
        
        // Auto scroll to bottom
        if (this.settings.autoScroll) {
            this.scrollToBottom();
        }
    }

    // Format message content
    formatMessage(content) {
        // Simple markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    // Show typing indicator
    showTypingIndicator() {
        if (!this.elements.chatContainer) return;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant-message typing-indicator';
        typingDiv.id = 'typing-indicator';
        
        const typingContent = document.createElement('div');
        typingContent.className = 'message-content';
        typingContent.innerHTML = `
            <div class="typing-animation">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <span>جاري الكتابة...</span>
        `;
        
        typingDiv.appendChild(typingContent);
        this.elements.chatContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    // Hide typing indicator
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Scroll to bottom
    scrollToBottom() {
        if (this.elements.chatContainer) {
            this.elements.chatContainer.scrollTop = this.elements.chatContainer.scrollHeight;
        }
    }

    // Adjust textarea height
    adjustTextareaHeight() {
        if (this.elements.userInput) {
            this.elements.userInput.style.height = 'auto';
            this.elements.userInput.style.height = Math.min(this.elements.userInput.scrollHeight, 120) + 'px';
        }
    }

    // Toggle settings panel
    toggleSettingsPanel() {
        if (this.elements.settingsPanel && this.elements.settingsOverlay) {
            const isActive = this.elements.settingsPanel.classList.contains('active');
            if (isActive) {
                this.elements.settingsPanel.classList.remove('active');
                this.elements.settingsOverlay.classList.remove('active');
                this.logger.info('Settings panel closed');
            } else {
                this.elements.settingsPanel.classList.add('active');
                this.elements.settingsOverlay.classList.add('active');
                this.logger.info('Settings panel opened');
            }
        }
    }

    // Close settings panel
    closeSettingsPanel() {
        if (this.elements.settingsPanel && this.elements.settingsOverlay) {
            this.elements.settingsPanel.classList.remove('active');
            this.elements.settingsOverlay.classList.remove('active');
            this.logger.info('Settings panel closed');
        }
    }

    // Toggle theme
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        this.settings.theme = newTheme;
        this.saveSettings();
    }

    // Apply theme
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        
        // Update theme toggle button
        if (this.elements.themeToggle) {
            this.elements.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
            this.elements.themeToggle.title = theme === 'dark' ? 'تبديل إلى الوضع الفاتح' : 'تبديل إلى الوضع المظلم';
        }
        
        this.logger.info('Theme applied:', theme);
    }

    // Toggle terminal
    toggleTerminal() {
        if (this.elements.commandTerminal) {
            this.elements.commandTerminal.classList.toggle('active');
            this.logger.info('Terminal toggled');
        }
    }

    // Update connection status
    updateConnectionStatus() {
        const status = this.geminiAPI.getStatus();
        
        if (this.elements.statusIndicator) {
            const statusText = status.isConnected ? 'متصل' : 'غير متصل';
            const statusClass = status.isConnected ? 'connected' : 'disconnected';
            
            this.elements.statusIndicator.textContent = statusText;
            this.elements.statusIndicator.className = `status-indicator ${statusClass}`;
        }
        
        this.logger.info('Connection status updated:', status);
    }

    // Show welcome message
    showWelcomeMessage() {
        const welcomeMessage = `مرحباً بك في CodeMind AI! 🤖

أنا مساعدك الذكي للبرمجة والتطوير. يمكنني مساعدتك في:

• كتابة وتحليل الكود
• إنشاء المشاريع
• حل المشاكل البرمجية
• شرح المفاهيم التقنية
• البحث والتطوير

لبدء الاستخدام، يرجى إدخال مفتاح Gemini API في الإعدادات.`;

        this.addMessageToChat('assistant', welcomeMessage, false);
    }

    // Hide loading screen
    hideLoadingScreen() {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                this.elements.loadingScreen.style.display = 'none';
                if (this.elements.mainApp) {
                    this.elements.mainApp.style.display = 'flex';
                    setTimeout(() => {
                        this.elements.mainApp.style.opacity = '1';
                    }, 50);
                }
            }, 500);
        }
        this.logger.success('Loading screen hidden');
    }

    // Show error
    showError(title, message) {
        this.logger.error('Error:', title, message);
        
        // Create error modal
        const errorModal = document.createElement('div');
        errorModal.className = 'error-modal';
        errorModal.innerHTML = `
            <div class="error-content">
                <h3>❌ ${title}</h3>
                <p>${message}</p>
                <button onclick="this.parentElement.parentElement.remove()">حسناً</button>
            </div>
        `;
        
        document.body.appendChild(errorModal);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorModal.parentElement) {
                errorModal.remove();
            }
        }, 5000);
    }

    // Show notification
    showNotification(message, type = 'info') {
        this.logger.info('Notification:', message, type);
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Show animation
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Clear chat history
    async clearChatHistory() {
        this.chatHistory = [];
        await this.storage.remove(CONFIG.STORAGE.KEYS.CHAT_HISTORY);
        
        if (this.elements.chatContainer) {
            this.elements.chatContainer.innerHTML = '';
        }
        
        this.showWelcomeMessage();
        this.showNotification('تم مسح سجل المحادثة', 'success');
    }

    // Export chat history
    exportChatHistory() {
        const data = {
            app: CONFIG.APP_NAME,
            version: CONFIG.VERSION,
            exported: new Date().toISOString(),
            messages: this.chatHistory
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `codemind-chat-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('تم تصدير سجل المحادثة', 'success');
    }

    // Get app status
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            theme: this.currentTheme,
            settings: this.settings,
            chatHistory: this.chatHistory.length,
            geminiAPI: this.geminiAPI.getStatus(),
            isProcessing: this.isProcessing
        };
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOM loaded, initializing CodeMind AI...');
    
    try {
        const app = new CodeMindApp();
        await app.initialize();
        
        // Make app globally available for debugging
        window.codeMindApp = app;
        
        console.log('✅ CodeMind AI initialized successfully!');
        
    } catch (error) {
        console.error('❌ Failed to initialize CodeMind AI:', error);
        
        // Hide loading screen even if initialization fails
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #ff4444; color: white; padding: 20px; border-radius: 10px;
            text-align: center; z-index: 10000; font-family: Arial, sans-serif;
        `;
        errorDiv.innerHTML = `
            <h3>خطأ في تهيئة التطبيق</h3>
            <p>${error.message}</p>
            <button onclick="location.reload()" style="
                background: white; color: #ff4444; border: none; 
                padding: 10px 20px; border-radius: 5px; cursor: pointer;
                margin-top: 10px;
            ">إعادة تحميل</button>
        `;
        
        document.body.appendChild(errorDiv);
    }
});

// Export for module usage
export default CodeMindApp;