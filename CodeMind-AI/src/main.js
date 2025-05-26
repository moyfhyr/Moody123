// ===== CodeMind AI Main Application =====

import { CONFIG } from './utils/config.js';
import storageManager, { settingsStorage, chatHistoryStorage } from './utils/storage.js';
import { agentCore } from './core/agent-core.js';
import { Logger } from './utils/simple-logger.js';

class CodeMindApp {
  constructor() {
    this.isInitialized = false;
    this.currentTheme = 'dark';
    this.settings = {};
    this.elements = {};
    this.isProcessing = false;
    this.currentProject = null;
    this.browserWindow = null;
    this.projectStudio = null;
    
    // Initialize logger
    this.logger = new Logger('CodeMindApp');
    this.logger.info('🚀 CodeMind AI Application starting...');
  }

  // Initialize the application
  async init() {
    try {
      this.logger.info('🚀 Initializing CodeMind AI...');
      
      // Show loading screen
      this.showLoadingScreen();
      
      // Initialize storage
      await storageManager.init();
      
      // Initialize Agent Core
      await agentCore.initialize();
      
      // Load settings
      await this.loadSettings();
      
      // Initialize DOM elements
      this.initializeElements();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Setup agent event listeners
      this.setupAgentEventListeners();
      
      // Apply theme
      this.applyTheme(this.settings.theme || 'dark');
      
      // Load chat history
      await this.loadChatHistory();
      
      // Hide loading screen and show app
      this.hideLoadingScreen();
      
      // Check for API key
      await this.checkApiKey();
      
      this.isInitialized = true;
      this.logger.success('✅ CodeMind AI initialized successfully');
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize CodeMind AI:', error);
      this.showError('فشل في تهيئة التطبيق', error.message);
    }
  }

  // Initialize DOM elements
  initializeElements() {
    this.elements = {
      // Main containers
      app: document.getElementById('app'),
      loadingScreen: document.getElementById('loading-screen'),
      errorBoundary: document.getElementById('error-boundary'),
      
      // Header elements
      settingsBtn: document.getElementById('settings-btn'),
      themeToggle: document.getElementById('theme-toggle'),
      statusIndicator: document.getElementById('status-indicator'),
      statusText: document.querySelector('.status-text'),
      statusDot: document.querySelector('.status-dot'),
      
      // Chat elements
      chatMessages: document.getElementById('chat-messages'),
      userInput: document.getElementById('user-input'),
      sendBtn: document.getElementById('send-btn'),
      
      // Terminal elements
      commandTerminal: document.getElementById('command-terminal'),
      terminalContent: document.querySelector('.terminal-content'),
      clearTerminal: document.getElementById('clear-terminal'),
      toggleTerminal: document.getElementById('toggle-terminal'),
      
      // Settings panel
      settingsPanel: document.getElementById('settings-panel'),
      closeSettings: document.getElementById('close-settings'),
      apiKeyInput: document.getElementById('api-key'),
      toggleApiKey: document.getElementById('toggle-api-key'),
      aiModelSelect: document.getElementById('ai-model'),
      saveSettings: document.getElementById('save-settings'),
      testConnection: document.getElementById('test-connection'),
      resetSettings: document.getElementById('reset-settings'),
      
      // Checkboxes
      autoScrollCheck: document.getElementById('auto-scroll'),
      soundEffectsCheck: document.getElementById('sound-effects'),
      saveHistoryCheck: document.getElementById('save-history'),
      
      // Range inputs
      maxTokensRange: document.getElementById('max-tokens'),
      temperatureRange: document.getElementById('temperature'),
      
      // Browser window
      browserWindow: document.getElementById('browser-window'),
      browserFrame: document.getElementById('browser-frame'),
      browserUrl: document.getElementById('browser-url'),
      browserBack: document.getElementById('browser-back'),
      browserForward: document.getElementById('browser-forward'),
      browserRefresh: document.getElementById('browser-refresh'),
      closeBrowser: document.getElementById('close-browser'),
      
      // Project studio
      projectStudio: document.getElementById('project-studio'),
      codeEditor: document.getElementById('code-editor'),
      projectPreview: document.getElementById('project-preview'),
      runProject: document.getElementById('run-project'),
      saveProject: document.getElementById('save-project'),
      downloadProject: document.getElementById('download-project'),
      closeStudio: document.getElementById('close-studio'),
      
      // Overlay
      overlay: document.getElementById('overlay')
    };
  }

