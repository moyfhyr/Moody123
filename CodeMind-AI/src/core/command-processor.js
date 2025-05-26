/**
 * معالج الأوامر الذكي
 * يحلل الأوامر وينشئ خطط التنفيذ
 */

import { Logger } from '../utils/simple-logger.js';
import { CONFIG } from '../utils/config.js';

export class CommandProcessor {
    constructor() {
        this.logger = new Logger('CommandProcessor');
        this.commandPatterns = new Map();
        this.executionStrategies = new Map();
        
        this.setupCommandPatterns();
        this.setupExecutionStrategies();
        
        this.logger.info('🧠 Command Processor initialized');
    }

    /**
     * تهيئة معالج الأوامر
     */
    async initialize() {
        try {
            this.logger.info('🚀 Initializing Command Processor...');
            
            // Load command patterns
            this.loadCommandPatterns();
            
            // Setup execution strategies
            this.setupExecutionStrategies();
            
            this.logger.success('✅ Command Processor initialized successfully');
            
        } catch (error) {
            this.logger.error('❌ Failed to initialize Command Processor:', error);
            throw error;
        }
    }

    /**
     * تحليل الأمر
     */
    async analyzeCommand(userInput) {
        try {
            this.logger.info('🔍 Analyzing command:', userInput);
            
            const analysis = {
                originalInput: userInput,
                normalizedInput: this.normalizeInput(userInput),
                type: this.detectCommandType(userInput),
                intent: this.extractIntent(userInput),
                entities: this.extractEntities(userInput),
                parameters: this.extractParameters(userInput),
                complexity: this.assessComplexity(userInput),
                language: this.detectLanguage(userInput),
                confidence: 0.8,
                timestamp: new Date()
            };
            
            // Enhance analysis with context
            analysis.context = this.analyzeContext(analysis);
            
            // Calculate confidence score
            analysis.confidence = this.calculateConfidence(analysis);
            
            this.logger.success('✅ Command analysis completed');
            
            return analysis;
            
        } catch (error) {
            this.logger.error('❌ Error analyzing command:', error);
            throw error;
        }
    }

    /**
     * إنشاء خطة التنفيذ
     */
    async generateExecutionPlan(analysis) {
        try {
            this.logger.info('📋 Generating execution plan...');
            
            const plan = {
                id: this.generatePlanId(),
                type: analysis.type,
                steps: [],
                estimatedTime: 0,
                requiredCapabilities: [],
                resources: [],
                dependencies: [],
                riskLevel: 'low',
                timestamp: new Date()
            };
            
            // Generate steps based on command type
            plan.steps = await this.generateSteps(analysis);
            
            // Estimate execution time
            plan.estimatedTime = this.estimateExecutionTime(plan.steps);
            
            // Identify required capabilities
            plan.requiredCapabilities = this.identifyRequiredCapabilities(analysis);
            
            // Identify resources
            plan.resources = this.identifyResources(analysis);
            
            // Check dependencies
            plan.dependencies = this.checkDependencies(analysis);
            
            // Assess risk level
            plan.riskLevel = this.assessRiskLevel(analysis);
            
            this.logger.success('✅ Execution plan generated');
            
            return plan;
            
        } catch (error) {
            this.logger.error('❌ Error generating execution plan:', error);
            throw error;
        }
    }

