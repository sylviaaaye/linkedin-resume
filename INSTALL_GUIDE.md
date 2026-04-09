# 🇺🇸 US Resume Personal Assistant - 安装指南

## 📦 下载项目

### 方法1：GitHub直接下载
1. 访问项目页面：https://github.com/sylviaaaye/resume-autofill-extension
2. 点击绿色的 "Code" 按钮
3. 选择 "Download ZIP"
4. 解压ZIP文件到本地目录

### 方法2：Git克隆
```bash
git clone https://github.com/sylviaaaye/resume-autofill-extension.git
cd resume-autofill-extension
```

## 🔧 Chrome扩展安装步骤

### 步骤1：打开Chrome扩展管理页面
1. 打开Chrome浏览器
2. 在地址栏输入：`chrome://extensions/`
3. 按回车键进入

### 步骤2：启用开发者模式
1. 在扩展管理页面右上角，找到"开发者模式"开关
2. 点击开关，启用开发者模式

### 步骤3：加载扩展
1. 点击"加载已解压的扩展程序"按钮
2. 选择你解压的`us-resume-personal-assistant`文件夹
3. 点击"选择文件夹"

### 步骤4：验证安装
1. 你应该能看到"US Resume Personal Assistant"扩展
2. 扩展图标应该出现在Chrome工具栏中
3. 点击图标可以打开扩展界面

## 🔑 Claude API配置

### 步骤1：获取Claude API密钥
1. 访问：https://console.anthropic.com/
2. 登录你的账户
3. 点击"Get API Keys"
4. 创建新的API密钥
5. 复制密钥（以`sk-ant-`开头）

### 步骤2：在扩展中配置API密钥
1. 点击Chrome工具栏中的扩展图标
2. 在"Claude API Configuration"部分
3. 粘贴你的API密钥到输入框
4. 点击"Save"按钮
5. 看到"API key saved successfully"提示

## 📄 使用扩展

### 第一步：上传简历
1. 点击扩展图标打开界面
2. 在"Resume Analysis"部分
3. 拖拽PDF简历文件到上传区域
4. 或者点击上传区域选择文件
5. 支持格式：PDF、DOCX、TXT

### 第二步：分析简历
1. 上传成功后，点击"🔍 Analyze Resume"按钮
2. 等待AI分析（约30-60秒）
3. 查看分析结果：
   - 综合评分（0-10分）
   - ATS兼容性评估
   - 具体优化建议
   - 修改前后对比

### 第三步：优化简历
1. 查看"Recommendations"标签页的具体建议
2. 查看"Optimized Version"标签页的优化后简历
3. 点击"📋 Copy Text"复制优化后的简历
4. 点击"📄 Export PDF"导出PDF版本

### 第四步：LinkedIn监控
1. 访问LinkedIn Jobs页面
2. 扩展自动监控新职位
3. 相关职位会显示"🌟 Top Match"或"🎯 Good Match"标记
4. 点击标记查看匹配详情

## 🎯 功能说明

### 1. 简历分析功能
- **AI分析**：使用Claude AI分析简历内容
- **ATS优化**：提高自动筛选系统通过率
- **Sponsor策略**：突出国际学生优势
- **格式转换**：转换为美国标准简历格式

### 2. LinkedIn监控功能
- **实时监控**：24/7监控LinkedIn新职位
- **智能匹配**：自动识别AI PM相关职位
- **Sponsor检测**：识别愿意Sponsor的公司
- **时效提醒**：24小时内新职位提醒

### 3. 隐私保护
- **本地处理**：简历内容在本地浏览器处理
- **加密传输**：API调用使用加密传输
- **数据不存储**：不存储你的简历数据
- **完全控制**：你可以随时清除所有数据

## 🔧 故障排除

### 问题1：扩展无法加载
**解决方案**：
1. 确保选择了正确的文件夹（包含manifest.json）
2. 确保Chrome版本是最新的
3. 重启Chrome浏览器

### 问题2：API密钥无效
**解决方案**：
1. 检查密钥是否正确复制（以`sk-ant-`开头）
2. 检查Claude账户是否有足够的配额
3. 尝试重新生成API密钥

### 问题3：PDF无法上传
**解决方案**：
1. 确保PDF文件小于10MB
2. 尝试转换为DOCX或TXT格式
3. 检查文件是否损坏

### 问题4：LinkedIn监控不工作
**解决方案**：
1. 确保在LinkedIn Jobs页面
2. 刷新页面重新加载扩展
3. 检查扩展权限设置

## 📞 技术支持

### 问题反馈
1. **GitHub Issues**：https://github.com/sylviaaaye/resume-autofill-extension/issues
2. **Email**：xiangchi.ye@outlook.com

### 功能建议
如果你有新的功能需求或改进建议，欢迎通过以上渠道反馈。

## 🔄 更新扩展

### 手动更新
1. 从GitHub下载最新版本
2. 在`chrome://extensions/`页面
3. 点击扩展的"刷新"按钮
4. 或重新加载扩展

### 自动更新（未来版本）
未来版本将支持自动更新功能。

## 📚 使用技巧

### 最佳实践
1. **定期更新简历**：每2-3个月更新一次简历
2. **针对性修改**：根据目标职位调整简历
3. **关键词优化**：添加职位描述中的关键词
4. **量化成果**：用数据证明你的成就

### 求职策略
1. **精准申请**：不要盲目申请，选择匹配度高的职位
2. **网络拓展**：利用LinkedIn建立人脉
3. **面试准备**：针对AI PM常见问题准备
4. **持续学习**：关注AI产品管理最新趋势

---

**祝你求职顺利！🇺🇸**

*"The future belongs to those who believe in the beauty of their dreams." - Eleanor Roosevelt*