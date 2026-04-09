#!/usr/bin/env python3
"""
快速验证脚本 - 检查扩展的基本配置和文件结构
可以在没有Chrome浏览器的情况下运行
"""

import os
import sys
import json
import hashlib
from pathlib import Path

# 颜色输出
class Colors:
    RESET = '\033[0m'
    GREEN = '\033[32m'
    RED = '\033[31m'
    YELLOW = '\033[33m'
    CYAN = '\033[36m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.RESET}")

def print_success(text):
    print(f"{Colors.GREEN}✅ {text}{Colors.RESET}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.RESET}")

def print_error(text):
    print(f"{Colors.RED}❌ {text}{Colors.RESET}")

def check_file_exists(path, description):
    if os.path.exists(path):
        print_success(f"{description}: {path}")
        return True
    else:
        print_error(f"{description}: {path} - 文件不存在")
        return False

def check_file_size(path, min_size=10):
    try:
        size = os.path.getsize(path)
        if size >= min_size:
            print_success(f"文件大小正常: {path} ({size} 字节)")
            return True
        else:
            print_warning(f"文件可能为空: {path} ({size} 字节)")
            return False
    except:
        print_error(f"无法获取文件大小: {path}")
        return False

def check_json_file(path, description):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = json.load(f)
        print_success(f"{description}: JSON格式正确")
        return True
    except json.JSONDecodeError as e:
        print_error(f"{description}: JSON格式错误 - {e}")
        return False
    except Exception as e:
        print_error(f"{description}: 读取失败 - {e}")
        return False

def check_manifest_specifics(manifest_path):
    try:
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
        
        checks_passed = 0
        total_checks = 0
        
        # 检查manifest_version
        total_checks += 1
        if manifest.get('manifest_version') == 3:
            print_success("manifest_version: 3 (正确)")
            checks_passed += 1
        else:
            print_error(f"manifest_version: {manifest.get('manifest_version')} (应为3)")
        
        # 检查name
        total_checks += 1
        name = manifest.get('name', '')
        if name:
            print_success(f"扩展名称: {name}")
            checks_passed += 1
        else:
            print_error("扩展名称未设置")
        
        # 检查version
        total_checks += 1
        version = manifest.get('version', '')
        if version:
            print_success(f"版本号: {version}")
            checks_passed += 1
        else:
            print_error("版本号未设置")
        
        # 检查permissions
        total_checks += 1
        permissions = manifest.get('permissions', [])
        required_perms = ['storage', 'activeTab']
        missing_perms = [p for p in required_perms if p not in permissions]
        if not missing_perms:
            print_success(f"权限配置正确: {permissions}")
            checks_passed += 1
        else:
            print_error(f"缺少必要权限: {missing_perms}")
        
        # 检查host_permissions
        total_checks += 1
        host_perms = manifest.get('host_permissions', [])
        required_hosts = ['https://*.linkedin.com/*']
        missing_hosts = [h for h in required_hosts if h not in host_perms]
        if not missing_hosts:
            print_success(f"主机权限正确: {host_perms}")
            checks_passed += 1
        else:
            print_error(f"缺少必要主机权限: {missing_hosts}")
        
        # 检查action
        total_checks += 1
        action = manifest.get('action', {})
        default_popup = action.get('default_popup', '')
        if default_popup == 'popup/index.html':
            print_success(f"Popup路径正确: {default_popup}")
            checks_passed += 1
        else:
            print_error(f"Popup路径错误: {default_popup} (应为popup/index.html)")
        
        # 检查content_scripts
        total_checks += 1
        content_scripts = manifest.get('content_scripts', [])
        if content_scripts and len(content_scripts) > 0:
            first_script = content_scripts[0]
            matches = first_script.get('matches', [])
            js_files = first_script.get('js', [])
            
            if matches and js_files:
                print_success(f"内容脚本配置正确: {len(js_files)}个JS文件")
                checks_passed += 1
            else:
                print_error("内容脚本配置不完整")
        else:
            print_error("未配置内容脚本")
        
        # 检查background
        total_checks += 1
        background = manifest.get('background', {})
        service_worker = background.get('service_worker', '')
        if service_worker == 'src/background/service-worker.js':
            print_success(f"Service Worker路径正确: {service_worker}")
            checks_passed += 1
        else:
            print_error(f"Service Worker路径错误: {service_worker}")
        
        print(f"\n{Colors.BOLD}Manifest检查结果: {checks_passed}/{total_checks} 项通过{Colors.RESET}")
        return checks_passed == total_checks
        
    except Exception as e:
        print_error(f"检查manifest失败: {e}")
        return False

