/**
 * معالج الأخطاء المتطور
 * يدير الأخطاء والاستعادة والتسجيل
 */

import { Logger } from '../utils/simple-logger.js';
import storageManager from '../utils/storage.js';

export class ErrorHandler {
    constructor() {
        this.logger = new Logger('ErrorHandler');
        this.storage = storageManager;
        
        this.errorHistory = [];
        this.recoveryStrategies = new Map();
        this.errorPatterns = new Map();
        this.maxHistorySize = 100;
        
        this.setupRecoveryStrategies();
        this.setupErrorPatterns();
        
        this.logger.info('🛡️ Error Handler initialized');
    }

    /**
     * تهيئة معالج الأخطاء
     */
    async initialize() {
        try {
            this.logger.info('🚀 Initializing Error Handler...');
            
            // Load error history
            await this.loadErrorHistory();
            
            // Setup global error handlers
            this.setupGlobalErrorHandlers();
            
            this.logger.success('✅ Error Handler initialized successfully');
            
        } catch (error) {
            this.logger.error('❌ Failed to initialize Error Handler:', error);
            throw error;
        }
    }

    /**
     * معالجة خطأ
     */
    async handleError(error, context = '', metadata = {}) {
        try {
            // Create error record
            const errorRecord = this.createErrorRecord(error, context, metadata);
            
            // Log error
            this.logError(errorRecord);
            
            // Add to history
            this.addToHistory(errorRecord);
            
            // Analyze error
            const analysis = this.analyzeError(errorRecord);
            
            // Determine recovery strategy
            const recoveryStrategy = this.determineRecoveryStrategy(analysis);
            
            // Execute recovery
            const recoveryResult = await this.executeRecovery(recoveryStrategy, errorRecord);
            
            // Save error history
            await this.saveErrorHistory();
            
            return recoveryResult;
            
        } catch (handlingError) {
            this.logger.error('❌ Error in error handling:', handlingError);
            return { success: false, retry: false, message: 'Critical error in error handling' };
        }
    }

    /**
     * إنشاء سجل خطأ
     */
    createErrorRecord(error, context, metadata) {
        return {
            id: this.generateErrorId(),
            timestamp: new Date(),
            message: error.message || 'Unknown error',
            stack: error.stack || '',
            name: error.name || 'Error',
            context: context,
            metadata: metadata,
            severity: this.determineSeverity(error, context),
            category: this.categorizeError(error, context),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
            url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
        };
    }

    /**
     * تسجيل الخطأ
     */
    logError(errorRecord) {
        const logMessage = `[${errorRecord.category}] ${errorRecord.context}: ${errorRecord.message}`;
        
        switch (errorRecord.severity) {
            case 'critical':
                this.logger.error('🚨 CRITICAL:', logMessage);
                break;
            case 'high':
                this.logger.error('❌ HIGH:', logMessage);
                break;
            case 'medium':
                this.logger.warn('⚠️ MEDIUM:', logMessage);
                break;
            case 'low':
                this.logger.info('ℹ️ LOW:', logMessage);
                break;
            default:
                this.logger.debug('🔍 DEBUG:', logMessage);
        }
    }

