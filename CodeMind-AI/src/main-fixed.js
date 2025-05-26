// ===== CodeMind AI Main Application - Fixed Version =====

// Import configurations
import { CONFIG } from './utils/config.js';

// Simple logger for debugging
class SimpleLogger {
    constructor(component = 'App') {
        this.component = component;
    }

    debug(message, ...args) {
        console.log(`[${this.component}] 🔍 ${message}`, ...args);
    }

    info(message, ...args) {
        console.log(`[${this.component}] ℹ️ ${message}`, ...args);
    }

    warn(message, ...args) {
        console.warn(`[${this.component}] ⚠️ ${message}`, ...args);
    }

    error(message, ...args) {
        console.error(`[${this.component}] ❌ ${message}`, ...args);
    }

    success(message, ...args) {
        console.log(`[${this.component}] ✅ ${message}`, ...args);
    }
}

// Simple storage manager
class SimpleStorageManager {
    constructor() {
        this.isAvailable = this.checkAvailability();
    }

    checkAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    async getItem(key, defaultValue = null) {
        if (!this.isAvailable) return defaultValue;
        
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('Failed to get item from storage:', e);
            return defaultValue;
        }
    }

    async setItem(key, value) {
        if (!this.isAvailable) return false;
        
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('Failed to set item in storage:', e);
            return false;
        }
    }
}

// Simple Gemini API class
class SimpleGeminiAPI {
    constructor() {
        this.apiKey = null;
        this.isConnected = false;
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
        this.isConnected = !!apiKey;
    }

    async testConnection() {
        if (!this.apiKey) {
            throw new Error('API key not set');
        }
        // Simple test - just check if key exists
        return { success: true };
    }

    async generateContent(prompt) {
        if (!this.apiKey) {
            throw new Error('API key not set');
        }
        
        // Simulate API response for now
        return {
            text: 'مرحباً! أنا CodeMind AI. يرجى إدخال مفتاح API صحيح للحصول على إجابات حقيقية.'
        };
    }

    getStatus() {
        return {
            isConnected: this.isConnected,
            hasApiKey: !!this.apiKey
        };
    }
}

// Main Application Class
class CodeMindApp {
    constructor() {
        this.isInitialized = false;
        this.logger = new SimpleLogger('CodeMindApp');
        this.storage = new SimpleStorageManager();
        this.geminiAPI = new SimpleGeminiAPI();
        this.currentTheme = 'dark';
        this.settings = {};
        
        this.logger.info('CodeMind AI initializing...');
    }

    // Initialize the application
    async initialize() {
        try {
            this.logger.info('Starting initialization...');
            
            // Load settings
            await this.loadSettings();
            
            // Setup UI
            this.setupUI();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Apply theme
            this.applyTheme(this.settings.theme || 'dark');
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            this.isInitialized = true;
            this.logger.success('Application initialized successfully!');
            
        } catch (error) {
            this.logger.error('Initialization failed:', error);
            this.showError('فشل في تهيئة التطبيق: ' + error.message);
        }
    }

    // Load settings from storage
    async loadSettings() {
        this.settings = await this.storage.getItem('codemind_settings', {
            theme: 'dark',
            model: 'gemini-pro',
            autoScroll: true,
            soundEffects: false,
            saveHistory: true
        });
        
        this.logger.info('Settings loaded:', this.settings);
    }

    // Save settings to storage
    async saveSettings() {
        await this.storage.setItem('codemind_settings', this.settings);
        this.logger.info('Settings saved');
    }

    // Setup UI elements
    setupUI() {
        this.logger.info('Setting up UI...');
        
        // Get main elements
        this.loadingScreen = document.getElementById('loading-screen');
        this.mainApp = document.getElementById('main-app');
        this.chatContainer = document.getElementById('chat-container');
        this.userInput = document.getElementById('user-input');
        this.sendButton = document.getElementById('send-button');
        this.settingsPanel = document.getElementById('settings-panel');
        this.settingsButton = document.getElementById('settings-button');
        this.themeToggle = document.getElementById('theme-toggle');
        
        // Setup quick action buttons
        this.setupQuickActions();
        
        // Setup settings panel
        this.setupSettingsPanel();
        
        this.logger.info('UI setup complete');
    }

