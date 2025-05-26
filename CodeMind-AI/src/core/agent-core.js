// ===== CodeMind AI Agent Core =====

import { geminiAPI } from './gemini-api.js';
import { CONFIG } from '../utils/config.js';

export class AgentCore {
  constructor() {
    this.isInitialized = false;
    this.conversationHistory = [];
    this.currentTask = null;
    this.capabilities = {
      webBrowsing: true,
      codeGeneration: true,
      imageAnalysis: true,
      dataAnalysis: true,
      projectCreation: true
    };
    this.systemPrompt = this.buildSystemPrompt();
  }

  // Initialize the agent
  async initialize(apiKey) {
    try {
      geminiAPI.setApiKey(apiKey);
      await geminiAPI.testConnection();
      this.isInitialized = true;
      return { success: true, message: 'تم تهيئة الوكيل بنجاح' };
    } catch (error) {
      this.isInitialized = false;
      throw new Error(`فشل في تهيئة الوكيل: ${error.message}`);
    }
  }

  // Build system prompt for the agent
  buildSystemPrompt() {
    return `أنت CodeMind AI، وكيل ذكاء اصطناعي متقدم ومتخصص في:

🎯 **قدراتك الأساسية:**
1. **البحث والتصفح**: البحث في الإنترنت وتحليل المواقع
2. **البرمجة والتطوير**: إنشاء مواقع وتطبيقات ويب كاملة
3. **تحليل البيانات**: معالجة وتحليل المعلومات
4. **حل المشاكل**: تقديم حلول تقنية متقدمة

🛠️ **التقنيات التي تتقنها:**
- HTML5, CSS3, JavaScript (ES6+)
- React, Vue.js, Angular
- Node.js, Python, PHP
- SQL, NoSQL databases
- API development and integration

📋 **قواعد التفاعل:**
1. **الوضوح**: اشرح خطواتك بوضوح
2. **التفصيل**: قدم أمثلة عملية وكود قابل للتشغيل
3. **الأمان**: تأكد من أمان الكود والممارسات
4. **الجودة**: اكتب كود نظيف ومنظم
5. **التفاعل**: اطرح أسئلة توضيحية عند الحاجة

🎨 **أسلوب الرد:**
- استخدم الرموز التعبيرية لتوضيح النقاط
- قسم الإجابات إلى خطوات واضحة
- قدم أمثلة عملية
- اقترح تحسينات وبدائل

🔧 **عند إنشاء المشاريع:**
1. اسأل عن المتطلبات المحددة
2. اقترح هيكل المشروع
3. اكتب كود HTML, CSS, JavaScript منفصل
4. اختبر الكود قبل التسليم
5. قدم تعليمات التشغيل

تذكر: أنت مساعد ذكي وودود، هدفك مساعدة المستخدم في تحقيق أهدافه التقنية بأفضل طريقة ممكنة.`;
  }

  // Process user command
  async processCommand(userInput, context = {}) {
    if (!this.isInitialized) {
      throw new Error('الوكيل غير مهيأ. يرجى إدخال مفتاح API أولاً.');
    }

    try {
      // Analyze command type
      const commandType = this.analyzeCommandType(userInput);
      
      // Add to conversation history
      this.addToHistory('user', userInput);

      // Generate response based on command type
      let response;
      switch (commandType) {
        case 'web_search':
          response = await this.handleWebSearch(userInput, context);
          break;
        case 'code_generation':
          response = await this.handleCodeGeneration(userInput, context);
          break;
        case 'question_answer':
          response = await this.handleQuestionAnswer(userInput, context);
          break;
        case 'project_creation':
          response = await this.handleProjectCreation(userInput, context);
          break;
        case 'data_analysis':
          response = await this.handleDataAnalysis(userInput, context);
          break;
        default:
          response = await this.handleGeneralQuery(userInput, context);
      }

      // Add response to history
      this.addToHistory('assistant', response.text);

      return {
        success: true,
        response: response.text,
        type: commandType,
        actions: response.actions || [],
        metadata: response.metadata || {}
      };

    } catch (error) {
      console.error('Command processing error:', error);
      return {
        success: false,
        error: error.message,
        response: 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.'
      };
    }
  }