    /**
     * تنفيذ الخطة
     */
    async executePlan(plan, task) {
        try {
            this.logger.info('⚡ Executing plan:', plan.id);
            
            const execution = {
                planId: plan.id,
                taskId: task.id,
                startTime: new Date(),
                status: 'running',
                currentStep: 0,
                results: [],
                errors: []
            };
            
            // Execute each step
            for (let i = 0; i < plan.steps.length; i++) {
                const step = plan.steps[i];
                execution.currentStep = i;
                
                try {
                    this.logger.info(`📋 Executing step ${i + 1}/${plan.steps.length}: ${step.description}`);
                    
                    const stepResult = await this.executeStep(step, task, execution);
                    execution.results.push(stepResult);
                    
                    // Update task step
                    if (task.steps && task.steps[i]) {
                        task.steps[i].result = stepResult;
                    }
                    
                } catch (stepError) {
                    this.logger.error(`❌ Step ${i + 1} failed:`, stepError);
                    execution.errors.push({
                        step: i,
                        error: stepError.message,
                        timestamp: new Date()
                    });
                    
                    // Decide whether to continue or abort
                    if (step.critical) {
                        throw stepError;
                    }
                }
            }
            
            execution.status = 'completed';
            execution.endTime = new Date();
            
            // Compile final result
            const finalResult = this.compileFinalResult(execution, plan);
            
            this.logger.success('✅ Plan execution completed');
            
            return finalResult;
            
        } catch (error) {
            this.logger.error('❌ Error executing plan:', error);
            throw error;
        }
    }

    /**
     * تنفيذ خطوة واحدة
     */
    async executeStep(step, task, execution) {
        const strategy = this.executionStrategies.get(step.type);
        
        if (!strategy) {
            throw new Error(`No execution strategy found for step type: ${step.type}`);
        }
        
        return await strategy(step, task, execution);
    }

