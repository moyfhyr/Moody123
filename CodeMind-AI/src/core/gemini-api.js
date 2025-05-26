// ===== Google Gemini API Integration =====

import { CONFIG } from '../utils/config.js';

export class GeminiAPI {
  constructor() {
    this.apiKey = null;
    this.baseUrl = CONFIG.API.GEMINI.BASE_URL;
    this.model = CONFIG.API.GEMINI.DEFAULT_MODEL;
    this.isConnected = false;
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }

  // Set API key
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    this.isConnected = false;
  }

  // Set model
  setModel(model) {
    if (Object.values(CONFIG.API.GEMINI.MODELS).includes(model)) {
      this.model = model;
    } else {
      throw new Error(`Unsupported model: ${model}`);
    }
  }

  // Test API connection
  async testConnection() {
    if (!this.apiKey) {
      throw new Error('API key is required');
    }

    try {
      const response = await this.generateContent('مرحبا، هل تعمل؟', {
        maxTokens: 10,
        temperature: 0.1
      });

      this.isConnected = true;
      return {
        success: true,
        model: this.model,
        response: response.text
      };
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  // Generate content using Gemini API
  async generateContent(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('API key is required');
    }

    // Rate limiting
    await this.handleRateLimit();

    const requestOptions = {
      maxTokens: options.maxTokens || CONFIG.API.GEMINI.MAX_TOKENS,
      temperature: options.temperature || CONFIG.API.GEMINI.TEMPERATURE,
      topP: options.topP || CONFIG.API.GEMINI.TOP_P,
      topK: options.topK || CONFIG.API.GEMINI.TOP_K,
      stopSequences: options.stopSequences || [],
      safetySettings: CONFIG.API.GEMINI.SAFETY_SETTINGS
    };

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: requestOptions.temperature,
        topK: requestOptions.topK,
        topP: requestOptions.topP,
        maxOutputTokens: requestOptions.maxTokens,
        stopSequences: requestOptions.stopSequences
      },
      safetySettings: requestOptions.safetySettings
    };

    try {
      const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated');
      }

      const candidate = data.candidates[0];
      
      if (candidate.finishReason === 'SAFETY') {
        throw new Error('Response blocked due to safety concerns');
      }

      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('Empty response from API');
      }

      this.requestCount++;
      this.lastRequestTime = Date.now();

      return {
        text: candidate.content.parts[0].text,
        finishReason: candidate.finishReason,
        safetyRatings: candidate.safetyRatings,
        usage: data.usageMetadata,
        model: this.model
      };

    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  // Generate content with conversation context
  async generateWithContext(messages, options = {}) {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages array is required');
    }

    // Convert messages to Gemini format
    const contents = messages.map(message => ({
      role: message.role === 'user' ? 'user' : 'model',
      parts: [{
        text: message.content
      }]
    }));

    const requestBody = {
      contents,
      generationConfig: {
        temperature: options.temperature || CONFIG.API.GEMINI.TEMPERATURE,
        topK: options.topK || CONFIG.API.GEMINI.TOP_K,
        topP: options.topP || CONFIG.API.GEMINI.TOP_P,
        maxOutputTokens: options.maxTokens || CONFIG.API.GEMINI.MAX_TOKENS,
        stopSequences: options.stopSequences || []
      },
      safetySettings: CONFIG.API.GEMINI.SAFETY_SETTINGS
    };

    try {
      const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated');
      }

      const candidate = data.candidates[0];
      
      if (candidate.finishReason === 'SAFETY') {
        throw new Error('Response blocked due to safety concerns');
      }

      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('Empty response from API');
      }

      this.requestCount++;
      this.lastRequestTime = Date.now();

      return {
        text: candidate.content.parts[0].text,
        finishReason: candidate.finishReason,
        safetyRatings: candidate.safetyRatings,
        usage: data.usageMetadata,
        model: this.model
      };

    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  // Stream content generation
  async *streamContent(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('API key is required');
    }

    await this.handleRateLimit();

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: options.temperature || CONFIG.API.GEMINI.TEMPERATURE,
        topK: options.topK || CONFIG.API.GEMINI.TOP_K,
        topP: options.topP || CONFIG.API.GEMINI.TOP_P,
        maxOutputTokens: options.maxTokens || CONFIG.API.GEMINI.MAX_TOKENS
      },
      safetySettings: CONFIG.API.GEMINI.SAFETY_SETTINGS
    };

    try {
      const url = `${this.baseUrl}/models/${this.model}:streamGenerateContent?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                  const candidate = data.candidates[0];
                  const text = candidate.content.parts[0]?.text || '';
                  
                  if (text) {
                    yield {
                      text,
                      finishReason: candidate.finishReason,
                      delta: true
                    };
                  }
                }
              } catch (e) {
                console.warn('Failed to parse streaming response:', e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      this.requestCount++;
      this.lastRequestTime = Date.now();

    } catch (error) {
      console.error('Gemini Streaming Error:', error);
      throw error;
    }
  }

  // Analyze image with Gemini Vision
  async analyzeImage(imageData, prompt = 'وصف هذه الصورة', options = {}) {
    if (this.model !== CONFIG.API.GEMINI.MODELS.PRO) {
      throw new Error('Image analysis requires Gemini Pro Vision model');
    }

    if (!this.apiKey) {
      throw new Error('API key is required');
    }

    await this.handleRateLimit();

    // Convert image to base64 if needed
    let base64Data = imageData;
    if (imageData instanceof File || imageData instanceof Blob) {
      base64Data = await this.fileToBase64(imageData);
    }

    const requestBody = {
      contents: [{
        parts: [
          {
            text: prompt
          },
          {
            inlineData: {
              mimeType: options.mimeType || 'image/jpeg',
              data: base64Data.split(',')[1] // Remove data:image/jpeg;base64, prefix
            }
          }
        ]
      }],
      generationConfig: {
        temperature: options.temperature || 0.4,
        topK: options.topK || CONFIG.API.GEMINI.TOP_K,
        topP: options.topP || CONFIG.API.GEMINI.TOP_P,
        maxOutputTokens: options.maxTokens || 2048
      },
      safetySettings: CONFIG.API.GEMINI.SAFETY_SETTINGS
    };

    try {
      const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated');
      }

      const candidate = data.candidates[0];
      
      if (candidate.finishReason === 'SAFETY') {
        throw new Error('Response blocked due to safety concerns');
      }

      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('Empty response from API');
      }

      this.requestCount++;
      this.lastRequestTime = Date.now();

      return {
        text: candidate.content.parts[0].text,
        finishReason: candidate.finishReason,
        safetyRatings: candidate.safetyRatings,
        usage: data.usageMetadata,
        model: this.model
      };

    } catch (error) {
      console.error('Gemini Vision Error:', error);
      throw error;
    }
  }

  // Convert file to base64
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Handle rate limiting
  async handleRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1000; // 1 second between requests

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  // Get API status
  getStatus() {
    return {
      isConnected: this.isConnected,
      model: this.model,
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      hasApiKey: !!this.apiKey
    };
  }

  // Get usage statistics
  getUsageStats() {
    return {
      totalRequests: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      averageRequestsPerHour: this.requestCount / Math.max(1, (Date.now() - this.lastRequestTime) / (1000 * 60 * 60))
    };
  }
}

// Create and export singleton instance
export const geminiAPI = new GeminiAPI();
export default geminiAPI;