  // Analyze command type
  analyzeCommandType(input) {
    const lowerInput = input.toLowerCase();
    
    // Web search patterns
    if (lowerInput.includes('ابحث') || lowerInput.includes('بحث') || 
        lowerInput.includes('google') || lowerInput.includes('يوتيوب') ||
        lowerInput.includes('موقع') || lowerInput.includes('رابط')) {
      return 'web_search';
    }
    
    // Code generation patterns
    if (lowerInput.includes('اكتب') || lowerInput.includes('اصنع') ||
        lowerInput.includes('أنشئ') || lowerInput.includes('كود') ||
        lowerInput.includes('موقع') || lowerInput.includes('تطبيق') ||
        lowerInput.includes('html') || lowerInput.includes('css') ||
        lowerInput.includes('javascript')) {
      return 'code_generation';
    }
    
    // Project creation patterns
    if (lowerInput.includes('مشروع') || lowerInput.includes('تطبيق كامل') ||
        lowerInput.includes('موقع كامل') || lowerInput.includes('نظام')) {
      return 'project_creation';
    }
    
    // Question/explanation patterns
    if (lowerInput.includes('اشرح') || lowerInput.includes('ما هو') ||
        lowerInput.includes('كيف') || lowerInput.includes('لماذا') ||
        lowerInput.includes('؟')) {
      return 'question_answer';
    }
    
    // Data analysis patterns
    if (lowerInput.includes('حلل') || lowerInput.includes('تحليل') ||
        lowerInput.includes('بيانات') || lowerInput.includes('إحصائيات')) {
      return 'data_analysis';
    }
    
    return 'general';
  }

  // Handle web search commands
  async handleWebSearch(input, context) {
    const prompt = `${this.systemPrompt}

المستخدم يطلب البحث التالي: "${input}"

قم بما يلي:
1. حدد الكلمات المفتاحية للبحث
2. اقترح المواقع المناسبة للبحث
3. وضح خطوات البحث
4. قدم نصائح للحصول على أفضل النتائج

قدم إجابة شاملة ومفيدة.`;

    const response = await geminiAPI.generateContent(prompt);
    
    return {
      text: response.text,
      actions: [
        {
          type: 'open_browser',
          data: { query: input }
        }
      ],
      metadata: {
        searchQuery: input,
        suggestedSites: this.extractSuggestedSites(response.text)
      }
    };
  }

  // Handle code generation commands
  async handleCodeGeneration(input, context) {
    const prompt = `${this.systemPrompt}

المستخدم يطلب: "${input}"

قم بإنشاء كود عملي وقابل للتشغيل. اتبع هذا التنسيق:

## 📋 تحليل المتطلبات
[وضح ما فهمته من الطلب]

## 🏗️ هيكل المشروع
[اقترح هيكل الملفات]

## 💻 الكود

### HTML:
\`\`\`html
[كود HTML كامل]
\`\`\`

### CSS:
\`\`\`css
[كود CSS كامل]
\`\`\`

### JavaScript:
\`\`\`javascript
[كود JavaScript كامل]
\`\`\`

## 🚀 تعليمات التشغيل
[كيفية تشغيل المشروع]

## ✨ ميزات إضافية
[اقتراحات للتحسين]

تأكد من أن الكود:
- نظيف ومنظم
- يعمل بشكل صحيح
- متجاوب مع الأجهزة المختلفة
- يتبع أفضل الممارسات`;

    const response = await geminiAPI.generateContent(prompt);
    
    return {
      text: response.text,
      actions: [
        {
          type: 'create_project',
          data: { 
            code: this.extractCodeFromResponse(response.text),
            title: this.extractProjectTitle(input)
          }
        }
      ],
      metadata: {
        projectType: 'web_application',
        technologies: ['html', 'css', 'javascript']
      }
    };
  }

  // Handle question/answer commands
  async handleQuestionAnswer(input, context) {
    const prompt = `${this.systemPrompt}

المستخدم يسأل: "${input}"

قدم إجابة شاملة ومفصلة تتضمن:
1. شرح واضح ومبسط
2. أمثلة عملية
3. نصائح مفيدة
4. مراجع إضافية إذا لزم الأمر

استخدم الرموز التعبيرية والتنسيق لجعل الإجابة أكثر وضوحاً.`;

    const response = await geminiAPI.generateContent(prompt);
    
    return {
      text: response.text,
      metadata: {
        questionType: 'explanation',
        topic: this.extractTopicFromQuestion(input)
      }
    };
  }

  // Handle project creation commands
  async handleProjectCreation(input, context) {
    const prompt = `${this.systemPrompt}

المستخدم يريد إنشاء مشروع: "${input}"

قم بإنشاء مشروع كامل ومتقدم يتضمن:

## 🎯 نظرة عامة على المشروع
[وصف المشروع وأهدافه]

## 📁 هيكل المشروع
\`\`\`
project/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── assets/
│   └── images/
└── README.md
\`\`\`

## 💻 ملفات المشروع

### 📄 index.html
\`\`\`html
[كود HTML كامل ومتقدم]
\`\`\`

### 🎨 css/style.css
\`\`\`css
[كود CSS متقدم مع تصميم جميل]
\`\`\`

### ⚡ js/script.js
\`\`\`javascript
[كود JavaScript متقدم مع وظائف تفاعلية]
\`\`\`

## 🚀 ميزات المشروع
[قائمة بالميزات المتاحة]

## 📱 التوافق
[معلومات عن التوافق مع الأجهزة]

## 🔧 التطوير المستقبلي
[اقتراحات للتحسين والتطوير]

تأكد من أن المشروع:
- احترافي ومتقدم
- يعمل على جميع الأجهزة
- يتضمن تفاعلات جميلة
- يتبع أحدث المعايير`;

    const response = await geminiAPI.generateContent(prompt);
    
    return {
      text: response.text,
      actions: [
        {
          type: 'create_full_project',
          data: { 
            files: this.extractProjectFiles(response.text),
            title: this.extractProjectTitle(input),
            description: this.extractProjectDescription(response.text)
          }
        }
      ],
      metadata: {
        projectType: 'full_application',
        complexity: 'advanced',
        technologies: ['html5', 'css3', 'javascript', 'responsive']
      }
    };
  }

