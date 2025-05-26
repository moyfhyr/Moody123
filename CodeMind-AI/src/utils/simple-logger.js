/**
 * نظام تسجيل بسيط
 */

export class Logger {
    constructor(component = 'App') {
        this.component = component;
    }

    debug(message, ...args) {
        console.log(`[${this.component}] 🔍 ${message}`, ...args);
    }

    info(message, ...args) {
        console.log(`[${this.component}] ℹ️ ${message}`, ...args);
    }

    warn(message, ...args) {
        console.warn(`[${this.component}] ⚠️ ${message}`, ...args);
    }

    error(message, ...args) {
        console.error(`[${this.component}] ❌ ${message}`, ...args);
    }

    success(message, ...args) {
        console.log(`[${this.component}] ✅ ${message}`, ...args);
    }
}