  // Set up event listeners
  setupEventListeners() {
    // Header controls
    this.elements.settingsBtn?.addEventListener('click', () => this.toggleSettings());
    this.elements.themeToggle?.addEventListener('click', () => this.toggleTheme());
    
    // Chat interface
    this.elements.sendBtn?.addEventListener('click', () => this.sendMessage());
    this.elements.userInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    this.elements.userInput?.addEventListener('input', () => this.handleInputChange());
    
    // Quick actions
    document.querySelectorAll('.quick-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const command = e.target.dataset.command;
        if (command) {
          this.elements.userInput.value = command;
          this.sendMessage();
        }
      });
    });
    
    // Terminal controls
    this.elements.clearTerminal?.addEventListener('click', () => this.clearTerminal());
    this.elements.toggleTerminal?.addEventListener('click', () => this.toggleTerminal());
    
    // Settings panel
    this.elements.closeSettings?.addEventListener('click', () => this.closeSettings());
    this.elements.toggleApiKey?.addEventListener('click', () => this.toggleApiKeyVisibility());
    this.elements.saveSettings?.addEventListener('click', () => this.saveSettings());
    this.elements.testConnection?.addEventListener('click', () => this.testConnection());
    this.elements.resetSettings?.addEventListener('click', () => this.resetSettings());
    
    // Range inputs
    this.elements.maxTokensRange?.addEventListener('input', (e) => {
      document.querySelector('.range-value').textContent = e.target.value;
    });
    this.elements.temperatureRange?.addEventListener('input', (e) => {
      document.querySelectorAll('.range-value')[1].textContent = e.target.value;
    });
    
    // Browser window
    this.elements.closeBrowser?.addEventListener('click', () => this.closeBrowser());
    this.elements.browserBack?.addEventListener('click', () => this.browserGoBack());
    this.elements.browserForward?.addEventListener('click', () => this.browserGoForward());
    this.elements.browserRefresh?.addEventListener('click', () => this.browserRefresh());
    
    // Project studio
    this.elements.closeStudio?.addEventListener('click', () => this.closeProjectStudio());
    this.elements.runProject?.addEventListener('click', () => this.runProject());
    this.elements.saveProject?.addEventListener('click', () => this.saveCurrentProject());
    this.elements.downloadProject?.addEventListener('click', () => this.downloadProject());
    
    // Editor tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchEditorTab(e.target.dataset.file));
    });
    
    // Overlay
    this.elements.overlay?.addEventListener('click', () => this.closeAllModals());
    
    // Error boundary
    document.getElementById('reload-app')?.addEventListener('click', () => {
      window.location.reload();
    });
    
    // Global error handler
    window.addEventListener('error', (e) => this.handleGlobalError(e));
    window.addEventListener('unhandledrejection', (e) => this.handleGlobalError(e));
    
    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  // Setup agent event listeners
  setupAgentEventListeners() {
    // Listen for agent events
    agentCore.on('initialized', () => {
      this.logger.success('🤖 Agent Core initialized');
      this.addTerminalMessage('تم تهيئة النواة الأساسية للوكيل');
    });

    agentCore.on('activated', () => {
      this.logger.success('🟢 Agent activated');
      this.addTerminalMessage('تم تفعيل الوكيل الذكي');
      this.updateConnectionStatus(true);
    });

    agentCore.on('deactivated', () => {
      this.logger.info('🔴 Agent deactivated');
      this.addTerminalMessage('تم إلغاء تفعيل الوكيل');
      this.updateConnectionStatus(false);
    });

    agentCore.on('taskStarted', (task) => {
      this.logger.info('📋 Task started:', task.id);
      this.addTerminalMessage(`بدء تنفيذ المهمة: ${task.input}`);
      this.setProcessingState(true);
    });

    agentCore.on('taskStepAdded', ({ task, step }) => {
      this.logger.debug('📋 Task step:', step.description);
      this.addTerminalMessage(`${step.description}...`);
    });

    agentCore.on('taskCompleted', (task) => {
      this.logger.success('✅ Task completed:', task.id);
      this.addTerminalMessage('تم إنجاز المهمة بنجاح');
      this.setProcessingState(false);
      
      // Display result in chat
      if (task.result) {
        this.displayAgentResponse(task.result);
      }
    });

    agentCore.on('taskFailed', (task) => {
      this.logger.error('❌ Task failed:', task.id, task.error);
      this.addTerminalMessage(`فشل في تنفيذ المهمة: ${task.error}`);
      this.setProcessingState(false);
      
      // Show error in chat
      this.displayErrorMessage(task.error);
    });

    agentCore.on('message', (message) => {
      this.displayAgentResponse(message);
    });
  }

  // Show loading screen
  showLoadingScreen() {
    const loadingScreen = this.elements.loadingScreen;
    if (loadingScreen) {
      loadingScreen.style.display = 'flex';
      this.updateLoadingStatus('جاري تحميل التطبيق...');
    }
  }

  // Hide loading screen
  hideLoadingScreen() {
    const loadingScreen = this.elements.loadingScreen;
    const app = this.elements.app;
    
    if (loadingScreen && app) {
      setTimeout(() => {
        loadingScreen.style.display = 'none';
        app.style.display = 'block';
        app.classList.add('animate-fade-in');
      }, 1000);
    }
  }

  // Update loading status
  updateLoadingStatus(status) {
    const statusElement = document.querySelector('.loading-status');
    if (statusElement) {
      statusElement.textContent = status;
    }
  }

  // Load settings from storage
  async loadSettings() {
    try {
      this.settings = await settingsStorage.get();
      console.log('📋 Settings loaded:', this.settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = {};
    }
  }

  // Apply theme
  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    
    const themeIcon = this.elements.themeToggle?.querySelector('.icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  // Toggle theme
  async toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    
    await settingsStorage.update({ theme: newTheme });
    this.addTerminalMessage(`تم تغيير الثيم إلى ${newTheme === 'dark' ? 'الوضع الليلي' : 'الوضع النهاري'}`, 'success');
  }

  // Check API key
  async checkApiKey() {
    const apiKey = await storageManager.getItem(CONFIG.STORAGE.KEYS.API_KEY);
    
    if (apiKey) {
      try {
        await agentCore.initialize(apiKey);
        this.updateConnectionStatus('online', 'متصل');
        this.enableChatInterface();
        this.addTerminalMessage('تم الاتصال بـ Gemini API بنجاح', 'success');
      } catch (error) {
        this.updateConnectionStatus('offline', 'خطأ في الاتصال');
        this.addTerminalMessage(`فشل الاتصال: ${error.message}`, 'error');
      }
    } else {
      this.updateConnectionStatus('offline', 'غير متصل');
      this.addTerminalMessage('يرجى إدخال مفتاح API في الإعدادات', 'warning');
    }
  }

  // Update connection status
  updateConnectionStatus(status, text) {
    if (this.elements.statusDot) {
      this.elements.statusDot.className = `status-dot ${status}`;
    }
    if (this.elements.statusText) {
      this.elements.statusText.textContent = text;
    }
  }

  // Enable/disable chat interface
  enableChatInterface() {
    if (this.elements.userInput) {
      this.elements.userInput.disabled = false;
      this.elements.userInput.placeholder = 'اكتب أمرك هنا... (مثال: اكتب لي موقع بسيط)';
    }
    if (this.elements.sendBtn) {
      this.elements.sendBtn.disabled = false;
    }
  }

  disableChatInterface() {
    if (this.elements.userInput) {
      this.elements.userInput.disabled = true;
      this.elements.userInput.placeholder = 'يرجى إدخال مفتاح API أولاً...';
    }
    if (this.elements.sendBtn) {
      this.elements.sendBtn.disabled = true;
    }
  }

  // Handle input change
  handleInputChange() {
    const input = this.elements.userInput;
    const sendBtn = this.elements.sendBtn;
    
    if (input && sendBtn) {
      const hasText = input.value.trim().length > 0;
      sendBtn.disabled = !hasText || this.isProcessing;
      
      // Auto-resize textarea
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 150) + 'px';
    }
  }

  // Send message
  async sendMessage() {
    const input = this.elements.userInput;
    const message = input?.value.trim();
    
    if (!message || this.isProcessing) return;
    
    try {
      this.setProcessingState(true);
      
      // Add user message to chat
      this.addChatMessage('user', message);
      
      // Clear input
      input.value = '';
      this.handleInputChange();
      
      // Process command with agent core
      const result = await agentCore.processCommand(message);
      
      // Save user message to history
      if (this.settings.saveHistory) {
        await chatHistoryStorage.add({
          type: 'user',
          content: message,
          timestamp: Date.now()
        });
      }
      
    } catch (error) {
      this.logger.error('Send message error:', error);
      this.displayErrorMessage('عذراً، حدث خطأ أثناء معالجة رسالتك. يرجى المحاولة مرة أخرى.');
      this.addTerminalMessage(`خطأ: ${error.message}`);
      this.setProcessingState(false);
    }
  }

  // Update send button state
  updateSendButton(processing) {
    const sendBtn = this.elements.sendBtn;
    if (sendBtn) {
      const icon = sendBtn.querySelector('.icon');
      if (processing) {
        sendBtn.disabled = true;
        if (icon) icon.textContent = '⏳';
      } else {
        sendBtn.disabled = false;
        if (icon) icon.textContent = '📤';
      }
    }
  }

  // Add chat message
  addChatMessage(type, content) {
    const messagesContainer = this.elements.chatMessages;
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message animate-slide-in-up`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'user' ? '👤' : '🤖';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    
    // Process markdown-like formatting
    const formattedContent = this.formatMessageContent(content);
    messageText.innerHTML = formattedContent;
    
    messageContent.appendChild(messageText);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    
    messagesContainer.appendChild(messageDiv);
    
    // Auto-scroll if enabled
    if (this.settings.autoScroll) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  // Format message content
  formatMessageContent(content) {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>')
      .replace(/#{1,6}\s(.*?)(?=\n|$)/g, '<h3>$1</h3>')
      .replace(/```(\w+)?\n([\s\S]*?)\n```/g, '<pre><code>$2</code></pre>');
  }

  // Handle actions from agent response
  async handleActions(actions) {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'open_browser':
            await this.openBrowser(action.data);
            break;
          case 'create_project':
            await this.createProject(action.data);
            break;
          case 'create_full_project':
            await this.createFullProject(action.data);
            break;
          default:
            console.warn('Unknown action type:', action.type);
        }
      } catch (error) {
        console.error('Action execution error:', error);
        this.addTerminalMessage(`فشل تنفيذ العملية: ${error.message}`, 'error');
      }
    }
  }

  // Open browser window
  async openBrowser(data) {
    const browserWindow = this.elements.browserWindow;
    const overlay = this.elements.overlay;
    
    if (browserWindow && overlay) {
      browserWindow.classList.remove('hidden');
      overlay.classList.remove('hidden');
      
      // Set URL if provided
      if (data.url) {
        this.elements.browserUrl.value = data.url;
        this.elements.browserFrame.src = data.url;
      } else if (data.query) {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(data.query)}`;
        this.elements.browserUrl.value = searchUrl;
        this.elements.browserFrame.src = searchUrl;
      }
      
      this.addTerminalMessage('تم فتح نافذة المتصفح', 'success');
    }
  }

  // Create simple project
  async createProject(data) {
    this.currentProject = {
      id: Date.now(),
      title: data.title || 'مشروع جديد',
      files: {
        'index.html': data.code.html || '',
        'style.css': data.code.css || '',
        'script.js': data.code.javascript || ''
      },
      createdAt: Date.now()
    };
    
    this.openProjectStudio();
    this.addTerminalMessage('تم إنشاء المشروع بنجاح', 'success');
  }

  // Create full project
  async createFullProject(data) {
    this.currentProject = {
      id: Date.now(),
      title: data.title || 'مشروع متقدم',
      description: data.description || '',
      files: data.files || {},
      createdAt: Date.now()
    };
    
    this.openProjectStudio();
    this.addTerminalMessage('تم إنشاء المشروع المتقدم بنجاح', 'success');
  }

  // Open project studio
  openProjectStudio() {
    const studio = this.elements.projectStudio;
    const overlay = this.elements.overlay;
    
    if (studio && overlay && this.currentProject) {
      studio.classList.remove('hidden');
      overlay.classList.remove('hidden');
      
      // Load first file
      const firstFile = Object.keys(this.currentProject.files)[0];
      if (firstFile) {
        this.switchEditorTab(firstFile);
      }
      
      this.addTerminalMessage('تم فتح استوديو المشاريع', 'success');
    }
  }

  // Switch editor tab
  switchEditorTab(fileName) {
    if (!this.currentProject || !this.currentProject.files[fileName]) return;
    
    // Update tab appearance
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.file === fileName) {
        tab.classList.add('active');
      }
    });
    
    // Load file content
    this.elements.codeEditor.value = this.currentProject.files[fileName];
  }

  // Run project
  runProject() {
    if (!this.currentProject) return;
    
    const htmlContent = this.currentProject.files['index.html'] || '';
    const cssContent = this.currentProject.files['style.css'] || this.currentProject.files['css/style.css'] || '';
    const jsContent = this.currentProject.files['script.js'] || this.currentProject.files['js/script.js'] || '';
    
    const fullHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.currentProject.title}</title>
    <style>${cssContent}</style>
