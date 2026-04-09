#!/bin/bash

echo "=== US Resume Personal Assistant - Project Structure Test ==="
echo ""

# Check basic structure
echo "1. Checking basic project structure..."
if [ -f "manifest.json" ]; then
    echo "✅ manifest.json exists"
else
    echo "❌ manifest.json missing"
fi

if [ -f "README.md" ]; then
    echo "✅ README.md exists"
else
    echo "❌ README.md missing"
fi

if [ -f "package.json" ]; then
    echo "✅ package.json exists"
else
    echo "❌ package.json missing"
fi

echo ""

# Check src directory
echo "2. Checking src directory structure..."
if [ -d "src" ]; then
    echo "✅ src/ directory exists"
    
    # Check subdirectories
    for dir in background content popup; do
        if [ -d "src/$dir" ]; then
            echo "  ✅ src/$dir/ exists"
            
            # Check for key files
            case $dir in
                background)
                    for file in service-worker.js safe-resume-optimizer.js data-manager.js; do
                        if [ -f "src/$dir/$file" ]; then
                            echo "    ✅ $file exists"
                        else
                            echo "    ⚠️  $file missing"
                        fi
                    done
                    ;;
                content)
                    for file in enhanced-linkedin-monitor.js linkedin-monitor.js; do
                        if [ -f "src/$dir/$file" ]; then
                            echo "    ✅ $file exists"
                        else
                            echo "    ⚠️  $file missing"
                        fi
                    done
                    ;;
                popup)
                    if [ -f "src/$dir/app.js" ]; then
                        echo "    ✅ app.js exists"
                    else
                        echo "    ⚠️  app.js missing"
                    fi
                    ;;
            esac
        else
            echo "  ❌ src/$dir/ missing"
        fi
    done
else
    echo "❌ src/ directory missing"
fi

echo ""

# Check popup directory
echo "3. Checking popup directory..."
if [ -d "popup" ]; then
    echo "✅ popup/ directory exists"
    
    if [ -f "popup/index.html" ]; then
        echo "  ✅ index.html exists"
        
        # Check HTML structure
        if grep -q "<!DOCTYPE html>" popup/index.html; then
            echo "    ✅ DOCTYPE present"
        else
            echo "    ⚠️  DOCTYPE missing"
        fi
        
        if grep -q "<html" popup/index.html; then
            echo "    ✅ HTML tag present"
        else
            echo "    ⚠️  HTML tag missing"
        fi
    else
        echo "  ❌ index.html missing"
    fi
else
    echo "❌ popup/ directory missing"
fi

echo ""

# Check docs directory
echo "4. Checking documentation..."
if [ -d "docs" ]; then
    echo "✅ docs/ directory exists"
    
    for doc in ARCHITECTURE.md TECH_RESEARCH.md SKILLS_REQUIREMENTS.md PRACTICAL_SKILLS_PLAN.md; do
        if [ -f "docs/$doc" ]; then
            lines=$(wc -l < "docs/$doc")
            echo "  ✅ $doc exists ($lines lines)"
        else
            echo "  ⚠️  $doc missing"
        fi
    done
else
    echo "❌ docs/ directory missing"
fi

echo ""

# Check manifest.json configuration
echo "5. Checking manifest.json configuration..."
if [ -f "manifest.json" ]; then
    echo "Manifest configuration:"
    
    # Check service worker path
    if grep -q '"service_worker": "src/background/service-worker.js"' manifest.json; then
        echo "  ✅ Service worker path correct"
    else
        echo "  ⚠️  Service worker path may be incorrect"
    fi
    
    # Check popup path
    if grep -q '"default_popup": "popup/index.html"' manifest.json; then
        echo "  ✅ Popup path correct"
    else
        echo "  ⚠️  Popup path may be incorrect"
    fi
    
    # Check content scripts
    if grep -q '"js": \["src/content/enhanced-linkedin-monitor.js"\]' manifest.json; then
        echo "  ✅ Content script path correct"
    else
        echo "  ⚠️  Content script path may be incorrect"
    fi
fi

echo ""

# Check for duplicate/old files
echo "6. Checking for duplicate/old files..."
for old_file in popup.js background.js; do
    if [ -f "$old_file" ]; then
        echo "⚠️  Old file found: $old_file (consider removing if src/ version exists)"
    fi
done

echo ""

# Summary
echo "=== Summary ==="
echo "Project structure appears to be mostly complete."
echo ""
echo "Next steps:"
echo "1. Remove duplicate files (popup.js, background.js) if src/ versions are complete"
echo "2. Ensure all JavaScript files have proper error handling"
echo "3. Test Chrome extension loading"
echo "4. Test core functionality with mock data"