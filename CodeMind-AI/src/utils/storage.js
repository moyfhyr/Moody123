// ===== Storage Management System =====

import { CONFIG } from './config.js';

class StorageManager {
  constructor() {
    this.isAvailable = this.checkAvailability();
    this.encryptionKey = null;
    this.init();
  }

  // Initialize storage manager
  async init() {
    if (CONFIG.STORAGE.ENCRYPTION.ENABLED) {
      await this.initEncryption();
    }
    this.cleanupExpiredData();
  }

  // Check if localStorage is available
  checkAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('localStorage is not available:', e);
      return false;
    }
  }

  // Initialize encryption for sensitive data
  async initEncryption() {
    try {
      if (window.crypto && window.crypto.subtle) {
        this.encryptionKey = await window.crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
      }
    } catch (e) {
      console.warn('Encryption initialization failed:', e);
      CONFIG.STORAGE.ENCRYPTION.ENABLED = false;
    }
  }

  // Encrypt sensitive data
  async encrypt(data) {
    if (!CONFIG.STORAGE.ENCRYPTION.ENABLED || !this.encryptionKey) {
      return data;
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(JSON.stringify(data));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        dataBuffer
      );

      return {
        encrypted: Array.from(new Uint8Array(encrypted)),
        iv: Array.from(iv),
        timestamp: Date.now()
      };
    } catch (e) {
      console.warn('Encryption failed:', e);
      return data;
    }
  }

  // Decrypt sensitive data
  async decrypt(encryptedData) {
    if (!CONFIG.STORAGE.ENCRYPTION.ENABLED || !this.encryptionKey || !encryptedData.encrypted) {
      return encryptedData;
    }

    try {
      const encrypted = new Uint8Array(encryptedData.encrypted);
      const iv = new Uint8Array(encryptedData.iv);
      
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encrypted
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decrypted));
    } catch (e) {
      console.warn('Decryption failed:', e);
      return null;
    }
  }

  // Set item in storage
  async setItem(key, value, encrypt = false) {
    if (!this.isAvailable) {
      console.warn('Storage not available');
      return false;
    }

    try {
      const data = {
        value: encrypt ? await this.encrypt(value) : value,
        timestamp: Date.now(),
        encrypted: encrypt
      };

      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to set storage item:', e);
      return false;
    }
  }

  // Get item from storage
  async getItem(key, defaultValue = null) {
    if (!this.isAvailable) {
      return defaultValue;
    }

    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        return defaultValue;
      }

      const data = JSON.parse(stored);
      
      // Check if data has expired
      if (this.isExpired(key, data.timestamp)) {
        this.removeItem(key);
        return defaultValue;
      }

      if (data.encrypted) {
        const decrypted = await this.decrypt(data.value);
        return decrypted !== null ? decrypted : defaultValue;
      }

      return data.value;
    } catch (e) {
      console.error('Failed to get storage item:', e);
      return defaultValue;
    }
  }

  // Remove item from storage
  removeItem(key) {
    if (!this.isAvailable) {
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Failed to remove storage item:', e);
      return false;
    }
  }

  // Clear all storage
  clear() {
    if (!this.isAvailable) {
      return false;
    }

    try {
      // Only clear CodeMind-related items
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('codemind_')) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (e) {
      console.error('Failed to clear storage:', e);
      return false;
    }
  }

  // Check if data has expired
  isExpired(key, timestamp) {
    const expiry = CONFIG.STORAGE.EXPIRY[key.replace('codemind_', '').toUpperCase()];
    if (!expiry) return false;
    
    return Date.now() - timestamp > expiry;
  }

  // Clean up expired data
  cleanupExpiredData() {
    if (!this.isAvailable) return;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('codemind_')) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const data = JSON.parse(stored);
              if (this.isExpired(key, data.timestamp)) {
                localStorage.removeItem(key);
              }
            }
          } catch (e) {
            // Remove corrupted data
            localStorage.removeItem(key);
          }
        }
      });
    } catch (e) {
      console.error('Failed to cleanup expired data:', e);
    }
  }

  // Get storage usage information
  getStorageInfo() {
    if (!this.isAvailable) {
      return { available: false };
    }

    try {
      let totalSize = 0;
      let itemCount = 0;
      const items = {};

      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('codemind_')) {
          const value = localStorage.getItem(key);
          const size = new Blob([value]).size;
          totalSize += size;
          itemCount++;
          items[key] = {
            size,
            lastModified: JSON.parse(value).timestamp
          };
        }
      });

      return {
        available: true,
        totalSize,
        itemCount,
        items,
        quota: this.getStorageQuota()
      };
    } catch (e) {
      console.error('Failed to get storage info:', e);
      return { available: false, error: e.message };
    }
  }

  // Get storage quota (approximate)
  getStorageQuota() {
    try {
      // Test storage limit
      let testSize = 1024 * 1024; // 1MB
      const testKey = '__quota_test__';
      
      while (testSize > 0) {
        try {
          const testData = 'x'.repeat(testSize);
          localStorage.setItem(testKey, testData);
          localStorage.removeItem(testKey);
          return testSize * 10; // Approximate quota
        } catch (e) {
          testSize = Math.floor(testSize / 2);
        }
      }
      
      return 5 * 1024 * 1024; // Default 5MB
    } catch (e) {
      return 5 * 1024 * 1024; // Default 5MB
    }
  }

  // Export data for backup
  async exportData() {
    const data = {};
    
    for (const [configKey, storageKey] of Object.entries(CONFIG.STORAGE.KEYS)) {
      const value = await this.getItem(storageKey);
      if (value !== null) {
        data[configKey] = value;
      }
    }

    return {
      version: CONFIG.APP.VERSION,
      timestamp: Date.now(),
      data
    };
  }

  // Import data from backup
  async importData(backupData) {
    if (!backupData.data) {
      throw new Error('Invalid backup data format');
    }

    const results = {};
    
    for (const [configKey, value] of Object.entries(backupData.data)) {
      const storageKey = CONFIG.STORAGE.KEYS[configKey];
      if (storageKey) {
        const encrypt = configKey === 'API_KEY';
        const success = await this.setItem(storageKey, value, encrypt);
        results[configKey] = success;
      }
    }

    return results;
  }
}

