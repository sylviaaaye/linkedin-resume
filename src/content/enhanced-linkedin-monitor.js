/**
 * Enhanced LinkedIn Job Monitor
 * 增强版LinkedIn职位监控系统
 * 包含反爬虫策略、智能筛选、实时评分
 */

class EnhancedLinkedInMonitor {
    constructor() {
        // 反爬虫配置
        this.config = {
            scanDelay: 1000 + Math.random() * 4000, // 1-5秒随机延迟
            maxRequestsPerMinute: 10,
            simulateHumanBehavior: true,
            humanLikeScroll: true,
            randomMouseMovements: true
        };
        
        // 关键词配置 - AI Product Manager专项
        this.keywords = {
            // AI PM职位关键词
            aiPmTitles: [
                'ai product manager',
                'machine learning product manager', 
                'ml product manager',
                'artificial intelligence product manager',
                'ai technical product manager',
                'ai/apm', // Associate Product Manager
                'ai product'
            ],
            
            // Sponsor相关关键词
            sponsorPositive: [
                'sponsorship',
                'h1b',
                'visa sponsorship',
                'work authorization',
                'immigration support'
            ],
            
            sponsorNegative: [
                'no sponsorship',
                'does not sponsor',
                'not offering sponsorship',
                'no h1b',
                'us citizens only'
            ],
            
            // 经验要求关键词
            experienceLevels: {
                entry: ['entry level', '0-2 years', 'new grad', 'associate', 'junior'],
                mid: ['2-5 years', '3+ years', 'mid-level', 'experienced'],
                senior: ['5+ years', 'senior', 'lead', 'principal', 'director']
            },
            
            // AI公司关键词
            aiCompanies: [
                'openai', 'anthropic', 'cohere', 'hugging face', 'stability ai',
                'scale ai', 'labelbox', 'snorkel ai', 'weights & biases',
                'databricks', 'snowflake', 'nvidia'
            ],
            
            // 大厂关键词
            bigTech: [
                'google', 'meta', 'facebook', 'amazon', 'apple', 'microsoft',
                'netflix', 'tesla', 'salesforce', 'oracle', 'ibm', 'intel'
            ]
        };
        
        // 数据存储
        this.jobListings = new Map();
        this.detectedJobs = new Set();
        this.requestCount = 0;
        this.lastRequestTime = Date.now();
        
        // 初始化
        this.init();
    }
    
    async init() {
        console.log('🔍 AI PM求职助手 - LinkedIn监控启动');
        
        // 1. 设置反爬虫保护
        this.setupAntiDetection();
        
        // 2. 设置DOM变化监听
        await this.setupMutationObserver();
        
        // 3. 扫描当前页面
        await this.scanCurrentPage();
        
        // 4. 设置消息监听
        this.setupMessageListener();
        
        // 5. 模拟人类行为（可选）
        if (this.config.simulateHumanBehavior) {
            this.startHumanSimulation();
        }
    }
    
    setupAntiDetection() {
        // 请求频率限制器
        this.requestLimiter = {
            count: 0,
            lastReset: Date.now(),
            
            canMakeRequest() {
                const now = Date.now();
                if (now - this.lastReset > 60000) { // 每分钟重置
                    this.count = 0;
                    this.lastReset = now;
                }
                return this.count < 10; // 每分钟最多10次
            },
            
            recordRequest() {
                this.count++;
            }
        };
        
        // 随机延迟函数
        this.randomDelay = (min = 1000, max = 5000) => {
            return new Promise(resolve => {
                const delay = min + Math.random() * (max - min);
                setTimeout(resolve, delay);
            });
        };
    }
    
