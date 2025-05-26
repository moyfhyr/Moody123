// ===== CodeMind AI - Test Version =====

console.log('🚀 Starting CodeMind AI Test...');

// Hide loading screen immediately
setTimeout(() => {
  console.log('⏰ Timeout triggered');
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
    console.log('✅ Loading screen hidden');
  } else {
    console.warn('⚠️ Loading screen not found');
  }
}, 1000);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM loaded!');
  
  // Hide loading screen
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
    console.log('✅ Loading screen hidden via DOM ready');
  }
  
  // Add test message
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages) {
    chatMessages.innerHTML = `
      <div class="message assistant-message">
        <div class="message-content">
          <div class="message-text">🎉 CodeMind AI Test is working!</div>
          <div class="message-time">${new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    `;
    console.log('✅ Test message added');
  }
  
  console.log('✅ Test initialization complete');
});