# AI PM求职自动化系统 - 架构设计文档

## 🎯 系统概述

### **核心目标**
为F1 OPT国际学生（AI Product Manager方向）提供完整的求职自动化解决方案，包含：
1. LinkedIn AI PM职位实时监控
2. 智能筛选（Sponsor/经验/公司类型）
3. 安全简历个性化优化（绝不添加虚假内容）
4. 半自动化申请流程

### **设计原则**
1. **真实性第一**：简历优化绝不添加虚假技能/经历
2. **本地优先**：用户数据存储在浏览器本地
3. **渐进增强**：从基础功能开始，逐步添加智能
4. **用户控制**：所有关键操作需要用户确认

## 🏗️ 系统架构

### **整体架构图**
```
用户浏览器 (Chrome)
├── Content Scripts (页面交互层)
│   ├── linkedin-monitor.js      # LinkedIn职位监控
│   ├── job-analyzer.js          # 职位详情分析
│   └── form-filler.js           # 表单填充（复用现有）
├── Background Service (逻辑层)
│   ├── job-processor.js         # 职位数据处理
│   ├── resume-optimizer.js      # 安全简历优化
│   ├── sponsor-checker.js       # Sponsor检测
│   └── data-manager.js          # 数据存储管理
├── Popup UI (用户界面层)
│   ├── dashboard.html           # 主控制面板
│   ├── job-list.html           # 职位列表
│   ├── resume-editor.html      # 简历编辑
│   └── settings.html           # 系统设置
└── Storage Layer (数据层)
    ├── IndexedDB (职位数据、简历版本)
    ├── Chrome Storage (用户配置)
    └── Local Files (导出数据)
```

### **数据流设计**
```
1. 用户浏览LinkedIn
   ↓
2. Content Script检测职位卡片
   ↓
3. 提取职位信息 + 应用智能筛选
   ↓
4. 存储到IndexedDB + 实时评分
   ↓
5. 用户查看匹配职位列表
   ↓
6. 选择职位 → 安全简历优化
   ↓
7. 用户确认优化结果
   ↓
8. 导航到申请页面 → 表单填充
   ↓
9. 追踪申请状态 → 反馈学习
```

## 📁 模块详细设计

### **1. LinkedIn监控模块 (linkedin-monitor.js)**

#### **核心功能**
- 实时检测LinkedIn职位列表变化
- 提取职位基本信息（标题、公司、地点、时间）
- 应用基础筛选（关键词匹配）
- 添加反爬虫保护机制

#### **技术实现**
```javascript
class EnhancedLinkedInMonitor {
  constructor() {
    // 反爬虫配置
    this.config = {
      scanDelay: 1000 + Math.random() * 4000, // 1-5秒随机延迟
      maxRequestsPerMinute: 10,
      simulateHumanBehavior: true
    };
    
    // 关键词配置
    this.keywords = {
      aiPm: ['ai product', 'machine learning product', 'ml product manager'],
      sponsor: ['sponsor', 'h1b', 'visa sponsorship'],
      experience: ['entry level', '0-2 years', 'new grad', 'associate']
    };
  }
  
  async monitorJobs() {
    // 1. 设置观察器监听DOM变化
    this.setupMutationObserver();
    
    // 2. 扫描现有职位
    await this.scanExistingJobs();
    
    // 3. 实时监控新职位
    this.startRealTimeMonitoring();
  }
}
```

#### **反爬虫策略**
1. **随机延迟**：每次操作添加1-5秒随机延迟
2. **请求限制**：每分钟最多10次数据提取
3. **行为模拟**：模拟鼠标移动和滚动
4. **错误恢复**：检测到限制时自动暂停

### **2. 智能筛选模块 (job-filter.js)**

#### **筛选维度**
1. **Sponsor状态**（最高优先级）
   - H1B数据库查询
   - JD文本分析（"提供sponsor" vs "不提供"）
   - 公司历史记录

