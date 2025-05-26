// ===== CodeMind AI - Simple Version =====

import { CONFIG } from './utils/config.js';
import storageManager from './utils/storage.js';
import { Logger } from './utils/simple-logger.js';

class CodeMindApp {
  constructor() {
    this.isInitialized = false;
    this.logger = new Logger('CodeMindApp');
    this.currentTheme = 'dark';
    this.isProcessing = false;
    
    this.logger.info('🚀 CodeMind AI starting...');
  }

  async init() {
    try {
      this.logger.info('🔧 Initializing application...');
      
      // Initialize storage
      await storageManager.init();
      this.logger.success('✅ Storage initialized');
      
      // Setup UI
      this.setupUI();
      this.logger.success('✅ UI setup complete');
      
      // Load settings
      await this.loadSettings();
      this.logger.success('✅ Settings loaded');
      
      // Setup event listeners
      this.setupEventListeners();
      this.logger.success('✅ Event listeners setup');
      
      this.isInitialized = true;
      this.hideLoadingScreen();
      this.logger.success('🎉 CodeMind AI initialized successfully!');
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize:', error);
      this.showError('Failed to initialize application: ' + error.message);
    }
  }

  setupUI() {
    // Theme setup
    this.applyTheme(this.currentTheme);
    
    // Update connection status
    this.updateConnectionStatus('disconnected');
  }

  setupEventListeners() {
    // Send button
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }

    // Message input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openSettings());
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Modal close buttons
    this.setupModalListeners();
  }

  setupModalListeners() {
    // Settings modal
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettings');
    
    if (settingsModal && closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', () => this.closeSettings());
      
      settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
          this.closeSettings();
        }
      });
    }

    // Save settings
    const saveSettingsBtn = document.getElementById('saveSettings');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    }

    // Test connection
    const testConnectionBtn = document.getElementById('testConnection');
    if (testConnectionBtn) {
      testConnectionBtn.addEventListener('click', () => this.testConnection());
    }
  }

  async loadSettings() {
    try {
      const settings = await storageManager.get('app_settings');
      if (settings) {
        this.currentTheme = settings.theme || 'dark';
        
        // Load API key
        const apiKeyInput = document.getElementById('apiKey');
        if (apiKeyInput && settings.apiKey) {
          apiKeyInput.value = settings.apiKey;
        }
        
        // Load model selection
        const modelSelect = document.getElementById('modelSelect');
        if (modelSelect && settings.model) {
          modelSelect.value = settings.model;
        }
      }
    } catch (error) {
      this.logger.warn('⚠️ Could not load settings:', error);
    }
  }

  async saveSettings() {
    try {
      const apiKeyInput = document.getElementById('apiKey');
      const modelSelect = document.getElementById('modelSelect');
      
      const settings = {
        apiKey: apiKeyInput?.value || '',
        model: modelSelect?.value || CONFIG.API.GEMINI.DEFAULT_MODEL,
        theme: this.currentTheme,
        lastUpdated: new Date().toISOString()
      };
      
      await storageManager.set('app_settings', settings);
      this.logger.success('✅ Settings saved');
      this.showSuccess('Settings saved successfully!');
      
    } catch (error) {
      this.logger.error('❌ Failed to save settings:', error);
      this.showError('Failed to save settings: ' + error.message);
    }
  }

  async testConnection() {
    try {
      this.updateConnectionStatus('connecting');
      this.logger.info('🔍 Testing API connection...');
      
      const apiKeyInput = document.getElementById('apiKey');
      const apiKey = apiKeyInput?.value;
      
      if (!apiKey) {
        throw new Error('API key is required');
      }
      
      // Simple test request
      const response = await fetch(`${CONFIG.API.GEMINI.BASE_URL}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (response.ok) {
        this.updateConnectionStatus('connected');
        this.logger.success('✅ Connection successful');
        this.showSuccess('API connection successful!');
      } else {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      this.updateConnectionStatus('disconnected');
      this.logger.error('❌ Connection failed:', error);
      this.showError('Connection failed: ' + error.message);
    }
  }

  async sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput?.value?.trim();
    
    if (!message || this.isProcessing) {
      return;
    }
    
    try {
      this.isProcessing = true;
      this.setProcessingState(true);
      
      // Add user message to chat
      this.addMessageToChat('user', message);
      messageInput.value = '';
      
      // Simple echo response for now
      setTimeout(() => {
        this.addMessageToChat('assistant', `Echo: ${message}`);
        this.setProcessingState(false);
        this.isProcessing = false;
      }, 1000);
      
    } catch (error) {
      this.logger.error('❌ Failed to send message:', error);
      this.showError('Failed to send message: ' + error.message);
      this.setProcessingState(false);
      this.isProcessing = false;
    }
  }

  addMessageToChat(role, content) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    const timestamp = new Date().toLocaleTimeString();
    messageDiv.innerHTML = `
      <div class="message-content">
        <div class="message-text">${this.escapeHtml(content)}</div>
        <div class="message-time">${timestamp}</div>
      </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  setProcessingState(processing) {
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    
    if (sendBtn) {
      sendBtn.disabled = processing;
      sendBtn.textContent = processing ? 'Processing...' : 'Send';
    }
    
    if (messageInput) {
      messageInput.disabled = processing;
    }
  }

  updateConnectionStatus(status) {
    const statusElement = document.getElementById('connectionStatus');
    if (!statusElement) return;
    
    statusElement.className = `connection-status ${status}`;
    
    const statusText = {
      connected: 'Connected',
      disconnected: 'Disconnected', 
      connecting: 'Connecting...'
    };
    
    statusElement.textContent = statusText[status] || 'Unknown';
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(this.currentTheme);
    this.logger.info(`🎨 Theme changed to: ${this.currentTheme}`);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  openSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
      modal.classList.add('active');
    }
  }

  closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  const app = new CodeMindApp();
  await app.init();
  
  // Make app globally available for debugging
  window.codeMindApp = app;
});