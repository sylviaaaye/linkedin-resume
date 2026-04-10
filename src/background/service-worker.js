/**
 * Main Service Worker
 * 主服务工作者 - 集成所有后台功能
 */

// 导入模块
importScripts(
    './safe-resume-optimizer.js',
    './data-manager.js'
);

class AIPMJobAssistant {
    constructor() {
        this.modules = {
            dataManager: null,
            resumeOptimizer: null
        };
        
        this.settings = {
            apiKey: null,
            monitoringEnabled: true,
            autoOptimize: true,
            sponsorFilter: true,
            experienceFilter: true
        };
        
        this.stats = {
            jobsDetected: 0,
            jobsOptimized: 0,
            applicationsSubmitted: 0,
            lastUpdated: null
        };
        
        this.init();
    }
    
    async init() {
        console.log('🚀 AI PM求职助手服务启动...');
        
        try {
            // 初始化数据管理器
            this.modules.dataManager = new DataManager();
            await this.modules.dataManager.init();
            
            // 加载设置
            await this.loadSettings();
            
            // 初始化简历优化器
            this.modules.resumeOptimizer = new SafeResumeOptimizer(this.settings.apiKey);
            
            // 设置消息监听
            this.setupMessageListeners();
            
            // 启动定期任务
            this.startPeriodicTasks();
            
            console.log('✅ AI PM求职助手服务初始化完成');
            
        } catch (error) {
            console.error('❌ 服务初始化失败:', error);
        }
    }
    
    async loadSettings() {
        try {
            const savedSettings = await this.modules.dataManager.getAllSettings();
            
            // 合并设置
            this.settings = {
                ...this.settings,
                ...savedSettings
            };
            
            console.log('⚙️ 设置加载完成');
            
        } catch (error) {
            console.warn('设置加载失败，使用默认设置:', error);
        }
    }
    
    async saveSettings(newSettings) {
        try {
            // 更新内存中的设置
            this.settings = {
                ...this.settings,
                ...newSettings
            };
            
            // 保存到数据库
            for (const [key, value] of Object.entries(newSettings)) {
                await this.modules.dataManager.saveSetting(key, value);
            }
            
            // 如果API密钥更新，重新初始化优化器
            if (newSettings.apiKey !== undefined) {
                this.modules.resumeOptimizer = new SafeResumeOptimizer(newSettings.apiKey);
            }
            
            console.log('⚙️ 设置保存成功');
            return true;
            
        } catch (error) {
            console.error('设置保存失败:', error);
            return false;
        }
    }
    
    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            // 异步处理消息
            this.handleMessage(request, sender)
                .then(response => sendResponse(response))
                .catch(error => sendResponse({ error: error.message }));
            
