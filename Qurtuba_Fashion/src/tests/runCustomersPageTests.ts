#!/usr/bin/env node

/**
 * Test Runner for Customers Page
 * This script runs all tests related to the Customers Page
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

// Test configuration
const testConfig = {
  testFiles: [
    'src/tests/CustomersPage.test.tsx',
    'src/tests/CustomersPagePerformance.test.tsx',
    'src/tests/CustomersPageIntegration.test.tsx',
  ],
  testRunner: 'src/tests/CustomersPageTestRunner.tsx',
  coverage: true,
  verbose: true,
  watch: false,
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Utility functions
const log = (message: string, color: string = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const logHeader = (title: string) => {
  log('\n' + '='.repeat(60), colors.cyan);
  log(`  ${title}`, colors.bright + colors.cyan);
  log('='.repeat(60), colors.cyan);
};

const logSuccess = (message: string) => {
  log(`✅ ${message}`, colors.green);
};

const logError = (message: string) => {
  log(`❌ ${message}`, colors.red);
};

const logWarning = (message: string) => {
  log(`⚠️  ${message}`, colors.yellow);
};

const logInfo = (message: string) => {
  log(`ℹ️  ${message}`, colors.blue);
};

// Check if test files exist
const checkTestFiles = () => {
  logHeader('فحص ملفات الاختبار');
  
  let allFilesExist = true;
  
  testConfig.testFiles.forEach(file => {
    if (existsSync(file)) {
      logSuccess(`تم العثور على: ${file}`);
    } else {
      logError(`لم يتم العثور على: ${file}`);
      allFilesExist = false;
    }
  });
  
  if (existsSync(testConfig.testRunner)) {
    logSuccess(`تم العثور على: ${testConfig.testRunner}`);
  } else {
    logError(`لم يتم العثور على: ${testConfig.testRunner}`);
    allFilesExist = false;
  }
  
  return allFilesExist;
};

// Run unit tests
const runUnitTests = () => {
  logHeader('تشغيل اختبارات الوحدة');
  
  try {
    const command = `npx jest ${testConfig.testFiles.join(' ')} --verbose --coverage`;
    logInfo(`تشغيل الأمر: ${command}`);
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    logSuccess('تم تشغيل اختبارات الوحدة بنجاح');
    return true;
  } catch (error) {
    logError('فشل في تشغيل اختبارات الوحدة');
    console.error(error);
    return false;
  }
};

// Run performance tests
const runPerformanceTests = () => {
  logHeader('تشغيل اختبارات الأداء');
  
  try {
    const command = `npx jest src/tests/CustomersPagePerformance.test.tsx --verbose`;
    logInfo(`تشغيل الأمر: ${command}`);
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    logSuccess('تم تشغيل اختبارات الأداء بنجاح');
    return true;
  } catch (error) {
    logError('فشل في تشغيل اختبارات الأداء');
    console.error(error);
    return false;
  }
};

// Run integration tests
const runIntegrationTests = () => {
  logHeader('تشغيل اختبارات التكامل');
  
  try {
    const command = `npx jest src/tests/CustomersPageIntegration.test.tsx --verbose`;
    logInfo(`تشغيل الأمر: ${command}`);
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    logSuccess('تم تشغيل اختبارات التكامل بنجاح');
    return true;
  } catch (error) {
    logError('فشل في تشغيل اختبارات التكامل');
    console.error(error);
    return false;
  }
};

// Run all tests
const runAllTests = () => {
  logHeader('تشغيل جميع الاختبارات');
  
  try {
    const command = `npx jest src/tests/ --verbose --coverage`;
    logInfo(`تشغيل الأمر: ${command}`);
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    logSuccess('تم تشغيل جميع الاختبارات بنجاح');
    return true;
  } catch (error) {
    logError('فشل في تشغيل بعض الاختبارات');
    console.error(error);
    return false;
  }
};

// Generate test report
const generateTestReport = () => {
  logHeader('تقرير نتائج الاختبار');
  
  const report = {
    timestamp: new Date().toISOString(),
    testFiles: testConfig.testFiles,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    coverage: 0,
  };
  
  // This would be populated with actual test results
  logInfo('تقرير الاختبار:');
  log(`  - وقت التشغيل: ${report.timestamp}`);
  log(`  - ملفات الاختبار: ${report.testFiles.length}`);
  log(`  - إجمالي الاختبارات: ${report.totalTests}`);
  log(`  - الاختبارات الناجحة: ${report.passedTests}`);
  log(`  - الاختبارات الفاشلة: ${report.failedTests}`);
  log(`  - تغطية الكود: ${report.coverage}%`);
  
  return report;
};

// Main function
const main = async () => {
  logHeader('اختبار صفحة إدارة الزبائن');
  logInfo('بدء تشغيل اختبارات صفحة إدارة الزبائن...\n');
  
  // Check if test files exist
  if (!checkTestFiles()) {
    logError('بعض ملفات الاختبار مفقودة. يرجى التأكد من وجود جميع الملفات المطلوبة.');
    process.exit(1);
  }
  
  // Run tests based on command line arguments
  const args = process.argv.slice(2);
  let success = true;
  
  if (args.includes('--unit') || args.includes('-u')) {
    success = runUnitTests() && success;
  }
  
  if (args.includes('--performance') || args.includes('-p')) {
    success = runPerformanceTests() && success;
  }
  
  if (args.includes('--integration') || args.includes('-i')) {
    success = runIntegrationTests() && success;
  }
  
  if (args.includes('--all') || args.includes('-a') || args.length === 0) {
    success = runAllTests() && success;
  }
  
  // Generate test report
  generateTestReport();
  
  // Final result
  logHeader('نتيجة الاختبار النهائية');
  if (success) {
    logSuccess('تم تشغيل جميع الاختبارات بنجاح!');
    process.exit(0);
  } else {
    logError('فشل في تشغيل بعض الاختبارات. يرجى مراجعة الأخطاء أعلاه.');
    process.exit(1);
  }
};

// Help function
const showHelp = () => {
  logHeader('مساعدة - اختبار صفحة إدارة الزبائن');
  log('الاستخدام:');
  log('  npm run test:customers [خيارات]');
  log('');
  log('الخيارات:');
  log('  --unit, -u        تشغيل اختبارات الوحدة فقط');
  log('  --performance, -p تشغيل اختبارات الأداء فقط');
  log('  --integration, -i تشغيل اختبارات التكامل فقط');
  log('  --all, -a         تشغيل جميع الاختبارات (افتراضي)');
  log('  --help, -h        عرض هذه المساعدة');
  log('');
  log('أمثلة:');
  log('  npm run test:customers --unit');
  log('  npm run test:customers --performance');
  log('  npm run test:customers --all');
  log('');
};

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run main function
main().catch(error => {
  logError('حدث خطأ غير متوقع:');
  console.error(error);
  process.exit(1);
});