</head>
<body>
    ${htmlContent.replace(/<html[^>]*>|<\/html>|<head[^>]*>[\s\S]*?<\/head>|<body[^>]*>|<\/body>/gi, '')}
    <script>${jsContent}</script>
</body>
</html>`;
    
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    this.elements.projectPreview.src = url;
    this.addTerminalMessage('تم تشغيل المشروع', 'success');
  }

  // Add terminal message
  addTerminalMessage(message, type = 'info') {
    const terminal = this.elements.terminalContent;
    if (!terminal) return;
    
    const line = document.createElement('div');
    line.className = `terminal-line terminal-${type}`;
    
    const prompt = document.createElement('span');
    prompt.className = 'terminal-prompt';
    prompt.textContent = 'CodeMind AI $ ';
    
    const text = document.createElement('span');
    text.className = 'terminal-text';
    text.textContent = message;
    
    line.appendChild(prompt);
    line.appendChild(text);
    terminal.appendChild(line);
    
    // Auto-scroll
    terminal.scrollTop = terminal.scrollHeight;
    
    // Limit terminal lines
    const lines = terminal.querySelectorAll('.terminal-line');
    if (lines.length > CONFIG.UI.TERMINAL.MAX_LINES) {
      lines[0].remove();
    }
  }

  // Clear terminal
  clearTerminal() {
    const terminal = this.elements.terminalContent;
    if (terminal) {
      terminal.innerHTML = `
        <div class="terminal-line">
          <span class="terminal-prompt">CodeMind AI $</span>
          <span class="terminal-text">نظام جاهز للاستخدام</span>
        </div>
      `;
    }
  }

  // Toggle terminal visibility
  toggleTerminal() {
    const terminalSection = document.querySelector('.terminal-section');
    const toggleBtn = this.elements.toggleTerminal;
    
    if (terminalSection && toggleBtn) {
      const isHidden = terminalSection.style.display === 'none';
      terminalSection.style.display = isHidden ? 'flex' : 'none';
      toggleBtn.textContent = isHidden ? 'إخفاء' : 'إظهار';
    }
  }

  // Toggle settings panel
  toggleSettings() {
    const panel = this.elements.settingsPanel;
    const overlay = this.elements.overlay;
    
    if (panel && overlay) {
      const isActive = panel.classList.contains('active');
      
      if (isActive) {
        this.closeSettings();
      } else {
        panel.classList.add('active');
        overlay.classList.remove('hidden');
        this.loadSettingsToForm();
      }
    }
  }

  // Close settings panel
  closeSettings() {
    const panel = this.elements.settingsPanel;
    const overlay = this.elements.overlay;
    
    if (panel && overlay) {
      panel.classList.remove('active');
      overlay.classList.add('hidden');
    }
  }

  // Load settings to form
  async loadSettingsToForm() {
    const apiKey = await storageManager.getItem(CONFIG.STORAGE.KEYS.API_KEY);
    
    if (this.elements.apiKeyInput && apiKey) {
      this.elements.apiKeyInput.value = apiKey;
    }
    
    if (this.elements.aiModelSelect) {
      this.elements.aiModelSelect.value = this.settings.model || CONFIG.API.GEMINI.DEFAULT_MODEL;
    }
    
    if (this.elements.autoScrollCheck) {
      this.elements.autoScrollCheck.checked = this.settings.autoScroll !== false;
    }
    
    if (this.elements.soundEffectsCheck) {
      this.elements.soundEffectsCheck.checked = this.settings.soundEffects || false;
    }
    
    if (this.elements.saveHistoryCheck) {
      this.elements.saveHistoryCheck.checked = this.settings.saveHistory !== false;
    }
    
    if (this.elements.maxTokensRange) {
      this.elements.maxTokensRange.value = this.settings.maxTokens || CONFIG.API.GEMINI.MAX_TOKENS;
      document.querySelector('.range-value').textContent = this.elements.maxTokensRange.value;
    }
    
    if (this.elements.temperatureRange) {
      this.elements.temperatureRange.value = this.settings.temperature || CONFIG.API.GEMINI.TEMPERATURE;
      document.querySelectorAll('.range-value')[1].textContent = this.elements.temperatureRange.value;
    }
  }

  // Save settings
  async saveSettings() {
    try {
      const newSettings = {
        theme: this.currentTheme,
        model: this.elements.aiModelSelect?.value || CONFIG.API.GEMINI.DEFAULT_MODEL,
        autoScroll: this.elements.autoScrollCheck?.checked !== false,
        soundEffects: this.elements.soundEffectsCheck?.checked || false,
        saveHistory: this.elements.saveHistoryCheck?.checked !== false,
        maxTokens: parseInt(this.elements.maxTokensRange?.value) || CONFIG.API.GEMINI.MAX_TOKENS,
        temperature: parseFloat(this.elements.temperatureRange?.value) || CONFIG.API.GEMINI.TEMPERATURE
      };
      
      await settingsStorage.set(newSettings);
      this.settings = newSettings;
      
      // Save API key separately (encrypted)
      const apiKey = this.elements.apiKeyInput?.value.trim();
      if (apiKey) {
        await storageManager.setItem(CONFIG.STORAGE.KEYS.API_KEY, apiKey, true);
        
        // Test connection with new API key
        try {
          await agentCore.initialize(apiKey);
          this.updateConnectionStatus('online', 'متصل');
          this.enableChatInterface();
          this.addTerminalMessage('تم حفظ الإعدادات والاتصال بنجاح', 'success');
        } catch (error) {
          this.updateConnectionStatus('offline', 'خطأ في الاتصال');
          this.addTerminalMessage(`تم حفظ الإعدادات لكن فشل الاتصال: ${error.message}`, 'warning');
        }
      } else {
        this.addTerminalMessage('تم حفظ الإعدادات', 'success');
      }
      
      this.closeSettings();
      
    } catch (error) {
      console.error('Save settings error:', error);
      this.addTerminalMessage(`فشل حفظ الإعدادات: ${error.message}`, 'error');
    }
  }

  // Test connection
  async testConnection() {
    const apiKey = this.elements.apiKeyInput?.value.trim();
    
    if (!apiKey) {
      this.addTerminalMessage('يرجى إدخال مفتاح API أولاً');
      return;
    }
    
    try {
      this.addTerminalMessage('جاري اختبار الاتصال...');
      
      // Initialize agent with API key
      const result = await agentCore.initialize(apiKey);
      
      if (result.success) {
        this.updateConnectionStatus(true);
        this.addTerminalMessage('✅ تم الاتصال بنجاح');
        this.logger.success('API connection successful');
      } else {
        this.updateConnectionStatus(false);
        this.addTerminalMessage('❌ فشل الاتصال');
        this.logger.error('API connection failed:', result.error);
      }
      
    } catch (error) {
      this.updateConnectionStatus(false);
      this.addTerminalMessage(`❌ خطأ في الاتصال: ${error.message}`);
      this.logger.error('Connection test error:', error);
    }
  }

  // Open settings panel
  openSettings() {
    const settingsPanel = this.elements.settingsPanel;
    const overlay = this.elements.overlay;
    
    if (settingsPanel && overlay) {
      settingsPanel.classList.add('active');
      overlay.classList.remove('hidden');
      
      // Load current settings into form
      this.loadSettingsIntoForm();
      
      this.addTerminalMessage('تم فتح لوحة الإعدادات', 'info');
    }
  }

  // Close settings panel
  closeSettings() {
    const settingsPanel = this.elements.settingsPanel;
    const overlay = this.elements.overlay;
    
    if (settingsPanel) {
      settingsPanel.classList.remove('active');
    }
    
    // Only hide overlay if no other modals are open
    if (overlay && this.elements.browserWindow?.classList.contains('hidden') && 
        this.elements.projectStudio?.classList.contains('hidden')) {
      overlay.classList.add('hidden');
    }
  }

  // Close all modals
  closeAllModals() {
    this.closeSettings();
    this.closeBrowser();
    this.closeProjectStudio();
    
    // Hide overlay
    const overlay = this.elements.overlay;
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  // Toggle API key visibility
  toggleApiKeyVisibility() {
    const input = this.elements.apiKeyInput;
    const toggleBtn = this.elements.toggleApiKey;
    
    if (input && toggleBtn) {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      toggleBtn.textContent = isPassword ? '🙈' : '👁️';
    }
  }

  // Reset settings
  async resetSettings() {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات؟')) {
      try {
        await storageManager.clear();
        await this.loadSettings();
        this.loadSettingsToForm();
        this.addTerminalMessage('تم إعادة تعيين الإعدادات', 'success');
      } catch (error) {
        this.addTerminalMessage(`فشل إعادة التعيين: ${error.message}`, 'error');
      }
    }
  }



  // Close browser
  closeBrowser() {
    const browserWindow = this.elements.browserWindow;
    const overlay = this.elements.overlay;
    
    if (browserWindow && overlay) {
      browserWindow.classList.add('hidden');
      overlay.classList.add('hidden');
    }
  }

  // Close project studio
  closeProjectStudio() {
    const studio = this.elements.projectStudio;
    const overlay = this.elements.overlay;
    
    if (studio && overlay) {
      studio.classList.add('hidden');
      overlay.classList.add('hidden');
    }
  }

  // Browser navigation
  browserGoBack() {
    const frame = this.elements.browserFrame;
    if (frame && frame.contentWindow) {
      frame.contentWindow.history.back();
    }
  }

  browserGoForward() {
    const frame = this.elements.browserFrame;
    if (frame && frame.contentWindow) {
      frame.contentWindow.history.forward();
    }
  }

  browserRefresh() {
    const frame = this.elements.browserFrame;
    if (frame) {
      frame.src = frame.src;
    }
  }

  // Save current project
  async saveCurrentProject() {
    if (!this.currentProject) return;
    
    try {
      // Update current file content
      const activeTab = document.querySelector('.tab.active');
      if (activeTab && this.elements.codeEditor) {
        const fileName = activeTab.dataset.file;
        this.currentProject.files[fileName] = this.elements.codeEditor.value;
      }
      
      // Save to storage
      await projectStorage.save(this.currentProject);
      this.addTerminalMessage('تم حفظ المشروع', 'success');
      
    } catch (error) {
      this.addTerminalMessage(`فشل حفظ المشروع: ${error.message}`, 'error');
    }
  }

  // Download project
  downloadProject() {
    if (!this.currentProject) return;
    
    try {
      const zip = this.createProjectZip(this.currentProject);
      const blob = new Blob([zip], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.currentProject.title}.zip`;
      a.click();
      
      URL.revokeObjectURL(url);
      this.addTerminalMessage('تم تحميل المشروع', 'success');
      
    } catch (error) {
      this.addTerminalMessage(`فشل تحميل المشروع: ${error.message}`, 'error');
    }
  }

  // Create project zip (simplified)
  createProjectZip(project) {
    // This is a simplified implementation
    // In a real app, you'd use a proper ZIP library
    let content = `Project: ${project.title}\n\n`;
    
    for (const [fileName, fileContent] of Object.entries(project.files)) {
      content += `=== ${fileName} ===\n${fileContent}\n\n`;
    }
    
    return content;
  }

  // Load chat history
  async loadChatHistory() {
    try {
      const history = await chatHistoryStorage.get();
      
      // Load last few messages
      const recentMessages = history.slice(-10);
      for (const message of recentMessages) {
        this.addChatMessage(message.type, message.content);
      }
      
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }

  // Handle global errors
  handleGlobalError(event) {
    console.error('Global error:', event);
    
    const errorBoundary = this.elements.errorBoundary;
    const errorMessage = document.getElementById('error-message');
    
    if (errorBoundary && errorMessage) {
      errorMessage.textContent = event.error?.message || event.reason?.message || 'حدث خطأ غير متوقع';
      errorBoundary.classList.remove('hidden');
    }
  }

  // Show error
  showError(title, message) {
    const errorBoundary = this.elements.errorBoundary;
    const errorMessageEl = document.getElementById('error-message');
    
    if (errorBoundary && errorMessageEl) {
      errorMessageEl.textContent = `${title}: ${message}`;
      errorBoundary.classList.remove('hidden');
    }
  }

  // Close browser window
  closeBrowser() {
    const browserWindow = this.elements.browserWindow;
    const overlay = this.elements.overlay;
    
    if (browserWindow) {
      browserWindow.classList.add('hidden');
    }
    
    // Only hide overlay if no other modals are open
    if (overlay && this.elements.settingsPanel?.classList.contains('hidden') && 
        this.elements.projectStudio?.classList.contains('hidden')) {
      overlay.classList.add('hidden');
    }
  }

  // Close project studio
  closeProjectStudio() {
    const projectStudio = this.elements.projectStudio;
    const overlay = this.elements.overlay;
    
    if (projectStudio) {
      projectStudio.classList.add('hidden');
    }
    
    // Only hide overlay if no other modals are open
    if (overlay && this.elements.settingsPanel?.classList.contains('hidden') && 
        this.elements.browserWindow?.classList.contains('hidden')) {
      overlay.classList.add('hidden');
    }
  }

  // Browser navigation functions
  browserGoBack() {
    // Implementation for browser back
    this.addTerminalMessage('العودة للخلف في المتصفح', 'info');
  }

  browserGoForward() {
    // Implementation for browser forward
    this.addTerminalMessage('التقدم للأمام في المتصفح', 'info');
  }

  browserRefresh() {
    // Implementation for browser refresh
    this.addTerminalMessage('تحديث صفحة المتصفح', 'info');
  }

  // Project studio functions
  runProject() {
    this.addTerminalMessage('تشغيل المشروع', 'info');
  }

  saveCurrentProject() {
    this.addTerminalMessage('حفظ المشروع', 'info');
  }

  downloadProject() {
    this.addTerminalMessage('تحميل المشروع', 'info');
  }

  switchEditorTab(fileName) {
    this.addTerminalMessage(`تبديل إلى ملف: ${fileName}`, 'info');
  }

  // Terminal functions
  clearTerminal() {
    const terminalContent = this.elements.terminalContent;
    if (terminalContent) {
      terminalContent.innerHTML = '';
      this.addTerminalMessage('تم مسح سطر الأوامر', 'info');
    }
  }

  toggleTerminal() {
    const terminal = this.elements.terminal;
    if (terminal) {
      terminal.classList.toggle('minimized');
    }
  }

  // Set processing state
  setProcessingState(processing) {
    this.isProcessing = processing;
    this.updateSendButton(processing);
    
    // Update input state
    if (this.elements.userInput) {
      this.elements.userInput.disabled = processing;
    }
  }

  // Display agent response
  displayAgentResponse(response) {
    if (typeof response === 'string') {
      this.addChatMessage('agent', response);
    } else if (response && response.content) {
      this.addChatMessage('agent', response.content);
    } else if (response && response.type) {
      // Handle different response types
      switch (response.type) {
        case 'code':
          this.displayCodeResponse(response);
          break;
        case 'search':
          this.displaySearchResponse(response);
          break;
        case 'analysis':
          this.displayAnalysisResponse(response);
          break;
        default:
          this.addChatMessage('agent', response.content || 'تم إنجاز المهمة');
      }
    }
    
    // Save to history
    if (this.settings.saveHistory && response) {
      chatHistoryStorage.add({
        type: 'agent',
        content: typeof response === 'string' ? response : response.content,
        timestamp: Date.now()
      });
    }
  }

  // Display error message
  displayErrorMessage(message) {
    this.addChatMessage('agent', `❌ ${message}`);
  }

  // Display code response
  displayCodeResponse(response) {
    let content = `💻 **كود ${response.language || 'JavaScript'}:**\n\n`;
    content += '```' + (response.language || 'javascript') + '\n';
    content += response.content + '\n';
    content += '```\n\n';
    
    if (response.explanation) {
      content += `📝 **الشرح:**\n${response.explanation}\n\n`;
    }
    
    this.addChatMessage('agent', content);
  }

  // Display search response
  displaySearchResponse(response) {
    let content = `🔍 **نتائج البحث:**\n\n`;
    
    if (response.summary) {
      content += `📋 **الملخص:**\n${response.summary}\n\n`;
    }
    
    if (response.results && response.results.length > 0) {
      content += `📊 **النتائج:**\n`;
      response.results.forEach((result, index) => {
        content += `${index + 1}. ${result.title || result.content}\n`;
      });
    }
    
    this.addChatMessage('agent', content);
  }

  // Display analysis response
  displayAnalysisResponse(response) {
    let content = `📊 **تحليل البيانات:**\n\n`;
    
    if (response.insights && response.insights.length > 0) {
      content += `💡 **الرؤى:**\n`;
      response.insights.forEach((insight, index) => {
        content += `${index + 1}. ${insight}\n`;
      });
      content += '\n';
    }
    
    if (response.summary) {
      content += `📋 **الملخص:**\n${response.summary}\n\n`;
    }
    
    this.addChatMessage('agent', content);
  }

  // Update connection status
  updateConnectionStatus(connected) {
    const statusElement = document.querySelector('.connection-status');
    if (statusElement) {
      statusElement.textContent = connected ? 'متصل' : 'غير متصل';
      statusElement.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  const app = new CodeMindApp();
  await app.init();
  
  // Make app globally available for debugging
  window.codeMindApp = app;
});

// Export for module usage
export default CodeMindApp;