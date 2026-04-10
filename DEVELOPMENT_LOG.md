# Development Log — AI PM Assistant Chrome Extension

> 给下一个 Claude 会话看的开发接力文档

---

## 项目概况

**目标用户**：F1 OPT 国际学生，求职 AI Product Manager 岗位
**技术栈**：Chrome Extension Manifest V3，原生 JS，IndexedDB，Claude API
**仓库**：https://github.com/sylviaaaye/linkedin-resume.git

---

## 关键文件地图

```
linkedin-resume-main/
├── manifest.json                          # MV3 配置，popup + content script + service worker
├── popup/
│   └── index.html                         # 主 UI（manifest 指向此文件）
├── src/
│   ├── popup/
│   │   └── app.js                         # Popup 前端逻辑（PopupApp 类）
│   ├── background/
│   │   ├── service-worker.js              # 消息路由中心（AIPMJobAssistant 类）
│   │   ├── safe-resume-optimizer.js       # 简历优化核心（本次重写）
│   │   └── data-manager.js                # IndexedDB 封装（DataManager 类）
│   └── content/
│       └── enhanced-linkedin-monitor.js   # LinkedIn 职位抓取 content script
└── resume-analyzer/
    └── analyzer.js                        # 旧版分析器，当前未使用
```

---

## 已完成功能

### ✅ Feature 1: Resume Optimization（简历优化）

**状态**：完整可用

**改了什么**：
- 原来是 5 阶段本地字符串操作流程，完全无效（没有真正用到 Claude）
- 重写 `safe-resume-optimizer.js` 中的 `optimizeForJob()` 方法
- 新增 `callClaudeForOptimization()` — 直接将简历 + JD 发给 Claude，让 Claude 一次性返回优化结果
- 修复：缺少 `anthropic-dangerous-direct-browser-access: true` header（Chrome 扩展调 Anthropic API 必须加）
- 模型：`claude-sonnet-4-6`

**核心 prompt 设计**（在 `callClaudeForOptimization`）：
- System：严格安全规则，禁止添加假技能/假经历，允许改写措辞/调整顺序/增强动词
- User：传入简历 + JD（可选），要求返回 JSON `{ optimizedResume, changes, summary }`

**返回格式**（`optimizeForJob` 返回）：
```js
{
  success: true,
  optimizedResume: "...",
  changes: ["change 1", "change 2", ...],
  summary: "...",
  optimizationReport: { summary: { safetyPassed: true, changesCount: N } },
  metadata: { originalLength, optimizedLength, changeCount, timestamp }
}
```

---

### ✅ Feature 2: Resume Version Management（版本管理）

**状态**：完整可用

**改了什么**：

1. **自动保存版本名**（`service-worker.js` `handleOptimizeResume`）
   优化完成后自动保存时，版本名格式：`优化版本 4/10 17:55（针对 JD）`

2. **版本列表显示**（`popup/app.js` `loadResumeVersions`）
   显示：版本名 + 改动数 badge + 日期
   **重要**：按钮从 `onclick="..."` 改为 `data-action` + `addEventListener`
   原因：MV3 CSP 阻止动态生成 HTML 里的 inline event handlers

3. **静态 HTML 按钮**（`popup/index.html` + `popup/app.js` `initUIEvents`）
   Save Version / Export / Upload 三个按钮从 `onclick` 属性改为 `initUIEvents()` 里用 `addEventListener` 绑定
   对应 ID：`saveVersionBtn` / `exportResumeBtn` / `uploadResumeBtn`

---

### ✅ Feature 3: System Status 显示

**状态**：完整可用

**改了什么**：

1. **Bug 修复**（`data-manager.js` `exportData`）
   `getJobs({}, 'savedAt', 1000)` → `getJobs({}, 'score', 1000)`
   `savedAt` 不在 jobs 的 IndexedDB 索引里，导致 `getDatabaseStats` 抛异常 → System Status 永远 loading

