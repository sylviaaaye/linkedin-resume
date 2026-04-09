// US Resume Personal Assistant - Integration Test
// This script tests the integration of all core modules

console.log('=== US Resume Personal Assistant Integration Test ===');

// Mock Chrome API for testing
const mockChrome = {
  storage: {
    local: {
      get: (keys, callback) => {
        console.log('Mock chrome.storage.local.get called with:', keys);
        callback({
          claudeApiKey: 'test-key-123',
          analysisPreferences: {
            optFocus: true,
            aiPmFocus: true,
            sponsorFocus: true
          }
        });
      },
      set: (data, callback) => {
        console.log('Mock chrome.storage.local.set called with:', data);
        if (callback) callback();
      }
    }
  }
};

// Global mock
global.chrome = mockChrome;

// Import modules
const fs = require('fs');
const path = require('path');

// Test 1: Check all required files exist
console.log('\n--- Test 1: File Structure Check ---');
const requiredFiles = [
  'manifest.json',
  'src/background/service-worker.js',
  'src/background/safe-resume-optimizer.js',
  'src/background/data-manager.js',
  'src/content/enhanced-linkedin-monitor.js',
  'src/popup/app.js',
  'popup/index.html',
  'docs/ARCHITECTURE.md',
  'docs/TECH_RESEARCH.md',
  'README.md'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Test 2: Check manifest.json configuration
console.log('\n--- Test 2: Manifest Configuration Check ---');
try {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
  
  console.log('Manifest version:', manifest.manifest_version);
  console.log('Permissions:', manifest.permissions?.length || 0, 'permissions');
  console.log('Host permissions:', manifest.host_permissions?.length || 0, 'host permissions');
  console.log('Service worker:', manifest.background?.service_worker || 'NOT SET');
  console.log('Popup:', manifest.action?.default_popup || 'NOT SET');
  
  // Check critical configurations
  const manifestChecks = [
    { check: manifest.manifest_version === 3, message: 'Manifest version should be 3' },
    { check: manifest.permissions?.includes('storage'), message: 'Should have storage permission' },
    { check: manifest.background?.service_worker, message: 'Should have service worker configured' },
    { check: manifest.action?.default_popup, message: 'Should have popup configured' }
  ];
  
  manifestChecks.forEach(({ check, message }) => {
    console.log(check ? `✅ ${message}` : `❌ ${message}`);
  });
  
} catch (error) {
  console.log(`❌ Failed to parse manifest.json: ${error.message}`);
}

// Test 3: Check module syntax (basic validation)
console.log('\n--- Test 3: Module Syntax Check ---');
const jsFiles = [
  'src/background/service-worker.js',
  'src/popup/app.js'
];

jsFiles.forEach(file => {
  try {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    
    // Basic syntax checks
    const checks = [
      { name: 'File not empty', check: content.length > 0 },
      { name: 'Contains class definition', check: /class\s+\w+/.test(content) },
      { name: 'Contains async functions', check: /async\s+function/.test(content) || /async\s+\w+\s*\(/.test(content) },
      { name: 'Contains error handling', check: /try\s*\{/.test(content) && /catch\s*\(/.test(content) }
    ];
    
    console.log(`\n${file}:`);
    checks.forEach(({ name, check }) => {
      console.log(`  ${check ? '✅' : '⚠️'} ${name}`);
    });
    
  } catch (error) {
    console.log(`❌ Failed to read ${file}: ${error.message}`);
  }
});

// Test 4: Check HTML structure
console.log('\n--- Test 4: HTML Structure Check ---');
try {
  const htmlContent = fs.readFileSync(path.join(__dirname, 'popup/index.html'), 'utf8');
  
  const htmlChecks = [
    { name: 'Contains DOCTYPE', check: /<!DOCTYPE html>/i.test(htmlContent) },
    { name: 'Contains HTML tag', check: /<html/i.test(htmlContent) },
    { name: 'Contains head section', check: /<head/i.test(htmlContent) },
    { name: 'Contains body section', check: /<body/i.test(htmlContent) },
    { name: 'Links to CSS', check: /<link.*?rel="stylesheet"/i.test(htmlContent) },
    { name: 'Links to JavaScript', check: /<script.*?src=/i.test(htmlContent) },
    { name: 'Contains tab navigation', check: /tab.*?navigation/i.test(htmlContent) || /data-tab/i.test(htmlContent) }
  ];
  
  htmlChecks.forEach(({ name, check }) => {
    console.log(`${check ? '✅' : '⚠️'} ${name}`);
  });
  
} catch (error) {
  console.log(`❌ Failed to read popup/index.html: ${error.message}`);
}

// Test 5: Documentation check
console.log('\n--- Test 5: Documentation Check ---');
const docFiles = [
  'docs/ARCHITECTURE.md',
  'docs/TECH_RESEARCH.md',
  'README.md'
];

docFiles.forEach(file => {
  try {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    const lines = content.split('\n').length;
    console.log(`📄 ${file}: ${lines} lines`);
  } catch (error) {
    console.log(`❌ ${file}: ${error.message}`);
  }
});

// Summary
console.log('\n=== Integration Test Summary ===');
console.log(`Files checked: ${requiredFiles.length}`);
console.log(`All files exist: ${allFilesExist ? '✅' : '❌'}`);
console.log('\nNext steps:');
console.log('1. Fix any missing files or configuration issues');
console.log('2. Update manifest.json with correct paths');
console.log('3. Test Chrome extension loading');
console.log('4. Test core functionality');

// Generate fix suggestions
if (!allFilesExist) {
  console.log('\n=== Fix Suggestions ===');
  
  // Check for common issues
  const manifestPath = path.join(__dirname, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Check if paths in manifest are correct
    if (manifest.background?.service_worker === 'background/service-worker.js') {
      console.log('⚠️ Manifest service worker path may need update to src/background/service-worker.js');
    }
    
    if (manifest.action?.default_popup === 'popup.html') {
      console.log('⚠️ Manifest popup path may need update to popup/index.html');
    }
  }
  
  // Check for duplicate files
  const duplicateChecks = [
    { old: 'popup.js', new: 'src/popup/app.js' },
    { old: 'background.js', new: 'src/background/service-worker.js' }
  ];
  
  duplicateChecks.forEach(({ old, new: newPath }) => {
    const oldPath = path.join(__dirname, old);
    const newFullPath = path.join(__dirname, newPath);
    
    if (fs.existsSync(oldPath) && fs.existsSync(newFullPath)) {
      console.log(`⚠️ Duplicate file detected: ${old} and ${newPath}`);
      console.log(`   Consider removing ${old} and updating references`);
    }
  });
}

console.log('\n=== Test Complete ===');