def calculate_file_hash(path):
    """计算文件的MD5哈希值"""
    try:
        with open(path, 'rb') as f:
            file_hash = hashlib.md5()
            chunk = f.read(8192)
            while chunk:
                file_hash.update(chunk)
                chunk = f.read(8192)
        return file_hash.hexdigest()
    except:
        return None

def check_directory_structure():
    print_header("检查目录结构")
    
    required_dirs = [
        '.',
        'popup',
        'src',
        'src/background',
        'src/content',
        'src/popup',
        'resume-analyzer',
        'docs'
    ]
    
    all_exist = True
    for dir_path in required_dirs:
        if os.path.exists(dir_path) and os.path.isdir(dir_path):
            print_success(f"目录存在: {dir_path}/")
        else:
            print_error(f"目录不存在: {dir_path}/")
            all_exist = False
    
    return all_exist

def check_required_files():
    print_header("检查必要文件")
    
    required_files = [
        ('manifest.json', '扩展配置文件'),
        ('popup/index.html', 'Popup主界面'),
        ('popup/app.js', 'Popup逻辑代码'),
        ('src/background/service-worker.js', 'Service Worker'),
        ('src/content/enhanced-linkedin-monitor.js', 'LinkedIn监控脚本'),
        ('resume-analyzer/analyzer.js', '简历分析器'),
        ('README.md', '项目说明文档')
    ]
    
    all_exist = True
    for file_path, description in required_files:
        if check_file_exists(file_path, description):
            check_file_size(file_path)
        else:
            all_exist = False
    
    return all_exist

def check_file_integrity():
    print_header("检查文件完整性")
    
    files_to_check = [
        'manifest.json',
        'popup/index.html',
        'popup/app.js'
    ]
    
    print("计算文件哈希值...")
    for file_path in files_to_check:
        if os.path.exists(file_path):
            file_hash = calculate_file_hash(file_path)
            if file_hash:
                print(f"  {file_path}: {file_hash[:8]}...")
            else:
                print_warning(f"  无法计算哈希值: {file_path}")
        else:
            print_error(f"  文件不存在: {file_path}")
    
    return True

def check_popup_html():
    print_header("检查Popup HTML结构")
    
    try:
        with open('popup/index.html', 'r', encoding='utf-8') as f:
            content = f.read()
        
        checks_passed = 0
        total_checks = 0
        
        # 检查DOCTYPE
        total_checks += 1
        if '<!DOCTYPE html>' in content:
            print_success("DOCTYPE声明正确")
            checks_passed += 1
        else:
            print_error("缺少DOCTYPE声明")
        
        # 检查HTML标签
        total_checks += 1
        if '<html' in content and '</html>' in content:
            print_success("HTML结构完整")
            checks_passed += 1
        else:
            print_error("HTML结构不完整")
        
        # 检查head和body
        total_checks += 1
        if '<head>' in content and '<body>' in content:
            print_success("包含head和body标签")
            checks_passed += 1
        else:
            print_error("缺少head或body标签")
        
        # 检查JavaScript引用
        total_checks += 1
        if '<script src="../src/popup/app.js">' in content or '<script src="app.js">' in content:
            print_success("JavaScript引用正确")
            checks_passed += 1
        else:
            print_error("JavaScript引用可能有问题")
        
        # 检查CSS样式
        total_checks += 1
        if '<style>' in content or 'style=' in content:
            print_success("包含CSS样式")
            checks_passed += 1
        else:
            print_warning("可能缺少CSS样式")
            checks_passed += 1  # 警告但不失败
        
        print(f"\n{Colors.BOLD}Popup HTML检查: {checks_passed}/{total_checks} 项通过{Colors.RESET}")
        return checks_passed >= total_checks - 1  # 允许一个警告
        
    except Exception as e:
        print_error(f"检查Popup HTML失败: {e}")
        return False