    /**
     * تطبيع النص المدخل
     */
    normalizeInput(input) {
        return input
            .trim()
            .toLowerCase()
            .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0020-\u007F]/g, ' ')
            .replace(/\s+/g, ' ');
    }

    /**
     * اكتشاف نوع الأمر
     */
    detectCommandType(input) {
        const normalizedInput = this.normalizeInput(input);
        
        // Code generation patterns
        if (this.matchesPattern(normalizedInput, [
            'اكتب', 'كود', 'برنامج', 'موقع', 'تطبيق', 'صفحة',
            'html', 'css', 'javascript', 'react', 'vue', 'angular'
        ])) {
            return 'code_generation';
        }
        
        // Web search patterns
        if (this.matchesPattern(normalizedInput, [
            'ابحث', 'بحث', 'معلومات', 'اشرح', 'ما هو', 'كيف',
            'أين', 'متى', 'لماذا', 'من هو'
        ])) {
            return 'web_search';
        }
        
        // Data analysis patterns
        if (this.matchesPattern(normalizedInput, [
            'حلل', 'تحليل', 'فحص', 'اختبر', 'قارن', 'احسب',
            'إحصائيات', 'بيانات', 'جدول', 'رسم بياني'
        ])) {
            return 'data_analysis';
        }
        
        // File processing patterns
        if (this.matchesPattern(normalizedInput, [
            'ملف', 'تحميل', 'رفع', 'حفظ', 'تصدير', 'استيراد',
            'pdf', 'excel', 'word', 'csv', 'json'
        ])) {
            return 'file_processing';
        }
        
        // Image analysis patterns
        if (this.matchesPattern(normalizedInput, [
            'صورة', 'صور', 'تحليل صورة', 'وصف صورة', 'استخراج نص',
            'تعديل صورة', 'فلتر', 'تأثير'
        ])) {
            return 'image_analysis';
        }
        
        // Default to general query
        return 'general_query';
    }

    /**
     * استخراج النية
     */
    extractIntent(input) {
        const normalizedInput = this.normalizeInput(input);
        
        // Create intent
        if (this.matchesPattern(normalizedInput, ['اكتب', 'أنشئ', 'اصنع', 'كون'])) {
            return 'create';
        }
        
        // Search intent
        if (this.matchesPattern(normalizedInput, ['ابحث', 'اعثر', 'جد'])) {
            return 'search';
        }
        
        // Analyze intent
        if (this.matchesPattern(normalizedInput, ['حلل', 'فحص', 'اختبر'])) {
            return 'analyze';
        }
        
        // Explain intent
        if (this.matchesPattern(normalizedInput, ['اشرح', 'وضح', 'فسر'])) {
            return 'explain';
        }
        
        // Modify intent
        if (this.matchesPattern(normalizedInput, ['عدل', 'غير', 'حدث'])) {
            return 'modify';
        }
        
        return 'general';
    }

    /**
     * استخراج الكيانات
     */
    extractEntities(input) {
        const entities = {
            technologies: [],
            languages: [],
            frameworks: [],
            topics: [],
            files: [],
            urls: []
        };
        
        const normalizedInput = this.normalizeInput(input);
        
        // Extract technologies
        const techPatterns = ['html', 'css', 'javascript', 'python', 'java', 'php', 'sql'];
        entities.technologies = techPatterns.filter(tech => 
            normalizedInput.includes(tech)
        );
        
        // Extract frameworks
        const frameworkPatterns = ['react', 'vue', 'angular', 'express', 'django', 'laravel'];
        entities.frameworks = frameworkPatterns.filter(framework => 
            normalizedInput.includes(framework)
        );
        
        // Extract URLs
        const urlRegex = /https?:\/\/[^\s]+/g;
        entities.urls = input.match(urlRegex) || [];
        
        // Extract file extensions
        const fileRegex = /\.[a-zA-Z0-9]+/g;
        entities.files = input.match(fileRegex) || [];
        
        return entities;
    }

    /**
     * استخراج المعاملات
     */
    extractParameters(input) {
        const parameters = {};
        
        // Extract numbers
        const numbers = input.match(/\d+/g);
        if (numbers) {
            parameters.numbers = numbers.map(Number);
        }
        
        // Extract quoted strings
        const quotedStrings = input.match(/"([^"]*)"/g);
        if (quotedStrings) {
            parameters.quotedStrings = quotedStrings.map(str => str.slice(1, -1));
        }
        
        // Extract colors
        const colorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/g;
        const colors = input.match(colorRegex);
        if (colors) {
            parameters.colors = colors;
        }
        
        return parameters;
    }

    /**
     * تقييم التعقيد
     */
    assessComplexity(input) {
        let complexity = 'simple';
        
        const wordCount = input.split(/\s+/).length;
        const hasMultipleRequests = input.includes('و') || input.includes('ثم') || input.includes('أيضا');
        const hasTechnicalTerms = this.extractEntities(input).technologies.length > 0;
        
        if (wordCount > 20 || hasMultipleRequests) {
            complexity = 'medium';
        }
        
        if (wordCount > 50 || (hasMultipleRequests && hasTechnicalTerms)) {
            complexity = 'complex';
        }
        
        return complexity;
    }

    /**
     * اكتشاف اللغة
     */
    detectLanguage(input) {
        const arabicRegex = /[\u0600-\u06FF]/;
        const englishRegex = /[a-zA-Z]/;
        
        const hasArabic = arabicRegex.test(input);
        const hasEnglish = englishRegex.test(input);
        
        if (hasArabic && hasEnglish) {
            return 'mixed';
        } else if (hasArabic) {
            return 'arabic';
        } else if (hasEnglish) {
            return 'english';
        }
        
        return 'unknown';
    }

    /**
     * تحليل السياق
     */
    analyzeContext(analysis) {
        return {
            hasCodeRequest: analysis.type === 'code_generation',
            hasSearchRequest: analysis.type === 'web_search',
            hasAnalysisRequest: analysis.type === 'data_analysis',
            requiresInternet: ['web_search', 'api_integration'].includes(analysis.type),
            requiresFileAccess: analysis.type === 'file_processing',
            isInteractive: analysis.complexity !== 'simple'
        };
    }

    /**
     * حساب درجة الثقة
     */
    calculateConfidence(analysis) {
        let confidence = 0.5;
        
        // Boost confidence for clear patterns
        if (analysis.type !== 'general_query') {
            confidence += 0.2;
        }
        
        // Boost confidence for clear intent
        if (analysis.intent !== 'general') {
            confidence += 0.1;
        }
        
        // Boost confidence for extracted entities
        if (Object.values(analysis.entities).some(arr => arr.length > 0)) {
            confidence += 0.1;
        }
        
        // Reduce confidence for complex commands
        if (analysis.complexity === 'complex') {
            confidence -= 0.1;
        }
        
        return Math.min(0.95, Math.max(0.1, confidence));
    }

    /**
     * إنشاء خطوات التنفيذ
     */
    async generateSteps(analysis) {
        const steps = [];
        
        switch (analysis.type) {
            case 'code_generation':
                steps.push(
                    { type: 'analyze_requirements', description: 'تحليل المتطلبات', critical: true },
                    { type: 'generate_code', description: 'إنشاء الكود', critical: true },
                    { type: 'validate_code', description: 'التحقق من الكود', critical: false },
                    { type: 'format_response', description: 'تنسيق الاستجابة', critical: true }
                );
                break;
                
            case 'web_search':
                steps.push(
                    { type: 'prepare_query', description: 'تحضير الاستعلام', critical: true },
                    { type: 'search_web', description: 'البحث في الويب', critical: true },
                    { type: 'analyze_results', description: 'تحليل النتائج', critical: true },
                    { type: 'summarize_findings', description: 'تلخيص النتائج', critical: true }
                );
                break;
                
            case 'data_analysis':
                steps.push(
                    { type: 'load_data', description: 'تحميل البيانات', critical: true },
                    { type: 'clean_data', description: 'تنظيف البيانات', critical: false },
                    { type: 'analyze_data', description: 'تحليل البيانات', critical: true },
                    { type: 'generate_insights', description: 'إنشاء الرؤى', critical: true }
                );
                break;
                
            default:
                steps.push(
                    { type: 'understand_query', description: 'فهم الاستعلام', critical: true },
                    { type: 'generate_response', description: 'إنشاء الاستجابة', critical: true },
                    { type: 'format_response', description: 'تنسيق الاستجابة', critical: true }
                );
        }
        
        return steps;
    }

    /**
     * تقدير وقت التنفيذ
     */
    estimateExecutionTime(steps) {
        const baseTime = 2000; // 2 seconds base
        const stepTime = 1000; // 1 second per step
        
        return baseTime + (steps.length * stepTime);
    }

    /**
     * تحديد القدرات المطلوبة
     */
    identifyRequiredCapabilities(analysis) {
        const capabilities = ['text_processing'];
        
        switch (analysis.type) {
            case 'code_generation':
                capabilities.push('code_generation', 'syntax_validation');
                break;
            case 'web_search':
                capabilities.push('web_search', 'content_analysis');
                break;
            case 'data_analysis':
                capabilities.push('data_analysis', 'statistical_analysis');
                break;
            case 'image_analysis':
                capabilities.push('image_analysis', 'computer_vision');
                break;
        }
        
        return capabilities;
    }

    /**
     * تحديد الموارد
     */
    identifyResources(analysis) {
        const resources = [];
        
        if (analysis.context.requiresInternet) {
            resources.push('internet_connection');
        }
        
        if (analysis.context.requiresFileAccess) {
            resources.push('file_system_access');
        }
        
        if (analysis.type === 'code_generation') {
            resources.push('code_templates', 'syntax_validators');
        }
        
        return resources;
    }

    /**
     * فحص التبعيات
     */
    checkDependencies(analysis) {
        const dependencies = [];
        
        if (analysis.entities.frameworks.length > 0) {
            dependencies.push(...analysis.entities.frameworks);
        }
        
        if (analysis.entities.technologies.length > 0) {
            dependencies.push(...analysis.entities.technologies);
        }
        
        return dependencies;
    }

    /**
     * تقييم مستوى المخاطر
     */
    assessRiskLevel(analysis) {
        if (analysis.context.requiresFileAccess) {
            return 'medium';
        }
        
        if (analysis.complexity === 'complex') {
            return 'medium';
        }
        
        return 'low';
    }

    /**
     * تجميع النتيجة النهائية
     */
    compileFinalResult(execution, plan) {
        const successfulResults = execution.results.filter(result => result && !result.error);
        
        if (successfulResults.length === 0) {
            throw new Error('No successful results from execution');
        }
        
        // Combine results based on plan type
        switch (plan.type) {
            case 'code_generation':
                return this.compileCodeResult(successfulResults);
            case 'web_search':
                return this.compileSearchResult(successfulResults);
            case 'data_analysis':
                return this.compileAnalysisResult(successfulResults);
            default:
                return this.compileGeneralResult(successfulResults);
        }
    }

    /**
     * تجميع نتيجة الكود
     */
    compileCodeResult(results) {
        const codeResult = results.find(r => r.type === 'code');
        return {
            type: 'code',
            content: codeResult?.content || '',
            language: codeResult?.language || 'javascript',
            explanation: codeResult?.explanation || '',
            files: results.filter(r => r.type === 'file')
        };
    }

    /**
     * تجميع نتيجة البحث
     */
    compileSearchResult(results) {
        return {
            type: 'search',
            summary: results.find(r => r.type === 'summary')?.content || '',
            results: results.filter(r => r.type === 'search_result'),
            sources: results.filter(r => r.type === 'source')
        };
    }

    /**
     * تجميع نتيجة التحليل
     */
    compileAnalysisResult(results) {
        return {
            type: 'analysis',
            insights: results.filter(r => r.type === 'insight'),
            data: results.find(r => r.type === 'data')?.content || {},
            charts: results.filter(r => r.type === 'chart')
        };
    }

    /**
     * تجميع النتيجة العامة
     */
    compileGeneralResult(results) {
        return {
            type: 'general',
            content: results.map(r => r.content).join('\n\n'),
            metadata: results.map(r => r.metadata).filter(Boolean)
        };
    }

    /**
     * فحص تطابق النمط
     */
    matchesPattern(input, patterns) {
        return patterns.some(pattern => input.includes(pattern));
    }

    /**
     * إعداد أنماط الأوامر
     */
    setupCommandPatterns() {
        // This will be expanded with more sophisticated pattern matching
        this.commandPatterns.set('code_generation', [
            /اكتب.*كود/,
            /أنشئ.*موقع/,
            /اصنع.*تطبيق/
        ]);
        
        this.commandPatterns.set('web_search', [
            /ابحث.*عن/,
            /ما هو/,
            /معلومات.*عن/
        ]);
    }

    /**
     * إعداد استراتيجيات التنفيذ
     */
    setupExecutionStrategies() {
        // Basic execution strategies - will be expanded
        this.executionStrategies.set('understand_query', async (step, task) => {
            return { type: 'understanding', content: 'Query understood', timestamp: new Date() };
        });
        
        this.executionStrategies.set('generate_response', async (step, task) => {
            return { type: 'response', content: 'Response generated', timestamp: new Date() };
        });
        
        this.executionStrategies.set('format_response', async (step, task) => {
            return { type: 'formatted', content: 'Response formatted', timestamp: new Date() };
        });
    }

    /**
     * تحميل أنماط الأوامر
     */
    loadCommandPatterns() {
        // Load patterns from configuration or storage
        this.logger.debug('📋 Command patterns loaded');
    }

    /**
     * توليد معرف الخطة
     */
    generatePlanId() {
        return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    /**
     * تنظيف الموارد
     */
    async cleanup() {
        try {
            this.logger.info('🧹 Cleaning up Command Processor...');
            
            this.commandPatterns.clear();
            this.executionStrategies.clear();
            
            this.logger.info('✅ Command Processor cleanup completed');
            
        } catch (error) {
            this.logger.error('Error during cleanup:', error);
        }
    }

    /**
     * إطلاق حدث
     */
    emit(eventName, data) {
        const event = new CustomEvent(`command:${eventName}`, {
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
            window.addEventListener(`command:${eventName}`, (event) => {
                callback(event.detail);
            });
        }
    }
}

export default CommandProcessor;