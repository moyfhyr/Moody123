/*
=================================================================
🤖 نظام العرض العمودي للخطوات الذكية (Intelligent Workflow System)
=================================================================
هذا الملف يحتوي على جميع وظائف نظام Workflow التفاعلي
يُدير عرض الخطوات، حالات الوكيل، والتفاعل مع المستخدم
=================================================================
*/

/**
 * 🎯 فئة WorkflowSystem الرئيسية
 * ===============================
 * تُدير جميع عمليات نظام Workflow من إنشاء الخطوات إلى التنفيذ
 */
class WorkflowSystem {
    /**
     * 🏗️ منشئ الفئة
     * ==============
     * يُهيئ النظام ويُعد المتغيرات الأساسية
     * @param {string} containerId - معرف الحاوي الرئيسي
     */
    constructor(containerId) {
        // 📋 المتغيرات الأساسية للنظام
        this.container = document.getElementById(containerId);
        this.steps = [];                    // مصفوفة جميع الخطوات
        this.currentStepIndex = 0;          // فهرس الخطوة الحالية
        this.isRunning = false;             // حالة تشغيل النظام
        this.agent = null;                  // عنصر الوكيل الذكي
        this.particles = [];                // مصفوفة الجسيمات المتحركة
        
        // 🎨 إعدادات التصميم والحركة
        this.animationSpeed = 300;          // سرعة الحركات (ميلي ثانية)
        this.thinkingDelay = 2000;          // مدة التفكير (ميلي ثانية)
        this.typingSpeed = 50;              // سرعة الكتابة (ميلي ثانية لكل حرف)
        
        // 🚀 تهيئة النظام
        this.init();
    }

    /**
     * 🚀 تهيئة النظام
     * ===============
     * يُنشئ الهيكل الأساسي ويُعد الأحداث
     */
    init() {
        console.log('🤖 تهيئة نظام Workflow الذكي...');
        
        // إنشاء الهيكل الأساسي
        this.createWorkflowStructure();
        
        // إنشاء الوكيل الذكي
        this.createAgent();
        
        // إنشاء الجسيمات المتحركة
        this.createParticles();
        
        // ربط الأحداث
        this.bindEvents();
        
        console.log('✅ تم تهيئة نظام Workflow بنجاح!');
    }

    /**
     * 🏗️ إنشاء الهيكل الأساسي للنظام
     * ================================
     * يُنشئ العناصر الأساسية: العنوان، الحالة، منطقة الخطوات
     */
    createWorkflowStructure() {
        // 📋 إنشاء العنوان والحالة
        const header = document.createElement('div');
        header.className = 'workflow-header';
        header.innerHTML = `
            <h2 class="workflow-title">🤖 الوكيل الذكي المتقدم</h2>
            <div class="workflow-status">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 10v6m11-7h-6m-10 0H1m15.5-6.5l-4.24 4.24M6.74 17.26L2.5 21.5m15-15l-4.24 4.24M6.74 6.74L2.5 2.5"/>
                </svg>
                جاهز للعمل
            </div>
        `;

        // 🔗 إنشاء الخط الواصل
        const connector = document.createElement('div');
        connector.className = 'workflow-connector';

        // 📋 إنشاء منطقة الخطوات
        const stepsContainer = document.createElement('div');
        stepsContainer.className = 'workflow-steps';
        stepsContainer.id = 'workflow-steps';

        // 🎬 إنشاء منطقة الأزرار
        const actions = document.createElement('div');
        actions.className = 'workflow-actions';
        actions.innerHTML = `
            <button class="workflow-action-btn" id="start-workflow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21"/>
                </svg>
                بدء العمل
            </button>
            <button class="workflow-action-btn secondary" id="pause-workflow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                </svg>
                إيقاف مؤقت
            </button>
            <button class="workflow-action-btn secondary" id="reset-workflow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                    <path d="M8 16H3v5"/>
                </svg>
                إعادة تعيين
            </button>
        `;

        // 🔗 إضافة العناصر للحاوي
        this.container.appendChild(header);
        this.container.appendChild(connector);
        this.container.appendChild(stepsContainer);
        this.container.appendChild(actions);
    }

    /**
     * 🤖 إنشاء الوكيل الذكي المتحرك
     * ==============================
     * يُنشئ شخصية الوكيل التي تُظهر حالات مختلفة
     */
    createAgent() {
        this.agent = document.createElement('div');
        this.agent.className = 'workflow-agent';
        this.agent.innerHTML = `
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
        `;
        
        // إضافة الوكيل للصفحة
        document.body.appendChild(this.agent);
        
        // إضافة تفاعل النقر
        this.agent.addEventListener('click', () => {
            this.showAgentMessage();
        });
    }