    async setupMutationObserver() {
        // 监听DOM变化，检测新职位
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    this.handleNewNodes(mutation.addedNodes);
                }
            });
        });
        
        // 观察整个文档，但限制深度以提高性能
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });
        
        console.log('✅ MutationObserver已启动');
    }
    
    async scanCurrentPage() {
        console.log('📊 开始扫描当前页面...');
        
        // 等待页面稳定
        await this.randomDelay(2000, 4000);
        
        // 查找所有职位卡片
        const jobCards = this.findJobCards();
        console.log(`找到 ${jobCards.length} 个职位卡片`);
        
        // 分批处理，避免一次性处理太多
        for (let i = 0; i < jobCards.length; i += 5) {
            const batch = jobCards.slice(i, i + 5);
            await this.processJobCards(batch);
            
            // 批次间延迟
            if (i + 5 < jobCards.length) {
                await this.randomDelay(1000, 3000);
            }
        }
        
        console.log('✅ 页面扫描完成');
    }
    
    findJobCards() {
        // LinkedIn职位卡片选择器（多种可能的选择器）
        const selectors = [
            '[data-job-id]',
            '.job-card-container',
            '.jobs-search-results__list-item',
            '[class*="job-card"]',
            '[class*="jobCard"]',
            'li[data-occludable-job-id]'
        ];
        
        let cards = [];
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                cards = [...cards, ...Array.from(elements)];
            }
        });
        
        // 去重（基于位置或ID）
        return this.deduplicateCards(cards);
    }
    
    deduplicateCards(cards) {
        const uniqueCards = [];
        const seenIds = new Set();
        
        cards.forEach(card => {
            const jobId = this.extractJobId(card);
            const position = this.getCardPosition(card);
            const key = jobId || position;
            
            if (!seenIds.has(key)) {
                seenIds.add(key);
                uniqueCards.push(card);
            }
        });
        
        return uniqueCards;
    }
    
    async processJobCards(cards) {
        for (const card of cards) {
            try {
                // 检查请求限制
                if (!this.requestLimiter.canMakeRequest()) {
                    console.log('⚠️ 达到请求限制，等待下一分钟');
                    await this.randomDelay(30000, 60000); // 等待30-60秒
                    this.requestLimiter.lastReset = Date.now();
                    this.requestLimiter.count = 0;
                }
                
                await this.analyzeJobCard(card);
                this.requestLimiter.recordRequest();
                
                // 卡片间延迟
                await this.randomDelay(500, 2000);
                
            } catch (error) {
                console.error('处理职位卡片失败:', error);
            }
        }
    }
    
    async analyzeJobCard(jobCard) {
        const jobId = this.extractJobId(jobCard);
        if (!jobId || this.detectedJobs.has(jobId)) {
            return;
        }
        
        // 标记为已处理
        this.detectedJobs.add(jobId);
        
        // 提取基础信息
        const jobData = {
            id: jobId,
            title: this.extractJobTitle(jobCard),
            company: this.extractCompany(jobCard),
            location: this.extractLocation(jobCard),
            postedTime: this.extractPostedTime(jobCard),
            url: this.extractJobUrl(jobCard),
            description: '',
            score: 0,
            analysis: {
                isAiPm: false,
                sponsorStatus: 'unknown', // unknown, likely, unlikely, confirmed
                experienceLevel: 'unknown', // entry, mid, senior
                companyType: 'unknown', // ai_company, big_tech, other
                filtersPassed: []
            }
        };
        
        // 应用智能筛选
        await this.applyIntelligentFilters(jobData, jobCard);
        
        // 计算综合评分
        jobData.score = this.calculateJobScore(jobData);
        
        // 存储职位数据
        this.jobListings.set(jobId, jobData);
        
        // 如果评分高，通知用户
        if (jobData.score >= 70) {
            this.highlightJobCard(jobCard, jobData);
            this.notifyNewJob(jobData);
        }
        
        console.log('📋 分析完成:', {
            title: jobData.title,
            company: jobData.company,
            score: jobData.score,
            filters: jobData.analysis.filtersPassed
        });
        
        return jobData;
    }
    
    async applyIntelligentFilters(jobData, jobCard) {
        const filters = [];
        
        // 1. AI PM职位筛选
        const isAiPm = this.isAiPmJob(jobData.title);
        jobData.analysis.isAiPm = isAiPm;
        if (isAiPm) filters.push('ai_pm');
        
        // 2. Sponsor状态检测
        const sponsorStatus = await this.checkSponsorStatus(jobData, jobCard);
        jobData.analysis.sponsorStatus = sponsorStatus;
        if (sponsorStatus === 'confirmed' || sponsorStatus === 'likely') {
            filters.push('sponsor_positive');
        }
        
        // 3. 经验要求分析
        const experienceLevel = this.analyzeExperience(jobCard);
        jobData.analysis.experienceLevel = experienceLevel;
        if (experienceLevel === 'entry' || experienceLevel === 'mid') {
            filters.push('experience_ok');
        }
        
        // 4. 公司类型分类
        const companyType = this.classifyCompany(jobData.company);
        jobData.analysis.companyType = companyType;
        if (companyType === 'ai_company' || companyType === 'big_tech') {
            filters.push('good_company');
        }
        
        jobData.analysis.filtersPassed = filters;
    }
    
    isAiPmJob(title) {
        const lowerTitle = title.toLowerCase();
        return this.keywords.aiPmTitles.some(keyword => 
            lowerTitle.includes(keyword)
        );
    }
    
    async checkSponsorStatus(jobData, jobCard) {
        // 方法1: 检查JD文本
        const cardText = jobCard.textContent.toLowerCase();
        
        // 检查否定词（优先级最高）
        const hasNegative = this.keywords.sponsorNegative.some(keyword =>
            cardText.includes(keyword)
        );
        if (hasNegative) return 'unlikely';
        
        // 检查肯定词
        const hasPositive = this.keywords.sponsorPositive.some(keyword =>
            cardText.includes(keyword)
        );
        if (hasPositive) return 'likely';
        
        // 方法2: 查询H1B数据库（异步）
        try {
            const h1bInfo = await this.queryH1BDatabase(jobData.company);
            if (h1bInfo && h1bInfo.hasHistory) {
                return h1bInfo.recentActivity ? 'confirmed' : 'likely';
            }
        } catch (error) {
            console.log('H1B数据库查询失败:', error);
        }
        
        return 'unknown';
    }
    
    async queryH1BDatabase(companyName) {
        // 这里可以集成USCIS H1B数据
        // 暂时返回模拟数据
        return new Promise(resolve => {
            setTimeout(() => {
                // 模拟数据库查询
                const aiCompanies = this.keywords.aiCompanies.map(c => c.toLowerCase());
                const bigTech = this.keywords.bigTech.map(c => c.toLowerCase());
                
                const lowerCompany = companyName.toLowerCase();
                const isAiCompany = aiCompanies.some(c => lowerCompany.includes(c));
                const isBigTech = bigTech.some(c => lowerCompany.includes(c));
                
                resolve({
                    hasHistory: isAiCompany || isBigTech,
                    recentActivity: Math.random() > 0.3, // 70%有近期活动
                    approvalRate: isAiCompany ? 0.8 : isBigTech ? 0.7 : 0.5
                });
            }, 500);
        });
    }
    
    analyzeExperience(jobCard) {
        const text = jobCard.textContent.toLowerCase();
        
        // 检查entry level关键词
        const isEntry = this.keywords.experienceLevels.entry.some(keyword =>
            text.includes(keyword)
        );
        if (isEntry) return 'entry';
        
        // 检查senior关键词
        const isSenior = this.keywords.experienceLevels.senior.some(keyword =>
            text.includes(keyword)
        );
        if (isSenior) return 'senior';
        
        // 检查mid level关键词
        const isMid = this.keywords.experienceLevels.mid.some(keyword =>
            text.includes(keyword)
        );
        if (isMid) return 'mid';
        
        // 尝试提取年限数字
        const yearMatch = text.match(/(\d+)\+?\s*years?/);
        if (yearMatch) {
            const years = parseInt(yearMatch[1]);
            if (years <= 2) return 'entry';
            if (years <= 5) return 'mid';
            return 'senior';
        }
        
        return 'unknown';
    }
    
    classifyCompany(companyName) {
        const lowerName = companyName.toLowerCase();
        
        // 检查是否是AI公司
        const isAiCompany = this.keywords.aiCompanies.some(company =>
            lowerName.includes(company.toLowerCase())
        );
        if (isAiCompany) return 'ai_company';
        
        // 检查是否是大厂
        const isBigTech = this.keywords.bigTech.some(company =>
            lowerName.includes(company.toLowerCase())
        );
        if (isBigTech) return 'big_tech';
        
        return 'other';
    }
    
    calculateJobScore(jobData) {
        let score = 0;
        const analysis = jobData.analysis;
        
        // AI PM职位：基础40分
        if (analysis.isAiPm) score += 40;
        
        // Sponsor状态：最高30分
        switch (analysis.sponsorStatus) {
            case 'confirmed': score += 30; break;
            case 'likely': score += 20; break;
            case 'unlikely': score -= 10; break;
        }
        
        // 经验要求：最高20分
        switch (analysis.experienceLevel) {
            case 'entry': score += 20; break;
            case 'mid': score += 15; break;
            case 'senior': score += 5; break;
        }
        
        // 公司类型：最高10分
        switch (analysis.companyType) {
            case 'ai_company': score += 10; break;
            case 'big_tech': score += 8; break;
        }
        
        // 新鲜度奖励：最高5分（24小时内）
        const hoursOld = (Date.now() - jobData.postedTime) / (1000 * 60 * 60);
        if (hoursOld < 24) score += 5;
        else if (hoursOld < 72) score += 3;
        
        return Math.min(100, Math.max(0, score));
    }
    
    // 工具方法
    extractJobId(jobCard) {
        return jobCard.dataset.jobId || 
               jobCard.getAttribute('data-occludable-job-id') ||
               jobCard.closest('[data-job-id]')?.dataset.jobId ||
               this.generateJobId(jobCard);
    }
    
    generateJobId(jobCard) {
        const title = this.extractJobTitle(jobCard);
        const company = this.extractCompany(jobCard);
        return `${company}-${title}`.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    }
    
    extractJobTitle(jobCard) {
        const selectors = [
            '.job-card-list__title',
            '.job-card-container__title',
            'h3',
            '[class*="job-title"]',
            '[class*="title"]'
        ];
        
        for (const selector of selectors) {
            const element = jobCard.querySelector(selector);
            if (element) {
                return element.textContent.trim() || 'Unknown Title';
            }
        }
        
        return 'Unknown Title';
    }
    
    extractCompany(jobCard) {
        const selectors = [
            '.job-card-container__company-name',
            '[class*="company-name"]',
            '[class*="company"]'
        ];
        
        for (const selector of selectors) {
            const element = jobCard.querySelector(selector);
            if (element) {
                return element.textContent.trim() || 'Unknown Company';
            }
        }
        
        return 'Unknown Company';
    }
    
    extractLocation(jobCard) {
        const selectors = [
            '.job-card-container__metadata-item',
            '[class*="location"]',
            '[class*="locality"]'
        ];
        
        for (const selector of selectors) {
            const element = jobCard.querySelector(selector);
            if (element) {
                return element.textContent.trim() || 'Unknown Location';
            }
        }
        
        return 'Unknown Location';
    }
    
    extractPostedTime(jobCard) {
        const timeText = jobCard.querySelector('[class*="time"]')?.textContent || '';
        return this.parseLinkedInTime(timeText);
    }
    
    parseLinkedInTime(timeText) {
        const now = new Date();
        
        if (timeText.includes('hour')) {
            const match = timeText.match(/(\d+)\s*hour/);
            if (match) {
                const hours = parseInt(match[1]);
                return new Date(now.getTime() - hours * 60 * 60 * 1000);
            }
        } else if (timeText.includes('day')) {
            const match = timeText.match(/(\d+)\s*day/);
            if (match) {
                const days = parseInt(match[1]);
                return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
            }
        } else if (timeText.includes('week')) {
            const match = timeText.match(/(\d+)\s*week/);
            if (match) {
                const weeks = parseInt(match[1]);
                return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
            }
        } else if (timeText.includes('month')) {
            const match = timeText.match(/(\d+)\s*month/);
            if (match) {
                const months = parseInt(match[1]);
                return new Date(now.getTime() - months * 30 * 24 * 60 * 60 * 1000);
            }
        }
        
        return now;
    }
    
    extractJobUrl(jobCard) {
        // 尝试提取职位详情链接
        const linkSelectors = [
            'a[href*="/jobs/"]',
            'a[href*="linkedin.com/jobs/view"]',
            'a.job-card-container__link'
        ];
        
        for (const selector of linkSelectors) {
            const link = jobCard.querySelector(selector);
            if (link && link.href) {
                return link.href;
            }
        }
        
        // 如果没有找到链接，尝试从ID构造
        const jobId = this.extractJobId(jobCard);
        if (jobId && jobId.includes('-')) {
            return `https://www.linkedin.com/jobs/view/${jobId}`;
        }
        
        return '';
    }
    
    getCardPosition(card) {
        // 获取卡片在页面中的位置，用于去重
        const rect = card.getBoundingClientRect();
        return `${Math.round(rect.top)}-${Math.round(rect.left)}`;
    }
    
    handleNewNodes(nodes) {
        nodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                // 检查是否是职位卡片
                if (this.isJobCard(node)) {
                    this.scheduleJobAnalysis(node);
                }
                
                // 检查子节点
                const jobCards = node.querySelectorAll('[data-job-id], .job-card-container');
                jobCards.forEach(card => {
                    this.scheduleJobAnalysis(card);
                });
            }
        });
    }
    
    isJobCard(element) {
        const selectors = [
            '[data-job-id]',
            '.job-card-container',
            '[class*="job-card"]'
        ];
        
        return selectors.some(selector => element.matches(selector));
    }
    
    async scheduleJobAnalysis(jobCard) {
        // 延迟分析，避免立即处理大量新节点
        await this.randomDelay(500, 2000);
        await this.analyzeJobCard(jobCard);
    }
    
    highlightJobCard(jobCard, jobData) {
        // 根据评分添加视觉提示
        let color, badgeText;
        
        if (jobData.score >= 85) {
            color = '#10b981'; // 绿色 - 完美匹配
            badgeText = '🌟 完美匹配';
        } else if (jobData.score >= 70) {
            color = '#3b82f6'; // 蓝色 - 优秀匹配
            badgeText = '🎯 优秀匹配';
        } else if (jobData.score >= 60) {
            color = '#f59e0b'; // 黄色 - 良好匹配
            badgeText = '✅ 良好匹配';
        } else {
            return; // 不突出显示低分职位
        }
        
        // 添加边框和背景色
        jobCard.style.borderLeft = `4px solid ${color}`;
        jobCard.style.paddingLeft = '8px';
        jobCard.style.backgroundColor = `${color}15`;
        jobCard.style.transition = 'all 0.3s ease';
        
        // 添加评分徽章
        const existingBadge = jobCard.querySelector('.ai-pm-assistant-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        const badge = document.createElement('div');
        badge.className = 'ai-pm-assistant-badge';
        badge.innerHTML = `
            <span style="
                background: ${color};
                color: white;
                padding: 4px 12px;
                border-radius: 16px;
                font-size: 12px;
                font-weight: 600;
                margin-left: 8px;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            ">
                ${badgeText} (${jobData.score}/100)
            </span>
        `;
        
        // 尝试添加到标题附近
        const titleElement = jobCard.querySelector('.job-card-list__title, h3, [class*="title"]');
        if (titleElement) {
            titleElement.appendChild(badge);
        } else {
            jobCard.insertBefore(badge, jobCard.firstChild);
        }
        
        // 添加悬停效果
        jobCard.addEventListener('mouseenter', () => {
            jobCard.style.transform = 'translateY(-2px)';
            jobCard.style.boxShadow = `0 4px 12px ${color}40`;
        });
        
        jobCard.addEventListener('mouseleave', () => {
            jobCard.style.transform = 'translateY(0)';
            jobCard.style.boxShadow = 'none';
        });
    }
    
    notifyNewJob(jobData) {
        // 发送通知到background script
        chrome.runtime.sendMessage({
            action: 'newJobFound',
            jobData: jobData,
            timestamp: Date.now()
        }).catch(err => {
            console.log('发送通知失败（可能未安装扩展）:', err);
        });
        
        // 本地通知（如果浏览器支持）
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🎯 发现AI PM职位', {
                body: `${jobData.title} @ ${jobData.company}\n评分: ${jobData.score}/100`,
                icon: 'https://img.icons8.com/color/96/000000/linkedin.png'
            });
        }
    }
    
    startHumanSimulation() {
        // 模拟人类滚动行为
        if (this.config.humanLikeScroll) {
            setInterval(() => {
                if (Math.random() > 0.7) { // 30%概率触发滚动
                    const scrollAmount = 100 + Math.random() * 300;
                    window.scrollBy({
                        top: scrollAmount,
                        behavior: 'smooth'
                    });
                }
            }, 10000); // 每10秒检查一次
        }
        
        // 模拟随机鼠标移动
        if (this.config.randomMouseMovements) {
            document.addEventListener('mousemove', (e) => {
                this.lastMouseMove = Date.now();
            });
            
            setInterval(() => {
                const idleTime = Date.now() - (this.lastMouseMove || 0);
                if (idleTime > 30000) { // 30秒无活动
                    this.simulateMouseMovement();
                }
            }, 5000);
        }
    }
    
    simulateMouseMovement() {
        // 创建虚拟鼠标移动事件
        const event = new MouseEvent('mousemove', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: Math.random() * window.innerWidth,
            clientY: Math.random() * window.innerHeight
        });
        
        document.dispatchEvent(event);
        this.lastMouseMove = Date.now();
    }
    
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'getJobStats':
                    sendResponse(this.getJobStatistics());
                    break;
                    
                case 'getTopJobs':
                    sendResponse(this.getTopJobs(request.limit || 10));
                    break;
                    
                case 'clearJobs':
                    this.jobListings.clear();
                    this.detectedJobs.clear();
                    sendResponse({ success: true });
                    break;
                    
                case 'updateKeywords':
                    if (request.keywords) {
                        this.updateKeywords(request.keywords);
                        sendResponse({ success: true });
                    }
                    break;
            }
        });
    }
    
    getJobStatistics() {
        const jobs = Array.from(this.jobListings.values());
        
        return {
            total: jobs.length,
            aiPmJobs: jobs.filter(j => j.analysis.isAiPm).length,
            sponsorLikely: jobs.filter(j => 
                j.analysis.sponsorStatus === 'confirmed' || 
                j.analysis.sponsorStatus === 'likely'
            ).length,
            entryLevel: jobs.filter(j => j.analysis.experienceLevel === 'entry').length,
            aiCompanies: jobs.filter(j => j.analysis.companyType === 'ai_company').length,
            topMatches: jobs.filter(j => j.score >= 70).length,
            averageScore: jobs.length > 0 ? 
                Math.round(jobs.reduce((sum, j) => sum + j.score, 0) / jobs.length) : 0
        };
    }
    
    getTopJobs(limit = 10) {
        const jobs = Array.from(this.jobListings.values());
        
        return jobs
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(job => ({
                id: job.id,
                title: job.title,
                company: job.company,
                score: job.score,
                sponsorStatus: job.analysis.sponsorStatus,
                experienceLevel: job.analysis.experienceLevel,
                companyType: job.analysis.companyType,
                url: job.url
            }));
    }
    
    updateKeywords(newKeywords) {
        if (newKeywords.aiPmTitles) {
            this.keywords.aiPmTitles = [
                ...this.keywords.aiPmTitles,
                ...newKeywords.aiPmTitles
            ];
        }
        
        if (newKeywords.customFilters) {
            // 添加用户自定义筛选条件
            this.keywords.customFilters = newKeywords.customFilters;
        }
    }
    
    // 页面卸载清理
    cleanup() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        // 移除所有添加的样式和元素
        document.querySelectorAll('.ai-pm-assistant-badge').forEach(el => el.remove());
        
        console.log('🧹 LinkedIn监控已清理');
    }
}

