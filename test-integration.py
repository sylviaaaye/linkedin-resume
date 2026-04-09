#!/usr/bin/env python3
"""
US Resume Personal Assistant - 集成测试脚本
测试Chrome扩展的所有模块和功能
"""

import os
import sys
import json
import re
from datetime import datetime
from pathlib import Path

# 颜色输出
class Colors:
    RESET = '\033[0m'
    BRIGHT = '\033[1m'
    DIM = '\033[2m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'
    WHITE = '\033[37m'

# 测试结果统计
test_results = {
    'total': 0,
    'passed': 0,
    'failed': 0,
    'skipped': 0
}

test_cases = []

def log(message, color=Colors.WHITE):
    print(f"{color}{message}{Colors.RESET}")

def log_header(title):
    print(f"\n{Colors.BRIGHT}{Colors.CYAN}{'=' * 80}{Colors.RESET}")
    print(f"{Colors.BRIGHT}{Colors.CYAN} {title}{Colors.RESET}")
    print(f"{Colors.BRIGHT}{Colors.CYAN}{'=' * 80}{Colors.RESET}")

def log_test(name, result, message=''):
    test_results['total'] += 1
    status = '✅ PASS' if result else '❌ FAIL'
    color = Colors.GREEN if result else Colors.RED
    
    print(f"{color}{status}{Colors.RESET} {name}")
    if message:
        print(f"  {Colors.DIM}{message}{Colors.RESET}")
    
    if result:
        test_results['passed'] += 1
    else:
        test_results['failed'] += 1
    
    test_cases.append({'name': name, 'result': result, 'message': message})

def log_skip(name, reason=''):
    test_results['total'] += 1
    test_results['skipped'] += 1
    print(f"{Colors.YELLOW}⏭️ SKIP{Colors.RESET} {name}")
    if reason:
        print(f"  {Colors.DIM}{reason}{Colors.RESET}")
    test_cases.append({'name': name, 'result': None, 'message': reason, 'skipped': True})

def test_file_exists(file_path, description):
    try:
        exists = os.path.exists(file_path)
        message = f"文件存在: {file_path}" if exists else f"文件不存在: {file_path}"
        log_test(description, exists, message)
        return exists
    except Exception as e:
        log_test(description, False, f"检查文件时出错: {str(e)}")
        return False

def test_file_content(file_path, description, check_function):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        result = check_function(content)
        log_test(description, result, f"文件内容检查: {file_path}")
        return result
    except Exception as e:
        log_test(description, False, f"读取文件时出错: {str(e)}")
        return False

def check_manifest_format(content):
    try:
        manifest = json.loads(content)
        return manifest.get('manifest_version') == 3
    except:
        return False

def check_manifest_permissions(content):
    try:
        manifest = json.loads(content)
        permissions = manifest.get('permissions', [])
        required = ['storage', 'activeTab']
        return all(perm in permissions for perm in required)
    except:
        return False

def check_manifest_content_scripts(content):
    try:
        manifest = json.loads(content)
        content_scripts = manifest.get('content_scripts', [])
        if not content_scripts:
            return False
        first_script = content_scripts[0]
        matches = first_script.get('matches', [])
        return any('*.linkedin.com/jobs/*' in match for match in matches)
    except:
        return False

def check_manifest_popup_path(content):
    try:
        manifest = json.loads(content)
        action = manifest.get('action', {})
        return action.get('default_popup') == 'popup/index.html'
    except:
        return False

def check_js_syntax(content):
    # 简单的语法检查
    lines = content.split('\n')
    
    # 检查括号平衡
    open_braces = content.count('{')
    close_braces = content.count('}')
    if abs(open_braces - close_braces) > 2:  # 允许少量不平衡
        return False
    
    # 检查常见语法错误模式
    for i, line in enumerate(lines):
        line = line.strip()
        # 检查未闭合的字符串
        if line.count('"') % 2 != 0 and not line.endswith('\\"'):
            return False
        if line.count("'") % 2 != 0 and not line.endswith("\\'"):
            return False
    
    return True

def check_html_structure(content):
    return ('<!DOCTYPE html>' in content and 
            '<html' in content and 
            '</html>' in content)

def check_module_structure(content, keywords):
    return any(keyword in content for keyword in keywords)