    // Setup quick action buttons
    setupQuickActions() {
        const quickActions = document.querySelectorAll('.quick-action');
        quickActions.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    // Setup settings panel
    setupSettingsPanel() {
        // API Key input
        const apiKeyInput = document.getElementById('api-key-input');
        if (apiKeyInput) {
            apiKeyInput.addEventListener('change', (e) => {
                const apiKey = e.target.value.trim();
                if (apiKey) {
                    this.geminiAPI.setApiKey(apiKey);
                    this.settings.apiKey = apiKey;
                    this.saveSettings();
                    this.showMessage('تم حفظ مفتاح API بنجاح!', 'success');
                }
            });
        }

        // Model selection
        const modelSelect = document.getElementById('model-select');
        if (modelSelect) {
            modelSelect.value = this.settings.model;
            modelSelect.addEventListener('change', (e) => {
                this.settings.model = e.target.value;
                this.saveSettings();
            });
        }

        // Other settings
        const settingsInputs = document.querySelectorAll('.setting-input');
        settingsInputs.forEach(input => {
            const settingName = input.dataset.setting;
            if (settingName && this.settings[settingName] !== undefined) {
                if (input.type === 'checkbox') {
                    input.checked = this.settings[settingName];
                } else {
                    input.value = this.settings[settingName];
                }
                
                input.addEventListener('change', (e) => {
                    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                    this.settings[settingName] = value;
                    this.saveSettings();
                });
            }
        });
    }

    // Setup event listeners
    setupEventListeners() {
        this.logger.info('Setting up event listeners...');
        
        // Settings button
        if (this.settingsButton) {
            this.settingsButton.addEventListener('click', () => {
                this.toggleSettingsPanel();
            });
        }

        // Theme toggle
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Send button
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        // User input
        if (this.userInput) {
            this.userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Close settings panel when clicking outside
        document.addEventListener('click', (e) => {
            if (this.settingsPanel && 
                !this.settingsPanel.contains(e.target) && 
                !this.settingsButton.contains(e.target) &&
                this.settingsPanel.classList.contains('active')) {
                this.toggleSettingsPanel();
            }
        });
        
        this.logger.info('Event listeners setup complete');
    }

    // Handle quick actions
    handleQuickAction(action) {
        this.logger.info('Quick action:', action);
        
        switch (action) {
            case 'search':
                this.userInput.value = 'ابحث عن ';
                this.userInput.focus();
                break;
            case 'create':
                this.userInput.value = 'أنشئ مشروع ';
                this.userInput.focus();
                break;
            case 'ask':
                this.userInput.value = 'اشرح لي ';
                this.userInput.focus();
                break;
            default:
                this.logger.warn('Unknown quick action:', action);
        }
    }

    // Toggle settings panel
    toggleSettingsPanel() {
        if (this.settingsPanel) {
            this.settingsPanel.classList.toggle('active');
            this.logger.info('Settings panel toggled');
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
        
        // Update theme toggle button text
        if (this.themeToggle) {
            this.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
        
        this.logger.info('Theme applied:', theme);
    }

    // Send message
    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;

        this.logger.info('Sending message:', message);
        
        // Clear input
        this.userInput.value = '';
        
        // Add user message to chat
        this.addMessageToChat('user', message);
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Generate response
            const response = await this.geminiAPI.generateContent(message);
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add AI response to chat
            this.addMessageToChat('assistant', response.text);
            
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessageToChat('assistant', 'عذراً، حدث خطأ في معالجة طلبك. يرجى التأكد من إدخال مفتاح API صحيح.');
            this.logger.error('Message processing failed:', error);
        }
    }

    // Add message to chat
    addMessageToChat(role, content) {
        if (!this.chatContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = new Date().toLocaleTimeString('ar-SA');
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        
        this.chatContainer.appendChild(messageDiv);
        
        // Auto scroll to bottom
        if (this.settings.autoScroll) {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        }
    }

    // Show typing indicator
    showTypingIndicator() {
        if (!this.chatContainer) return;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant-message typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = '<div class="message-content">جاري الكتابة...</div>';
        
        this.chatContainer.appendChild(typingDiv);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    // Hide typing indicator
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Hide loading screen
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
                if (this.mainApp) {
                    this.mainApp.style.display = 'flex';
                    setTimeout(() => {
                        this.mainApp.style.opacity = '1';
                    }, 50);
                }
            }, 500);
        }
        this.logger.success('Loading screen hidden');
    }

    // Show error message
    showError(message) {
        this.logger.error('Error:', message);
        // You can implement a toast notification here
        alert(message);
    }

    // Show success message
    showMessage(message, type = 'info') {
        this.logger.info('Message:', message, type);
        // You can implement a toast notification here
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOM loaded, initializing CodeMind AI...');
    
    try {
        const app = new CodeMindApp();
        await app.initialize();
        
        // Make app globally available for debugging
        window.codeMindApp = app;
        
    } catch (error) {
        console.error('❌ Failed to initialize CodeMind AI:', error);
        
        // Hide loading screen even if initialization fails
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Show error message
        document.body.innerHTML += `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: #ff4444; color: white; padding: 20px; border-radius: 10px; 
                        text-align: center; z-index: 10000;">
                <h3>خطأ في تهيئة التطبيق</h3>
                <p>${error.message}</p>
                <button onclick="location.reload()" style="background: white; color: #ff4444; 
                        border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    إعادة تحميل
                </button>
            </div>
        `;
    }
});

// Export for module usage
export default CodeMindApp;