// 页面加载后初始化
if (window.location.hostname.includes('linkedin.com') && 
    window.location.pathname.includes('/jobs/')) {
    
    console.log('🚀 检测到LinkedIn职位页面，启动AI PM求职助手...');
    
    // 等待页面加载完成
    const initMonitor = () => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                window.aiPmJobMonitor = new EnhancedLinkedInMonitor();
            });
        } else {
            window.aiPmJobMonitor = new EnhancedLinkedInMonitor();
        }
    };
    
    // 延迟初始化，确保页面完全加载
    setTimeout(initMonitor, 2000);
    
    // 页面卸载时清理
    window.addEventListener('beforeunload', () => {
        if (window.aiPmJobMonitor) {
            window.aiPmJobMonitor.cleanup();
        }
    });
    
    // 导出到全局，方便调试
    window.AiPmJobAssistant = {
        version: '1.0.0',
        init: () => {
            if (!window.aiPmJobMonitor) {
                window.aiPmJobMonitor = new EnhancedLinkedInMonitor();
            }
            return window.aiPmJobMonitor;
        },
        getStats: () => window.aiPmJobMonitor?.getJobStatistics(),
        getTopJobs: (limit) => window.aiPmJobMonitor?.getTopJobs(limit)
    };
    
    console.log('✅ AI PM求职助手已就绪，可通过 window.AiPmJobAssistant 访问');
}

// 导出模块（如果被其他脚本引用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedLinkedInMonitor;
}