/**
 * مدير API متقدم للتعامل مع Google Gemini
 * يدعم إعادة المحاولة، التخزين المؤقت، ومعالجة الأخطاء
 */

import { Logger } from '../utils/simple-logger.js';
import storageManager from '../utils/storage.js';
import { CONFIG } from '../utils/config.js';

export class APIManager {
    constructor() {
        this.apiKey = null;
        this.currentModel = CONFIG.API.GEMINI.DEFAULT_MODEL;
        this.baseUrl = CONFIG.API.GEMINI.BASE_URL;
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.rateLimiter = new Map();
        this.cache = new Map();
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        
        this.logger = new Logger('APIManager');
        this.storage = storageManager;
        
        // Request statistics
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokensUsed: 0,
            averageResponseTime: 0,
            lastRequestTime: null
        };
        
        this.logger.info('🔌 API Manager initialized');
    }

    /**
     * تهيئة مدير API
     */
    async initialize() {
        try {
            this.logger.info('🚀 Initializing API Manager...');
            
            // Load cached API key
            await this.loadApiKey();
            
            // Load statistics
            await this.loadStats();
            
            // Setup rate limiting
            this.setupRateLimiting();
            
            // Start queue processor
            this.startQueueProcessor();
            
            this.logger.success('✅ API Manager initialized successfully');
            
        } catch (error) {
            this.logger.error('❌ Failed to initialize API Manager:', error);
            throw error;
        }
    }

    /**
     * تعيين مفتاح API
     */
    async setApiKey(apiKey) {
        try {
            if (!apiKey || typeof apiKey !== 'string') {
                throw new Error('Invalid API key provided');
            }
            
            // Validate API key format
            if (!this.validateApiKeyFormat(apiKey)) {
                throw new Error('API key format is invalid');
            }
            
            this.apiKey = apiKey;
            
            // Save to secure storage
            await this.saveApiKey(apiKey);
            
            this.logger.info('🔑 API key set successfully');
            
            return true;
            
        } catch (error) {
            this.logger.error('❌ Failed to set API key:', error);
            throw error;
        }
    }

    /**
     * التحقق من صحة مفتاح API
     */
    async validateApiKey(apiKey = this.apiKey) {
        try {
            if (!apiKey) {
                return false;
            }
            
            this.logger.info('🔍 Validating API key...');
            
            // Test with a simple request
            const testRequest = {
                contents: [{
                    parts: [{
                        text: 'Hello, this is a test message. Please respond with "API key is valid".'
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 20,
                    temperature: 0.1
                }
            };
            
            const response = await this.makeRawRequest(testRequest, apiKey);
            
            if (response && response.candidates && response.candidates[0]) {
                const responseText = response.candidates[0].content.parts[0].text;
                this.logger.success('✅ API key validation successful');
                return true;
            }
            
            return false;
            
        } catch (error) {
            this.logger.error('❌ API key validation failed:', error);
            return false;
        }
    }

    /**
     * إرسال طلب للذكاء الاصطناعي
     */
    async sendRequest(options = {}) {
        try {
            if (!this.apiKey) {
                throw new Error('API key not set. Please configure API key first.');
            }
            
            // Prepare request
            const request = this.prepareRequest(options);
            
            // Check cache first
            const cacheKey = this.generateCacheKey(request);
            if (this.cache.has(cacheKey) && !options.skipCache) {
                this.logger.info('📋 Returning cached response');
                return this.cache.get(cacheKey);
            }
            
            // Add to queue
            return new Promise((resolve, reject) => {
                this.requestQueue.push({
                    request,
                    options,
                    resolve,
                    reject,
                    timestamp: Date.now(),
                    attempts: 0
                });
                
                this.processQueue();
            });
            
        } catch (error) {
            this.logger.error('❌ Error sending request:', error);
            throw error;
        }
    }

    /**
     * تحضير الطلب
     */
    prepareRequest(options) {
        const {
            message,
            systemPrompt,
            maxTokens = CONFIG.API.GEMINI.MAX_TOKENS,
            temperature = CONFIG.API.GEMINI.TEMPERATURE,
            topP = CONFIG.API.GEMINI.TOP_P,
            topK = CONFIG.API.GEMINI.TOP_K,
            model = this.currentModel
        } = options;
        
        // Build the prompt
        let fullPrompt = '';
        
        if (systemPrompt) {
            fullPrompt += `System: ${systemPrompt}\n\n`;
        }
        
        fullPrompt += `User: ${message}`;
        
        // Prepare request body
        const request = {
            contents: [{
                parts: [{
                    text: fullPrompt
                }]
            }],
            generationConfig: {
                maxOutputTokens: Math.min(maxTokens, CONFIG.API.GEMINI.MAX_TOKENS),
                temperature: Math.max(0, Math.min(2, temperature)),
                topP: Math.max(0, Math.min(1, topP)),
                topK: Math.max(1, Math.min(40, topK))
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };
        
        return { request, model };
    }

    /**
     * معالجة طابور الطلبات
     */
    async processQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) {
            return;
        }
        
        this.isProcessingQueue = true;
        
        while (this.requestQueue.length > 0) {
            const queueItem = this.requestQueue.shift();
            
            try {
                // Check rate limiting
                await this.checkRateLimit();
                
                // Execute request
                const result = await this.executeRequest(queueItem);
                queueItem.resolve(result);
                
            } catch (error) {
                // Handle retry logic
                if (queueItem.attempts < this.retryAttempts && this.shouldRetry(error)) {
                    queueItem.attempts++;
                    this.logger.warn(`🔄 Retrying request (attempt ${queueItem.attempts}/${this.retryAttempts})`);
                    
                    // Add delay before retry
                    await this.delay(this.retryDelay * queueItem.attempts);
                    
                    // Re-add to queue
                    this.requestQueue.unshift(queueItem);
                } else {
                    queueItem.reject(error);
                }
            }
        }
        
        this.isProcessingQueue = false;
    }

    /**
     * تنفيذ الطلب
     */
    async executeRequest(queueItem) {
        const startTime = performance.now();
        
        try {
            this.logger.info('📤 Sending request to Gemini API...');
            
            const { request, model } = queueItem.request;
            const response = await this.makeRawRequest(request, this.apiKey, model);
            
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            // Update statistics
            this.updateStats(true, responseTime, response);
            
            // Process response
            const processedResponse = this.processResponse(response);
            
            // Cache response
            const cacheKey = this.generateCacheKey(queueItem.request);
            this.cache.set(cacheKey, processedResponse);
            
            // Clean cache if too large
            if (this.cache.size > 100) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }
            
            this.logger.success(`✅ Request completed in ${responseTime.toFixed(2)}ms`);
            
            return processedResponse;
            
        } catch (error) {
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            // Update statistics
            this.updateStats(false, responseTime);
            
            this.logger.error('❌ Request failed:', error);
            throw error;
        }
    }

    /**
     * إجراء طلب خام
     */
    async makeRawRequest(requestBody, apiKey, model = this.currentModel) {
        const url = `${this.baseUrl}/models/${model}:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
        }
        
        return await response.json();
    }

    /**
     * معالجة الاستجابة
     */
    processResponse(response) {
        try {
            if (!response || !response.candidates || response.candidates.length === 0) {
                throw new Error('No response candidates received');
            }
            
            const candidate = response.candidates[0];
            
            if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
                throw new Error('No content in response');
            }
            
            const content = candidate.content.parts[0].text;
            
            return {
                content: content.trim(),
                finishReason: candidate.finishReason,
                safetyRatings: candidate.safetyRatings,
                tokenCount: response.usageMetadata || {},
                model: this.currentModel,
                timestamp: new Date()
            };
            
        } catch (error) {
            this.logger.error('Error processing response:', error);
            throw new Error(`Failed to process API response: ${error.message}`);
        }
    }

    /**
     * فحص حدود المعدل
     */
    async checkRateLimit() {
        const now = Date.now();
        const windowSize = 60000; // 1 minute
        const maxRequests = 60; // 60 requests per minute
        
        // Clean old entries
        for (const [timestamp] of this.rateLimiter) {
            if (now - timestamp > windowSize) {
                this.rateLimiter.delete(timestamp);
            }
        }
        
        // Check if we're at the limit
        if (this.rateLimiter.size >= maxRequests) {
            const oldestRequest = Math.min(...this.rateLimiter.keys());
            const waitTime = windowSize - (now - oldestRequest);
            
            this.logger.warn(`⏳ Rate limit reached. Waiting ${waitTime}ms...`);
            await this.delay(waitTime);
        }
        
        // Add current request
        this.rateLimiter.set(now, true);
    }

    /**
     * تحديث الإحصائيات
     */
    updateStats(success, responseTime, response = null) {
        this.stats.totalRequests++;
        this.stats.lastRequestTime = new Date();
        
        if (success) {
            this.stats.successfulRequests++;
            
            // Update average response time
            const totalTime = this.stats.averageResponseTime * (this.stats.successfulRequests - 1) + responseTime;
            this.stats.averageResponseTime = totalTime / this.stats.successfulRequests;
            
            // Update token usage
            if (response && response.usageMetadata) {
                this.stats.totalTokensUsed += (response.usageMetadata.totalTokenCount || 0);
            }
        } else {
            this.stats.failedRequests++;
        }
        
        // Save stats periodically
        if (this.stats.totalRequests % 10 === 0) {
            this.saveStats();
        }
    }

    /**
     * فحص ما إذا كان يجب إعادة المحاولة
     */
    shouldRetry(error) {
        const retryableErrors = [
            'network error',
            'timeout',
            'rate limit',
            'server error',
            '429',
            '500',
            '502',
            '503',
            '504'
        ];
        
        const errorMessage = error.message.toLowerCase();
        return retryableErrors.some(retryableError => 
            errorMessage.includes(retryableError)
        );
    }

    /**
     * توليد مفتاح التخزين المؤقت
     */
    generateCacheKey(request) {
        const requestString = JSON.stringify(request);
        return btoa(requestString).substring(0, 32);
    }

    /**
     * التحقق من تنسيق مفتاح API
     */
    validateApiKeyFormat(apiKey) {
        // Gemini API keys typically start with 'AIza' and are 39 characters long
        return /^AIza[0-9A-Za-z_-]{35}$/.test(apiKey);
    }

    /**
     * إعداد حدود المعدل
     */
    setupRateLimiting() {
        // Clear rate limiter every minute
        setInterval(() => {
            const now = Date.now();
            const windowSize = 60000;
            
            for (const [timestamp] of this.rateLimiter) {
                if (now - timestamp > windowSize) {
                    this.rateLimiter.delete(timestamp);
                }
            }
        }, 10000); // Check every 10 seconds
    }

    /**
     * بدء معالج الطابور
     */
    startQueueProcessor() {
        // Process queue every 100ms
        setInterval(() => {
            if (!this.isProcessingQueue && this.requestQueue.length > 0) {
                this.processQueue();
            }
        }, 100);
    }

    /**
     * تحميل مفتاح API
     */
    async loadApiKey() {
        try {
            const encryptedKey = await this.storage.get(CONFIG.STORAGE.KEYS.API_KEY);
            if (encryptedKey) {
                this.apiKey = await this.storage.decrypt(encryptedKey);
                this.logger.info('🔑 API key loaded from storage');
            }
        } catch (error) {
            this.logger.error('Error loading API key:', error);
        }
    }

    /**
     * حفظ مفتاح API
     */
    async saveApiKey(apiKey) {
        try {
            const encryptedKey = await this.storage.encrypt(apiKey);
            await this.storage.set(CONFIG.STORAGE.KEYS.API_KEY, encryptedKey);
            this.logger.info('🔑 API key saved to storage');
        } catch (error) {
            this.logger.error('Error saving API key:', error);
        }
    }

    /**
     * تحميل الإحصائيات
     */
    async loadStats() {
        try {
            const savedStats = await this.storage.get('api_stats');
            if (savedStats) {
                this.stats = { ...this.stats, ...savedStats };
                this.logger.info('📊 API statistics loaded');
            }
        } catch (error) {
            this.logger.error('Error loading stats:', error);
        }
    }

    /**
     * حفظ الإحصائيات
     */
    async saveStats() {
        try {
            await this.storage.set('api_stats', this.stats);
            this.logger.debug('📊 API statistics saved');
        } catch (error) {
            this.logger.error('Error saving stats:', error);
        }
    }

    /**
     * تأخير
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * الحصول على الإحصائيات
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * مسح التخزين المؤقت
     */
    clearCache() {
        this.cache.clear();
        this.logger.info('🧹 API cache cleared');
    }

    /**
     * تنظيف الموارد
     */
    async cleanup() {
        try {
            this.logger.info('🧹 Cleaning up API Manager...');
            
            // Save final stats
            await this.saveStats();
            
            // Clear cache
            this.clearCache();
            
            // Clear rate limiter
            this.rateLimiter.clear();
            
            // Clear queue
            this.requestQueue = [];
            
            this.logger.info('✅ API Manager cleanup completed');
            
        } catch (error) {
            this.logger.error('Error during cleanup:', error);
        }
    }

    /**
     * إطلاق حدث
     */
    emit(eventName, data) {
        const event = new CustomEvent(`api:${eventName}`, {
            detail: data
        });
        
        if (typeof window !== 'undefined') {
            window.dispatchEvent(event);
        }
    }

    /**
     * الاستماع لحدث
     */
    on(eventName, callback) {
        if (typeof window !== 'undefined') {
            window.addEventListener(`api:${eventName}`, (event) => {
                callback(event.detail);
            });
        }
    }
}

export default APIManager;