2. **经验要求**（次优先级）
   - 年限提取（正则表达式）
   - 级别识别（entry, mid, senior）
   - 弹性判断（"or equivalent experience"）

3. **公司类型**（基础筛选）
   - AI公司识别（关键词匹配）
   - 大厂识别（预定义列表）
   - 行业分类（科技、金融科技等）

#### **评分算法**
```javascript
class JobScorer {
  calculateScore(job) {
    let score = 0;
    
    // Sponsor权重：40%
    if (job.sponsorStatus === 'confirmed') score += 40;
    else if (job.sponsorStatus === 'likely') score += 20;
    
    // 经验匹配权重：30%
    if (job.experienceLevel === 'entry' || job.experienceLevel === '0-2') score += 30;
    else if (job.experienceLevel === '2-5') score += 15;
    
    // 公司类型权重：20%
    if (job.companyType === 'ai_company') score += 20;
    else if (job.companyType === 'big_tech') score += 15;
    
    // 新鲜度权重：10%
    const hoursOld = (Date.now() - job.postedTime) / (1000 * 60 * 60);
    if (hoursOld < 24) score += 10;
    else if (hoursOld < 72) score += 5;
    
    return Math.min(100, score);
  }
}
```

### **3. 安全简历优化模块 (resume-optimizer.js)**

#### **安全边界设计**
```javascript
class SafeResumeOptimizer {
  constructor() {
    // 安全规则定义
    this.safetyRules = {
      allowRephrasing: true,      // 允许重新表述
      allowRestructuring: true,   // 允许结构调整
      allowQuantification: true,  // 允许量化成果
      allowSkillHighlighting: true, // 允许技能突出
      forbidAddingSkills: true,   // 禁止添加新技能
      forbidAddingExperience: true, // 禁止添加新经历
      forbidFalsifyingDates: true  // 禁止伪造时间
    };
    
    this.validator = new ResumeValidator();
  }
  
  async optimizeForJob(originalResume, jobDescription) {
    // 1. 验证原始简历真实性
    const validation = this.validator.validate(originalResume);
    if (!validation.valid) {
      throw new Error(`简历验证失败: ${validation.errors.join(', ')}`);
    }
    
    // 2. 分析职位要求
    const jobAnalysis = await this.analyzeJobDescription(jobDescription);
    
    // 3. 生成安全优化建议
    const suggestions = this.generateSafeSuggestions(originalResume, jobAnalysis);
    
    // 4. 应用优化（严格遵守安全规则）
    const optimized = this.applyOptimizations(originalResume, suggestions);
    
    // 5. 最终验证
    const finalValidation = this.validator.compare(originalResume, optimized);
    if (!finalValidation.safe) {
      throw new Error(`优化后验证失败: 检测到不允许的修改`);
    }
    
    return {
      optimizedResume: optimized,
      suggestions: suggestions,
      changes: finalValidation.changes,
      safetyReport: finalValidation.report
    };
  }
}
```

#### **优化类型定义**
```javascript
// 允许的优化类型
const ALLOWED_OPTIMIZATIONS = {
  REPHRASE: 'rephrase',          // 重新表述，更专业
  REORDER: 'reorder',            // 调整顺序，突出相关
  QUANTIFY: 'quantify',          // 量化成果，添加指标
  HIGHLIGHT: 'highlight',        // 突出显示，增加可见性
  CONTEXTUALIZE: 'contextualize' // 添加上下文，解释价值
};

// 禁止的修改类型
const FORBIDDEN_MODIFICATIONS = {
  ADD_SKILL: 'add_skill',        // 添加新技能
  ADD_EXPERIENCE: 'add_experience', // 添加新经历
  MODIFY_DATES: 'modify_dates',   // 修改时间线
  FALSIFY_EDUCATION: 'falsify_education' // 伪造教育
};
```

### **4. 数据存储模块 (data-manager.js)**

