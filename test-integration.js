#!/usr/bin/env node

/**
 * US Resume Personal Assistant - 集成测试脚本
 * 测试Chrome扩展的所有模块和功能
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// 测试结果统计
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
};

// 测试用例
const testCases = [];

// 工具函数
function log(message, color = colors.white) {
    console.log(color + message + colors.reset);
}

function logHeader(title) {
    console.log('\n' + colors.bright + colors.cyan + '='.repeat(80) + colors.reset);
    console.log(colors.bright + colors.cyan + ` ${title}` + colors.reset);
    console.log(colors.bright + colors.cyan + '='.repeat(80) + colors.reset);
}

function logTest(name, result, message = '') {
    testResults.total++;
    const status = result ? '✅ PASS' : '❌ FAIL';
    const color = result ? colors.green : colors.red;
    
    console.log(`${color}${status}${colors.reset} ${name}`);
    if (message) {
        console.log(`  ${colors.dim}${message}${colors.reset}`);
    }
    
    if (result) {
        testResults.passed++;
    } else {
        testResults.failed++;
    }
    
    testCases.push({ name, result, message });
}

function logSkip(name, reason = '') {
    testResults.total++;
    testResults.skipped++;
    console.log(`${colors.yellow}⏭️ SKIP${colors.reset} ${name}`);
    if (reason) {
        console.log(`  ${colors.dim}${reason}${colors.reset}`);
    }
    testCases.push({ name, result: null, message: reason, skipped: true });
}

// 文件检查测试
function testFileExists(filePath, description) {
    try {
        const exists = fs.existsSync(filePath);
        const message = exists ? `文件存在: ${filePath}` : `文件不存在: ${filePath}`;
        logTest(description, exists, message);
        return exists;
    } catch (error) {
        logTest(description, false, `检查文件时出错: ${error.message}`);
        return false;
    }
}

function testFileContent(filePath, description, checkFunction) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const result = checkFunction(content);
        logTest(description, result, `文件内容检查: ${filePath}`);
        return result;
    } catch (error) {
        logTest(description, false, `读取文件时出错: ${error.message}`);
        return false;
    }
}

// 主要测试函数
async function runAllTests() {
    logHeader('US Resume Personal Assistant - 集成测试');
    console.log(`开始时间: ${new Date().toLocaleString()}`);
    console.log(`项目路径: ${process.cwd()}\n`);
    
    // 第一阶段：文件结构测试
    logHeader('第一阶段：文件结构测试');
    
    // 1.1 检查manifest.json
    testFileExists('manifest.json', 'manifest.json文件存在');
    testFileContent('manifest.json', 'manifest.json格式正确', (content) => {
        try {
            const manifest = JSON.parse(content);
            return manifest.manifest_version === 3;
        } catch {
            return false;
        }
    });
    
    // 1.2 检查核心目录结构
    const requiredDirs = [
        'src',
        'src/background',
        'src/content',
        'src/popup',
        'popup',
        'resume-analyzer'
    ];
    
    requiredDirs.forEach(dir => {
        testFileExists(dir, `目录存在: ${dir}`);
    });
    
    // 1.3 检查核心文件
    const requiredFiles = [
        'manifest.json',
        'popup/index.html',
        'popup/app.js',
        'src/background/service-worker.js',
        'src/content/enhanced-linkedin-monitor.js',
        'src/popup/app.js',
        'resume-analyzer/analyzer.js'
    ];
    
    requiredFiles.forEach(file => {
        testFileExists(file, `文件存在: ${file}`);
    });
    
    // 第二阶段：代码语法测试
    logHeader('第二阶段：代码语法测试');
    
    // 2.1 检查JavaScript语法
    const jsFiles = [
        'popup/app.js',
        'src/background/service-worker.js',
        'src/content/enhanced-linkedin-monitor.js',
        'src/popup/app.js',
        'resume-analyzer/analyzer.js'
    ];
    
    jsFiles.forEach(file => {
        testFileContent(file, `${file} JavaScript语法检查`, (content) => {
            try {
                // 简单的语法检查 - 检查常见语法错误
                if (content.includes('console.log')) {
                    // 有console.log是正常的
                }
                // 检查是否有明显的语法错误模式
                const lines = content.split('\n');
                let hasSyntaxError = false;
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    // 检查未闭合的括号
                    if (line.includes('{') && !line.includes('}') && 
                        !lines.slice(i + 1).join('').includes('}')) {
                        hasSyntaxError = true;
                        break;
                    }
                }
                
                return !hasSyntaxError;
            } catch {
                return false;
            }
        });
    });
    
    // 2.2 检查HTML语法
    testFileContent('popup/index.html', 'popup/index.html HTML语法检查', (content) => {
        return content.includes('<!DOCTYPE html>') && 
               content.includes('<html') && 
               content.includes('</html>');
    });
    
    // 第三阶段：配置验证测试
    logHeader('第三阶段：配置验证测试');
    
    // 3.1 验证manifest.json配置
    testFileContent('manifest.json', 'manifest.json权限配置', (content) => {
        try {
            const manifest = JSON.parse(content);
            const requiredPermissions = ['storage', 'activeTab'];
            const hasRequiredPermissions = requiredPermissions.every(perm => 
                manifest.permissions && manifest.permissions.includes(perm)
            );
            return hasRequiredPermissions;
        } catch {
            return false;
        }
    });
    
    testFileContent('manifest.json', 'manifest.json内容脚本配置', (content) => {
        try {
            const manifest = JSON.parse(content);
            return manifest.content_scripts && 
                   manifest.content_scripts.length > 0 &&
                   manifest.content_scripts[0].matches.includes('*.linkedin.com/jobs/*');
        } catch {
            return false;
        }
    });
    
    // 3.2 验证popup路径
    testFileContent('manifest.json', 'manifest.json popup路径配置', (content) => {
        try {
            const manifest = JSON.parse(content);
            return manifest.action && 
                   manifest.action.default_popup === 'popup/index.html';
        } catch {
            return false;
        }
    });
    
    // 第四阶段：模块功能测试
    logHeader('第四阶段：模块功能测试');
    
    // 4.1 测试Service Worker模块
    testFileContent('src/background/service-worker.js', 'Service Worker模块结构', (content) => {
        return content.includes('class DataManager') || 
               content.includes('class SafeResumeOptimizer') ||
               content.includes('chrome.runtime.onMessage.addListener');
    });
    
    // 4.2 测试Content Script模块
    testFileContent('src/content/enhanced-linkedin-monitor.js', 'LinkedIn监控模块结构', (content) => {
        return content.includes('class LinkedInMonitor') || 
               content.includes('observeJobListings') ||
               content.includes('extractJobDetails');
    });
    
    // 4.3 测试Popup应用模块
    testFileContent('popup/app.js', 'Popup应用模块结构', (content) => {
        return content.includes('class PopupApp') || 
               content.includes('init()') ||
               content.includes('loadSettings()');
    });
    
    // 4.4 测试简历分析器模块
    testFileContent('resume-analyzer/analyzer.js', '简历分析器模块结构', (content) => {
        return content.includes('class ResumeAnalyzer') || 
               content.includes('analyzeResume') ||
               content.includes('optimizeForJob');
    });
    
    // 第五阶段：数据流测试
    logHeader('第五阶段：数据流测试');
    
    // 5.1 检查模块间通信
    const modules = [
        { file: 'popup/app.js', check: 'chrome.runtime.sendMessage' },
        { file: 'src/background/service-worker.js', check: 'chrome.runtime.onMessage' },
        { file: 'src/content/enhanced-linkedin-monitor.js', check: 'chrome.runtime.sendMessage' }
    ];
    
    modules.forEach(({ file, check }) => {
        testFileContent(file, `${file} 包含通信接口: ${check}`, (content) => {
            return content.includes(check);
        });
    });
    
    // 5.2 检查存储API使用
    testFileContent('src/background/service-worker.js', 'Service Worker使用存储API', (content) => {
        return content.includes('chrome.storage.') || content.includes('localStorage');
    });
    
    testFileContent('popup/app.js', 'Popup使用存储API', (content) => {
        return content.includes('chrome.storage.') || content.includes('localStorage');
    });
    
    // 第六阶段：安全边界测试
    logHeader('第六阶段：安全边界测试');
    
    // 6.1 检查API密钥安全处理
    testFileContent('popup/app.js', 'API密钥安全输入处理', (content) => {
        return content.includes('type="password"') || 
               content.includes('input type="password"');
    });
    
    // 6.2 检查数据本地存储
    testFileContent('manifest.json', '仅请求必要权限', (content) => {
        try {
            const manifest = JSON.parse(content);
            const permissions = manifest.permissions || [];
            // 检查是否有危险的权限
            const dangerousPermissions = ['debugger', 'proxy', 'webRequestBlocking'];
            const hasDangerousPermission = dangerousPermissions.some(perm => 
                permissions.includes(perm)
            );
            return !hasDangerousPermission;
        } catch {
            return false;
        }
    });
    
    // 第七阶段：用户体验测试
    logHeader('第七阶段：用户体验测试');
    
    // 7.1 检查错误处理
    testFileContent('popup/app.js', 'Popup包含错误处理', (content) => {
        return content.includes('try') && content.includes('catch');
    });
    
    // 7.2 检查用户反馈
    testFileContent('popup/app.js', 'Popup包含用户反馈机制', (content) => {
        return content.includes('showMessage') || 
               content.includes('alert') ||
               content.includes('console.error');
    });
    
    // 7.3 检查响应式设计
    testFileContent('popup/index.html', 'Popup包含响应式CSS', (content) => {
        return content.includes('@media') || 
               content.includes('max-width') ||
               content.includes('min-width');
    });
    
    // 生成测试报告
    logHeader('测试结果汇总');
    
    console.log(`总计测试: ${testResults.total}`);
    console.log(`${colors.green}通过: ${testResults.passed}${colors.reset}`);
    console.log(`${colors.red}失败: ${testResults.failed}${colors.reset}`);
    console.log(`${colors.yellow}跳过: ${testResults.skipped}${colors.reset}`);
    
    const passRate = testResults.total > 0 ? 
        Math.round((testResults.passed / testResults.total) * 100) : 0;
    
    console.log(`\n通过率: ${colors.bright}${passRate}%${colors.reset}`);
    
    // 显示失败的测试
    if (testResults.failed > 0) {
        console.log(`\n${colors.red}${colors.bright}失败的测试用例:${colors.reset}`);
        testCases
            .filter(tc => tc.result === false)
            .forEach(tc => {
                console.log(`  ❌ ${tc.name}`);
                if (tc.message) {
                    console.log(`     ${colors.dim}${tc.message}${colors.reset}`);
                }
            });
    }
    
    // 显示跳过的测试
    if (testResults.skipped > 0) {
        console.log(`\n${colors.yellow}${colors.bright}跳过的测试用例:${colors.reset}`);
        testCases
            .filter(tc => tc.skipped)
            .forEach(tc => {
                console.log(`  ⏭️ ${tc.name}`);
                if (tc.message) {
                    console.log(`     ${colors.dim}${tc.message}${colors.reset}`);
                }
            });
    }
    
    // 总体评估
    console.log(`\n${colors.bright}总体评估:${colors.reset}`);
    if (passRate >= 90) {
        console.log(`${colors.green}✅ 优秀 - 项目结构良好，准备进行实际浏览器测试${colors.reset}`);
    } else if (passRate >= 70) {
        console.log(`${colors.yellow}⚠️ 良好 - 项目结构基本完整，需要修复一些配置问题${colors.reset}`);
    } else {
        console.log(`${colors.red}❌ 需要改进 - 项目结构存在问题，需要修复后才能进行浏览器测试${colors.reset}`);
    }
    
    // 建议下一步
    console.log(`\n${colors.bright}建议下一步:${colors.reset}`);
    if (testResults.failed === 0) {
        console.log(`1. 在Chrome浏览器中加载扩展进行测试`);
        console.log(`2. 测试Popup界面功能`);
        console.log(`3. 测试LinkedIn页面监控功能`);
        console.log(`4. 测试简历优化功能`);
    } else {
        console.log(`1. 修复上述失败的测试用例`);
        console.log(`2. 重新运行集成测试`);
        console.log(`3. 然后在Chrome浏览器中加载扩展`);
    }
    
    console.log(`\n结束时间: ${new Date().toLocaleString()}`);
    
    // 返回退出码
    process.exit(testResults.failed > 0 ? 1 : 0);
}

// 运行测试
runAllTests().catch(error => {
    console.error(`${colors.red}测试运行出错: ${error.message}${colors.reset}`);
    console.error(error.stack);
    process.exit(1);
});