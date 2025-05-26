// Debug script to test imports
console.log('🔍 Testing imports...');

try {
    console.log('1. Testing CONFIG import...');
    import('./src/utils/config.js').then(module => {
        console.log('✅ CONFIG imported successfully:', module.CONFIG);
    }).catch(err => {
        console.error('❌ CONFIG import failed:', err);
    });

    console.log('2. Testing storage import...');
    import('./src/utils/storage.js').then(module => {
        console.log('✅ Storage imported successfully:', module.default);
    }).catch(err => {
        console.error('❌ Storage import failed:', err);
    });

    console.log('3. Testing simple-logger import...');
    import('./src/utils/simple-logger.js').then(module => {
        console.log('✅ Logger imported successfully:', module.Logger);
    }).catch(err => {
        console.error('❌ Logger import failed:', err);
    });

    console.log('4. Testing gemini-api import...');
    import('./src/core/gemini-api.js').then(module => {
        console.log('✅ GeminiAPI imported successfully:', module.geminiAPI);
    }).catch(err => {
        console.error('❌ GeminiAPI import failed:', err);
    });

    console.log('5. Testing agent-core import...');
    import('./src/core/agent-core.js').then(module => {
        console.log('✅ AgentCore imported successfully:', module.agentCore);
    }).catch(err => {
        console.error('❌ AgentCore import failed:', err);
    });

    console.log('6. Testing main.js import...');
    import('./src/main.js').then(module => {
        console.log('✅ Main imported successfully');
    }).catch(err => {
        console.error('❌ Main import failed:', err);
    });

} catch (error) {
    console.error('❌ Debug script error:', error);
}