    /**
     * ✨ إنشاء الجسيمات المتحركة
     * ===========================
     * يُنشئ تأثيرات بصرية جميلة في الخلفية
     */
    createParticles() {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'workflow-particles';
        this.container.appendChild(particlesContainer);

        // إنشاء 20 جسيم متحرك
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.createParticle(particlesContainer);
            }, i * 400); // تأخير تدريجي لكل جسيم
        }
    }

    /**
     * ⭐ إنشاء جسيم واحد
     * ==================
     * يُنشئ جسيم متحرك واحد مع موقع وحركة عشوائية
     * @param {HTMLElement} container - حاوي الجسيمات
     */
    createParticle(container) {
        const particle = document.createElement('div');
        particle.className = 'workflow-particle';
        
        // موقع عشوائي
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 8 + 's';
        particle.style.animationDuration = (8 + Math.random() * 4) + 's';
        
        container.appendChild(particle);
        
        // إزالة الجسيم بعد انتهاء الحركة
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 12000);
    }

    /**
     * 🔗 ربط الأحداث
     * ===============
     * يربط جميع الأحداث والتفاعلات
     */
    bindEvents() {
        // زر بدء العمل
        document.getElementById('start-workflow').addEventListener('click', () => {
            this.startWorkflow();
        });

        // زر الإيقاف المؤقت
        document.getElementById('pause-workflow').addEventListener('click', () => {
            this.pauseWorkflow();
        });

        // زر إعادة التعيين
        document.getElementById('reset-workflow').addEventListener('click', () => {
            this.resetWorkflow();
        });
    }

    /**
     * ➕ إضافة خطوة جديدة
     * ===================
     * يُضيف خطوة جديدة لنظام Workflow
     * @param {Object} stepData - بيانات الخطوة
     */
    addStep(stepData) {
        const step = {
            id: this.steps.length + 1,
            title: stepData.title || 'خطوة جديدة',
            description: stepData.description || 'وصف الخطوة',
            icon: stepData.icon || 'default',
            status: 'pending',
            action: stepData.action || null,
            duration: stepData.duration || 3000
        };

        this.steps.push(step);
        this.renderStep(step);
        
        console.log(`➕ تم إضافة خطوة جديدة: ${step.title}`);
    }

    /**
     * 🎨 رسم خطوة واحدة
     * ==================
     * يُنشئ عنصر HTML لخطوة واحدة
     * @param {Object} step - بيانات الخطوة
     */
    renderStep(step) {
        const stepElement = document.createElement('div');
        stepElement.className = `workflow-step ${step.status}`;
        stepElement.id = `step-${step.id}`;
        
        stepElement.innerHTML = `
            <div class="workflow-step-icon">
                ${this.getStepIcon(step.icon)}
            </div>
            <div class="workflow-step-content">
                <h3 class="workflow-step-title">${step.title}</h3>
                <p class="workflow-step-description">${step.description}</p>
                <div class="workflow-step-status">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M8 12l2 2 4-4"/>
                    </svg>
                    ${this.getStatusText(step.status)}
                </div>
            </div>
        `;

        // إضافة تأثير الظهور التدريجي
        stepElement.style.opacity = '0';
        stepElement.style.transform = 'translateY(20px)';
        
        document.getElementById('workflow-steps').appendChild(stepElement);
        
        // تطبيق الحركة
        setTimeout(() => {
            stepElement.style.transition = 'all 0.5s ease-out';
            stepElement.style.opacity = '1';
            stepElement.style.transform = 'translateY(0)';
        }, 100);
    }

    /**
     * 🎯 الحصول على أيقونة الخطوة
     * ============================
     * يُرجع أيقونة SVG حسب نوع الخطوة
     * @param {string} iconType - نوع الأيقونة
     * @returns {string} - كود SVG للأيقونة
     */
    getStepIcon(iconType) {
        const icons = {
            thinking: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>`,
            
            creating: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>`,
            
            analyzing: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9,17H7V10H9V17M13,17H11V7H13V17M17,17H15V13H17V17M19.5,19.5H4.5V5.5H19.5V19.5M19.5,4H4.5C3.67,4 3,4.67 3,5.5V19.5C3,20.33 3.67,21 4.5,21H19.5C20.33,21 21,20.33 21,19.5V5.5C21,4.67 20.33,4 19.5,4Z"/>
            </svg>`,
            
            coding: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8,3A2,2 0 0,0 6,5V9A2,2 0 0,1 4,11H3V13H4A2,2 0 0,1 6,15V19A2,2 0 0,0 8,21H10V19H8V14A2,2 0 0,0 6,12A2,2 0 0,0 8,10V5H10V3M16,3A2,2 0 0,1 18,5V9A2,2 0 0,0 20,11H21V13H20A2,2 0 0,0 18,15V19A2,2 0 0,1 16,21H14V19H16V14A2,2 0 0,1 18,12A2,2 0 0,1 16,10V5H14V3H16Z"/>
            </svg>`,
            
            testing: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7,2V4H8V18A4,4 0 0,0 12,22A4,4 0 0,0 16,18V4H17V2H7M11,16C10.4,16 10,15.6 10,15C10,14.4 10.4,14 11,14C11.6,14 12,14.4 12,15C12,15.6 11.6,16 11,16M13,12C12.4,12 12,11.6 12,11C12,10.4 12.4,10 13,10C13.6,10 14,10.4 14,11C14,11.6 13.6,12 13,12M14,7H10V4H14V7Z"/>
            </svg>`,
            
            default: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
            </svg>`
        };

        return icons[iconType] || icons.default;
    }

    /**
     * 📝 الحصول على نص الحالة
     * ========================
     * يُرجع نص وصفي لحالة الخطوة
     * @param {string} status - حالة الخطوة
     * @returns {string} - النص الوصفي
     */
    getStatusText(status) {
        const statusTexts = {
            pending: 'في الانتظار...',
            active: 'قيد التنفيذ...',
            thinking: 'يفكر...',
            working: 'يعمل...',
            completed: 'مكتمل ✓',
            error: 'خطأ ✗'
        };

        return statusTexts[status] || 'غير معروف';
    }

    /**
     * ▶️ بدء تشغيل النظام
     * ===================
     * يبدأ تنفيذ جميع الخطوات بالتسلسل
     */
    async startWorkflow() {
        if (this.isRunning) {
            console.log('⚠️ النظام يعمل بالفعل!');
            return;
        }

        console.log('🚀 بدء تشغيل نظام Workflow...');
        this.isRunning = true;
        this.updateAgentState('working');
        
        // تحديث حالة النظام
        this.updateSystemStatus('يعمل...');

        // تنفيذ كل خطوة
        for (let i = 0; i < this.steps.length; i++) {
            if (!this.isRunning) break; // توقف إذا تم إيقاف النظام
            
            await this.executeStep(i);
        }

        // انتهاء العمل
        this.isRunning = false;
        this.updateAgentState('completed');
        this.updateSystemStatus('مكتمل ✓');
        
        console.log('✅ تم إنجاز جميع الخطوات بنجاح!');
    }

    /**
     * ⏸️ إيقاف النظام مؤقتاً
     * ======================
     * يوقف تنفيذ النظام مؤقتاً
     */
    pauseWorkflow() {
        if (!this.isRunning) {
            console.log('⚠️ النظام متوقف بالفعل!');
            return;
        }

        console.log('⏸️ إيقاف النظام مؤقتاً...');
        this.isRunning = false;
        this.updateAgentState('paused');
        this.updateSystemStatus('متوقف مؤقتاً');
    }

    /**
     * 🔄 إعادة تعيين النظام
     * =====================
     * يعيد النظام لحالته الأولى
     */
    resetWorkflow() {
        console.log('🔄 إعادة تعيين النظام...');
        
        this.isRunning = false;
        this.currentStepIndex = 0;
        
        // إعادة تعيين حالة جميع الخطوات
        this.steps.forEach((step, index) => {
            step.status = 'pending';
            this.updateStepStatus(index, 'pending');
        });

        this.updateAgentState('ready');
        this.updateSystemStatus('جاهز للعمل');
        
        console.log('✅ تم إعادة تعيين النظام بنجاح!');
    }

    /**
     * ⚡ تنفيذ خطوة واحدة
     * ==================
     * ينفذ خطوة واحدة مع عرض التقدم
     * @param {number} stepIndex - فهرس الخطوة
     */
    async executeStep(stepIndex) {
        const step = this.steps[stepIndex];
        if (!step) return;

        console.log(`⚡ تنفيذ الخطوة: ${step.title}`);
        
        // تحديث حالة الخطوة إلى نشطة
        step.status = 'active';
        this.updateStepStatus(stepIndex, 'active');
        this.updateAgentState('thinking');

        // مرحلة التفكير
        await this.simulateThinking(stepIndex);
        
        // مرحلة العمل
        step.status = 'working';
        this.updateStepStatus(stepIndex, 'working');
        this.updateAgentState('working');
        
        // تنفيذ العمل الفعلي
        if (step.action && typeof step.action === 'function') {
            try {
                await step.action();
            } catch (error) {
                console.error(`❌ خطأ في تنفيذ الخطوة ${step.title}:`, error);
                step.status = 'error';
                this.updateStepStatus(stepIndex, 'error');
                return;
            }
        } else {
            // محاكاة العمل
            await this.delay(step.duration);
        }

        // إكمال الخطوة
        step.status = 'completed';
        this.updateStepStatus(stepIndex, 'completed');
        
        console.log(`✅ تم إنجاز الخطوة: ${step.title}`);
    }

    /**
     * 🧠 محاكاة التفكير
     * ==================
     * يُظهر حالة التفكير مع تأثيرات بصرية
     * @param {number} stepIndex - فهرس الخطوة
     */
    async simulateThinking(stepIndex) {
        const step = this.steps[stepIndex];
        
        // تحديث النص لإظهار التفكير
        this.updateStepStatus(stepIndex, 'thinking');
        
        // تأثير الكتابة التدريجية
        const thinkingTexts = [
            'يحلل المتطلبات...',
            'يفكر في الحل الأمثل...',
            'يخطط للتنفيذ...',
            'جاهز للبدء...'
        ];

        for (const text of thinkingTexts) {
            if (!this.isRunning) break;
            
            await this.typeText(stepIndex, text);
            await this.delay(500);
        }
    }

    /**
     * ⌨️ تأثير الكتابة التدريجية
     * ===========================
     * يُظهر النص بتأثير الكتابة التدريجية
     * @param {number} stepIndex - فهرس الخطوة
     * @param {string} text - النص المراد كتابته
     */
    async typeText(stepIndex, text) {
        const stepElement = document.getElementById(`step-${stepIndex + 1}`);
        const statusElement = stepElement.querySelector('.workflow-step-status');
        
        // مسح النص الحالي
        const iconSvg = statusElement.querySelector('svg').outerHTML;
        statusElement.innerHTML = iconSvg;
        
        // كتابة النص حرف بحرف
        for (let i = 0; i <= text.length; i++) {
            if (!this.isRunning) break;
            
            statusElement.innerHTML = iconSvg + ' ' + text.substring(0, i);
            await this.delay(this.typingSpeed);
        }
    }

    /**
     * 🔄 تحديث حالة الخطوة
     * ====================
     * يُحدث مظهر الخطوة حسب حالتها
     * @param {number} stepIndex - فهرس الخطوة
     * @param {string} status - الحالة الجديدة
     */
    updateStepStatus(stepIndex, status) {
        const stepElement = document.getElementById(`step-${stepIndex + 1}`);
        if (!stepElement) return;

        // إزالة الفئات القديمة
        stepElement.classList.remove('pending', 'active', 'thinking', 'working', 'completed', 'error');
        
        // إضافة الفئة الجديدة
        stepElement.classList.add(status);

        // تحديث نص الحالة
        const statusElement = stepElement.querySelector('.workflow-step-status');
        const iconSvg = statusElement.querySelector('svg').outerHTML;
        statusElement.innerHTML = iconSvg + ' ' + this.getStatusText(status);
    }

    /**
     * 🤖 تحديث حالة الوكيل
     * ====================
     * يُغير مظهر وحركة الوكيل حسب الحالة
     * @param {string} state - حالة الوكيل
     */
    updateAgentState(state) {
        if (!this.agent) return;

        // إزالة الفئات القديمة
        this.agent.classList.remove('thinking', 'working', 'completed', 'paused', 'ready');
        
        // إضافة الفئة الجديدة
        this.agent.classList.add(state);

        // تغيير الأيقونة حسب الحالة
        const icons = {
            thinking: `<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>`,
            
            working: `<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
            </svg>`,
            
            completed: `<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>`,
            
            ready: `<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>`
        };

        this.agent.innerHTML = icons[state] || icons.ready;
    }

    /**
     * 📊 تحديث حالة النظام
     * ====================
     * يُحدث نص حالة النظام في العنوان
     * @param {string} status - نص الحالة
     */
    updateSystemStatus(status) {
        const statusElement = this.container.querySelector('.workflow-status');
        if (statusElement) {
            const iconSvg = statusElement.querySelector('svg').outerHTML;
            statusElement.innerHTML = iconSvg + ' ' + status;
        }
    }

    /**
     * 💬 عرض رسالة من الوكيل
     * =======================
     * يُظهر رسالة تفاعلية من الوكيل
     */
    showAgentMessage() {
        const messages = [
            'مرحباً! أنا الوكيل الذكي، جاهز لمساعدتك! 🤖',
            'يمكنني تنفيذ المهام المعقدة خطوة بخطوة! ⚡',
            'اضغط على "بدء العمل" لرؤية السحر! ✨',
            'أستطيع التفكير والتحليل والبرمجة! 🧠',
            'دعني أُظهر لك قوة الذكاء الاصطناعي! 🚀'
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        // إنشاء فقاعة الرسالة
        const bubble = document.createElement('div');
        bubble.style.cssText = `
            position: fixed;
            bottom: 120px;
            right: 30px;
            background: var(--workflow-primary);
            color: white;
            padding: 15px 20px;
            border-radius: 20px;
            max-width: 250px;
            font-size: 14px;
            box-shadow: 0 8px 25px rgba(25, 195, 125, 0.3);
            z-index: 1001;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease-out;
        `;
        
        bubble.textContent = randomMessage;
        document.body.appendChild(bubble);

        // إظهار الفقاعة
        setTimeout(() => {
            bubble.style.opacity = '1';
            bubble.style.transform = 'translateY(0)';
        }, 100);

        // إخفاء الفقاعة بعد 4 ثوان
        setTimeout(() => {
            bubble.style.opacity = '0';
            bubble.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (bubble.parentNode) {
                    bubble.parentNode.removeChild(bubble);
                }
            }, 300);
        }, 4000);
    }

    /**
     * ⏱️ دالة التأخير
     * ================
     * تُنشئ تأخير زمني للحركات والتأثيرات
     * @param {number} ms - المدة بالميلي ثانية
     * @returns {Promise} - وعد يكتمل بعد المدة المحددة
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 🎯 إضافة مشروع تجريبي
     * ======================
     * يُضيف مشروع تجريبي لعرض إمكانيات النظام
     */
    addSampleProject() {
        console.log('🎯 إضافة مشروع تجريبي...');

        // خطوات المشروع التجريبي
        const sampleSteps = [
            {
                title: 'تحليل المتطلبات',
                description: 'تحليل وفهم متطلبات المشروع والمستخدم',
                icon: 'analyzing',
                duration: 3000,
                action: async () => {
                    console.log('🔍 يحلل المتطلبات...');
                    await this.delay(2000);
                    console.log('✅ تم تحليل المتطلبات بنجاح');
                }
            },
            {
                title: 'تصميم الهيكل',
                description: 'تصميم هيكل المشروع والمكونات الأساسية',
                icon: 'thinking',
                duration: 4000,
                action: async () => {
                    console.log('🎨 يصمم الهيكل...');
                    await this.delay(3000);
                    console.log('✅ تم تصميم الهيكل بنجاح');
                }
            },
            {
                title: 'كتابة الكود',
                description: 'كتابة الكود البرمجي وتطبيق الوظائف',
                icon: 'coding',
                duration: 5000,
                action: async () => {
                    console.log('💻 يكتب الكود...');
                    await this.delay(4000);
                    console.log('✅ تم كتابة الكود بنجاح');
                }
            },
            {
                title: 'اختبار النظام',
                description: 'اختبار جميع الوظائف والتأكد من عملها',
                icon: 'testing',
                duration: 3000,
                action: async () => {
                    console.log('🧪 يختبر النظام...');
                    await this.delay(2500);
                    console.log('✅ تم اختبار النظام بنجاح');
                }
            },
            {
                title: 'نشر المشروع',
                description: 'نشر المشروع وجعله متاحاً للاستخدام',
                icon: 'creating',
                duration: 2000,
                action: async () => {
                    console.log('🚀 ينشر المشروع...');
                    await this.delay(1500);
                    console.log('✅ تم نشر المشروع بنجاح');
                }
            }
        ];

        // إضافة كل خطوة
        sampleSteps.forEach(step => {
            this.addStep(step);
        });

        console.log('✅ تم إضافة المشروع التجريبي بنجاح!');
    }
}

/**
 * 🚀 تهيئة النظام عند تحميل الصفحة
 * =================================
 * يُنشئ نظام Workflow ويُضيف مشروع تجريبي
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 بدء تحميل نظام Workflow الذكي...');
    
    // إنشاء النظام
    window.workflowSystem = new WorkflowSystem('workflow-container');
    
    // إضافة مشروع تجريبي
    window.workflowSystem.addSampleProject();
    
    console.log('🎉 تم تحميل نظام Workflow بنجاح!');
});

/**
 * 🎯 تصدير النظام للاستخدام الخارجي
 * ==================================
 * يجعل النظام متاحاً للاستخدام من ملفات أخرى
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorkflowSystem;
}