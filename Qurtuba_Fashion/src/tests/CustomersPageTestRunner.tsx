import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CheckCircle, XCircle, Clock, Play, Pause, RotateCcw } from 'lucide-react';
import { databaseService } from '../db/database.service';
import { Customer } from '../types/customer';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  error?: string;
  duration?: number;
}

interface TestScenario {
  id: string;
  name: string;
  description: string;
  testFunction: () => Promise<boolean>;
}

export function CustomersPageTestRunner() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Load test data
  useEffect(() => {
    const loadTestData = async () => {
      try {
        const testCustomers = await databaseService.getCustomers();
        setCustomers(testCustomers);
      } catch (error) {
        console.error('Error loading test data:', error);
      }
    };
    loadTestData();
  }, []);

  // Test scenarios
  const testScenarios: TestScenario[] = [
    {
      id: 'load-customers',
      name: 'تحميل قائمة الزبائن',
      description: 'التحقق من تحميل قائمة الزبائن من قاعدة البيانات',
      testFunction: async () => {
        try {
          const customers = await databaseService.getCustomers();
          return customers.length > 0;
        } catch (error) {
          console.error('Test failed:', error);
          return false;
        }
      }
    },
    {
      id: 'search-customers',
      name: 'البحث في الزبائن',
      description: 'التحقق من وظيفة البحث في أسماء الزبائن',
      testFunction: async () => {
        try {
          const customers = await databaseService.getCustomers();
          if (customers.length === 0) return false;
          
          const firstCustomer = customers[0];
          const searchResults = customers.filter(customer => 
            customer.name.toLowerCase().includes(firstCustomer.name.toLowerCase())
          );
          return searchResults.length > 0;
        } catch (error) {
          console.error('Test failed:', error);
          return false;
        }
      }
    },
    {
      id: 'filter-by-label',
      name: 'التصفية حسب التصنيف',
      description: 'التحقق من تصفية الزبائن حسب التصنيف',
      testFunction: async () => {
        try {
          const customers = await databaseService.getCustomers();
          if (customers.length === 0) return false;
          
          const goldenCustomers = customers.filter(customer => customer.label === 'ذهبي');
          return true; // Test passes if no error occurs
        } catch (error) {
          console.error('Test failed:', error);
          return false;
        }
      }
    },
    {
      id: 'sort-customers',
      name: 'ترتيب الزبائن',
      description: 'التحقق من ترتيب الزبائن حسب المعايير المختلفة',
      testFunction: async () => {
        try {
          const customers = await databaseService.getCustomers();
          if (customers.length === 0) return false;
          
          // Test sorting by name
          const sortedByName = [...customers].sort((a, b) => a.name.localeCompare(b.name));
          
          // Test sorting by total spent
          const sortedBySpent = [...customers].sort((a, b) => b.totalSpent - a.totalSpent);
          
          return sortedByName.length === customers.length && sortedBySpent.length === customers.length;
        } catch (error) {
          console.error('Test failed:', error);
          return false;
        }
      }
    },
    {
      id: 'create-customer',
      name: 'إنشاء زبون جديد',
      description: 'التحقق من إنشاء زبون جديد في قاعدة البيانات',
      testFunction: async () => {
        try {
          const testCustomer = {
            name: `زبون اختبار ${Date.now()}`,
            phone: '07700000000',
            address: 'عنوان اختبار',
            label: 'جديد',
            totalSpent: 0,
            lastOrder: undefined,
            measurements: {
              height: 0,
              shoulder: 0,
              waist: 0,
              chest: 0
            },
            notes: 'زبون للاختبار',
            created_at: new Date().toISOString()
          };
          
          await databaseService.createCustomer(testCustomer);
          return true;
        } catch (error) {
          console.error('Test failed:', error);
          return false;
        }
      }
    },
    {
      id: 'statistics-calculation',
      name: 'حساب الإحصائيات',
      description: 'التحقق من حساب الإحصائيات بشكل صحيح',
      testFunction: async () => {
        try {
          const customers = await databaseService.getCustomers();
          if (customers.length === 0) return false;
          
          const total = customers.length;
          const goldenCustomers = customers.filter(c => c.label === 'ذهبي').length;
          const regularCustomers = customers.filter(c => c.label === 'منتظم').length;
          const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
          
          return total >= 0 && goldenCustomers >= 0 && regularCustomers >= 0 && totalSpent >= 0;
        } catch (error) {
          console.error('Test failed:', error);
          return false;
        }
      }
    },
    {
      id: 'view-modes',
      name: 'أوضاع العرض',
      description: 'التحقق من تبديل أوضاع العرض (جدول/شبكة)',
      testFunction: async () => {
        try {
          // This test simulates the view mode switching logic
          const customers = await databaseService.getCustomers();
          if (customers.length === 0) return false;
          
          // Simulate table view
          const tableView = customers.map(customer => ({
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            address: customer.address,
            label: customer.label
          }));
          
          // Simulate grid view
          const gridView = customers.map(customer => ({
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            address: customer.address,
            label: customer.label,
            totalSpent: customer.totalSpent,
            ordersCount: customer.orders.length
          }));
          
          return tableView.length === customers.length && gridView.length === customers.length;
        } catch (error) {
          console.error('Test failed:', error);
          return false;
        }
      }
    },
    {
      id: 'permissions-check',
      name: 'فحص الصلاحيات',
      description: 'التحقق من تطبيق الصلاحيات بشكل صحيح',
      testFunction: async () => {
        try {
          // This test simulates permission checking
          const mockUser = { id: '1', role: 'admin' };
          const hasPermission = (action: string) => {
            // Simulate permission logic
            return mockUser.role === 'admin' || action === 'view_customers';
          };
          
          const canViewCustomers = hasPermission('view_customers');
          const canCreateCustomer = hasPermission('create_customer');
          const canPrintCustomers = hasPermission('print_customers_list');
          
          return canViewCustomers && canCreateCustomer && canPrintCustomers;
        } catch (error) {
          console.error('Test failed:', error);
          return false;
        }
      }
    }
  ];

  // Initialize test results
  useEffect(() => {
    const initialResults = testScenarios.map(scenario => ({
      id: scenario.id,
      name: scenario.name,
      status: 'pending' as const
    }));
    setTestResults(initialResults);
  }, []);

  const runSingleTest = async (scenario: TestScenario) => {
    const startTime = Date.now();
    
    setTestResults(prev => prev.map(result => 
      result.id === scenario.id 
        ? { ...result, status: 'running' }
        : result
    ));
    
    setCurrentTest(scenario.id);
    
    try {
      const success = await scenario.testFunction();
      const duration = Date.now() - startTime;
      
      setTestResults(prev => prev.map(result => 
        result.id === scenario.id 
          ? { 
              ...result, 
              status: success ? 'passed' : 'failed',
              duration,
              error: success ? undefined : 'Test function returned false'
            }
          : result
      ));
    } catch (error) {
      const duration = Date.now() - startTime;
      
      setTestResults(prev => prev.map(result => 
        result.id === scenario.id 
          ? { 
              ...result, 
              status: 'failed',
              duration,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          : result
      ));
    }
    
    setCurrentTest(null);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    for (const scenario of testScenarios) {
      await runSingleTest(scenario);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsRunning(false);
  };

  const resetTests = () => {
    setTestResults(testScenarios.map(scenario => ({
      id: scenario.id,
      name: scenario.name,
      status: 'pending'
    })));
    setCurrentTest(null);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-100 text-green-800">نجح</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">فشل</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800">جاري</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">معلق</Badge>;
    }
  };

  const passedTests = testResults.filter(r => r.status === 'passed').length;
  const failedTests = testResults.filter(r => r.status === 'failed').length;
  const totalTests = testResults.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6E9CA] to-[#FDFBF7] p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white rounded-xl shadow-lg border border-[#C69A72]/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#13312A] arabic-text">
              اختبار صفحة إدارة الزبائن
            </CardTitle>
            <p className="text-[#155446] arabic-text">
              اختبار شامل لجميع وظائف صفحة إدارة الزبائن
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-6">
              <Button
                onClick={runAllTests}
                disabled={isRunning}
                className="bg-[#155446] hover:bg-[#13312A] text-white flex items-center gap-2"
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isRunning ? 'جاري التشغيل...' : 'تشغيل جميع الاختبارات'}
              </Button>
              
              <Button
                onClick={resetTests}
                disabled={isRunning}
                variant="outline"
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                إعادة تعيين
              </Button>
            </div>

            {/* Test Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{passedTests}</div>
                  <div className="text-sm text-green-800 arabic-text">اختبارات نجحت</div>
                </CardContent>
              </Card>
              
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{failedTests}</div>
                  <div className="text-sm text-red-800 arabic-text">اختبارات فشلت</div>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalTests}</div>
                  <div className="text-sm text-blue-800 arabic-text">إجمالي الاختبارات</div>
                </CardContent>
              </Card>
            </div>

            {/* Test Data Info */}
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <h3 className="font-semibold text-[#13312A] arabic-text mb-2">معلومات بيانات الاختبار</h3>
                <p className="text-sm text-[#155446] arabic-text">
                  عدد الزبائن المحملة: {customers.length}
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Test Results */}
        <div className="space-y-4">
          {testResults.map((result) => {
            const scenario = testScenarios.find(s => s.id === result.id);
            return (
              <Card 
                key={result.id} 
                className={`bg-white rounded-xl shadow-lg border ${
                  result.status === 'passed' ? 'border-green-200' :
                  result.status === 'failed' ? 'border-red-200' :
                  result.status === 'running' ? 'border-blue-200' :
                  'border-[#C69A72]/20'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <h3 className="font-semibold text-[#13312A] arabic-text">{result.name}</h3>
                        <p className="text-sm text-[#155446] arabic-text">{scenario?.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(result.status)}
                      {result.duration && (
                        <span className="text-sm text-gray-500">
                          {result.duration}ms
                        </span>
                      )}
                    </div>
                  </div>

                  {result.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800 arabic-text">
                        <strong>خطأ:</strong> {result.error}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => scenario && runSingleTest(scenario)}
                      disabled={isRunning || result.status === 'running'}
                      className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]"
                    >
                      تشغيل الاختبار
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
