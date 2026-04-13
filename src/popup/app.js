/**
 * Popup界面主逻辑
 */

class PopupApp {
    constructor() {
        this.currentTab = 'dashboard';
        this.settings = {};
        this.jobs = [];
        this.resumes = [];
        
        this.init();
    }
    
    async init() {
        console.log('🚀 Popup应用初始化...');
        
        // 初始化UI事件
        this.initUIEvents();
        
        // 加载设置
        await this.loadSettings();
        
        // 加载数据
        await this.loadData();
        
        // 更新UI
        this.updateUI();
        
        console.log('✅ Popup应用初始化完成');
    }
    
    initUIEvents() {
        // 标签页切换
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.switchTab(tabId);
            });
        });
        
        // 按钮事件
        document.getElementById('scanJobsBtn')?.addEventListener('click', () => this.scanJobs());
        document.getElementById('refreshJobsBtn')?.addEventListener('click', () => this.refreshJobs());
        document.getElementById('optimizeBtn')?.addEventListener('click', () => this.optimizeResume());
        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => this.saveSettings());
        document.getElementById('resetSystemBtn')?.addEventListener('click', () => this.resetSystem());
        document.getElementById('exportDataBtn')?.addEventListener('click', () => this.exportData());
        document.getElementById('importDataBtn')?.addEventListener('click', () => this.importData());
        document.getElementById('viewChangesBtn')?.addEventListener('click', () => this.viewChanges());
        
        // Resume 操作按钮
        document.getElementById('saveVersionBtn')?.addEventListener('click', () => this.saveResumeVersion());
        document.getElementById('exportResumeBtn')?.addEventListener('click', () => this.exportResume());
        document.getElementById('uploadResumeBtn')?.addEventListener('click', () => document.getElementById('resumeUpload').click());

        // 文件上传
        document.getElementById('resumeUpload')?.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // 搜索功能
        document.getElementById('jobSearch')?.addEventListener('input', (e) => this.filterJobs(e.target.value));
    }
    
    switchTab(tabId) {
        // 更新标签页状态
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });
        
        this.currentTab = tabId;
        
        // 标签页特定操作
        if (tabId === 'dashboard') {
            this.updateDashboard();
        } else if (tabId === 'jobs') {
            this.updateJobsList();
        } else if (tabId === 'settings') {
            this.updateSettingsUI();
        }
    }
    
    async loadSettings() {
        try {
            const response = await this.sendMessage('getSettings');
            if (response.success) {
                this.settings = response.settings;
                this.updateSettingsForm();
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }
    
    async loadData() {
        try {
            // 加载职位数据
            const jobsResponse = await this.sendMessage('getJobs', { 
                filter: {}, 
                sortBy: 'score', 
                limit: 50 
            });
            
            if (jobsResponse.success) {
                this.jobs = jobsResponse.jobs;
            }
            
            // 加载统计信息
            const statsResponse = await this.sendMessage('getJobStats');
            if (statsResponse.success) {
                this.stats = statsResponse.stats;
            }
            
            // 检查系统状态
            const statusResponse = await this.sendMessage('getSystemStatus');
            if (statusResponse.success) {
                this.systemStatus = statusResponse.status;
                this.updateStatusBadge();
            }
            
        } catch (error) {
            console.error('加载数据失败:', error);
        }
    }
    
    updateUI() {
        this.updateDashboard();
        this.updateJobsList();
        this.updateSettingsForm();
        this.updateStatusBadge();
    }
    
    updateDashboard() {
        // 更新统计数字
        if (this.stats) {
            document.getElementById('totalJobs').textContent = this.stats.total || 0;
            document.getElementById('highMatchJobs').textContent = this.stats.scoreDistribution?.excellent || 0;
            document.getElementById('applications').textContent = this.stats.byStatus?.applied || 0;
            
            // 计算成功率（简化版）
            const totalApplied = this.stats.byStatus?.applied || 0;
            const successRate = totalApplied > 0 ? Math.round((this.stats.scoreDistribution?.excellent || 0) / totalApplied * 100) : 0;
            document.getElementById('successRate').textContent = `${successRate}%`;
        }
        
        // 更新推荐职位
        this.updateRecommendedJobs();
    }
    
    updateRecommendedJobs() {
        const container = document.getElementById('recommendedJobs');
        if (!container) return;
        
        // 筛选高评分职位
        const recommendedJobs = this.jobs
            .filter(job => job.score >= 70)
            .slice(0, 5);
        
        if (recommendedJobs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🎯</div>
                    <p>暂无高匹配职位</p>
                    <p style="font-size: 14px; margin-top: 8px;">浏览LinkedIn职位页面开始监控</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = recommendedJobs.map(job => `
            <div class="job-card">
                <div class="job-title">${this.escapeHtml(job.title)}</div>
                <div class="job-company">${this.escapeHtml(job.company)}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                    <span class="job-score">${job.score}/100</span>
                    <button class="btn" style="padding: 4px 12px; font-size: 12px;" 
                            onclick="popupApp.viewJob('${job.id}')">
                        查看详情
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    updateJobsList() {
        const container = document.getElementById('allJobs');
        if (!container) return;
        
        if (this.jobs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <p>还没有发现职位</p>
                    <p style="font-size: 14px; margin-top: 8px;">浏览LinkedIn职位页面开始监控</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.jobs.map(job => `
            <div class="job-card">
                <div class="job-title">${this.escapeHtml(job.title)}</div>
                <div class="job-company">${this.escapeHtml(job.company)} • ${this.escapeHtml(job.location || '未知地点')}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                    <span class="job-score" style="background: ${this.getScoreColor(job.score)}">
                        ${job.score}/100
                    </span>
                    <div style="font-size: 12px; color: #6c757d;">
                        ${this.formatDate(job.postedTime || job.savedAt)}
                    </div>
                </div>
                <div style="margin-top: 8px; font-size: 12px; color: #6c757d;">
                    ${this.getJobTags(job)}
                </div>
            </div>
        `).join('');
    }
    
    updateSettingsForm() {
        // 更新表单值
        if (this.settings) {
            document.getElementById('apiKey').value = this.settings.apiKey || '';
            document.getElementById('autoOptimize').checked = this.settings.autoOptimize !== false;
            document.getElementById('sponsorFilter').checked = this.settings.sponsorFilter !== false;
            document.getElementById('experienceFilter').checked = this.settings.experienceFilter !== false;
        }
        
        // 更新系统状态
        this.updateSettingsUI();
    }
    
    updateSettingsUI() {
        const statusElement = document.getElementById('systemStatus');
        if (!statusElement) return;

        if (!this.systemStatus) {
            statusElement.innerHTML = '<span style="color: var(--warning-color);">⚠️ 系统状态加载中...</span>';
            return;
        }

        const { database, stats, uptime } = this.systemStatus;
        statusElement.innerHTML = `
            <div style="margin-bottom: 4px;">
                <strong>职位:</strong> ${database?.jobs?.total ?? 0} 个&nbsp;&nbsp;
                <strong>申请:</strong> ${database?.applications?.total ?? 0} 个&nbsp;&nbsp;
                <strong>简历版本:</strong> ${database?.resumes ?? 0} 个
            </div>
            <div style="margin-bottom: 4px;">
                <strong>运行时间:</strong> ${uptime || '未知'}
            </div>
            <div>
                <strong>版本:</strong> ${this.systemStatus.version || '1.0.0'} &nbsp;
                <span style="color: var(--success-color);">✅ 运行正常</span>
            </div>
        `;
    }
    
    updateStatusBadge() {
        const badge = document.getElementById('statusBadge');
        if (!badge || !this.systemStatus) return;
        
        if (this.systemStatus.initialized) {
            badge.textContent = '✅ 系统正常';
            badge.style.background = 'rgba(16, 185, 129, 0.2)';
        } else {
            badge.textContent = '⚠️ 系统异常';
            badge.style.background = 'rgba(239, 68, 68, 0.2)';
        }
    }
    
    async scanJobs() {
        try {
            // 发送扫描请求
            await this.sendMessage('scanJobs');
            
            // 显示成功消息
            this.showMessage('开始扫描LinkedIn职位...', 'info');
            
            // 刷新数据
            setTimeout(() => this.loadData(), 2000);
            
        } catch (error) {
            console.error('扫描职位失败:', error);
            this.showMessage('扫描失败: ' + error.message, 'error');
        }
    }
    
    async refreshJobs() {
        try {
            await this.loadData();
            this.updateJobsList();
            this.showMessage('职位列表已刷新', 'success');
        } catch (error) {
            console.error('刷新职位失败:', error);
            this.showMessage('刷新失败: ' + error.message, 'error');
        }
    }
    
    async optimizeResume() {
        const resumeText = document.getElementById('resumeText').value;
        const jobDescription = document.getElementById('jobDescription').value;
        
        if (!resumeText.trim()) {
            this.showMessage('请输入简历内容', 'warning');
            return;
        }
        
        try {
            this.showMessage('正在优化简历...', 'info');
            
            const response = await this.sendMessage('optimizeResume', {
                resume: resumeText,
                jobDescription: jobDescription,
                preferences: {
                    isInternationalStudent: true
                }
            });
            
            if (response.success) {
                // 更新简历文本
                if (response.optimizedResume) {
                    document.getElementById('resumeText').value = response.optimizedResume;
                }

                // 显示修改摘要
                const changes = response.changes || [];
                const summaryEl = document.getElementById('optimizationSummary');
                if (changes.length > 0) {
                    summaryEl.innerHTML = `
                        <div style="margin-bottom: 8px; color: var(--success-color); font-weight: 600;">
                            ${response.summary || `完成 ${changes.length} 处优化`}
                        </div>
                        <ul style="margin: 0; padding-left: 16px; font-size: 13px; line-height: 1.7;">
                            ${changes.map(c => `<li>${this.escapeHtml(c)}</li>`).join('')}
                        </ul>`;
                } else {
                    summaryEl.textContent = response.summary || '优化完成';
                }
                document.getElementById('optimizationResult').style.display = 'block';

                this.showMessage(`简历优化完成，${changes.length} 处改进`, 'success');

            } else {
                this.showMessage('优化失败: ' + (response.error || '未知错误'), 'error');
            }
            
        } catch (error) {
            console.error('简历优化失败:', error);
            this.showMessage('优化失败: ' + error.message, 'error');
        }
    }
    
    async saveSettings() {
        const settings = {
            apiKey: document.getElementById('apiKey').value.trim(),
            autoOptimize: document.getElementById('autoOptimize').checked,
            sponsorFilter: document.getElementById('sponsorFilter').checked,
            experienceFilter: document.getElementById('experienceFilter').checked
        };
        
        try {
            const response = await this.sendMessage('updateSettings', { settings });
            
            if (response.success) {
                this.settings = { ...this.settings, ...settings };
                this.showMessage('设置已保存', 'success');
            } else {
                this.showMessage('保存失败: ' + (response.error || '未知错误'), 'error');
            }
            
        } catch (error) {
            console.error('保存设置失败:', error);
            this.showMessage('保存失败: ' + error.message, 'error');
        }
    }
    
    async resetSystem() {
        if (!confirm('确定要重置系统吗？所有数据将被清除，此操作不可撤销。')) {
            return;
        }
        
        try {
            const response = await this.sendMessage('resetSystem');
            
            if (response.success) {
                this.showMessage('系统已重置', 'success');
                setTimeout(() => {
                    this.loadSettings();
                    this.loadData();
                }, 1000);
            } else {
                this.showMessage('重置失败: ' + (response.error || '未知错误'), 'error');
            }
            
        } catch (error) {
            console.error('重置系统失败:', error);
            this.showMessage('重置失败: ' + error.message, 'error');
        }
    }
    
    async exportData() {
        try {
            const response = await this.sendMessage('exportData');
            
            if (response.success) {
                // 创建下载链接
                const dataStr = JSON.stringify(response.data, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `ai-pm-assistant-backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                this.showMessage('数据导出成功', 'success');
            } else {
                this.showMessage('导出失败: ' + (response.error || '未知错误'), 'error');
            }
            
        } catch (error) {
            console.error('导出数据失败:', error);
            this.showMessage('导出失败: ' + error.message, 'error');
        }
    }
    
    async importData() {
        // 创建文件输入
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                const response = await this.sendMessage('importData', { data });
                
                if (response.success) {
                    this.showMessage('数据导入成功', 'success');
                    setTimeout(() => this.loadData(), 1000);
                } else {
                    this.showMessage('导入失败: ' + (response.error || '未知错误'), 'error');
                }
                
            } catch (error) {
                console.error('导入数据失败:', error);
                this.showMessage('导入失败: ' + error.message, 'error');
            }
        };
        
        input.click();
    }
    
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            let text;
            if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                text = await this.extractTextFromPDF(file);
            } else {
                text = await this.readFileAsText(file);
            }
            document.getElementById('resumeText').value = text;
            this.showMessage('简历文件已加载', 'success');
        } catch (error) {
            console.error('读取文件失败:', error);
            this.showMessage('读取文件失败: ' + error.message, 'error');
        }
    }

    async extractTextFromPDF(file) {
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        if (!pdfjsLib) throw new Error('PDF.js 未加载');
        pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('resume-analyzer/pdf.worker.js');

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            pages.push(pageText);
        }
        return pages.join('\n\n');
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }
    
    filterJobs(query) {
        const container = document.getElementById('allJobs');
        if (!container || !this.jobs.length) return;
        
        const filteredJobs = this.jobs.filter(job => 
            job.title.toLowerCase().includes(query.toLowerCase()) ||
            job.company.toLowerCase().includes(query.toLowerCase())
        );
        
        if (filteredJobs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <p>没有找到匹配的职位</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredJobs.map(job => `
            <div class="job-card">
                <div class="job-title">${this.escapeHtml(job.title)}</div>
                <div class="job-company">${this.escapeHtml(job.company)}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                    <span class="job-score">${job.score}/100</span>
                    <button class="btn" style="padding: 4px 12px; font-size: 12px;">
                        查看详情
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    viewJob(jobId) {
        // 打开职位详情页（待实现）
        this.showMessage('职位详情功能开发中', 'info');
    }
    
    viewChanges() {
        document.getElementById('optimizationResult')?.scrollIntoView({ behavior: 'smooth' });
    }
    
    // 工具方法
    async sendMessage(action, data = {}) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ action, ...data }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response || { success: false, error: 'No response' });
                }
            });
        });
    }
    
    showMessage(text, type = 'info') {
        // 创建消息元素
        const message = document.createElement('div');
        message.className = `message message-${type}`;
        message.innerHTML = `
            <span>${text}</span>
            <button class="message-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        // 添加到消息容器
        const container = document.getElementById('messageContainer') || this.createMessageContainer();
        container.appendChild(message);
        
        // 自动移除
        setTimeout(() => {
            if (message.parentElement) {
                message.remove();
            }
        }, 5000);
    }
    
    createMessageContainer() {
        const container = document.createElement('div');
        container.id = 'messageContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 300px;
        `;
        document.body.appendChild(container);
        return container;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    getScoreColor(score) {
        if (score >= 80) return 'rgba(16, 185, 129, 0.2)';
        if (score >= 60) return 'rgba(245, 158, 11, 0.2)';
        return 'rgba(239, 68, 68, 0.2)';
    }
    
    formatDate(dateString) {
        if (!dateString) return '未知时间';
        
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return '今天';
            if (diffDays === 1) return '昨天';
            if (diffDays < 7) return `${diffDays}天前`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
            if (diffDays < 365) return `${Math.floor(diffDays / 30)}月前`;
            return `${Math.floor(diffDays / 365)}年前`;
        } catch (error) {
            return '未知时间';
        }
    }
    
    getJobTags(job) {
        const tags = [];
        
        if (job.sponsorStatus === 'likely') {
            tags.push('<span style="color: #10b981;">Sponsor友好</span>');
        } else if (job.sponsorStatus === 'unlikely') {
            tags.push('<span style="color: #ef4444;">不Sponsor</span>');
        }
        
        if (job.experienceLevel === 'entry') {
            tags.push('<span style="color: #3b82f6;">应届友好</span>');
        }
        
        if (job.companyType === 'ai') {
            tags.push('<span style="color: #8b5cf6;">AI公司</span>');
        }
        
        return tags.join(' • ');
    }
    
    // 新增功能：简历版本管理
    async saveResumeVersion() {
        const resumeText = document.getElementById('resumeText').value;
        const versionName = prompt('请输入简历版本名称:', `版本 ${new Date().toLocaleDateString()}`);
        
        if (!versionName || !resumeText.trim()) return;
        
        try {
            const response = await this.sendMessage('saveResume', {
                resume: resumeText,
                version: versionName,
                isOriginal: false
            });
            
            if (response.success) {
                this.showMessage(`简历版本 "${versionName}" 已保存`, 'success');
                this.loadResumeVersions();
            } else {
                this.showMessage('保存失败: ' + (response.error || '未知错误'), 'error');
            }
        } catch (error) {
            console.error('保存简历版本失败:', error);
            this.showMessage('保存失败: ' + error.message, 'error');
        }
    }
    
    async loadResumeVersions() {
        try {
            const response = await this.sendMessage('getResumes', { limit: 10 });
            const container = document.getElementById('resumeVersions');
            if (!container) return;

            if (!response.success || response.resumes.length === 0) {
                container.innerHTML = '<div class="empty-state" style="padding: var(--spacing-md);"><p>No saved versions yet</p></div>';
                return;
            }

            container.innerHTML = response.resumes.map(resume => {
                const versionName = typeof resume.version === 'string' && resume.version.length > 1
                    ? resume.version
                    : (resume.isOriginal ? '原始版本' : `版本 ${resume.id?.slice(-4) || '?'}`);
                const changes = resume.metadata?.changes;
                const changeBadge = changes > 0
                    ? `<span style="font-size: 11px; color: var(--primary-color); margin-left: 6px;">${changes} 处改动</span>`
                    : '';
                return `
                <div class="resume-version" style="margin-bottom: 8px; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-secondary);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${this.escapeHtml(versionName)}${changeBadge}
                                ${resume.isOriginal ? '<span style="color: var(--success-color); margin-left: 6px; font-size: 11px;">原始</span>' : ''}
                            </div>
                            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
                                ${this.formatDate(resume.createdAt)}
                            </div>
                        </div>
                        <div style="display: flex; gap: 4px; margin-left: 8px; flex-shrink: 0;">
                            <button class="btn btn-secondary btn-sm" data-action="load" data-id="${resume.id}">加载</button>
                            <button class="btn btn-danger btn-sm" data-action="delete" data-id="${resume.id}">删除</button>
                        </div>
                    </div>
                </div>`;
            }).join('');

            // 用 addEventListener 替代 onclick 属性（MV3 CSP 禁止内联事件）
            container.querySelectorAll('button[data-action]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    if (btn.dataset.action === 'load') {
                        this.loadResumeVersion(id);
                    } else if (btn.dataset.action === 'delete') {
                        this.deleteResumeVersion(id);
                    }
                });
            });

        } catch (error) {
            console.error('加载简历版本失败:', error);
        }
    }
    
    async loadResumeVersion(resumeId) {
        try {
            const response = await this.sendMessage('getResume', { id: resumeId });
            
            if (response.success && response.resume) {
                const textarea = document.getElementById('resumeText');
                textarea.value = response.resume.content;
                textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                textarea.focus();
                this.showMessage(`已加载简历版本`, 'success');
            }
        } catch (error) {
            console.error('加载简历版本失败:', error);
            this.showMessage('加载失败: ' + error.message, 'error');
        }
    }
    
    async deleteResumeVersion(resumeId) {
        if (!confirm('确定要删除这个简历版本吗？')) return;
        
        try {
            const response = await this.sendMessage('deleteResume', { id: resumeId });
            
            if (response.success) {
                this.showMessage('简历版本已删除', 'success');
                this.loadResumeVersions();
            }
        } catch (error) {
            console.error('删除简历版本失败:', error);
            this.showMessage('删除失败: ' + error.message, 'error');
        }
    }
    
    // 新增功能：申请追踪
    async trackApplication(jobId) {
        try {
            const job = this.jobs.find(j => j.id === jobId);
            if (!job) {
                this.showMessage('未找到职位信息', 'error');
                return;
            }
            
            const status = prompt('请输入申请状态 (applied/interview/offer/rejected):', 'applied');
            if (!status) return;
            
            const response = await this.sendMessage('saveApplication', {
                jobId,
                status,
                appliedAt: new Date().toISOString(),
                notes: ''
            });
            
            if (response.success) {
                this.showMessage('申请状态已更新', 'success');
                this.loadData();
            }
        } catch (error) {
            console.error('更新申请状态失败:', error);
            this.showMessage('更新失败: ' + error.message, 'error');
        }
    }
    
    // 新增功能：数据统计图表
    updateStatsChart() {
        const canvas = document.getElementById('statsChart');
        if (!canvas || !this.stats) return;
        
        // 简化版图表 - 实际项目中可以使用Chart.js等库
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制简单的条形图
        const scores = [0, 0, 0, 0]; // 0-40, 40-60, 60-80, 80-100
        this.jobs.forEach(job => {
            if (job.score < 40) scores[0]++;
            else if (job.score < 60) scores[1]++;
            else if (job.score < 80) scores[2]++;
            else scores[3]++;
        });
        
        const maxScore = Math.max(...scores);
        const barWidth = 40;
        const spacing = 20;
        
        // 绘制条形
        scores.forEach((score, index) => {
            const x = index * (barWidth + spacing) + 20;
            const height = (score / maxScore) * 150;
            const y = canvas.height - height - 30;
            
            // 条形
            ctx.fillStyle = this.getBarColor(index);
            ctx.fillRect(x, y, barWidth, height);
            
            // 数值
            ctx.fillStyle = '#374151';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(score.toString(), x + barWidth / 2, y - 5);
            
            // 标签
            const labels = ['低匹配', '中等', '良好', '优秀'];
            ctx.fillText(labels[index], x + barWidth / 2, canvas.height - 10);
        });
    }
    
    getBarColor(index) {
        const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
        return colors[index] || '#6b7280';
    }
    
    // 新增功能：导出简历
    async exportResume() {
        const resumeText = document.getElementById('resumeText').value;
        if (!resumeText.trim()) {
            this.showMessage('没有简历内容可导出', 'warning');
            return;
        }
        
        const format = prompt('选择导出格式 (txt/md/html):', 'txt');
        if (!format) return;
        
        let content = resumeText;
        let extension = 'txt';
        
        if (format === 'md') {
            content = `# 简历\n\n${resumeText.replace(/\n/g, '\n\n')}`;
            extension = 'md';
        } else if (format === 'html') {
            content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>简历 - ${new Date().toLocaleDateString()}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
        .section { margin-bottom: 20px; }
        .section-title { font-weight: bold; color: #10b981; margin-bottom: 8px; }
    </style>
</head>
<body>
    <h1>简历</h1>
    <div>${resumeText.replace(/\n/g, '<br>')}</div>
</body>
</html>`;
            extension = 'html';
        }
        
        // 创建下载链接
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume-${new Date().toISOString().split('T')[0]}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showMessage(`简历已导出为 ${format.toUpperCase()} 格式`, 'success');
    }
    
    // 新增功能：快捷键支持
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+S: 保存简历版本
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveResumeVersion();
            }
            
            // Ctrl+E: 导出简历
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                this.exportResume();
            }
            
            // Ctrl+F: 搜索职位
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                const searchInput = document.getElementById('jobSearch');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        });
    }
    
    // 新增功能：主题切换
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        this.showMessage(`已切换到${newTheme === 'dark' ? '深色' : '浅色'}主题`, 'info');
    }
    
    // 初始化主题
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // 添加主题切换按钮
        const themeToggle = document.createElement('button');
        themeToggle.className = 'btn';
        themeToggle.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 4px 8px;
            font-size: 12px;
        `;
        themeToggle.textContent = savedTheme === 'dark' ? '☀️ 浅色' : '🌙 深色';
        themeToggle.onclick = () => this.toggleTheme();
        
        document.querySelector('.popup-header')?.appendChild(themeToggle);
    }
}

// 全局实例
let popupApp;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    popupApp = new PopupApp();

    // 导出全局实例供HTML内联事件调用
    window.popupApp = popupApp;

    // 初始化额外功能
    popupApp.initKeyboardShortcuts();
    popupApp.initTheme();

    // 加载简历版本
    setTimeout(() => popupApp.loadResumeVersions(), 1000);

    // 更新统计图表
    setTimeout(() => popupApp.updateStatsChart(), 1500);
});