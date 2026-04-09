# AI PM求职自动化系统 - 项目总览

## 📋 项目信息
- **项目名称**: AI PM Job Assistant (LinkedIn Resume Optimizer)
- **仓库地址**: https://github.com/sylviaaaye/linkedin-resume
- **版本**: v1.0.0 (MVP)
- **创建日期**: 2026-03-23
- **状态**: 核心模块开发完成，准备集成测试

## 🎯 项目愿景
为F1 OPT国际学生（AI Product Manager方向）提供完整的求职自动化解决方案，包含LinkedIn职位监控、智能筛选、安全简历优化和半自动化申请流程。

## 📁 项目结构

### **文档目录**
```
docs/
├── ARCHITECTURE.md          # 系统架构设计
├── TECH_RESEARCH.md         # 技术调研文档
├── SKILLS_REQUIREMENTS.md   # 技能需求分析
├── PRACTICAL_SKILLS_PLAN.md # 实用技能学习计划
├── PROJECT_SUMMARY.md       # 项目总览（本文档）
└── README.md               # 项目README
```

### **源代码目录**
```
src/
├── content/                 # 内容脚本
│   ├── linkedin-monitor.js          # 基础LinkedIn监控
│   └── enhanced-linkedin-monitor.js # 增强版监控（反爬虫+智能筛选）
├── background/              # 后台服务
│   ├── service-worker.js           # 主服务工作者
│   ├── safe-resume-optimizer.js    # 安全简历优化系统
│   └── data-manager.js             # 数据存储管理
├── popup/                   # 用户界面
│   ├── index.html           # 主界面
│   └── app.js               # 前端逻辑
├── resume-analyzer/         # 简历分析模块
│   └── analyzer.js          # 简历分析器
└── assets/                  # 资源文件
    └── icons/               # 扩展图标
```

### **配置文件**
```
manifest.json                # Chrome扩展配置文件
package.json                 # 项目配置（待创建）
```

## 📊 开发进度

### **已完成模块** ✅

#### **1. 增强版LinkedIn监控系统** (~800行)
- **文件**: `src/content/enhanced-linkedin-monitor.js`
- **功能**:
  - 反爬虫策略（随机延迟、请求限制、人类行为模拟）
  - 智能筛选（AI PM识别、Sponsor检测、经验分析、公司分类）
  - 实时评分系统（多维度加权评分0-100分）
  - 视觉增强（高亮匹配职位，添加评分徽章）

#### **2. 安全简历优化系统** (~1200行)
- **文件**: `src/background/safe-resume-optimizer.js`
- **核心原则**: 绝不添加虚假技能和经历
- **功能**:
  - 简历验证和真实性检查
  - Claude API集成 + 本地分析算法
  - 安全优化建议生成
  - 修改跟踪和版本管理

#### **3. 数据存储管理系统** (~1200行)
- **文件**: `src/background/data-manager.js`
- **数据库**: IndexedDB + 5个数据存储
- **功能**:
  - 完整的CRUD操作接口
  - 数据统计和分析
  - 导出/导入、备份/恢复
  - 定期清理和维护

#### **4. 主服务工作者** (~600行)
- **文件**: `src/background/service-worker.js`
- **功能**:
  - 模块协调和消息处理
  - 用户设置管理
  - 定期任务调度
  - 错误处理和恢复

### **总计代码量**: ~3800行核心代码 + 900行文档

## 🔧 技术栈

### **核心技术**
- **平台**: Chrome Extension MV3
- **前端**: HTML/CSS/JavaScript (Vanilla JS)
- **存储**: IndexedDB + Chrome Storage API
- **AI集成**: Claude API (Anthropic)
- **反爬虫**: 自定义策略（随机延迟、行为模拟）

### **关键算法**
1. **智能筛选算法**: 多维度加权评分
2. **Sponsor检测算法**: H1B数据分析 + 文本匹配
3. **安全优化算法**: 真实性验证 + 边界控制
4. **数据查询算法**: IndexedDB索引优化

## 🚀 核心功能

### **1. LinkedIn职位监控**
- 实时检测LinkedIn AI PM职位
- 智能筛选（Sponsor友好、经验匹配、公司类型）
- 反爬虫保护（稳定运行24小时+）
- 视觉提示和评分展示

### **2. 安全简历优化**
- 基于真实内容的个性化优化
- 严格遵守"不添加虚假技能"原则
- Claude API深度分析 + 本地验证
- 修改跟踪和版本对比

### **3. 数据管理**
- 本地数据存储（隐私保护）
- 职位、简历、申请、公司数据管理
- 统计分析和可视化
- 数据备份和恢复

### **4. 用户界面**
- 简洁直观的Popup界面
- 实时数据展示
- 设置和配置管理
- 操作引导和反馈