// Specific storage functions for different data types
export class SettingsStorage {
  constructor(storageManager) {
    this.storage = storageManager;
    this.key = CONFIG.STORAGE.KEYS.SETTINGS;
  }

  async get() {
    return await this.storage.getItem(this.key, {
      theme: CONFIG.UI.THEME.DEFAULT,
      model: CONFIG.API.GEMINI.DEFAULT_MODEL,
      autoScroll: CONFIG.UI.CHAT.AUTO_SCROLL,
      soundEffects: false,
      saveHistory: true,
      maxTokens: CONFIG.API.GEMINI.MAX_TOKENS,
      temperature: CONFIG.API.GEMINI.TEMPERATURE
    });
  }

  async set(settings) {
    return await this.storage.setItem(this.key, settings);
  }

  async update(updates) {
    const current = await this.get();
    const updated = { ...current, ...updates };
    return await this.set(updated);
  }
}

export class ChatHistoryStorage {
  constructor(storageManager) {
    this.storage = storageManager;
    this.key = CONFIG.STORAGE.KEYS.CHAT_HISTORY;
  }

  async get() {
    return await this.storage.getItem(this.key, []);
  }

  async add(message) {
    const history = await this.get();
    history.push({
      ...message,
      id: Date.now() + Math.random(),
      timestamp: Date.now()
    });

    // Keep only the last N messages
    if (history.length > CONFIG.UI.CHAT.MAX_MESSAGES) {
      history.splice(0, history.length - CONFIG.UI.CHAT.MAX_MESSAGES);
    }

    return await this.storage.setItem(this.key, history);
  }

  async clear() {
    return await this.storage.setItem(this.key, []);
  }
}

export class ProjectStorage {
  constructor(storageManager) {
    this.storage = storageManager;
    this.key = CONFIG.STORAGE.KEYS.PROJECTS;
  }

  async getAll() {
    return await this.storage.getItem(this.key, []);
  }

  async get(projectId) {
    const projects = await this.getAll();
    return projects.find(p => p.id === projectId);
  }

  async save(project) {
    const projects = await this.getAll();
    const existingIndex = projects.findIndex(p => p.id === project.id);
    
    const projectData = {
      ...project,
      lastModified: Date.now()
    };

    if (existingIndex >= 0) {
      projects[existingIndex] = projectData;
    } else {
      projects.push(projectData);
    }

    return await this.storage.setItem(this.key, projects);
  }

  async delete(projectId) {
    const projects = await this.getAll();
    const filtered = projects.filter(p => p.id !== projectId);
    return await this.storage.setItem(this.key, filtered);
  }
}

// Create and export storage instances
const storageManager = new StorageManager();
export const settingsStorage = new SettingsStorage(storageManager);
export const chatHistoryStorage = new ChatHistoryStorage(storageManager);
export const projectStorage = new ProjectStorage(storageManager);

export default storageManager;