            return true; // 保持消息通道开放
        });
        
        console.log('📡 消息监听器已设置');
    }
    
    async handleMessage(request, sender) {
        console.log('📨 收到消息:', request.action);
        
        switch (request.action) {
            // 设置相关
            case 'getSettings':
                return { success: true, settings: this.settings };
                
            case 'updateSettings':
                const success = await this.saveSettings(request.settings);
                return { success };
                
            // 职位相关
            case 'saveJob':
                return await this.handleSaveJob(request.jobData);

            case 'getJobs':
                return await this.handleGetJobs(request.filter, request.sortBy, request.limit);

            case 'getJobStats':
                return await this.handleGetJobStats();

            case 'updateJobStatus':
                return await this.handleUpdateJobStatus(request.jobId, request.status);

            case 'scanJobs':
                return await this.handleScanJobs();

            // Content script → Background
            case 'newJobFound':
                return await this.handleSaveJob(request.jobData);
                
            // 简历相关
            case 'optimizeResume':
                return await this.handleOptimizeResume(
                    request.resume,
                    request.jobDescription,
                    request.preferences
                );

            case 'saveResume': {
                const resumeData = request.resumeData || {
                    content: request.resume,
                    version: request.version,
                    isOriginal: request.isOriginal
                };
                return await this.handleSaveResume(resumeData);
            }

            case 'getResumes':
                return await this.handleGetResumes(request.filter, request.limit);

            case 'getResume':
                return await this.handleGetResume(request.id);

            case 'deleteResume':
                return await this.handleDeleteResume(request.id);

            // 申请相关
            case 'saveApplication': {
                const applicationData = request.applicationData || {
                    jobId: request.jobId,
                    status: request.status,
                    appliedAt: request.appliedAt,
                    notes: request.notes
                };
                return await this.handleSaveApplication(applicationData);
            }
                
            case 'getApplications':
                return await this.handleGetApplications(request.filter, request.limit);
                
            case 'getApplicationStats':
                return await this.handleGetApplicationStats();
                
            // 公司相关
            case 'saveCompany':
                return await this.handleSaveCompany(request.companyData);
                
            case 'getCompany':
                return await this.handleGetCompany(request.companyName);
                
            // 数据管理
            case 'exportData':
                return await this.handleExportData();
                
            case 'importData':
                return await this.handleImportData(request.data);
                
            case 'getDatabaseStats':
                return await this.handleGetDatabaseStats();
                
            case 'cleanupData':
                return await this.handleCleanupData(request.daysToKeep);
                
            // 系统状态
            case 'getSystemStatus':
                return await this.handleGetSystemStatus();
                
            case 'resetSystem':
                return await this.handleResetSystem();
                
            default:
                throw new Error(`未知操作: ${request.action}`);
        }
    }
    
    // ==================== 职位处理 ====================
    
    async handleSaveJob(jobData) {
        try {
            // 验证职位数据
            if (!jobData.id || !jobData.title || !jobData.company) {
                throw new Error('职位数据不完整');
            }
            
            // 应用用户设置过滤
            if (this.settings.sponsorFilter && jobData.analysis?.sponsorStatus === 'unlikely') {
                console.log(`⏭️ 跳过不Sponsor的职位: ${jobData.title}`);
                return { skipped: true, reason: 'sponsor_filter' };
            }
            
            if (this.settings.experienceFilter && jobData.analysis?.experienceLevel === 'senior') {
                console.log(`⏭️ 跳过高级职位: ${jobData.title}`);
                return { skipped: true, reason: 'experience_filter' };
            }
            
            // 保存到数据库
            const savedJob = await this.modules.dataManager.saveJob(jobData);
            
            // 更新统计
            this.stats.jobsDetected++;
            this.stats.lastUpdated = new Date().toISOString();
            
            // 发送通知（如果评分高）
            if (savedJob.score >= 70) {
                this.sendJobNotification(savedJob);
            }
            
            return { success: true, job: savedJob };
            
        } catch (error) {
            console.error('保存职位失败:', error);
            return { success: false, error: error.message };
        }
    }
    
    async handleGetJobs(filter = {}, sortBy = 'score', limit = 50) {
        try {
            const jobs = await this.modules.dataManager.getJobs(filter, sortBy, limit);
            return { success: true, jobs, count: jobs.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async handleGetJobStats() {
        try {
            const stats = await this.modules.dataManager.getJobStatistics();
            return { success: true, stats };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async handleUpdateJobStatus(jobId, status) {
        try {
            const updatedJob = await this.modules.dataManager.updateJobStatus(jobId, status);
            return { success: true, job: updatedJob };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // ==================== 简历处理 ====================
    
    async handleOptimizeResume(resume, jobDescription, preferences = {}) {
        try {
            // 检查是否启用自动优化
            if (!this.settings.autoOptimize) {
                return { 
                    success: false, 
                    error: '自动优化已禁用',
                    fallback: resume 
                };
            }
            
            // 检查API密钥
            if (!this.settings.apiKey) {
                return { 
                    success: false, 
                    error: '未设置Claude API密钥',
                    fallback: resume,
                    suggestion: '请在设置中配置API密钥'
                };
            }
            
            console.log('🔍 开始简历优化...');
            
            // 调用优化器
            const result = await this.modules.resumeOptimizer.optimizeForJob(
                resume, 
                jobDescription, 
                preferences
            );
            
            if (result.success) {
                // 保存优化后的简历
                const dateStr = new Date().toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                const versionLabel = jobDescription?.trim()
                    ? `优化版本 ${dateStr}（针对 JD）`
                    : `优化版本 ${dateStr}`;
                const resumeData = {
                    content: result.optimizedResume,
                    version: versionLabel,
                    isOriginal: false,
                    metadata: {
                        optimizedFor: jobDescription?.substring(0, 100) || '',
                        changes: result.changes.length,
                        summary: result.summary || ''
                    }
                };
                
                await this.modules.dataManager.saveResume(resumeData);
                
                // 更新统计
                this.stats.jobsOptimized++;
                
                console.log('✅ 简历优化完成');
            }
            
            return result;
            
        } catch (error) {
            console.error('简历优化失败:', error);
            return { 
                success: false, 
                error: error.message,
                fallback: resume 
            };
        }
    }
    
    async handleSaveResume(resumeData) {
        try {
            const savedResume = await this.modules.dataManager.saveResume(resumeData);
            return { success: true, resume: savedResume };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async handleGetResumes(filter = {}, limit = 20) {
        try {
            const resumes = await this.modules.dataManager.getResumes(filter, 'createdAt', limit);
            return { success: true, resumes, count: resumes.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async handleGetResume(id) {
        try {
            const resume = await this.modules.dataManager.getResume(id);
            return { success: true, resume };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async handleDeleteResume(id) {
        try {
            await this.modules.dataManager.deleteResume(id);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async handleScanJobs() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const linkedInTab = tabs.find(tab => tab.url?.includes('linkedin.com/jobs'));
            if (!linkedInTab) {
                return { success: false, error: '请先打开LinkedIn职位页面' };
            }
            await chrome.tabs.sendMessage(linkedInTab.id, { action: 'scanJobs' });
            return { success: true, message: '扫描请求已发送' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ==================== 申请处理 ====================
    
    async handleSaveApplication(applicationData) {
        try {
            const savedApp = await this.modules.dataManager.saveApplication(applicationData);
            
            // 更新统计
            this.stats.applicationsSubmitted++;
            
            return { success: true, application: savedApp };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async handleGetApplications(filter = {}, limit = 50) {
        try {
            const applications = await this.modules.dataManager.getApplications(filter, 'appliedAt', limit);
            return { success: true, applications, count: applications.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async handleGetApplicationStats() {
        try {
            const stats = await this.modules.dataManager.getApplicationStats();
            return { success: true, stats };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // ==================== 公司处理 ====================
    
    async handleSaveCompany(companyData) {
        try {
            const savedCompany = await this.modules.dataManager.saveCompany(companyData);
            return { success: true, company: savedCompany };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async handleGetCompany(companyName) {
        try {
            const company = await this.modules.dataManager.getCompany(companyName);
            return { success: true, company };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // ==================== 数据管理 ====================
    
    async handleExportData() {
        try {
            const data = await this.modules.dataManager.exportData();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async handleImportData(data) {
        try {
            const success = await this.modules.dataManager.importData(data);
            return { success };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async handleGetDatabaseStats() {
        try {
            const stats = await this.modules.dataManager.getDatabaseStats();
            return { success: true, stats };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async handleCleanupData(daysToKeep = 30) {
        try {
            const deletedCount = await this.modules.dataManager.cleanupOldData(daysToKeep);
            return { success: true, deletedCount };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // ==================== 系统状态 ====================
    
    async handleGetSystemStatus() {
        try {
            const dbStats = await this.modules.dataManager.getDatabaseStats();
            
            const status = {
                version: '1.0.0',
                initialized: true,
                settings: this.settings,
                stats: this.stats,
                database: dbStats,
                timestamp: new Date().toISOString(),
                uptime: this.getUptime()
            };
            
            return { success: true, status };
        } catch (error) {
            return { 
                success: false, 
                error: error.message,
                status: {
                    initialized: false,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }
    
    async handleResetSystem() {
        try {
            await this.modules.dataManager.clearAllData();
            
            // 重置统计
            this.stats = {
                jobsDetected: 0,
                jobsOptimized: 0,
                applicationsSubmitted: 0,
                lastUpdated: null
            };
            
            // 重置设置（保留API密钥）
            const apiKey = this.settings.apiKey;
            this.settings = {
                apiKey: apiKey,
                monitoringEnabled: true,
                autoOptimize: true,
                sponsorFilter: true,
                experienceFilter: true
            };
            
            console.log('🔄 系统已重置');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // ==================== 工具方法 ====================
    
    sendJobNotification(job) {
        // 创建浏览器通知
        if ('Notification' in self && Notification.permission === 'granted') {
            const notification = new Notification('🎯 发现高匹配AI PM职位', {
                body: `${job.title}\n${job.company} - 评分: ${job.score}/100`,
                icon: 'icons/icon128.png',
                tag: `job_${job.id}`,
                requireInteraction: true
            });
            
            notification.onclick = () => {
                if (job.url) {
                    chrome.tabs.create({ url: job.url });
                }
                notification.close();
            };
            
            // 7秒后自动关闭
            setTimeout(() => notification.close(), 7000);
        }
    }
    
    getUptime() {
        if (!this.startTime) {
            this.startTime = Date.now();
        }
        
        const uptimeMs = Date.now() - this.startTime;
        const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
        const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}小时 ${minutes}分钟`;
    }
    
    startPeriodicTasks() {
        // 使用 chrome.alarms 替代 setInterval（MV3 service worker 中 setInterval 不可靠）
        chrome.alarms.create('cleanupData', { periodInMinutes: 60 });
        chrome.alarms.create('backupData', { periodInMinutes: 30 });

        chrome.alarms.onAlarm.addListener(async (alarm) => {
            if (alarm.name === 'cleanupData') {
                try {
                    await this.modules.dataManager.cleanupOldData(30);
                    console.log('🔄 定期数据清理完成');
                } catch (error) {
                    console.error('定期数据清理失败:', error);
                }
            } else if (alarm.name === 'backupData') {
                try {
                    await this.modules.dataManager.backupToLocalStorage();
                } catch (error) {
                    console.error('定期备份失败:', error);
                }
            }
        });

        console.log('⏰ 定期任务已启动');
    }
}

// 服务启动
let assistant;

chrome.runtime.onInstalled.addListener(() => {
    console.log('🔧 扩展安装/更新');
    
    // 创建默认设置
    chrome.storage.local.set({
        'aiPmAssistant_installed': true,
        'installTime': new Date().toISOString()
    });
});

chrome.runtime.onStartup.addListener(() => {
    console.log('🔄 浏览器启动，初始化服务...');
    assistant = new AIPMJobAssistant();
});

// 立即初始化
assistant = new AIPMJobAssistant();

// 导出到全局（用于调试）
self.AIPMJobAssistant = AIPMJobAssistant;
self.assistant = assistant;

console.log('🎉 AI PM求职助手服务已启动');