    /**
     * إضافة للتاريخ
     */
    addToHistory(errorRecord) {
        this.errorHistory.push(errorRecord);
        
        // Maintain history size limit
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory.shift();
        }
    }

    /**
     * تحليل الخطأ
     */
    analyzeError(errorRecord) {
        const analysis = {
            isRecurring: this.isRecurringError(errorRecord),
            frequency: this.calculateErrorFrequency(errorRecord),
            pattern: this.identifyErrorPattern(errorRecord),
            relatedErrors: this.findRelatedErrors(errorRecord),
            possibleCauses: this.identifyPossibleCauses(errorRecord),
            impact: this.assessImpact(errorRecord)
        };
        
        return analysis;
    }

    /**
     * تحديد استراتيجية الاستعادة
     */
    determineRecoveryStrategy(analysis) {
        const errorRecord = analysis.errorRecord || {};
        
        // Check for specific recovery strategies
        for (const [pattern, strategy] of this.recoveryStrategies) {
            if (this.matchesErrorPattern(errorRecord, pattern)) {
                return strategy;
            }
        }
        
        // Default strategy based on severity
        switch (errorRecord.severity) {
            case 'critical':
                return this.recoveryStrategies.get('critical_default');
            case 'high':
                return this.recoveryStrategies.get('high_default');
            case 'medium':
                return this.recoveryStrategies.get('medium_default');
            default:
                return this.recoveryStrategies.get('low_default');
        }
    }

    /**
     * تنفيذ الاستعادة
     */
    async executeRecovery(strategy, errorRecord) {
        try {
            if (!strategy) {
                return { success: false, retry: false, message: 'No recovery strategy available' };
            }
            
            this.logger.info(`🔄 Executing recovery strategy: ${strategy.name}`);
            
            const result = await strategy.execute(errorRecord);
            
            if (result.success) {
                this.logger.success(`✅ Recovery successful: ${strategy.name}`);
            } else {
                this.logger.warn(`⚠️ Recovery failed: ${strategy.name}`);
            }
            
            return result;
            
        } catch (recoveryError) {
            this.logger.error('❌ Recovery execution failed:', recoveryError);
            return { success: false, retry: false, message: 'Recovery execution failed' };
        }
    }

    /**
     * تحديد شدة الخطأ
     */
    determineSeverity(error, context) {
        const message = error.message?.toLowerCase() || '';
        
        // Critical errors
        if (message.includes('network') && context.includes('api')) {
            return 'critical';
        }
        
        if (message.includes('authentication') || message.includes('unauthorized')) {
            return 'high';
        }
        
        if (message.includes('validation') || message.includes('invalid')) {
            return 'medium';
        }
        
        if (context.includes('initialization') || context.includes('activation')) {
            return 'high';
        }
        
        return 'low';
    }

    /**
     * تصنيف الخطأ
     */
    categorizeError(error, context) {
        const message = error.message?.toLowerCase() || '';
        
        if (context.includes('api') || message.includes('fetch') || message.includes('network')) {
            return 'network';
        }
        
        if (context.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
            return 'authentication';
        }
        
        if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
            return 'validation';
        }
        
        if (context.includes('storage') || message.includes('storage') || message.includes('quota')) {
            return 'storage';
        }
        
        if (context.includes('command') || context.includes('processing')) {
            return 'processing';
        }
        
        return 'general';
    }

    /**
     * فحص الخطأ المتكرر
     */
    isRecurringError(errorRecord) {
        const recentErrors = this.errorHistory.slice(-10);
        const similarErrors = recentErrors.filter(err => 
            err.message === errorRecord.message && 
            err.context === errorRecord.context
        );
        
        return similarErrors.length > 2;
    }

    /**
     * حساب تكرار الخطأ
     */
    calculateErrorFrequency(errorRecord) {
        const timeWindow = 60 * 60 * 1000; // 1 hour
        const cutoffTime = new Date(Date.now() - timeWindow);
        
        const recentSimilarErrors = this.errorHistory.filter(err => 
            err.timestamp > cutoffTime &&
            err.message === errorRecord.message &&
            err.context === errorRecord.context
        );
        
        return recentSimilarErrors.length;
    }

    /**
     * تحديد نمط الخطأ
     */
    identifyErrorPattern(errorRecord) {
        for (const [patternName, pattern] of this.errorPatterns) {
            if (this.matchesErrorPattern(errorRecord, pattern)) {
                return patternName;
            }
        }
        
        return 'unknown';
    }

    /**
     * العثور على أخطاء مرتبطة
     */
    findRelatedErrors(errorRecord) {
        const timeWindow = 5 * 60 * 1000; // 5 minutes
        const cutoffTime = new Date(errorRecord.timestamp.getTime() - timeWindow);
        
        return this.errorHistory.filter(err => 
            err.timestamp > cutoffTime &&
            err.timestamp < errorRecord.timestamp &&
            (err.context === errorRecord.context || err.category === errorRecord.category)
        );
    }

    /**
     * تحديد الأسباب المحتملة
     */
    identifyPossibleCauses(errorRecord) {
        const causes = [];
        
        switch (errorRecord.category) {
            case 'network':
                causes.push('Internet connection issues', 'API server downtime', 'Rate limiting');
                break;
            case 'authentication':
                causes.push('Invalid API key', 'Expired credentials', 'Permission issues');
                break;
            case 'validation':
                causes.push('Invalid input format', 'Missing required fields', 'Data type mismatch');
                break;
            case 'storage':
                causes.push('Storage quota exceeded', 'Permission denied', 'Corrupted data');
                break;
            default:
                causes.push('Unknown cause');
        }
        
        return causes;
    }

    /**
     * تقييم التأثير
     */
    assessImpact(errorRecord) {
        const impact = {
            userExperience: 'low',
            systemStability: 'low',
            dataIntegrity: 'low',
            functionality: 'low'
        };
        
        switch (errorRecord.severity) {
            case 'critical':
                impact.userExperience = 'high';
                impact.systemStability = 'high';
                impact.functionality = 'high';
                break;
            case 'high':
                impact.userExperience = 'medium';
                impact.functionality = 'medium';
                break;
            case 'medium':
                impact.userExperience = 'low';
                impact.functionality = 'low';
                break;
        }
        
        if (errorRecord.context.includes('storage') || errorRecord.context.includes('data')) {
            impact.dataIntegrity = 'medium';
        }
        
        return impact;
    }

    /**
     * فحص تطابق نمط الخطأ
     */
    matchesErrorPattern(errorRecord, pattern) {
        if (pattern.message && !pattern.message.test(errorRecord.message)) {
            return false;
        }
        
        if (pattern.context && !pattern.context.test(errorRecord.context)) {
            return false;
        }
        
        if (pattern.category && pattern.category !== errorRecord.category) {
            return false;
        }
        
        return true;
    }

    /**
     * إعداد استراتيجيات الاستعادة
     */
    setupRecoveryStrategies() {
        // Network error recovery
        this.recoveryStrategies.set('network_error', {
            name: 'Network Error Recovery',
            execute: async (errorRecord) => {
                return {
                    success: true,
                    retry: true,
                    delay: 5000,
                    message: 'سيتم إعادة المحاولة خلال 5 ثوان'
                };
            }
        });
        
        // Authentication error recovery
        this.recoveryStrategies.set('auth_error', {
            name: 'Authentication Error Recovery',
            execute: async (errorRecord) => {
                return {
                    success: false,
                    retry: false,
                    message: 'يرجى التحقق من مفتاح API والمحاولة مرة أخرى'
                };
            }
        });
        
        // Validation error recovery
        this.recoveryStrategies.set('validation_error', {
            name: 'Validation Error Recovery',
            execute: async (errorRecord) => {
                return {
                    success: false,
                    retry: false,
                    message: 'يرجى التحقق من صحة البيانات المدخلة'
                };
            }
        });
        
        // Default strategies
        this.recoveryStrategies.set('critical_default', {
            name: 'Critical Default Recovery',
            execute: async (errorRecord) => {
                return {
                    success: false,
                    retry: false,
                    message: 'خطأ حرج - يرجى إعادة تشغيل التطبيق'
                };
            }
        });
        
        this.recoveryStrategies.set('high_default', {
            name: 'High Default Recovery',
            execute: async (errorRecord) => {
                return {
                    success: true,
                    retry: true,
                    delay: 3000,
                    message: 'سيتم إعادة المحاولة تلقائياً'
                };
            }
        });
        
        this.recoveryStrategies.set('medium_default', {
            name: 'Medium Default Recovery',
            execute: async (errorRecord) => {
                return {
                    success: true,
                    retry: true,
                    delay: 1000,
                    message: 'إعادة محاولة...'
                };
            }
        });
        
        this.recoveryStrategies.set('low_default', {
            name: 'Low Default Recovery',
            execute: async (errorRecord) => {
                return {
                    success: true,
                    retry: false,
                    message: 'تم تسجيل الخطأ'
                };
            }
        });
    }

    /**
     * إعداد أنماط الأخطاء
     */
    setupErrorPatterns() {
        this.errorPatterns.set('network_timeout', {
            message: /timeout|network|fetch/i,
            category: 'network'
        });
        
        this.errorPatterns.set('api_key_invalid', {
            message: /api.*key|unauthorized|forbidden/i,
            category: 'authentication'
        });
        
        this.errorPatterns.set('validation_failed', {
            message: /validation|invalid|required/i,
            category: 'validation'
        });
        
        this.errorPatterns.set('storage_quota', {
            message: /quota|storage|space/i,
            category: 'storage'
        });
    }

    /**
     * إعداد معالجات الأخطاء العامة
     */
    setupGlobalErrorHandlers() {
        if (typeof window !== 'undefined') {
            // Handle unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                this.handleError(event.reason, 'unhandled_promise_rejection', {
                    promise: event.promise
                });
            });
            
            // Handle general errors
            window.addEventListener('error', (event) => {
                this.handleError(event.error, 'global_error', {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                });
            });
        }
    }

    /**
     * تحميل تاريخ الأخطاء
     */
    async loadErrorHistory() {
        try {
            const savedHistory = await this.storage.get('error_history');
            if (savedHistory && Array.isArray(savedHistory)) {
                this.errorHistory = savedHistory.slice(-this.maxHistorySize);
                this.logger.info(`📥 Loaded ${this.errorHistory.length} error records`);
            }
        } catch (error) {
            this.logger.error('Error loading error history:', error);
        }
    }

    /**
     * حفظ تاريخ الأخطاء
     */
    async saveErrorHistory() {
        try {
            await this.storage.set('error_history', this.errorHistory);
            this.logger.debug('💾 Error history saved');
        } catch (error) {
            this.logger.error('Error saving error history:', error);
        }
    }

    /**
     * الحصول على إحصائيات الأخطاء
     */
    getErrorStats() {
        const stats = {
            total: this.errorHistory.length,
            bySeverity: {},
            byCategory: {},
            recent: 0,
            recurring: 0
        };
        
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        this.errorHistory.forEach(error => {
            // Count by severity
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
            
            // Count by category
            stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
            
            // Count recent errors
            if (error.timestamp > oneHourAgo) {
                stats.recent++;
            }
        });
        
        // Count recurring errors
        const errorSignatures = new Map();
        this.errorHistory.forEach(error => {
            const signature = `${error.message}_${error.context}`;
            errorSignatures.set(signature, (errorSignatures.get(signature) || 0) + 1);
        });
        
        stats.recurring = Array.from(errorSignatures.values()).filter(count => count > 1).length;
        
        return stats;
    }

    /**
     * مسح تاريخ الأخطاء
     */
    async clearErrorHistory() {
        this.errorHistory = [];
        await this.storage.remove('error_history');
        this.logger.info('🧹 Error history cleared');
    }

    /**
     * توليد معرف الخطأ
     */
    generateErrorId() {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    /**
     * تنظيف الموارد
     */
    async cleanup() {
        try {
            this.logger.info('🧹 Cleaning up Error Handler...');
            
            // Save final error history
            await this.saveErrorHistory();
            
            // Clear memory
            this.errorHistory = [];
            this.recoveryStrategies.clear();
            this.errorPatterns.clear();
            
            this.logger.info('✅ Error Handler cleanup completed');
            
        } catch (error) {
            this.logger.error('Error during cleanup:', error);
        }
    }
}

export default ErrorHandler;