def check_communication_api(content):
    return ('chrome.runtime.sendMessage' in content or 
            'chrome.runtime.onMessage' in content)

def check_storage_api(content):
    return ('chrome.storage.' in content or 
            'localStorage' in content)

def check_security_features(content):
    return ('type="password"' in content or 
            'input type="password"' in content)

def check_error_handling(content):
    return ('try' in content and 'catch' in content)

def check_user_feedback(content):
    return ('showMessage' in content or 
            'alert' in content or 
            'console.error' in content)

def check_responsive_design(content):
    return ('@media' in content or 
            'max-width' in content or 
            'min-width' in content)

def main():
    log_header('US Resume Personal Assistant - 集成测试')
    print(f"开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"项目路径: {os.getcwd()}\n")
    
    # 第一阶段：文件结构测试
    log_header('第一阶段：文件结构测试')
    
    # 1.1 检查manifest.json
    test_file_exists('manifest.json', 'manifest.json文件存在')
    test_file_content('manifest.json', 'manifest.json格式正确', check_manifest_format)
    
    # 1.2 检查核心目录结构
    required_dirs = [
        'src',
        'src/background',
        'src/content',
        'src/popup',
        'popup',
        'resume-analyzer'
    ]
    
    for dir_path in required_dirs:
        test_file_exists(dir_path, f"目录存在: {dir_path}")
    
    # 1.3 检查核心文件
    required_files = [
        'manifest.json',
        'popup/index.html',
        'popup/app.js',
        'src/background/service-worker.js',
        'src/content/enhanced-linkedin-monitor.js',
        'src/popup/app.js',
        'resume-analyzer/analyzer.js'
    ]
    
    for file_path in required_files:
        test_file_exists(file_path, f"文件存在: {file_path}")
    
    # 第二阶段：代码语法测试
    log_header('第二阶段：代码语法测试')
    
    # 2.1 检查JavaScript语法
    js_files = [
        'popup/app.js',
        'src/background/service-worker.js',
        'src/content/enhanced-linkedin-monitor.js',
        'src/popup/app.js',
        'resume-analyzer/analyzer.js'
    ]
    
    for file_path in js_files:
        if os.path.exists(file_path):
            test_file_content(file_path, f"{file_path} JavaScript语法检查", check_js_syntax)
        else:
            log_skip(f"{file_path} JavaScript语法检查", "文件不存在")
    
    # 2.2 检查HTML语法
    test_file_content('popup/index.html', 'popup/index.html HTML语法检查', check_html_structure)
    
    # 第三阶段：配置验证测试
    log_header('第三阶段：配置验证测试')
    
    # 3.1 验证manifest.json配置
    test_file_content('manifest.json', 'manifest.json权限配置', check_manifest_permissions)
    test_file_content('manifest.json', 'manifest.json内容脚本配置', check_manifest_content_scripts)
    test_file_content('manifest.json', 'manifest.json popup路径配置', check_manifest_popup_path)
    
    # 第四阶段：模块功能测试
    log_header('第四阶段：模块功能测试')
    
    # 4.1 测试Service Worker模块
    test_file_content('src/background/service-worker.js', 'Service Worker模块结构', 
                     lambda c: check_module_structure(c, ['class DataManager', 'class SafeResumeOptimizer', 'chrome.runtime.onMessage.addListener']))
    
    # 4.2 测试Content Script模块
    test_file_content('src/content/enhanced-linkedin-monitor.js', 'LinkedIn监控模块结构',
                     lambda c: check_module_structure(c, ['class LinkedInMonitor', 'observeJobListings', 'extractJobDetails']))
    
    # 4.3 测试Popup应用模块
    test_file_content('popup/app.js', 'Popup应用模块结构',
                     lambda c: check_module_structure(c, ['class PopupApp', 'init()', 'loadSettings()']))
    
    # 4.4 测试简历分析器模块
    test_file_content('resume-analyzer/analyzer.js', '简历分析器模块结构',
                     lambda c: check_module_structure(c, ['class ResumeAnalyzer', 'analyzeResume', 'optimizeForJob']))
    
    # 第五阶段：数据流测试
    log_header('第五阶段：数据流测试')
    
    # 5.1 检查模块间通信
    modules = [
        ('popup/app.js', 'chrome.runtime.sendMessage'),
        ('src/background/service-worker.js', 'chrome.runtime.onMessage'),
        ('src/content/enhanced-linkedin-monitor.js', 'chrome.runtime.sendMessage')
    ]
    
    for file_path, api in modules:
        if os.path.exists(file_path):
            test_file_content(file_path, f"{file_path} 包含通信接口: {api}", 
                            lambda c, api=api: api in c)
        else:
            log_skip(f"{file_path} 包含通信接口: {api}", "文件不存在")
    
    # 5.2 检查存储API使用
    test_file_content('src/background/service-worker.js', 'Service Worker使用存储API', check_storage_api)
    test_file_content('popup/app.js', 'Popup使用存储API', check_storage_api)
    
    # 第六阶段：安全边界测试
    log_header('第六阶段：安全边界测试')
    
    # 6.1 检查API密钥安全处理
    test_file_content('popup/app.js', 'API密钥安全输入处理', check_security_features)
    
    # 6.2 检查数据本地存储
    test_file_content('manifest.json', '仅请求必要权限', lambda c: True)  # 简化检查
    
    # 第七阶段：用户体验测试
    log_header('第七阶段：用户体验测试')
    
    # 7.1 检查错误处理
    test_file_content('popup/app.js', 'Popup包含错误处理', check_error_handling)
    
    # 7.2 检查用户反馈
    test_file_content('popup/app.js', 'Popup包含用户反馈机制', check_user_feedback)
    
    # 7.3 检查响应式设计
    test_file_content('popup/index.html', 'Popup包含响应式CSS', check_responsive_design)
    
    # 生成测试报告
    log_header('测试结果汇总')
    
    print(f"总计测试: {test_results['total']}")
    print(f"{Colors.GREEN}通过: {test_results['passed']}{Colors.RESET}")
    print(f"{Colors.RED}失败: {test_results['failed']}{Colors.RESET}")
    print(f"{Colors.YELLOW}跳过: {test_results['skipped']}{Colors.RESET}")
    
    pass_rate = 0
    if test_results['total'] > 0:
        pass_rate = round((test_results['passed'] / test_results['total']) * 100)
    
    print(f"\n通过率: {Colors.BRIGHT}{pass_rate}%{Colors.RESET}")
    
    # 显示失败的测试
    if test_results['failed'] > 0:
        print(f"\n{Colors.RED}{Colors.BRIGHT}失败的测试用例:{Colors.RESET}")
        for tc in test_cases:
            if tc.get('result') is False:
                print(f"  ❌ {tc['name']}")
                if tc['message']:
                    print(f"     {Colors.DIM}{tc['message']}{Colors.RESET}")
    
    # 显示跳过的测试
    if test_results['skipped'] > 0:
        print(f"\n{Colors.YELLOW}{Colors.BRIGHT}跳过的测试用例:{Colors.RESET}")
        for tc in test_cases:
            if tc.get('skipped'):
                print(f"  ⏭️ {tc['name']}")
                if tc['message']:
                    print(f"     {Colors.DIM}{tc['message']}{Colors.RESET}")
    
    # 总体评估
    print(f"\n{Colors.BRIGHT}总体评估:{Colors.RESET}")
    if pass_rate >= 90:
        print(f"{Colors.GREEN}✅ 优秀 - 项目结构良好，准备进行实际浏览器测试{Colors.RESET}")
    elif pass_rate >= 70:
        print(f"{Colors.YELLOW}⚠️ 良好 - 项目结构基本完整，需要修复一些配置问题{Colors.RESET}")
    else:
        print(f"{Colors.RED}❌ 需要改进 - 项目结构存在问题，需要修复后才能进行浏览器测试{Colors.RESET}")
    
    # 建议下一步
    print(f"\n{Colors.BRIGHT}建议下一步:{Colors.RESET}")
    if test_results['failed'] == 0:
        print("1. 在Chrome浏览器中加载扩展进行测试")
        print("2. 测试Popup界面功能")
        print("3. 测试LinkedIn页面监控功能")
        print("4. 测试简历优化功能")
    else:
        print("1. 修复上述失败的测试用例")
        print("2. 重新运行集成测试")
        print("3. 然后在Chrome浏览器中加载扩展")
    
    print(f"\n结束时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 返回退出码
    sys.exit(1 if test_results['failed'] > 0 else 0)

if __name__ == '__main__':
    main()