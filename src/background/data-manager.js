/**
 * Data Manager
 * 数据存储和管理模块
 * 使用IndexedDB进行本地数据存储
 */

class DataManager {
    constructor() {
        this.dbName = 'aiPmJobAssistantDB';
        this.dbVersion = 1;
        this.db = null;
        
        // 数据库模式
        this.schema = {
            jobs: {
                key: 'id',
                indexes: [
                    'score',          // 评分索引
                    'postedAt',       // 发布时间索引
                    'company',        // 公司索引
                    'sponsorStatus',  // Sponsor状态索引
                    'experienceLevel', // 经验级别索引
                    'companyType',    // 公司类型索引
                    'status'          // 状态索引（new, viewed, applied, rejected）
                ]
            },
            resumes: {
                key: 'id',
                indexes: [
                    'createdAt',      // 创建时间
                    'jobId',          // 关联职位
                    'version',        // 版本号
                    'isOriginal'      // 是否为原始简历
                ]
            },
            applications: {
                key: 'id',
                indexes: [
                    'jobId',          // 职位ID
                    'status',         // 申请状态
                    'appliedAt',      // 申请时间
                    'company'         // 公司名称
                ]
            },
            companies: {
                key: 'name',
                indexes: [
                    'sponsorHistory', // Sponsor历史
                    'industry',       // 行业分类
                    'size',           // 公司规模
                    'lastUpdated'     // 最后更新时间
                ]
            },
            settings: {
                key: 'key',
                indexes: []
            }
        };
        
        // 注意：不在构造函数中调用 this.init()，避免与外部调用产生双重初始化竞争
        // 由 AIPMJobAssistant.init() 统一调用
    }
    
    async init() {
        try {
            await this.openDatabase();
            console.log('✅ 数据管理器初始化完成');
        } catch (error) {
            console.error('❌ 数据管理器初始化失败:', error);
            throw error;
        }
    }
    