#### **数据库设计**
```javascript
// IndexedDB Schema
const DB_SCHEMA = {
  version: 1,
  stores: {
    jobs: {
      key: 'id',
      indexes: [
        'score',          // 评分索引（快速筛选）
        'postedAt',       // 发布时间索引
        'company',        // 公司索引
        'sponsorStatus',  // Sponsor状态索引
        'experienceLevel' // 经验级别索引
      ]
    },
    resumes: {
      key: 'id',
      indexes: [
        'createdAt',      // 创建时间
        'jobId',          // 关联职位
        'version'         // 版本号
      ]
    },
    applications: {
      key: 'id',
      indexes: [
        'jobId',          // 职位ID
        'status',         // 申请状态
        'appliedAt'       // 申请时间
      ]
    },
    companies: {
      key: 'name',
      indexes: [
        'sponsorHistory', // Sponsor历史
        'industry',       // 行业分类
        'size'           // 公司规模
      ]
    }
  }
};
```

#### **数据同步策略**
1. **本地优先**：所有操作先在本地完成
2. **增量同步**：只同步变化的数据
3. **冲突解决**：用户手动确认冲突
4. **备份导出**：定期导出数据备份

### **5. 用户界面模块 (popup/)**

#### **界面设计原则**
1. **简洁直观**：新手5分钟内上手
2. **信息分层**：重要信息优先展示
3. **操作引导**：清晰的下一步指引
4. **反馈及时**：实时显示操作状态

#### **主要界面**
1. **Dashboard（仪表盘）**
   - 今日发现职位统计
   - 申请进度概览
   - 快速操作入口

2. **Job List（职位列表）**
   - 卡片式职位展示
   - 多维度筛选器
   - 批量操作功能

3. **Resume Editor（简历编辑器）**
   - 原始/优化对比视图
   - 修改建议列表
   - 版本历史管理

4. **Settings（设置）**
   - API密钥配置
   - 筛选偏好设置
   - 数据管理选项

## 🔧 技术实现细节

### **Chrome Extension配置**
```json
{
  "manifest_version": 3,
  "name": "AI PM Job Assistant",
  "version": "1.0.0",
  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "https://*.linkedin.com/*",
    "https://api.anthropic.com/*"
  ],
  "content_scripts": [
    {
      "matches": ["https://*.linkedin.com/jobs/*"],
      "js": ["content/linkedin-monitor.js"],
      "run_at": "document_idle"
    }
  ],
  "background": {
    "service_worker": "background/service-worker.js"
  },
  "action": {
    "default_popup": "popup/dashboard.html"
  }
}
```

### **通信机制设计**
```javascript
// Content Script ↔ Background通信
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'NEW_JOB_DETECTED':
      return handleNewJob(request.jobData);
    case 'ANALYZE_JOB':
      return analyzeJobDescription(request.jobId);
    case 'OPTIMIZE_RESUME':
      return optimizeResumeForJob(request.resume, request.jobId);
  }
});

// Background ↔ Popup通信
const port = chrome.runtime.connect({ name: "popup" });
port.postMessage({ type: "UPDATE_JOBS", data: jobs });
port.onMessage.addListener((msg) => {
  if (msg.type === "JOB_SELECTED") {
    handleJobSelection(msg.jobId);
  }
});
```

### **错误处理策略**
```javascript
class ErrorHandler {
  constructor() {
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true
    };
  }
  
  async withRetry(operation, context) {
    let lastError;
    
    for (let i = 0; i < this.retryConfig.maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // 检查是否可重试的错误
        if (!this.isRetryable(error)) {
          throw error;
        }
        
        // 计算延迟时间
        const delay = this.calculateDelay(i);
        await this.delay(delay);
        
        // 记录重试日志
        this.logRetry(context, i, error);
      }
    }
    
    throw new Error(`操作失败，重试${this.retryConfig.maxRetries}次后仍失败: ${lastError.message}`);
  }
  
  isRetryable(error) {
    // 网络错误、超时错误可重试
    const retryableErrors = [
      'NetworkError',
      'TimeoutError',
      'ECONNRESET',
      'ETIMEDOUT'
    ];
    
    return retryableErrors.some(type => error.message.includes(type));
  }
}
```