def check_js_files():
    print_header("检查JavaScript文件语法")
    
    js_files = [
        ('popup/app.js', 'Popup应用逻辑'),
        ('src/background/service-worker.js', 'Service Worker'),
        ('src/content/enhanced-linkedin-monitor.js', 'LinkedIn监控'),
        ('resume-analyzer/analyzer.js', '简历分析器')
    ]
    
    all_valid = True
    for file_path, description in js_files:
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 简单语法检查
                issues = []
                
                # 检查括号平衡
                if content.count('{') != content.count('}'):
                    issues.append("大括号不平衡")
                
                if content.count('(') != content.count(')'):
                    issues.append("小括号不平衡")
                
                if content.count('[') != content.count(']'):
                    issues.append("方括号不平衡")
                
                # 检查常见语法错误
                if 'console.error' in content or 'try' in content:
                    # 有错误处理是好的
                    pass
                
                if issues:
                    print_warning(f"{description}: {', '.join(issues)}")
                    all_valid = False
                else:
                    print_success(f"{description}: 语法基本正确")
                
                # 显示文件基本信息
                lines = content.count('\n') + 1
                print(f"  行数: {lines}, 大小: {len(content)} 字节")
                
            except Exception as e:
                print_error(f"{description}: 读取失败 - {e}")
                all_valid = False
        else:
            print_error(f"{description}: 文件不存在")
            all_valid = False
    
    return all_valid

def generate_summary():
    print_header("项目验证总结")
    
    print(f"{Colors.BOLD}项目基本信息:{Colors.RESET}")
    print(f"  项目路径: {os.getcwd()}")
    print(f"  验证时间: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 统计文件
    total_files = 0
    total_size = 0
    
    for root, dirs, files in os.walk('.'):
        # 忽略隐藏目录和文件
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        files = [f for f in files if not f.startswith('.')]
        
        for file in files:
            if file.endswith(('.js', '.html', '.json', '.md')):
                file_path = os.path.join(root, file)
                try:
                    total_size += os.path.getsize(file_path)
                    total_files += 1
                except:
                    pass
    
    print(f"  相关文件数: {total_files}")
    print(f"  总文件大小: {total_size:,} 字节 ({total_size/1024:.1f} KB)")
    
    print(f"\n{Colors.BOLD}建议下一步:{Colors.RESET}")
    print("1. 按照 LOCAL_TEST_GUIDE.md 在Chrome浏览器中加载扩展")
    print("2. 逐步测试所有功能")
    print("3. 记录发现的问题")
    print("4. 根据测试结果进行优化")
    
    print(f"\n{Colors.BOLD}关键文件位置:{Colors.RESET}")
    print("  • manifest.json - 扩展配置文件")
    print("  • popup/index.html - 用户界面")
    print("  • src/background/service-worker.js - 后台服务")
    print("  • src/content/enhanced-linkedin-monitor.js - LinkedIn监控")
    print("  • LOCAL_TEST_GUIDE.md - 详细测试指南")

def main():
    print_header("US Resume Personal Assistant - 快速验证")
    print("此脚本检查扩展的基本配置和文件结构，无需Chrome浏览器。")
    
    # 检查当前目录
    if not os.path.exists('manifest.json'):
        print_error("请在项目根目录运行此脚本（包含manifest.json的目录）")
        print("当前目录:", os.getcwd())
        return False
    
    # 执行各项检查
    results = []
    
    results.append(check_directory_structure())
    results.append(check_required_files())
    results.append(check_json_file('manifest.json', 'Manifest配置文件'))
    results.append(check_manifest_specifics('manifest.json'))
    results.append(check_popup_html())
    results.append(check_js_files())
    results.append(check_file_integrity())
    
    # 生成总结
    generate_summary()
    
    # 总体评估
    passed_count = sum(1 for r in results if r)
    total_count = len(results)
    
    print_header("总体评估")
    print(f"{Colors.BOLD}检查结果: {passed_count}/{total_count} 项通过{Colors.RESET}")
    
    if passed_count == total_count:
        print_success("✅ 所有检查通过！扩展结构完整，可以开始浏览器测试。")
        return True
    elif passed_count >= total_count * 0.8:
        print_warning(f"⚠️  大部分检查通过 ({passed_count}/{total_count})，但有一些问题需要修复。")
        return False
    else:
        print_error(f"❌ 检查未通过 ({passed_count}/{total_count})，需要修复问题后才能测试。")
        return False

if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n用户中断")
        sys.exit(1)
    except Exception as e:
        print_error(f"脚本运行出错: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)