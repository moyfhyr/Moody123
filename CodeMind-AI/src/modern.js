// Modern CodeMind AI JavaScript
class ModernCodeMindAI {
    constructor() {
        this.apiKey = '';
        this.isConnected = false;
        this.chatHistory = [];
        this.currentModel = 'gemini-1.5-flash';
        this.settings = {
            autoScroll: true,
            soundEffects: false,
            saveHistory: true,
            theme: 'light'
        };
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.updateConnectionStatus();
        this.setupEventListeners();
        this.showWelcomeMessage();
    }

    setupEventListeners() {
        // Enter key support for chat input
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Close modal on outside click
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    this.toggleSettings();
                }
            });
        }

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('settingsModal');
                if (modal && modal.classList.contains('active')) {
                    this.toggleSettings();
                }
            }
        });
    }

    showWelcomeMessage() {
        // Add a small delay to show the welcome animation
        setTimeout(() => {
            this.addSystemMessage('🎉 مرحباً بك في CodeMind AI! النظام جاهز للاستخدام.');
        }, 1000);
    }

    // Toggle Settings Modal
    toggleSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.toggle('active');
            
            // Load current settings into form
            if (modal.classList.contains('active')) {
                this.loadSettingsToForm();
            }
        }
    }

    // Toggle Theme
    toggleTheme() {
        document.body.classList.toggle('dark');
        const themeBtn = document.querySelector('.modern-theme-btn');
        const isDark = document.body.classList.contains('dark');
        
        if (themeBtn) {
            themeBtn.textContent = isDark ? '☀️' : '🌙';
        }
        
        this.settings.theme = isDark ? 'dark' : 'light';
        this.saveSettingsToStorage();
    }

    // Load Settings
    loadSettings() {
        try {
            // Load API key
            const savedApiKey = localStorage.getItem('codemind_api_key');
            if (savedApiKey) {
                this.apiKey = savedApiKey;
            }

            // Load other settings
            const savedSettings = localStorage.getItem('codemind_settings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }

            // Apply theme
            if (this.settings.theme === 'dark') {
                document.body.classList.add('dark');
                const themeBtn = document.querySelector('.modern-theme-btn');
                if (themeBtn) {
                    themeBtn.textContent = '☀️';
                }
            }

            // Load chat history
            if (this.settings.saveHistory) {
                const savedHistory = localStorage.getItem('codemind_chat_history');
                if (savedHistory) {
                    this.chatHistory = JSON.parse(savedHistory);
                    this.restoreChatHistory();
                }
            }

        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    loadSettingsToForm() {
        const apiKeyInput = document.getElementById('apiKey');
        const aiModelSelect = document.getElementById('aiModel');
        const autoScrollCheck = document.getElementById('autoScroll');
        const soundEffectsCheck = document.getElementById('soundEffects');
        const saveHistoryCheck = document.getElementById('saveHistory');

        if (apiKeyInput) apiKeyInput.value = this.apiKey;
        if (aiModelSelect) aiModelSelect.value = this.currentModel;
        if (autoScrollCheck) autoScrollCheck.checked = this.settings.autoScroll;
        if (soundEffectsCheck) soundEffectsCheck.checked = this.settings.soundEffects;
        if (saveHistoryCheck) saveHistoryCheck.checked = this.settings.saveHistory;
    }

    // Save Settings
    saveSettings() {
        try {
            const apiKeyInput = document.getElementById('apiKey');
            const aiModelSelect = document.getElementById('aiModel');
            const autoScrollCheck = document.getElementById('autoScroll');
            const soundEffectsCheck = document.getElementById('soundEffects');
            const saveHistoryCheck = document.getElementById('saveHistory');

            // Validate API key
            const newApiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
            if (!newApiKey) {
                this.showNotification('يرجى إدخال مفتاح API صحيح', 'error');
                return;
            }

            // Update settings
            this.apiKey = newApiKey;
            this.currentModel = aiModelSelect ? aiModelSelect.value : 'gemini-1.5-flash';
            
            this.settings.autoScroll = autoScrollCheck ? autoScrollCheck.checked : true;
            this.settings.soundEffects = soundEffectsCheck ? soundEffectsCheck.checked : false;
            this.settings.saveHistory = saveHistoryCheck ? saveHistoryCheck.checked : true;

            // Save to localStorage
            localStorage.setItem('codemind_api_key', this.apiKey);
            this.saveSettingsToStorage();

            // Update connection status
            this.updateConnectionStatus();

            // Close modal
            this.toggleSettings();

            // Show success message
            this.showNotification('تم حفظ الإعدادات بنجاح! ✅', 'success');
            this.addSystemMessage('✅ تم حفظ الإعدادات بنجاح. يمكنك الآن بدء المحادثة!');

        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('حدث خطأ أثناء حفظ الإعدادات', 'error');
        }
    }

    saveSettingsToStorage() {
        try {
            localStorage.setItem('codemind_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings to storage:', error);
        }
    }

    // Update Connection Status
    updateConnectionStatus() {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        
        if (this.apiKey && this.apiKey.length > 10) {
            this.isConnected = true;
            
            if (statusDot) statusDot.classList.add('connected');
            if (statusText) statusText.textContent = 'متصل';
            if (chatInput) {
                chatInput.disabled = false;
                chatInput.placeholder = 'اكتب رسالتك هنا...';
            }
            if (sendBtn) sendBtn.disabled = false;
            
        } else {
            this.isConnected = false;
            
            if (statusDot) statusDot.classList.remove('connected');
            if (statusText) statusText.textContent = 'غير متصل';
            if (chatInput) {
                chatInput.disabled = true;
                chatInput.placeholder = 'يرجى إدخال مفتاح API في الإعدادات أولاً';
            }
            if (sendBtn) sendBtn.disabled = true;
        }
    }

    // Send Message
    sendMessage() {
        const input = document.getElementById('chatInput');
        if (!input) return;
        
        const message = input.value.trim();
        
        if (!message) {
            this.showNotification('يرجى كتابة رسالة أولاً', 'error');
            return;
        }
        
        if (!this.isConnected) {
            this.showNotification('يرجى إدخال مفتاح API في الإعدادات أولاً', 'error');
            return;
        }
        
        // Add user message
        this.addMessage(message, 'user');
        input.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Simulate AI response (replace with actual API call)
        setTimeout(() => {
            this.hideTypingIndicator();
            this.simulateAIResponse(message);
        }, 1500 + Math.random() * 1000);
    }

    // Add Message to Chat
    addMessage(message, sender, isSystem = false) {
        const chatContainer = document.getElementById('chatContainer');
        if (!chatContainer) return;
        
        // Clear welcome message on first user message
        if (sender === 'user' && this.chatHistory.filter(m => m.sender === 'user').length === 0) {
            const welcomeMsg = chatContainer.querySelector('.welcome-message');
            if (welcomeMsg) {
                welcomeMsg.style.display = 'none';
            }
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        
        if (isSystem) {
            messageDiv.className += ' system';
        }
        
        // Create message content
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = message;
        
        messageDiv.appendChild(messageContent);
        chatContainer.appendChild(messageDiv);
        
        // Auto scroll if enabled
        if (this.settings.autoScroll) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        // Save to history
        const messageObj = {
            message,
            sender,
            timestamp: new Date().toISOString(),
            isSystem
        };
        
        this.chatHistory.push(messageObj);
        
        // Save history if enabled
        if (this.settings.saveHistory) {
            this.saveChatHistory();
        }
        
        // Play sound if enabled
        if (this.settings.soundEffects && sender === 'ai') {
            this.playNotificationSound();
        }
    }

    addSystemMessage(message) {
        this.addMessage(message, 'ai', true);
    }

    showTypingIndicator() {
        const chatContainer = document.getElementById('chatContainer');
        if (!chatContainer) return;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message ai typing-indicator';
        typingDiv.id = 'typing-indicator';
        
        const typingContent = document.createElement('div');
        typingContent.className = 'message-content';
        typingContent.innerHTML = `
            <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
            جاري الكتابة...
        `;
        
        typingDiv.appendChild(typingContent);
        chatContainer.appendChild(typingDiv);
        
        if (this.settings.autoScroll) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Simulate AI Response (replace with actual API integration)
    simulateAIResponse(userMessage) {
        const responses = [
            `شكراً لك على رسالتك: "${userMessage}". هذا مثال على رد الذكاء الاصطناعي. 🤖`,
            `فهمت طلبك بخصوص: "${userMessage}". سأساعدك في ذلك! 💡`,
            `رسالة رائعة! "${userMessage}" - دعني أفكر في أفضل طريقة لمساعدتك. 🔍`,
            `تم استلام رسالتك: "${userMessage}". إليك ما يمكنني مساعدتك به... ✨`,
            `ممتاز! بخصوص "${userMessage}" - لدي عدة اقتراحات مفيدة لك. 🎯`
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        this.addMessage(randomResponse, 'ai');
    }

    // Quick Actions
    quickAction(action) {
        if (!this.isConnected) {
            this.showNotification('يرجى إدخال مفتاح API في الإعدادات أولاً', 'error');
            return;
        }
        
        const actions = {
            search: 'ابحث لي عن معلومات حول الذكاء الاصطناعي وتطبيقاته',
            create: 'أنشئ لي موقع ويب بسيط وجميل باستخدام HTML و CSS',
            question: 'ما هي أفضل لغات البرمجة للمبتدئين في عام 2024؟',
            code: 'اشرح لي هذا الكود واعطني أمثلة: console.log("Hello World");'
        };
        
        const input = document.getElementById('chatInput');
        if (input && actions[action]) {
            input.value = actions[action];
            this.sendMessage();
        }
    }

    // Show Notification
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.modern-notification');
        existingNotifications.forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = `modern-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // Save Chat History
    saveChatHistory() {
        try {
            if (this.settings.saveHistory) {
                localStorage.setItem('codemind_chat_history', JSON.stringify(this.chatHistory));
            }
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    // Restore Chat History
    restoreChatHistory() {
        const chatContainer = document.getElementById('chatContainer');
        if (!chatContainer || this.chatHistory.length === 0) return;
        
        // Hide welcome message
        const welcomeMsg = chatContainer.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.style.display = 'none';
        }
        
        // Add messages from history
        this.chatHistory.forEach(messageObj => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${messageObj.sender}`;
            
            if (messageObj.isSystem) {
                messageDiv.className += ' system';
            }
            
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            messageContent.textContent = messageObj.message;
            
            messageDiv.appendChild(messageContent);
            chatContainer.appendChild(messageDiv);
        });
        
        // Auto scroll
        if (this.settings.autoScroll) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    // Clear Chat History
    clearChatHistory() {
        this.chatHistory = [];
        localStorage.removeItem('codemind_chat_history');
        
        const chatContainer = document.getElementById('chatContainer');
        if (chatContainer) {
            // Remove all messages except welcome
            const messages = chatContainer.querySelectorAll('.chat-message');
            messages.forEach(message => message.remove());
            
            // Show welcome message again
            const welcomeMsg = chatContainer.querySelector('.welcome-message');
            if (welcomeMsg) {
                welcomeMsg.style.display = 'block';
            }
        }
        
        this.showNotification('تم مسح تاريخ المحادثة', 'success');
    }

    // Play Notification Sound
    playNotificationSound() {
        if (!this.settings.soundEffects) return;
        
        try {
            // Create a simple beep sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Sound not supported:', error);
        }
    }
}

// Global functions for HTML onclick events
let modernAI;

function toggleSettings() {
    if (modernAI) {
        modernAI.toggleSettings();
    }
}

function toggleTheme() {
    if (modernAI) {
        modernAI.toggleTheme();
    }
}

function saveSettings() {
    if (modernAI) {
        modernAI.saveSettings();
    }
}

function sendMessage() {
    if (modernAI) {
        modernAI.sendMessage();
    }
}

function quickAction(action) {
    if (modernAI) {
        modernAI.quickAction(action);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    modernAI = new ModernCodeMindAI();
    
    // Add some helpful console messages
    console.log('🤖 CodeMind AI تم تحميله بنجاح!');
    console.log('💡 استخدم modernAI للوصول إلى وظائف التطبيق');
    console.log('⚙️ لا تنس إدخال مفتاح Gemini API في الإعدادات');
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModernCodeMindAI;
}