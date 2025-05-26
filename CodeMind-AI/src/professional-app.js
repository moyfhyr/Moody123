// ===== PROFESSIONAL CODEMIND AI APPLICATION =====
// تم تحديث النظام ليتوافق مع النظام المحسن

class CodeMindAI {
    constructor() {
        this.apiKey = localStorage.getItem('gemini_api_key') || '';
        this.model = localStorage.getItem('gemini_model') || 'gemini-1.5-flash';
        this.chatHistory = JSON.parse(localStorage.getItem('chat_history') || '[]');
        this.currentChatId = null;
        this.isTyping = false;
        this.theme = localStorage.getItem('theme') || 'dark';
        
        // متغيرات النظام المحسن
        this.enhancedSystemEnabled = true;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.setupAutoResize();
        this.hideLoadingScreen();
        this.updateConnectionStatus();
        this.loadChatHistory();
        
        // Initialize AI assistant animations
        this.initAIAssistant();
    }

    setupEventListeners() {
        // Send message
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput');
        
        sendBtn?.addEventListener('click', () => this.sendMessage());
        messageInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        themeToggle?.addEventListener('click', () => this.toggleTheme());

        // New chat
        const newChatBtn = document.getElementById('newChatBtn');
        newChatBtn?.addEventListener('click', () => this.startNewChat());

        // Quick actions
        document.querySelectorAll('.quick-action').forEach(action => {
            action.addEventListener('click', () => {
                const actionType = action.dataset.action;
                this.handleQuickAction(actionType);
            });
        });

        // AI Assistant click
        const aiAssistant = document.getElementById('aiAssistant');
        aiAssistant?.addEventListener('click', () => this.toggleAIAssistant());

        // Settings button
        const settingsBtn = document.getElementById('settingsBtn');
        settingsBtn?.addEventListener('click', () => this.openSettings());

        // Model selector
        const modelSelector = document.getElementById('modelSelector');
        modelSelector?.addEventListener('click', () => this.openModelSelector());
    }

    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const themeIcon = document.querySelector('#themeToggle svg');
        if (themeIcon) {
            if (this.theme === 'dark') {
                themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
            } else {
                themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
            }
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.theme);
        this.setupTheme();
    }

    setupAutoResize() {
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('input', () => {
                messageInput.style.height = 'auto';
                messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
            });
        }
    }

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 2000);
    }

    updateConnectionStatus() {
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        
        if (this.apiKey) {
            messageInput?.removeAttribute('disabled');
            sendBtn?.removeAttribute('disabled');
        } else {
            messageInput?.setAttribute('disabled', 'true');
            sendBtn?.setAttribute('disabled', 'true');
        }
    }

    initAIAssistant() {
        const aiAssistant = document.getElementById('aiAssistant');
        if (aiAssistant) {
            // Set initial state
            this.setAIState('idle');
        }
    }

    setAIState(state) {
        const aiAssistant = document.getElementById('aiAssistant');
        const aiEmoji = document.getElementById('aiEmoji');
        
        if (!aiAssistant || !aiEmoji) return;

        // Remove all state classes
        aiAssistant.classList.remove('thinking', 'talking');
        
        switch (state) {
            case 'thinking':
                aiAssistant.classList.add('thinking');
                aiEmoji.textContent = '🤔';
                break;
            case 'talking':
                aiAssistant.classList.add('talking');
                aiEmoji.textContent = '💬';
                break;
            case 'processing':
                aiAssistant.classList.add('thinking');
                aiEmoji.textContent = '⚡';
                break;
            default:
                aiEmoji.textContent = '🤖';
        }
    }

    toggleAIAssistant() {
        // Focus on input when AI assistant is clicked
        const messageInput = document.getElementById('messageInput');
        if (messageInput && !messageInput.disabled) {
            messageInput.focus();
        }
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput?.value.trim();
        
        if (!message || this.isTyping) return;
        
        if (!this.apiKey) {
            this.showApiKeyPrompt();
            return;
        }

        // Clear input and show chat
        messageInput.value = '';
        messageInput.style.height = 'auto';
        this.showChatInterface();

        // Add user message
        this.addMessage('user', message);
        
        // Set AI state to thinking
        this.setAIState('thinking');
        this.isTyping = true;

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await this.callGeminiAPI(message);
            this.hideTypingIndicator();
            this.addMessage('assistant', response);
            this.setAIState('idle');
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('assistant', 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.');
            this.setAIState('idle');
            console.error('API Error:', error);
        }

        this.isTyping = false;
    }

    showChatInterface() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        const chatMessages = document.getElementById('chatMessages');
        
        if (welcomeScreen && chatMessages) {
            welcomeScreen.style.display = 'none';
            chatMessages.style.display = 'block';
        }
    }

    addMessage(role, content) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = role === 'user' ? 'م' : '🤖';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (role === 'assistant') {
            messageContent.innerHTML = this.formatMessage(content);
        } else {
            messageContent.textContent = content;
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Save to history
        this.saveMessageToHistory(role, content);
    }

    formatMessage(content) {
        // Basic markdown-like formatting
        let formatted = content
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
        
        return formatted;
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant';
        typingDiv.id = 'typingIndicator';
        
        typingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                    <span style="color: var(--text-muted); font-size: 14px;">يكتب...</span>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async callGeminiAPI(message) {
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: `أنت CodeMind AI، مساعد ذكي متخصص في البرمجة والتطوير. أجب باللغة العربية بشكل مفيد ومفصل.\n\nالسؤال: ${message}`
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Invalid response format');
        }
    }

    handleQuickAction(actionType) {
        const actions = {
            'new-project': 'أريد إنشاء مشروع برمجي جديد. ما هي الخطوات والتقنيات المناسبة؟',
            'code-review': 'أريد مراجعة كودي البرمجي. كيف يمكنني تحسينه؟',
            'debug-help': 'أواجه مشكلة في كودي ولا أستطيع العثور على الخطأ. هل يمكنك مساعدتي؟',
            'learn-tech': 'أريد تعلم تقنية برمجية جديدة. ما هي أفضل التقنيات الحديثة؟'
        };

        const message = actions[actionType];
        if (message) {
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.value = message;
                messageInput.focus();
            }
        }
    }

    startNewChat() {
        // Clear current chat
        const chatMessages = document.getElementById('chatMessages');
        const welcomeScreen = document.getElementById('welcomeScreen');
        
        if (chatMessages) chatMessages.innerHTML = '';
        if (welcomeScreen) welcomeScreen.style.display = 'flex';
        if (chatMessages) chatMessages.style.display = 'none';

        // Reset AI state
        this.setAIState('idle');
        this.currentChatId = null;
    }

    saveMessageToHistory(role, content) {
        if (!this.currentChatId) {
            this.currentChatId = Date.now().toString();
        }

        const message = {
            id: Date.now(),
            role,
            content,
            timestamp: new Date().toISOString()
        };

        // Add to current chat or create new one
        let currentChat = this.chatHistory.find(chat => chat.id === this.currentChatId);
        if (!currentChat) {
            currentChat = {
                id: this.currentChatId,
                title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                messages: [],
                createdAt: new Date().toISOString()
            };
            this.chatHistory.unshift(currentChat);
        }

        currentChat.messages.push(message);
        localStorage.setItem('chat_history', JSON.stringify(this.chatHistory));
    }

    loadChatHistory() {
        const chatHistoryContainer = document.getElementById('chatHistory');
        if (!chatHistoryContainer) return;

        // Clear existing items except the active one
        const activeItem = chatHistoryContainer.querySelector('.chat-item.active');
        chatHistoryContainer.innerHTML = '';
        if (activeItem) {
            chatHistoryContainer.appendChild(activeItem);
        }

        // Add chat history items
        this.chatHistory.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                ${chat.title}
            `;
            
            chatItem.addEventListener('click', () => this.loadChat(chat.id));
            chatHistoryContainer.appendChild(chatItem);
        });
    }

    loadChat(chatId) {
        const chat = this.chatHistory.find(c => c.id === chatId);
        if (!chat) return;

        this.currentChatId = chatId;
        this.showChatInterface();

        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
            chat.messages.forEach(message => {
                this.addMessage(message.role, message.content);
            });
        }

        // Update active state
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.closest('.chat-item').classList.add('active');
    }

    showApiKeyPrompt() {
        const message = 'يرجى إدخال مفتاح Gemini API في الإعدادات أولاً للبدء في استخدام CodeMind AI.';
        alert(message);
        this.openSettings();
    }

    openSettings() {
        // Create settings modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="
                background: var(--bg-secondary);
                border: 1px solid var(--border-light);
                border-radius: 12px;
                padding: 24px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            ">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                    <h2 style="color: var(--text-primary); font-size: 20px; font-weight: 600;">الإعدادات</h2>
                    <button id="closeSettings" style="
                        background: none;
                        border: none;
                        color: var(--text-secondary);
                        font-size: 24px;
                        cursor: pointer;
                        padding: 4px;
                    ">&times;</button>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 500;">
                        مفتاح Gemini API:
                    </label>
                    <input type="password" id="apiKeyInput" value="${this.apiKey}" style="
                        width: 100%;
                        padding: 12px;
                        background: var(--bg-input);
                        border: 1px solid var(--border-light);
                        border-radius: 8px;
                        color: var(--text-primary);
                        font-size: 14px;
                    " placeholder="أدخل مفتاح API هنا...">
                    <small style="color: var(--text-muted); font-size: 12px; margin-top: 4px; display: block;">
                        احصل على مفتاح مجاني من 
                        <a href="https://makersuite.google.com/app/apikey" target="_blank" style="color: var(--accent-green);">
                            Google AI Studio
                        </a>
                    </small>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 500;">
                        النموذج:
                    </label>
                    <select id="modelSelect" style="
                        width: 100%;
                        padding: 12px;
                        background: var(--bg-input);
                        border: 1px solid var(--border-light);
                        border-radius: 8px;
                        color: var(--text-primary);
                        font-size: 14px;
                    ">
                        <option value="gemini-1.5-pro" ${this.model === 'gemini-1.5-pro' ? 'selected' : ''}>
                            Gemini 1.5 Pro (أفضل جودة)
                        </option>
                        <option value="gemini-1.5-flash" ${this.model === 'gemini-1.5-flash' ? 'selected' : ''}>
                            Gemini 1.5 Flash (أسرع)
                        </option>
                    </select>
                </div>
                
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button id="testConnection" style="
                        padding: 10px 20px;
                        background: var(--accent-blue);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                    ">اختبار الاتصال</button>
                    <button id="saveSettings" style="
                        padding: 10px 20px;
                        background: var(--accent-green);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                    ">حفظ</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners for settings modal
        modal.querySelector('#closeSettings').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('#saveSettings').addEventListener('click', () => {
            const apiKey = modal.querySelector('#apiKeyInput').value.trim();
            const model = modal.querySelector('#modelSelect').value;
            
            this.apiKey = apiKey;
            this.model = model;
            
            localStorage.setItem('gemini_api_key', apiKey);
            localStorage.setItem('gemini_model', model);
            
            this.updateConnectionStatus();
            document.body.removeChild(modal);
            
            if (apiKey) {
                alert('تم حفظ الإعدادات بنجاح!');
            }
        });

        modal.querySelector('#testConnection').addEventListener('click', async () => {
            const apiKey = modal.querySelector('#apiKeyInput').value.trim();
            if (!apiKey) {
                alert('يرجى إدخال مفتاح API أولاً');
                return;
            }

            try {
                const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: 'مرحبا' }] }]
                    })
                });

                if (testResponse.ok) {
                    alert('✅ الاتصال ناجح! يمكنك الآن استخدام CodeMind AI');
                } else {
                    alert('❌ فشل الاتصال. يرجى التحقق من مفتاح API');
                }
            } catch (error) {
                alert('❌ خطأ في الاتصال: ' + error.message);
            }
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    openModelSelector() {
        // Simple model selector - could be expanded
        console.log('Model selector clicked');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.codeMindAI = new CodeMindAI();
    
    // تحقق من وجود النظام المحسن وتفعيله
    setTimeout(() => {
        if (window.enhancedAI && typeof window.enhancedAI === 'object') {
            console.log('✅ تم تفعيل النظام المحسن بنجاح!');
            // دمج الأنظمة
            window.codeMindAI.enhancedSystem = window.enhancedAI;
        }
    }, 100);
});

// Export for global access
window.CodeMindAI = CodeMindAI;