    async openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = (event) => {
                console.error('IndexedDB打开失败:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('📊 IndexedDB连接成功');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createStores(db);
                console.log('🔄 IndexedDB结构升级完成');
            };
        });
    }
    
    createStores(db) {
        // 删除旧的存储（如果存在）
        if (db.objectStoreNames.contains('jobs')) {
            db.deleteObjectStore('jobs');
        }
        if (db.objectStoreNames.contains('resumes')) {
            db.deleteObjectStore('resumes');
        }
        if (db.objectStoreNames.contains('applications')) {
            db.deleteObjectStore('applications');
        }
        if (db.objectStoreNames.contains('companies')) {
            db.deleteObjectStore('companies');
        }
        if (db.objectStoreNames.contains('settings')) {
            db.deleteObjectStore('settings');
        }
        
        // 创建新的存储
        const jobsStore = db.createObjectStore('jobs', { keyPath: 'id' });
        const resumesStore = db.createObjectStore('resumes', { keyPath: 'id' });
        const applicationsStore = db.createObjectStore('applications', { keyPath: 'id' });
        const companiesStore = db.createObjectStore('companies', { keyPath: 'name' });
        const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
        
        // 创建索引
        this.createIndexes(jobsStore, this.schema.jobs.indexes);
        this.createIndexes(resumesStore, this.schema.resumes.indexes);
        this.createIndexes(applicationsStore, this.schema.applications.indexes);
        this.createIndexes(companiesStore, this.schema.companies.indexes);
    }
    
    createIndexes(store, indexes) {
        indexes.forEach(index => {
            store.createIndex(index, index, { unique: false });
        });
    }
    
    // ==================== 职位数据操作 ====================
    
    async saveJob(jobData) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            
            const transaction = this.db.transaction(['jobs'], 'readwrite');
            const store = transaction.objectStore('jobs');
            
            // 添加默认字段
            const jobWithDefaults = {
                ...jobData,
                savedAt: new Date().toISOString(),
                status: jobData.status || 'new',
                viewed: jobData.viewed || false,
                applied: jobData.applied || false
            };
            
            const request = store.put(jobWithDefaults);
            
            request.onsuccess = () => {
                console.log('💾 职位数据保存成功:', jobData.id);
                resolve(jobWithDefaults);
            };
            
            request.onerror = (event) => {
                console.error('保存职位数据失败:', event.target.error);
                reject(event.target.error);
            };
        });
    }
    
    async getJob(jobId) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            
            const transaction = this.db.transaction(['jobs'], 'readonly');
            const store = transaction.objectStore('jobs');
            const request = store.get(jobId);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
    
    async getJobs(filter = {}, sortBy = 'score', limit = 100) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            
            const transaction = this.db.transaction(['jobs'], 'readonly');
            const store = transaction.objectStore('jobs');
            const index = store.index(sortBy);
            
            let request;
            if (Object.keys(filter).length === 0) {
                request = index.openCursor(null, 'prev'); // 降序
            } else {
                // 简单的过滤逻辑
                request = index.openCursor();
            }
            
            const results = [];
            let count = 0;
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                
                if (cursor && count < limit) {
                    const job = cursor.value;
                    
                    // 应用过滤条件
                    let include = true;
                    for (const key in filter) {
                        if (job[key] !== filter[key]) {
                            include = false;
                            break;
                        }
                    }
                    
                    if (include) {
                        results.push(job);
                        count++;
                    }
                    
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
    
    async getTopJobs(limit = 20) {
        return this.getJobs({}, 'score', limit);
    }
    
    async getNewJobs(limit = 50) {
        return this.getJobs({ status: 'new' }, 'postedAt', limit);
    }
    
    async updateJobStatus(jobId, status) {
        return new Promise(async (resolve, reject) => {
            try {
                const job = await this.getJob(jobId);
                if (!job) {
                    reject(new Error('职位不存在'));
                    return;
                }
                
                job.status = status;
                job.updatedAt = new Date().toISOString();
                
                if (status === 'viewed') {
                    job.viewed = true;
                    job.viewedAt = new Date().toISOString();
                } else if (status === 'applied') {
                    job.applied = true;
                    job.appliedAt = new Date().toISOString();
                }
                
                await this.saveJob(job);
                resolve(job);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    async deleteJob(jobId) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            
            const transaction = this.db.transaction(['jobs'], 'readwrite');
            const store = transaction.objectStore('jobs');
            const request = store.delete(jobId);
            
            request.onsuccess = () => {
                console.log('🗑️ 职位数据删除成功:', jobId);
                resolve(true);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
    
    async getJobStatistics() {
        const jobs = await this.getJobs({}, 'score', 1000); // 获取最多1000个职位
        
        const stats = {
            total: jobs.length,
            byStatus: {
                new: jobs.filter(j => j.status === 'new').length,
                viewed: jobs.filter(j => j.status === 'viewed').length,
                applied: jobs.filter(j => j.status === 'applied').length,
                rejected: jobs.filter(j => j.status === 'rejected').length
            },
            bySponsor: {
                confirmed: jobs.filter(j => j.analysis?.sponsorStatus === 'confirmed').length,
                likely: jobs.filter(j => j.analysis?.sponsorStatus === 'likely').length,
                unknown: jobs.filter(j => !j.analysis?.sponsorStatus || j.analysis.sponsorStatus === 'unknown').length,
                unlikely: jobs.filter(j => j.analysis?.sponsorStatus === 'unlikely').length
            },
            byExperience: {
                entry: jobs.filter(j => j.analysis?.experienceLevel === 'entry').length,
                mid: jobs.filter(j => j.analysis?.experienceLevel === 'mid').length,
                senior: jobs.filter(j => j.analysis?.experienceLevel === 'senior').length,
                unknown: jobs.filter(j => !j.analysis?.experienceLevel || j.analysis.experienceLevel === 'unknown').length
            },
            byCompany: {
                ai_company: jobs.filter(j => j.analysis?.companyType === 'ai_company').length,
                big_tech: jobs.filter(j => j.analysis?.companyType === 'big_tech').length,
                other: jobs.filter(j => !j.analysis?.companyType || j.analysis.companyType === 'other').length
            },
            scoreDistribution: {
                excellent: jobs.filter(j => j.score >= 80).length,
                good: jobs.filter(j => j.score >= 60 && j.score < 80).length,
                fair: jobs.filter(j => j.score >= 40 && j.score < 60).length,
                poor: jobs.filter(j => j.score < 40).length
            },
            recentActivity: {
                last24h: jobs.filter(j => {
                    const postedTime = new Date(j.postedTime || j.savedAt);
                    const now = new Date();
                    return (now - postedTime) < 24 * 60 * 60 * 1000;
                }).length,
                last7d: jobs.filter(j => {
                    const postedTime = new Date(j.postedTime || j.savedAt);
                    const now = new Date();
                    return (now - postedTime) < 7 * 24 * 60 * 60 * 1000;
                }).length
            }
        };
        
        // 计算平均分
        if (jobs.length > 0) {
            const totalScore = jobs.reduce((sum, job) => sum + (job.score || 0), 0);
            stats.averageScore = Math.round(totalScore / jobs.length);
        } else {
            stats.averageScore = 0;
        }
        
        return stats;
    }
    
    // ==================== 简历数据操作 ====================
    
    async saveResume(resumeData) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            
            const transaction = this.db.transaction(['resumes'], 'readwrite');
            const store = transaction.objectStore('resumes');
            
            // 生成唯一ID
            const resumeId = resumeData.id || `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const resumeWithDefaults = {
                ...resumeData,
                id: resumeId,
                createdAt: new Date().toISOString(),
                version: resumeData.version || 1,
                isOriginal: resumeData.isOriginal || false
            };
            
            const request = store.put(resumeWithDefaults);
            
            request.onsuccess = () => {
                console.log('💾 简历数据保存成功:', resumeId);
                resolve(resumeWithDefaults);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
    
    async getResume(resumeId) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            
            const transaction = this.db.transaction(['resumes'], 'readonly');
            const store = transaction.objectStore('resumes');
            const request = store.get(resumeId);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
    
    async getOriginalResume() {
        const resumes = await this.getResumes({ isOriginal: true }, 'createdAt', 1);
        return resumes.length > 0 ? resumes[0] : null;
    }
    
    async getResumes(filter = {}, sortBy = 'createdAt', limit = 50) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            
            const transaction = this.db.transaction(['resumes'], 'readonly');
            const store = transaction.objectStore('resumes');
            const index = store.index(sortBy);
            
            const request = index.openCursor(null, 'prev'); // 降序
            const results = [];
            let count = 0;
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                
                if (cursor && count < limit) {
                    const resume = cursor.value;
                    
                    // 应用过滤条件
                    let include = true;
                    for (const key in filter) {
                        if (resume[key] !== filter[key]) {
                            include = false;
                            break;
                        }
                    }
                    
                    if (include) {
                        results.push(resume);
                        count++;
                    }
                    
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
    
    async deleteResume(resumeId) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }

            const transaction = this.db.transaction(['resumes'], 'readwrite');
            const store = transaction.objectStore('resumes');
            const request = store.delete(resumeId);

            request.onsuccess = () => {
                console.log('🗑️ 简历数据删除成功:', resumeId);
                resolve(true);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async getResumeVersions(jobId = null) {
        const filter = jobId ? { jobId } : {};
        return this.getResumes(filter, 'createdAt', 100);
    }
    
    async createResumeVersion(originalResumeId, optimizedResume, jobId, changes) {
        const original = await this.getResume(originalResumeId);
        if (!original) {
            throw new Error('原始简历不存在');
        }
        
        const versionData = {
            content: optimizedResume,
            originalId: originalResumeId,
            jobId: jobId,
            changes: changes,
            version: (original.version || 1) + 1,
            parentVersion: original.version || 1,
            isOriginal: false,
            metadata: {
                optimizedAt: new Date().toISOString(),
                changeCount: changes?.length || 0
            }
        };
        
        return this.saveResume(versionData);
    }
    
    // ==================== 申请数据操作 ====================
    
    async saveApplication(applicationData) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            
            const transaction = this.db.transaction(['applications'], 'readwrite');
            const store = transaction.objectStore('applications');
            
            // 生成唯一ID
            const appId = applicationData.id || `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const appWithDefaults = {
                ...applicationData,
                id: appId,
                appliedAt: applicationData.appliedAt || new Date().toISOString(),
                status: applicationData.status || 'applied',
                resumeVersion: applicationData.resumeVersion || 1
            };
            
            const request = store.put(appWithDefaults);
            
            request.onsuccess = () => {
                console.log('💾 申请记录保存成功:', appId);
                
                // 同时更新职位状态
                if (appWithDefaults.jobId) {
                    this.updateJobStatus(appWithDefaults.jobId, 'applied').catch(console.error);
                }
                
                resolve(appWithDefaults);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
    
    async getApplications(filter = {}, sortBy = 'appliedAt', limit = 100) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            
            const transaction = this.db.transaction(['applications'], 'readonly');
            const store = transaction.objectStore('applications');
            const index = store.index(sortBy);
            
            const request = index.openCursor(null, 'prev'); // 降序
            const results = [];
            let count = 0;
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                
                if (cursor && count < limit) {
                    const app = cursor.value;
                    
                    // 应用过滤条件
                    let include = true;
                    for (const key in filter) {
                        if (app[key] !== filter[key]) {
                            include = false;
                            break;
                        }
                    }
                    
                    if (include) {
                        results.push(app);
                        count++;
                    }
                    
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
    
    async getApplicationStats() {
        const applications = await this.getApplications({}, 'appliedAt', 1000);
        
        const stats = {
            total: applications.length,
            byStatus: {
                applied: applications.filter(a => a.status === 'applied').length,
                interview: applications.filter(a => a.status === 'interview').length,
                offer: applications.filter(a => a.status === 'offer').length,
                rejected: applications.filter(a => a.status === 'rejected').length
            },
            byMonth: {},
            successRate: 0
        };
        
        // 按月份统计
        applications.forEach(app => {
            const date = new Date(app.appliedAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + 1;
        });
        
        // 计算成功率（面试邀请率）
        const interviewCount = applications.filter(a => a.status === 'interview' || a.status === 'offer').length;
        if (applications.length > 0) {
            stats.successRate = Math.round((interviewCount / applications.length) * 100);
        }
        
        return stats;
    }
    
    async updateApplicationStatus(appId, status, notes = '') {
        return new Promise(async (resolve, reject) => {
            try {
                const transaction = this.db.transaction(['applications'], 'readwrite');
                const store = transaction.objectStore('applications');
                const request = store.get(appId);
                
                request.onsuccess = () => {
                    const app = request.result;
                    if (!app) {
                        reject(new Error('申请记录不存在'));
                        return;
                    }
                    
                    app.status = status;
                    app.updatedAt = new Date().toISOString();
                    
                    if (notes) {
                        app.notes = app.notes ? `${app.notes}\n${notes}` : notes;
                    }
                    
                    if (status === 'interview') {
                        app.interviewAt = app.interviewAt || new Date().toISOString();
                    } else if (status === 'offer') {
                        app.offerAt = app.offerAt || new Date().toISOString();
                    } else if (status === 'rejected') {
                        app.rejectedAt = app.rejectedAt || new Date().toISOString();
                    }
                    
                    const updateRequest = store.put(app);
                    
                    updateRequest.onsuccess = () => {
                        resolve(app);
                    };
                    
                    updateRequest.onerror = (event) => {
                        reject(event.target.error);
                    };
                };
                
                request.onerror = (event) => {
                    reject(event.target.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // ==================== 公司数据操作 ====================
    
    async saveCompany(companyData) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            
            const transaction = this.db.transaction(['companies'], 'readwrite');
            const store = transaction.objectStore('companies');
            
            const companyWithDefaults = {
                ...companyData,
                lastUpdated: new Date().toISOString(),
                jobCount: companyData.jobCount || 0,
                sponsorScore: companyData.sponsorScore || 0
            };
            
            const request = store.put(companyWithDefaults);
            
            request.onsuccess = () => {
                console.log('💾 公司数据保存成功:', companyData.name);
                resolve(companyWithDefaults);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
    
    async getCompany(companyName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            
            const transaction = this.db.transaction(['companies'], 'readonly');
            const store = transaction.objectStore('companies');
            const request = store.get(companyName);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
    
    async updateCompanySponsorInfo(companyName, sponsorData) {
        return new Promise(async (resolve, reject) => {
            try {
                let company = await this.getCompany(companyName);
                
                if (!company) {
                    company = {
                        name: companyName,
                        sponsorHistory: [],
                        industry: 'unknown',
                        size: 'unknown'
                    };
                }
                
                // 更新Sponsor历史
                if (!company.sponsorHistory) {
                    company.sponsorHistory = [];
                }
                
                company.sponsorHistory.push({
                    ...sponsorData,
                    recordedAt: new Date().toISOString()
                });
                
                // 保留最近100条记录
                if (company.sponsorHistory.length > 100) {
                    company.sponsorHistory = company.sponsorHistory.slice(-100);
                }
                
                // 计算Sponsor分数
                const recentHistory = company.sponsorHistory.slice(-20); // 最近20条记录
                const sponsorCount = recentHistory.filter(h => h.sponsors === true).length;
                company.sponsorScore = recentHistory.length > 0 ? 
                    Math.round((sponsorCount / recentHistory.length) * 100) : 0;
                
                await this.saveCompany(company);
                resolve(company);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    async getSponsorFriendlyCompanies(limit = 50) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            
            const transaction = this.db.transaction(['companies'], 'readonly');
            const store = transaction.objectStore('companies');
            const index = store.index('sponsorHistory');
            
            const request = index.openCursor(null, 'prev');
            const results = [];
            let count = 0;
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                
                if (cursor && count < limit) {
                    const company = cursor.value;
                    
                    // 只返回有Sponsor历史的公司
                    if (company.sponsorHistory && company.sponsorHistory.length > 0) {
                        results.push(company);
                        count++;
                    }
                    
                    cursor.continue();
                } else {
                    // 按Sponsor分数排序
                    results.sort((a, b) => (b.sponsorScore || 0) - (a.sponsorScore || 0));
                    resolve(results);
                }
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
    
    // ==================== 设置数据操作 ====================
    
    async saveSetting(key, value) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            
            const setting = {
                key: key,
                value: value,
                updatedAt: new Date().toISOString()
            };
            
            const request = store.put(setting);
            
            request.onsuccess = () => {
                resolve(setting);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
    
    async getSetting(key, defaultValue = null) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.get(key);
            
            request.onsuccess = () => {
                resolve(request.result ? request.result.value : defaultValue);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
    
    async getAllSettings() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const settings = {};
                request.result.forEach(setting => {
                    settings[setting.key] = setting.value;
                });
                resolve(settings);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
    
    // ==================== 数据导出和导入 ====================
    
    async exportData() {
        const data = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            jobs: await this.getJobs({}, 'savedAt', 1000),
            resumes: await this.getResumes({}, 'createdAt', 100),
            applications: await this.getApplications({}, 'appliedAt', 500),
            companies: await this.getAllCompanies(),
            settings: await this.getAllSettings()
        };
        
        return data;
    }
    
    async getAllCompanies() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            
            const transaction = this.db.transaction(['companies'], 'readonly');
            const store = transaction.objectStore('companies');
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
    
    async importData(data) {
        // 验证数据格式
        if (!data.version || !data.exportedAt) {
            throw new Error('无效的数据格式');
        }
        
        console.log('📥 开始导入数据...');
        
        // 导入公司数据
        if (data.companies && Array.isArray(data.companies)) {
            for (const company of data.companies) {
                await this.saveCompany(company).catch(console.error);
            }
            console.log(`✅ 导入 ${data.companies.length} 个公司记录`);
        }
        
        // 导入职位数据
        if (data.jobs && Array.isArray(data.jobs)) {
            for (const job of data.jobs) {
                await this.saveJob(job).catch(console.error);
            }
            console.log(`✅ 导入 ${data.jobs.length} 个职位记录`);
        }
        
        // 导入简历数据
        if (data.resumes && Array.isArray(data.resumes)) {
            for (const resume of data.resumes) {
                await this.saveResume(resume).catch(console.error);
            }
            console.log(`✅ 导入 ${data.resumes.length} 个简历记录`);
        }
        
        // 导入申请数据
        if (data.applications && Array.isArray(data.applications)) {
            for (const app of data.applications) {
                await this.saveApplication(app).catch(console.error);
            }
            console.log(`✅ 导入 ${data.applications.length} 个申请记录`);
        }
        
        // 导入设置
        if (data.settings && typeof data.settings === 'object') {
            for (const [key, value] of Object.entries(data.settings)) {
                await this.saveSetting(key, value).catch(console.error);
            }
            console.log(`✅ 导入 ${Object.keys(data.settings).length} 个设置项`);
        }
        
        console.log('🎉 数据导入完成');
        return true;
    }
    
    // ==================== 数据清理和维护 ====================
    
    async cleanupOldData(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        
        console.log(`🧹 清理 ${daysToKeep} 天前的数据...`);
        
        let deletedCount = 0;
        
        // 清理旧职位
        const oldJobs = await this.getJobs({}, 'postedAt', 1000);
        for (const job of oldJobs) {
            const jobDate = new Date(job.postedTime || job.savedAt);
            if (jobDate < cutoffDate && job.status !== 'applied') {
                await this.deleteJob(job.id).catch(console.error);
                deletedCount++;
            }
        }
        
        console.log(`✅ 清理完成，删除了 ${deletedCount} 条旧记录`);
        return deletedCount;
    }
    
    async getDatabaseStats() {
        const stats = {
            jobs: await this.getJobStatistics(),
            applications: await this.getApplicationStats(),
            companies: await this.getCompanyCount(),
            resumes: await this.getResumeCount(),
            totalSize: await this.estimateDatabaseSize()
        };
        
        return stats;
    }
    
    async getCompanyCount() {
        const companies = await this.getAllCompanies();
        return companies.length;
    }
    
    async getResumeCount() {
        const resumes = await this.getResumes({}, 'createdAt', 10000);
        return resumes.length;
    }
    
    async estimateDatabaseSize() {
        // 简单的数据库大小估算
        const data = await this.exportData();
        const jsonString = JSON.stringify(data);
        const sizeInBytes = new Blob([jsonString]).size;
        
        const sizeInMB = sizeInBytes / (1024 * 1024);
        return {
            bytes: sizeInBytes,
            megabytes: Math.round(sizeInMB * 100) / 100,
            readable: sizeInMB < 1 ? 
                `${Math.round(sizeInBytes / 1024)} KB` : 
                `${Math.round(sizeInMB * 100) / 100} MB`
        };
    }
    
    async clearAllData() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            
            const request = indexedDB.deleteDatabase(this.dbName);
            
            request.onsuccess = () => {
                console.log('🗑️ 所有数据已清除');
                this.db = null;
                resolve(true);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
            
            request.onblocked = () => {
                console.warn('数据库删除被阻止，请关闭所有标签页后重试');
                reject(new Error('数据库删除被阻止'));
            };
        });
    }
    
    // ==================== 工具方法 ====================
    
    generateId(prefix = 'item') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    formatDate(date) {
        return new Date(date).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    async backupToLocalStorage() {
        try {
            const data = await this.exportData();
            await chrome.storage.local.set({
                'aiPmAssistant_backup': JSON.stringify(data),
                'aiPmAssistant_backup_time': new Date().toISOString()
            });
            console.log('💾 数据已备份到chrome.storage.local');
            return true;
        } catch (error) {
            console.error('数据备份失败:', error);
            return false;
        }
    }

    async restoreFromLocalStorage() {
        try {
            const result = await chrome.storage.local.get('aiPmAssistant_backup');
            const backup = result['aiPmAssistant_backup'];
            if (!backup) {
                throw new Error('没有找到备份数据');
            }

            const data = JSON.parse(backup);
            await this.importData(data);
            console.log('🔄 数据已从chrome.storage.local恢复');
            return true;
        } catch (error) {
            console.error('数据恢复失败:', error);
            return false;
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}

// 浏览器环境下的全局导出
if (typeof window !== 'undefined') {
    window.DataManager = DataManager;
    
    // 自动初始化
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            window.dataManager = new DataManager();
            await window.dataManager.init();
            console.log('✅ 数据管理器已就绪');
        } catch (error) {
            console.error('数据管理器初始化失败:', error);
        }
    });
}