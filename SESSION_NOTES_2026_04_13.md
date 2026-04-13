# 开发会话记录 — 2026-04-13

## 本次完成的修复

### 1. PDF 上传乱码修复
- **问题**: Upload PDF 后 Resume Editor 显示原始 PDF 二进制内容
- **原因**: `readFileAsText()` 用 `readAsText()` 直接读 binary
- **修复**: 安装 `pdfjs-dist@3`，复制 `pdf.min.js` + `pdf.worker.js` 到 `resume-analyzer/`
- **相关文件**: `src/popup/app.js`（新增 `extractTextFromPDF`）, `popup/index.html`, `manifest.json`

### 2. Resume 优化 JSON 解析失败修复
- **问题**: `safe-resume-optimizer.js:165` — "Claude 返回的 JSON 解析失败"
- **原因**: Claude 返回的 optimizedResume 包含原始换行符/引号，破坏 JSON 解析
- **修复**: 彻底放弃 JSON 格式，改用分隔符标签
  ```
  ===OPTIMIZED_RESUME=== ... ===END_RESUME===
  ===CHANGES=== ... ===END_CHANGES===
  ===SUMMARY=== ... ===END_SUMMARY===
  ```
- **相关文件**: `src/background/safe-resume-optimizer.js`

### 3. Resume Version load 体验改进
- Load 版本后自动 scrollIntoView + focus 到 textarea
- **相关文件**: `src/popup/app.js`（`loadResumeVersion`）

### 4. LinkedIn Job 监控 — 修复 scanJobs 无响应
- **问题**: content script 收到 `scanJobs` 消息但无响应（`setupMessageListener` 缺少 case）
- **修复**: 在 `setupMessageListener` 加入 `case 'scanJobs'`，触发 `scanCurrentPage()`
- **相关文件**: `src/content/enhanced-linkedin-monitor.js`

---

## LinkedIn DOM 调查记录（未解决）

### 背景
LinkedIn 在 2025+ 完全重写了 DOM：
- 所有 class 名都是哈希值（`_23fd8694 b2865a35...`），不可用
- 旧的 `data-job-id`、`data-occludable-job-id` 属性已全部移除

### 调查结果（在 linkedin.com/jobs/search-results/ 测试）

| 选择器 | 结果 | 说明 |
|--------|------|------|
| `li[data-occludable-job-id]` | 0 | 属性已移除 |
| `[data-job-id]` | 0 | 属性已移除 |
| `.job-card-container` | 0 | 类名已哈希化 |
| `a[href*="currentJobId"]` | 20 | ⚠️ 全在右侧详情面板，不是侧边栏列表 |
| `a[href*="/jobs/view/"]` | 1 | 只有详情面板有 |
| `li button[aria-label]` | 5 | 第1个是 navbar 导航按钮，不是职位卡片 |
| `div[role="button"][tabindex="0"]` | 33 | ariaLabel=null，有 `componentkey` 属性 |
| `[role="listitem"]` | 0 | 无此角色 |
| `li` 总数 | 45 | 包含 navbar 和其他 |

### 关键发现
1. **LinkedIn 职位列表使用 pushState 导航**，不是传统 `<a>` 标签
2. **右侧详情面板**的链接才含 `currentJobId`，侧边栏列表用的是不同机制
3. **侧边栏职位卡片**是 `div[role="button"]` 结构，带有 `componentkey` UUID 属性
4. `li` 里面第一个子元素是 `<button aria-label="...">`（但第一个 li 是 navbar）

### 下次继续调试的命令

```javascript
// 1. 找有 componentkey 的所有元素
document.querySelectorAll('[componentkey]').length

// 2. 看第一个 componentkey 元素内容
document.querySelectorAll('[componentkey]')[0].innerText.slice(0, 100)

// 3. 找左侧面板的职位卡片（按 x 坐标过滤）
Array.from(document.querySelectorAll('div[role="button"]'))
  .filter(d => {
    const r = d.getBoundingClientRect();
    return r.left < 400 && r.width > 150 && r.height > 50;
  }).length

// 4. 找有意义的 aria-label（长度>20，排除导航）
Array.from(document.querySelectorAll('[aria-label]'))
  .filter(el => el.ariaLabel && el.ariaLabel.length > 20)
  .slice(0, 5)
  .map(el => el.tagName + ': ' + el.ariaLabel.slice(0, 80))

// 5. 看 li 里有没有职位标题文字
Array.from(document.querySelectorAll('li'))
  .map(li => li.innerText.slice(0, 50).trim())
  .filter(t => t.length > 5)
  .slice(0, 10)
```

### 最有希望的下一步
- **`[componentkey]` 属性**是 LinkedIn 2025+ 用于组件标识的属性，每个职位卡片可能都有唯一的 componentkey
- **按位置过滤** `div[role="button"]`（x < 400px）很可能命中侧边栏职位卡片
- 一旦找到正确元素，job ID 可能需要从 URL 变化事件或 componentkey 推断

---

## 架构说明

### 整体流程
```
用户打开 linkedin.com/jobs/*
  → Chrome 自动注入 enhanced-linkedin-monitor.js
  → content script 扫描职位卡片
  → chrome.runtime.sendMessage('newJobFound', jobData)
  → service-worker.js 接收并存入 IndexedDB
  → popup 打开时 getJobs 从 IndexedDB 读取展示
```

### 重要：开发时必须的步骤
每次修改 content script 后：
1. `chrome://extensions` → 刷新扩展
2. 刷新 LinkedIn 页面（F5）
3. 查看 LinkedIn tab 的 DevTools Console（不是 service worker console）

### Content Script 隔离世界限制
- `window.AiPmJobAssistant` 在 DevTools console 里永远是 `undefined`
- Content script 的 `console.log` 会出现在页面 console 里
- 用 Filter 搜索 "AI PM" 或 "找到" 来过滤我们的日志

---

## 待开发功能

1. ✅ Resume 优化（Claude API）
2. ✅ Resume 版本管理
3. ✅ System Status 显示
4. ✅ PDF 上传支持
5. 🔴 LinkedIn Job 监控（选择器待修复，见上方调查记录）
6. ⏳ Job 详情 / View Changes diff 对比
7. ⏳ Jobs tab 每个职位加 "Optimize for this job" 按钮

## 关键文件路径

| 文件 | 说明 |
|------|------|
| `popup/index.html` | 主 UI（manifest 指向此文件） |
| `src/popup/app.js` | Popup 前端逻辑 |
| `src/background/service-worker.js` | 后台调度，消息路由 |
| `src/background/safe-resume-optimizer.js` | 简历优化核心 |
| `src/background/data-manager.js` | IndexedDB 数据存储 |
| `src/content/enhanced-linkedin-monitor.js` | LinkedIn 职位抓取（选择器待修复）|
| `resume-analyzer/pdf.min.js` | PDF.js 库（pdfjs-dist@3 legacy build）|
| `resume-analyzer/pdf.worker.js` | PDF.js worker |
