// ===== Simple Test for CodeMind AI =====

console.log('🚀 Starting CodeMind AI...');

// Simple app initialization
class SimpleCodeMindApp {
  constructor() {
    console.log('📱 Creating app instance...');
    this.isInitialized = false;
  }

  async init() {
    try {
      console.log('🔧 Initializing app...');
      
      // Hide loading screen after 3 seconds
      setTimeout(() => {
        this.hideLoadingScreen();
      }, 3000);
      
      this.isInitialized = true;
      console.log('✅ App initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
    }
  }

  hideLoadingScreen() {
    console.log('🎭 Hiding loading screen...');
    
    const loadingScreen = document.getElementById('loading-screen');
    const app = document.getElementById('app');
    
    if (loadingScreen && app) {
      loadingScreen.style.display = 'none';
      app.style.display = 'block';
      console.log('✅ Loading screen hidden, app shown');
    } else {
      console.error('❌ Could not find loading screen or app elements');
    }
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📄 DOM loaded, starting app...');
  
  const app = new SimpleCodeMindApp();
  await app.init();
});

// Also try immediate initialization in case DOM is already loaded
if (document.readyState === 'loading') {
  console.log('⏳ DOM is still loading...');
} else {
  console.log('✅ DOM already loaded, starting app immediately...');
  const app = new SimpleCodeMindApp();
  app.init();
}