## 🚀 开发实施计划

### **Phase 1: 基础监控系统（本周）**
**目标**：稳定的LinkedIn职位监控 + 基础筛选

**任务清单**：
1. ✅ 增强linkedin-monitor.js（反爬虫策略）
2. 🔄 实现基础筛选算法（关键词匹配）
3. 🔄 构建数据存储系统（IndexedDB）
4. 🔄 开发基础Popup UI（职位列表展示）

**交付物**：
- 可运行的Chrome扩展
- 能够检测LinkedIn AI PM职位
- 基础关键词筛选功能
- 本地数据存储

### **Phase 2: 智能筛选系统（下周）**
**目标**：准确的Sponsor检测 + 经验分析

**任务清单**：
1. 🔄 集成H1B数据库（USCIS数据）
2. 🔄 实现经验要求分析算法
3. 🔄 开发公司分类系统
4. 🔄 完善筛选UI（多条件组合）

**交付物**：
- 智能筛选算法（准确率>85%）
- 完整的筛选UI界面
- 实时评分和排序系统

### **Phase 3: 安全简历优化（下下周）**
**目标**：真实有效的简历个性化

**任务清单**：
1. 🔄 实现安全优化引擎（边界控制）
2. 🔄 集成Claude API（优化建议生成）
3. 🔄 开发简历对比编辑器
4. 🔄 添加版本管理系统

**交付物**：
- 安全简历优化系统
- 简历对比和版本管理
- 用户确认工作流

### **Phase 4: 系统集成（第4周）**
**目标**：完整可用的产品

**任务清单**：
1. 🔄 集成所有模块（统一数据流）
2. 🔄 实现表单填充集成（复用现有）
3. 🔄 添加申请状态追踪
4. 🔄 进行用户测试和优化

**交付物**：
- 完整的AI PM求职自动化系统
- 用户文档和指南
- Beta版本发布

## 📊 质量保证

### **测试策略**
1. **单元测试**：核心算法和工具函数
2. **集成测试**：模块间通信和数据流
3. **端到端测试**：完整用户流程
4. **性能测试**：内存使用和响应时间

### **监控指标**
1. **技术指标**：
   - LinkedIn监控稳定性（成功率）
   - Sponsor检测准确率
   - 内存使用峰值
   - 页面加载性能

2. **产品指标**：
   - 每日发现职位数量
   - 用户操作完成率
   - 简历优化接受率
   - 用户满意度评分

### **维护计划**
1. **定期更新**：
   - LinkedIn页面选择器（每月检查）
   - H1B数据库（季度更新）
   - 公司分类数据（半年更新）

2. **用户反馈**：
   - 问题报告渠道
   - 功能请求收集
   - 版本更新通知

## ⚠️ 风险控制

### **技术风险**
1. **LinkedIn反爬虫升级**
   - **应对**：模块化选择器，快速更新机制
   - **降级**：提供手动职位输入

2. **Claude API成本控制**
   - **应对**：缓存优化，Prompt效率提升
   - **降级**：本地算法替代部分功能

### **产品风险**
1. **用户信任建立**
   - **应对**：透明数据使用，开源部分代码
   - **增强**：详细的安全边界说明

2. **市场竞争**
   - **应对**：专注AI PM国际学生细分市场
   - **差异化**：深度优化，专业建议

## 🎯 成功标准

### **技术成功**
- ✅ LinkedIn监控稳定运行 > 95%成功率
- ✅ Sponsor检测准确率 > 85%
- ✅ 简历优化安全边界100%遵守
- ✅ 系统响应时间 < 2秒

### **产品成功**
- ✅