2. **UI 改进**（`popup/app.js` `updateSettingsUI`）
   有数据时显示：职位数、申请数、简历版本数、运行时间、版本号
   无数据时显示 loading 提示

---

## 待开发功能

| 优先级 | 功能 | 状态 | 说明 |
|--------|------|------|------|
| **4** | LinkedIn Job 监控 | ❌ 未开发 | Content script 已写但未验证；需在 LinkedIn jobs 页面才能触发 |
| **5** | PDF 上传支持 | ❌ 未开发 | `resume-analyzer/pdf.worker.js` 存在但未接入 popup；需集成 pdf.js |
| **6** | Job 详情页 | ❌ 空壳 | `viewJob()` 目前只弹 toast |
| **7** | Dashboard 职位列表 | ❌ 无数据 | 依赖 LinkedIn 监控先完成 |

---

## 重要技术约束

### MV3 CSP 规则
**所有按钮事件必须用 `addEventListener`，不能用 `onclick="..."` 属性**
这包括动态生成的 HTML 和静态 HTML 中的按钮。

正确做法：
```js
// 动态生成的列表 → data 属性 + 事件委托
container.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => { ... });
});

// 静态 HTML 按钮 → 在 initUIEvents() 里绑定
document.getElementById('myBtn')?.addEventListener('click', () => this.myMethod());
```

### Claude API 调用（Chrome 扩展必须）
```js
headers: {
    'Content-Type': 'application/json',
    'x-api-key': this.apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'   // 缺少此 header → 400 错误
}
model: 'claude-sonnet-4-6'
```

### 消息通信格式
Popup → Service Worker 通过 `chrome.runtime.sendMessage`：
```js
// Popup 发送
chrome.runtime.sendMessage({ action: 'actionName', key1: val1, ... }, callback)

// Service Worker 接收（service-worker.js handleMessage switch）
case 'actionName': return await this.handleActionName(request.key1, ...);
```

### IndexedDB 索引（data-manager.js schema）
只能用已定义的索引作为 `sortBy` 参数：
- `jobs`：`score`, `postedAt`, `company`, `sponsorStatus`, `experienceLevel`, `companyType`, `status`
- `resumes`：`createdAt`, `jobId`, `version`, `isOriginal`
- `applications`：`jobId`, `status`, `appliedAt`, `company`

---

## 下一步开发建议：LinkedIn Job 监控

### 当前状态
`src/content/enhanced-linkedin-monitor.js` 已写好框架：
- 在 `linkedin.com/jobs/*` 页面自动运行
- 有关键词匹配、评分逻辑、反爬延迟
- 发现职位后通过 `chrome.runtime.sendMessage({ action: 'newJobFound', jobData })` 上报

### 需要验证/修复的点
1. 职位数据抓取是否匹配 LinkedIn 当前 DOM 结构（LinkedIn 会改 HTML）
2. `handleScanJobs()` 在 service-worker 里找当前 tab 的逻辑是否正确
3. Dashboard 的职位列表渲染（`updateRecommendedJobs` / `updateJobsList`）是否正常

### 建议步骤
1. 先在 LinkedIn jobs 页面打开 DevTools，看 content script 是否加载（console 有无 "AI PM求职助手" 日志）
2. 检查 content script 里的 DOM selector 是否匹配当前 LinkedIn HTML
3. 修复 selector 后测试 Scan LinkedIn 按钮

---

## 已知待修 Bug

| Bug | 位置 | 影响 |
|-----|------|------|
| 旧保存的版本显示名称为 "1" | DataManager 默认值 `version: resumeData.version \|\| 1` | 低，仅影响旧数据显示 |
| Dashboard `refreshJobsBtn2` 未绑定事件 | `popup/app.js initUIEvents` 里没有绑 `refreshJobsBtn2` | 低，Jobs tab 的刷新按钮无效 |
| `saveResumeVersion` 用 `prompt()` 交互 | `popup/app.js` | 低，功能能用但 UX 差 |

---

*最后更新：2026-04-10*
*开发进度：3/7 功能完成*