## 📈 技术指标

### **性能目标**
- **内存使用**: < 200MB
- **响应时间**: < 2秒
- **稳定性**: 24小时连续运行
- **准确性**: Sponsor检测 > 85%

### **安全目标**
- **数据隐私**: 100%本地存储
- **内容安全**: 100%遵守真实性原则
- **操作安全**: 破坏性操作需要确认
- **API安全**: 密钥安全存储和传输

## 🎯 用户价值

### **目标用户**: F1 OPT国际学生（AI PM方向）
- **痛点**: 重复搜索、格式转换、Sponsor筛选、简历优化
- **解决方案**: 自动化工具解决所有痛点
- **价值主张**: 节省80%求职时间，提高匹配精度

### **具体价值**
1. **时间节省**: 每天自动发现AI PM职位
2. **精准匹配**: 智能筛选Sponsor友好职位
3. **质量提升**: 专业安全的简历优化
4. **流程简化**: 半自动化申请流程

## 📅 开发路线图

### **Phase 1: 核心模块** ✅ **已完成**
- 技术调研和架构设计
- LinkedIn监控系统
- 安全简历优化系统
- 数据存储管理系统

### **Phase 2: 系统集成** 🔄 **进行中**
- 模块集成测试
- 用户界面开发
- 表单填充引擎集成
- MVP版本发布

### **Phase 3: 功能完善** ⏳ **计划中**
- 高级筛选算法
- 申请状态追踪
- 数据分析和报告
- 用户反馈优化

### **Phase 4: 扩展功能** ⏳ **未来规划**
- 多平台支持（Indeed, Glassdoor）
- 社区功能（Sponsor信息共享）
- 高级AI功能（面试模拟）
- 移动端应用

## 🔒 安全与合规

### **安全原则**
1. **真实性第一**: 绝不添加虚假技能和经历
2. **隐私保护**: 所有数据本地存储，可选加密
3. **透明操作**: 所有修改可追溯，用户可审查
4. **合规使用**: 遵守LinkedIn服务条款

### **伦理考虑**
- 不鼓励简历造假
- 提供真实有效的优化建议
- 尊重知识产权和隐私
- 促进公平求职环境

## 👥 团队与贡献

### **核心开发**
- **Sylvia (Ye Shhyoungchee)**: 产品设计、需求分析
- **Lila (AI Assistant)**: 架构设计、代码实现、文档编写

### **开发时间线**
- **2026-03-23 21:00**: 项目启动，需求分析
- **2026-03-23 21:26**: 技术调研完成
- **2026-03-23 21:34**: 架构设计完成
- **2026-03-23 22:09**: 核心模块开发完成
- **2026-03-23 22:10**: 准备GitHub推送

## 📚 相关文档

### **技术文档**
1. [ARCHITECTURE.md](ARCHITECTURE.md) - 完整系统架构设计
2. [TECH_RESEARCH.md](TECH_RESEARCH.md) - 技术调研和工具选型
3. [SKILLS_REQUIREMENTS.md](SKILLS_REQUIREMENTS.md) - 技能需求分析
4. [PRACTICAL_SKILLS_PLAN.md](PRACTICAL_SKILLS_PLAN.md) - 实用技能学习计划

### **用户文档**
1. [README.md](README.md) - 项目介绍和使用指南
2. [INSTALL_GUIDE.md](INSTALL_GUIDE.md) - 安装和配置指南

## 🚀 快速开始

### **环境要求**
- Chrome浏览器 90+
- Claude API密钥（可选，用于高级功能）
- Git（用于版本控制）

### **安装步骤**
1. 克隆仓库: `git clone https://github.com/sylviaaaye/linkedin-resume.git`
2. 打开Chrome扩展管理: `chrome://extensions/`
3. 开启开发者模式
4. 加载已解压的扩展程序
5. 配置API密钥（可选）

### **使用流程**
1. 在LinkedIn职位页面打开扩展
2. 上传或输入简历
3. 查看自动发现的AI PM职位
4. 选择职位进行简历优化
5. 确认优化结果并申请

## 📞 支持与反馈

### **问题报告**
- GitHub Issues: https://github.com/sylviaaaye/linkedin-resume/issues
- 功能请求: 通过Issues提交

### **贡献指南**
1. Fork仓库
2. 创建功能分支
3. 提交更改
4. 发起Pull Request

### **联系方式**
- GitHub: [sylviaaaye](https://github.com/sylviaaaye)
- 项目维护: Sylvia (Ye Shhyoungchee)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢所有为项目提供想法、反馈和贡献的人。特别感谢Claude API提供的AI分析能力，以及开源社区的各种工具和库。

---

**最后更新**: 2026-03-23 22:10  
**版本**: v1.0.0  
**状态**: 核心开发完成，准备测试