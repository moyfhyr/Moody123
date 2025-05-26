// ===== Configuration Management =====

export const CONFIG = {
  // Application Info
  APP: {
    NAME: 'CodeMind AI',
    VERSION: '1.0.0',
    DESCRIPTION: '🤖 وكيل ذكاء اصطناعي متقدم للتصفح والبرمجة',
    AUTHOR: 'CodeMind Team',
    GITHUB: 'https://github.com/codemind-ai/codemind-ai'
  },

  // API Configuration
  API: {
    GEMINI: {
      BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
      MODELS: {
        PRO: 'gemini-1.5-pro',
        FLASH: 'gemini-1.5-flash'
      },
      DEFAULT_MODEL: 'gemini-1.5-flash',
      MAX_TOKENS: 8192,
      TEMPERATURE: 0.7,
      TOP_P: 0.8,
      TOP_K: 40,
      SAFETY_SETTINGS: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    }
  },

  // UI Configuration
  UI: {
    THEME: {
      DEFAULT: 'dark',
      AVAILABLE: ['light', 'dark', 'auto']
    },
    ANIMATIONS: {
      ENABLED: true,
      DURATION: 250,
      EASING: 'ease-in-out'
    },
    CHAT: {
      MAX_MESSAGES: 100,
      AUTO_SCROLL: true,
      TYPING_SPEED: 50,
      MAX_INPUT_LENGTH: 4000
    },
    TERMINAL: {
      MAX_LINES: 1000,
      SCROLL_BUFFER: 100
    }
  },

  // Storage Configuration
  STORAGE: {
    KEYS: {
      API_KEY: 'codemind_api_key',
      SETTINGS: 'codemind_settings',
      CHAT_HISTORY: 'codemind_chat_history',
      USER_PREFERENCES: 'codemind_user_preferences',
      PROJECTS: 'codemind_projects',
      THEME: 'codemind_theme'
    },
    ENCRYPTION: {
      ENABLED: true,
      ALGORITHM: 'AES-GCM'
    },
    EXPIRY: {
      CHAT_HISTORY: 30 * 24 * 60 * 60 * 1000, // 30 days
      PROJECTS: 90 * 24 * 60 * 60 * 1000 // 90 days
    }
  },

  // Feature Flags
  FEATURES: {
    VOICE_INPUT: false,
    FILE_UPLOAD: true,
    EXPORT_CHAT: true,
    DARK_MODE: true,
    NOTIFICATIONS: true,
    BROWSER_INTEGRATION: true,
    PROJECT_STUDIO: true,
    AUTO_SAVE: true,
    OFFLINE_MODE: false
  },

  // Browser Configuration
  BROWSER: {
    SUPPORTED: ['chrome', 'firefox', 'safari', 'edge'],
    MIN_VERSION: {
      chrome: 90,
      firefox: 88,
      safari: 14,
      edge: 90
    },
    IFRAME_SANDBOX: [
      'allow-scripts',
      'allow-same-origin',
      'allow-forms',
      'allow-popups',
      'allow-top-navigation'
    ]
  },

  // Development
  DEV: {
    DEBUG: import.meta.env?.DEV || false,
    MOCK_API: false,
    VERBOSE_LOGGING: true,
    PERFORMANCE_MONITORING: true
  },

  // Error Handling
  ERROR: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    TIMEOUT: 30000,
    REPORT_ERRORS: true
  },

  // Performance
  PERFORMANCE: {
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 100,
    LAZY_LOAD: true,
    VIRTUAL_SCROLLING: false
  }
};

// Environment-specific overrides
if (typeof window !== 'undefined') {
  // Browser-specific configurations
  CONFIG.RUNTIME = {
    USER_AGENT: navigator.userAgent,
    PLATFORM: navigator.platform,
    LANGUAGE: navigator.language,
    ONLINE: navigator.onLine,
    COOKIES_ENABLED: navigator.cookieEnabled,
    LOCAL_STORAGE_AVAILABLE: (() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    })(),
    INDEXED_DB_AVAILABLE: 'indexedDB' in window,
    WEB_WORKERS_AVAILABLE: 'Worker' in window,
    SERVICE_WORKERS_AVAILABLE: 'serviceWorker' in navigator
  };
}

// Validation functions
export const validateConfig = () => {
  const errors = [];
  
  if (!CONFIG.API.GEMINI.BASE_URL) {
    errors.push('Missing Gemini API base URL');
  }
  
  if (!CONFIG.STORAGE.KEYS.API_KEY) {
    errors.push('Missing API key storage key');
  }
  
  if (CONFIG.UI.CHAT.MAX_MESSAGES < 1) {
    errors.push('Invalid max messages configuration');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Configuration update functions
export const updateConfig = (path, value) => {
  const keys = path.split('.');
  let current = CONFIG;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
};

export const getConfig = (path, defaultValue = null) => {
  const keys = path.split('.');
  let current = CONFIG;
  
  for (const key of keys) {
    if (current[key] === undefined) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current;
};

// Export default configuration
export default CONFIG;