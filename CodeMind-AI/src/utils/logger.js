/**
 * نظام تسجيل متقدم
 * يدعم مستويات مختلفة من التسجيل والتصفية
 */

export class Logger {
    constructor(component = 'App') {
        this.component = component;
        this.logLevel = this.getLogLevel();
        this.logs = [];
        this.maxLogs = 1000;
        
        // Log levels
        this.levels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3,
            SUCCESS: 4
        };
        
        // Colors for console output
        this.colors = {
            DEBUG: '#6B7280',
            INFO: '#3B82F6',
            WARN: '#F59E0B',
            ERROR: '#EF4444',
            SUCCESS: '#10B981'
        };
        
        // Emojis for different log types
        this.emojis = {
            DEBUG: '🔍',
            INFO: 'ℹ️',
            WARN: '⚠️',
            ERROR: '❌',
            SUCCESS: '✅'
        };
    }

    /**
     * تسجيل رسالة تصحيح
     */
    debug(message, ...args) {
        this.log('DEBUG', message, ...args);
    }

    /**
     * تسجيل رسالة معلومات
     */
    info(message, ...args) {
        this.log('INFO', message, ...args);
    }

    /**
     * تسجيل رسالة تحذير
     */
    warn(message, ...args) {
        this.log('WARN', message, ...args);
    }

    /**
     * تسجيل رسالة خطأ
     */
    error(message, ...args) {
        this.log('ERROR', message, ...args);
    }

    /**
     * تسجيل رسالة نجاح
     */
    success(message, ...args) {
        this.log('SUCCESS', message, ...args);
    }

    /**
     * تسجيل رسالة عامة
     */
    log(level, message, ...args) {
        // Check if this level should be logged
        if (this.levels[level] < this.logLevel) {
            return;
        }

        const timestamp = new Date();
        const logEntry = {
            timestamp,
            level,
            component: this.component,
            message,
            args,
            id: this.generateLogId()
        };

        // Add to internal log storage
        this.addToStorage(logEntry);

        // Output to console
        this.outputToConsole(logEntry);

        // Emit log event
        this.emitLogEvent(logEntry);
    }

    /**
     * إضافة للتخزين الداخلي
     */
    addToStorage(logEntry) {
        this.logs.push(logEntry);
        
        // Maintain max logs limit
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
    }

    /**
     * إخراج للكونسول
     */
    outputToConsole(logEntry) {
        const { timestamp, level, component, message, args } = logEntry;
        const timeStr = timestamp.toLocaleTimeString();
        const emoji = this.emojis[level];
        const color = this.colors[level];
        
        const prefix = `${emoji} [${timeStr}] [${component}]`;
        
        if (typeof window !== 'undefined' && window.console) {
            const consoleMethod = this.getConsoleMethod(level);
            
            if (args.length > 0) {
                consoleMethod(
                    `%c${prefix} ${message}`,
                    `color: ${color}; font-weight: bold;`,
                    ...args
                );
            } else {
                consoleMethod(
                    `%c${prefix} ${message}`,
                    `color: ${color}; font-weight: bold;`
                );
            }
        }
    }

    /**
     * الحصول على طريقة الكونسول المناسبة
     */
    getConsoleMethod(level) {
        switch (level) {
            case 'DEBUG':
                return console.debug || console.log;
            case 'INFO':
            case 'SUCCESS':
                return console.info || console.log;
            case 'WARN':
                return console.warn || console.log;
            case 'ERROR':
                return console.error || console.log;
            default:
                return console.log;
        }
    }

    /**
     * إطلاق حدث التسجيل
     */
    emitLogEvent(logEntry) {
        if (typeof window !== 'undefined') {
            const event = new CustomEvent('logger:entry', {
                detail: logEntry
            });
            window.dispatchEvent(event);
        }
    }

    /**
     * الحصول على مستوى التسجيل
     */
    getLogLevel() {
        // Check localStorage for saved log level
        if (typeof localStorage !== 'undefined') {
            const savedLevel = localStorage.getItem('logger_level');
            if (savedLevel && this.levels[savedLevel] !== undefined) {
                return this.levels[savedLevel];
            }
        }
        
        // Default to INFO level in production, DEBUG in development
        return typeof process !== 'undefined' && process.env.NODE_ENV === 'development' 
            ? this.levels.DEBUG 
            : this.levels.INFO;
    }

    /**
     * تعيين مستوى التسجيل
     */
    setLogLevel(level) {
        if (this.levels[level] !== undefined) {
            this.logLevel = this.levels[level];
            
            // Save to localStorage
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('logger_level', level);
            }
            
            this.info(`Log level set to: ${level}`);
        } else {
            this.warn(`Invalid log level: ${level}`);
        }
    }

    /**
     * الحصول على السجلات
     */
    getLogs(filter = {}) {
        let filteredLogs = [...this.logs];
        
        // Filter by level
        if (filter.level) {
            filteredLogs = filteredLogs.filter(log => log.level === filter.level);
        }
        
        // Filter by component
        if (filter.component) {
            filteredLogs = filteredLogs.filter(log => log.component === filter.component);
        }
        
        // Filter by time range
        if (filter.since) {
            const sinceTime = new Date(filter.since);
            filteredLogs = filteredLogs.filter(log => log.timestamp >= sinceTime);
        }
        
        // Filter by search term
        if (filter.search) {
            const searchTerm = filter.search.toLowerCase();
            filteredLogs = filteredLogs.filter(log => 
                log.message.toLowerCase().includes(searchTerm) ||
                log.component.toLowerCase().includes(searchTerm)
            );
        }
        
        // Limit results
        if (filter.limit) {
            filteredLogs = filteredLogs.slice(-filter.limit);
        }
        
        return filteredLogs;
    }

    /**
     * مسح السجلات
     */
    clearLogs() {
        this.logs = [];
        this.info('Logs cleared');
    }

    /**
     * تصدير السجلات
     */
    exportLogs(format = 'json') {
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(this.logs, null, 2);
            case 'csv':
                return this.exportToCSV();
            case 'txt':
                return this.exportToText();
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * تصدير إلى CSV
     */
    exportToCSV() {
        const headers = ['Timestamp', 'Level', 'Component', 'Message'];
        const rows = this.logs.map(log => [
            log.timestamp.toISOString(),
            log.level,
            log.component,
            `"${log.message.replace(/"/g, '""')}"`
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    /**
     * تصدير إلى نص
     */
    exportToText() {
        return this.logs.map(log => {
            const timeStr = log.timestamp.toLocaleString();
            const emoji = this.emojis[log.level];
            return `${emoji} [${timeStr}] [${log.component}] ${log.message}`;
        }).join('\n');
    }

    /**
     * الحصول على إحصائيات السجلات
     */
    getStats() {
        const stats = {
            total: this.logs.length,
            byLevel: {},
            byComponent: {},
            recent: 0,
            oldestEntry: null,
            newestEntry: null
        };
        
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        this.logs.forEach(log => {
            // Count by level
            stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
            
            // Count by component
            stats.byComponent[log.component] = (stats.byComponent[log.component] || 0) + 1;
            
            // Count recent logs
            if (log.timestamp > oneHourAgo) {
                stats.recent++;
            }
            
            // Track oldest and newest
            if (!stats.oldestEntry || log.timestamp < stats.oldestEntry.timestamp) {
                stats.oldestEntry = log;
            }
            if (!stats.newestEntry || log.timestamp > stats.newestEntry.timestamp) {
                stats.newestEntry = log;
            }
        });
        
        return stats;
    }

    /**
     * تجميع السجلات حسب الفترة الزمنية
     */
    groupByTimeInterval(interval = 'hour') {
        const groups = new Map();
        
        this.logs.forEach(log => {
            const key = this.getTimeIntervalKey(log.timestamp, interval);
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(log);
        });
        
        return Object.fromEntries(groups);
    }

    /**
     * الحصول على مفتاح الفترة الزمنية
     */
    getTimeIntervalKey(timestamp, interval) {
        const date = new Date(timestamp);
        
        switch (interval) {
            case 'minute':
                return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
            case 'hour':
                return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
            case 'day':
                return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            case 'week':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                return `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
            case 'month':
                return `${date.getFullYear()}-${date.getMonth()}`;
            default:
                return date.toISOString().split('T')[0];
        }
    }

    /**
     * البحث في السجلات
     */
    search(query, options = {}) {
        const {
            caseSensitive = false,
            regex = false,
            fields = ['message', 'component']
        } = options;
        
        let searchFn;
        
        if (regex) {
            const regexPattern = new RegExp(query, caseSensitive ? 'g' : 'gi');
            searchFn = (text) => regexPattern.test(text);
        } else {
            const searchTerm = caseSensitive ? query : query.toLowerCase();
            searchFn = (text) => {
                const textToSearch = caseSensitive ? text : text.toLowerCase();
                return textToSearch.includes(searchTerm);
            };
        }
        
        return this.logs.filter(log => {
            return fields.some(field => {
                const value = log[field];
                return value && searchFn(String(value));
            });
        });
    }

    /**
     * إنشاء تقرير السجلات
     */
    generateReport(options = {}) {
        const {
            timeRange = '24h',
            includeStats = true,
            includeCharts = false,
            format = 'html'
        } = options;
        
        const cutoffTime = this.getTimeRangeCutoff(timeRange);
        const relevantLogs = this.logs.filter(log => log.timestamp >= cutoffTime);
        
        const report = {
            generatedAt: new Date(),
            timeRange,
            totalLogs: relevantLogs.length,
            logs: relevantLogs
        };
        
        if (includeStats) {
            report.stats = this.generateStatsForLogs(relevantLogs);
        }
        
        if (includeCharts) {
            report.charts = this.generateChartsData(relevantLogs);
        }
        
        switch (format) {
            case 'json':
                return JSON.stringify(report, null, 2);
            case 'html':
                return this.generateHTMLReport(report);
            default:
                return report;
        }
    }

    /**
     * الحصول على نقطة قطع النطاق الزمني
     */
    getTimeRangeCutoff(timeRange) {
        const now = new Date();
        const cutoff = new Date(now);
        
        switch (timeRange) {
            case '1h':
                cutoff.setHours(now.getHours() - 1);
                break;
            case '6h':
                cutoff.setHours(now.getHours() - 6);
                break;
            case '24h':
                cutoff.setDate(now.getDate() - 1);
                break;
            case '7d':
                cutoff.setDate(now.getDate() - 7);
                break;
            case '30d':
                cutoff.setDate(now.getDate() - 30);
                break;
            default:
                cutoff.setDate(now.getDate() - 1);
        }
        
        return cutoff;
    }

    /**
     * إنشاء إحصائيات للسجلات
     */
    generateStatsForLogs(logs) {
        const stats = {
            total: logs.length,
            byLevel: {},
            byComponent: {},
            timeline: {}
        };
        
        logs.forEach(log => {
            // Count by level
            stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
            
            // Count by component
            stats.byComponent[log.component] = (stats.byComponent[log.component] || 0) + 1;
            
            // Timeline data
            const hourKey = log.timestamp.toISOString().substring(0, 13);
            stats.timeline[hourKey] = (stats.timeline[hourKey] || 0) + 1;
        });
        
        return stats;
    }

    /**
     * إنشاء بيانات الرسوم البيانية
     */
    generateChartsData(logs) {
        return {
            levelDistribution: this.generateLevelChart(logs),
            componentActivity: this.generateComponentChart(logs),
            timeline: this.generateTimelineChart(logs)
        };
    }

    /**
     * إنشاء رسم بياني للمستويات
     */
    generateLevelChart(logs) {
        const data = {};
        logs.forEach(log => {
            data[log.level] = (data[log.level] || 0) + 1;
        });
        return data;
    }

    /**
     * إنشاء رسم بياني للمكونات
     */
    generateComponentChart(logs) {
        const data = {};
        logs.forEach(log => {
            data[log.component] = (data[log.component] || 0) + 1;
        });
        return data;
    }

    /**
     * إنشاء رسم بياني زمني
     */
    generateTimelineChart(logs) {
        const data = {};
        logs.forEach(log => {
            const hourKey = log.timestamp.toISOString().substring(0, 13);
            data[hourKey] = (data[hourKey] || 0) + 1;
        });
        return data;
    }

    /**
     * إنشاء تقرير HTML
     */
    generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Logger Report - ${report.timeRange}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat-card { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; flex: 1; }
        .log-entry { margin: 5px 0; padding: 10px; border-left: 3px solid #ccc; }
        .DEBUG { border-left-color: #6B7280; }
        .INFO { border-left-color: #3B82F6; }
        .WARN { border-left-color: #F59E0B; }
        .ERROR { border-left-color: #EF4444; }
        .SUCCESS { border-left-color: #10B981; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Logger Report</h1>
        <p>Generated: ${report.generatedAt.toLocaleString()}</p>
        <p>Time Range: ${report.timeRange}</p>
        <p>Total Logs: ${report.totalLogs}</p>
    </div>
    
    ${report.stats ? this.generateStatsHTML(report.stats) : ''}
    
    <h2>Log Entries</h2>
    <div class="logs">
        ${report.logs.map(log => `
            <div class="log-entry ${log.level}">
                <strong>[${log.timestamp.toLocaleString()}] [${log.component}] ${this.emojis[log.level]}</strong>
                <br>${log.message}
            </div>
        `).join('')}
    </div>
</body>
</html>`;
    }

    /**
     * إنشاء HTML للإحصائيات
     */
    generateStatsHTML(stats) {
        return `
    <div class="stats">
        <div class="stat-card">
            <h3>By Level</h3>
            ${Object.entries(stats.byLevel).map(([level, count]) => 
                `<div>${this.emojis[level]} ${level}: ${count}</div>`
            ).join('')}
        </div>
        <div class="stat-card">
            <h3>By Component</h3>
            ${Object.entries(stats.byComponent).map(([component, count]) => 
                `<div>${component}: ${count}</div>`
            ).join('')}
        </div>
    </div>`;
    }

    /**
     * توليد معرف السجل
     */
    generateLogId() {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    /**
     * إنشاء مثيل فرعي للمكون
     */
    createChild(childComponent) {
        return new Logger(`${this.component}:${childComponent}`);
    }
}

// إنشاء مثيل افتراضي
export const logger = new Logger('Global');
export default Logger;