  // Handle data analysis commands
  async handleDataAnalysis(input, context) {
    const prompt = `${this.systemPrompt}

المستخدم يطلب تحليل: "${input}"

قدم تحليلاً شاملاً يتضمن:
1. فهم البيانات المطلوب تحليلها
2. الأدوات والطرق المناسبة
3. خطوات التحليل
4. كيفية تفسير النتائج
5. أمثلة عملية

إذا كان التحليل يتطلب كود، قدم أمثلة بـ JavaScript أو Python.`;

    const response = await geminiAPI.generateContent(prompt);
    
    return {
      text: response.text,
      metadata: {
        analysisType: 'data_analysis',
        tools: ['javascript', 'charts', 'statistics']
      }
    };
  }

  // Handle general queries
  async handleGeneralQuery(input, context) {
    const prompt = `${this.systemPrompt}

المستخدم يقول: "${input}"

قدم رد مفيد ومناسب حسب السياق. إذا كان الطلب غير واضح، اطرح أسئلة توضيحية.`;

    const response = await geminiAPI.generateContent(prompt);
    
    return {
      text: response.text,
      metadata: {
        queryType: 'general'
      }
    };
  }

  // Add message to conversation history
  addToHistory(role, content) {
    this.conversationHistory.push({
      role,
      content,
      timestamp: Date.now()
    });

    // Keep only last 20 messages to manage context length
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }

  // Extract code from response
  extractCodeFromResponse(response) {
    const codeBlocks = {};
    const htmlMatch = response.match(/```html\n([\s\S]*?)\n```/);
    const cssMatch = response.match(/```css\n([\s\S]*?)\n```/);
    const jsMatch = response.match(/```javascript\n([\s\S]*?)\n```/);

    if (htmlMatch) codeBlocks.html = htmlMatch[1];
    if (cssMatch) codeBlocks.css = cssMatch[1];
    if (jsMatch) codeBlocks.javascript = jsMatch[1];

    return codeBlocks;
  }

  // Extract project files from response
  extractProjectFiles(response) {
    const files = {};
    
    // Extract HTML
    const htmlMatch = response.match(/```html\n([\s\S]*?)\n```/);
    if (htmlMatch) {
      files['index.html'] = htmlMatch[1];
    }
    
    // Extract CSS
    const cssMatch = response.match(/```css\n([\s\S]*?)\n```/);
    if (cssMatch) {
      files['css/style.css'] = cssMatch[1];
    }
    
    // Extract JavaScript
    const jsMatch = response.match(/```javascript\n([\s\S]*?)\n```/);
    if (jsMatch) {
      files['js/script.js'] = jsMatch[1];
    }

    return files;
  }

  // Extract project title
  extractProjectTitle(input) {
    // Simple extraction - can be improved
    return input.replace(/اصنع|أنشئ|اكتب/g, '').trim() || 'مشروع جديد';
  }

  // Extract project description
  extractProjectDescription(response) {
    const match = response.match(/## 🎯 نظرة عامة على المشروع\n(.*?)(?=\n##|\n\n|$)/s);
    return match ? match[1].trim() : 'مشروع تم إنشاؤه بواسطة CodeMind AI';
  }

  // Extract suggested sites
  extractSuggestedSites(response) {
    // Simple extraction - can be improved
    const sites = [];
    if (response.includes('google')) sites.push('Google');
    if (response.includes('youtube')) sites.push('YouTube');
    if (response.includes('github')) sites.push('GitHub');
    return sites;
  }

  // Extract topic from question
  extractTopicFromQuestion(input) {
    // Simple extraction - can be improved
    const words = input.split(' ');
    return words.slice(0, 3).join(' ');
  }

  // Get agent status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      conversationLength: this.conversationHistory.length,
      currentTask: this.currentTask,
      capabilities: this.capabilities,
      apiStatus: geminiAPI.getStatus()
    };
  }

  // Clear conversation history
  clearHistory() {
    this.conversationHistory = [];
  }

  // Get conversation history
  getHistory() {
    return this.conversationHistory;
  }
}

// Create and export singleton instance
export const agentCore = new AgentCore();
export default agentCore;