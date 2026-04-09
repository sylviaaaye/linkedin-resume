#!/usr/bin/env python3
import sys

def check_file_syntax(file_path):
    print(f"\n检查文件: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"读取文件失败: {e}")
        return False
    
    # 检查括号平衡
    open_braces = content.count('{')
    close_braces = content.count('}')
    print(f"大括号: {{ = {open_braces}, }} = {close_braces}, 差值 = {open_braces - close_braces}")
    
    open_paren = content.count('(')
    close_paren = content.count(')')
    print(f"小括号: ( = {open_paren}, ) = {close_paren}, 差值 = {open_paren - close_paren}")
    
    open_bracket = content.count('[')
    close_bracket = content.count(']')
    print(f"方括号: [ = {open_bracket}, ] = {close_bracket}, 差值 = {open_bracket - close_bracket}")
    
    # 检查引号
    double_quotes = content.count('"')
    single_quotes = content.count("'")
    print(f"双引号: {double_quotes}, 单引号: {single_quotes}")
    
    # 检查常见的语法问题
    lines = content.split('\n')
    issues = []
    
    for i, line in enumerate(lines, 1):
        line = line.rstrip()
        
        # 检查未闭合的字符串（简化检查）
        if line.count('"') % 2 != 0 and not line.endswith('\\"'):
            # 排除注释和特殊情况
            if not line.strip().startswith('//') and not line.strip().startswith('*'):
                issues.append(f"第{i}行: 双引号不平衡 - {line[:50]}")
        
        if line.count("'") % 2 != 0 and not line.endswith("\\'"):
            if not line.strip().startswith('//') and not line.strip().startswith('*'):
                issues.append(f"第{i}行: 单引号不平衡 - {line[:50]}")
    
    if issues:
        print(f"发现 {len(issues)} 个潜在问题:")
        for issue in issues[:10]:  # 只显示前10个
            print(f"  {issue}")
        if len(issues) > 10:
            print(f"  ... 还有 {len(issues) - 10} 个问题")
        return False
    else:
        print("✓ 语法检查通过")
        return True

if __name__ == '__main__':
    files = [
        'src/content/enhanced-linkedin-monitor.js',
        'resume-analyzer/analyzer.js',
        'popup/app.js'
    ]
    
    all_passed = True
    for file_path in files:
        if check_file_syntax(file_path):
            all_passed = all_passed and True
        else:
            all_passed = False
    
    sys.exit(0 if all_passed else 1)