import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import {
  BarChart,
  TrendingUp,
  Calendar,
  Clock,
  Wrench,
  Sparkles,
  Printer
} from 'lucide-react';
import { openPrintWindow, formatPrintDateTime } from './print/PrintUtils';

export function ReportsPage() {
  const upcomingFeatures = [
    {
      title: 'تقارير المبيعات',
      description: 'تقارير مفصلة عن المبيعات الشهرية والسنوية',
      icon: BarChart,
      estimatedDate: 'الربع الثاني 2026'
    },
    {
      title: 'تحليل الأداء',
      description: 'تحليل أداء العمل ومعدلات النمو',
      icon: TrendingUp,
      estimatedDate: 'الربع الثاني 2026'
    },
    {
      title: 'تقارير الزبائن',
      description: 'تحليل سلوك الزبائن وأنماط الشراء',
      icon: Calendar,
      estimatedDate: 'الربع الثالث 2026'
    },
    {
      title: 'تقارير المخزون',
      description: 'تتبع المخزون والأقمشة المتوفرة',
      icon: Clock,
      estimatedDate: 'الربع الثالث 2026'
    }
  ];

  const progressPercent = 35;
  const releaseWindow = 'الربع الثاني 2026';
  const nearestLaunch = upcomingFeatures[0]?.estimatedDate ?? '—';
  const finalLaunch = upcomingFeatures[upcomingFeatures.length - 1]?.estimatedDate ?? '—';

  const handlePrintReports = () => {
    const now = new Date();
    const timelineBadgeStyle: React.CSSProperties = {
      backgroundColor: 'rgba(21, 84, 70, 0.12)',
      color: '#155446',
      border: '1px solid rgba(21, 84, 70, 0.35)',
    };
    const planBadgeStyle: React.CSSProperties = {
      backgroundColor: 'rgba(198, 154, 114, 0.2)',
      color: '#13312A',
      border: '1px solid rgba(198, 154, 114, 0.4)',
    };
    const nextSteps = [
      'استكمال إعداد مصادر البيانات وربطها مع لوحة التحكم.',
      'تطوير واجهات العرض البصري والتأكد من توافقها مع الهوية البصرية.',
      'إطلاق مرحلة الاختبار الداخلي ثم إشعار المستخدمين بالإطلاق التجريبي.',
    ];

    openPrintWindow('ملخص تطوير التقارير', (
      <>
        <header className="print-header">
          <h1 className="print-title">تقرير حالة تطوير نظام التقارير</h1>
          <p className="print-subtitle">نظرة شاملة على مسار تطوير وحدات التقارير في منصة أزياء قرطبة</p>
          <div className="print-meta">
            <span>تاريخ الطباعة: {formatPrintDateTime(now)}</span>
            <span>عدد الوحدات المخطط لها: {upcomingFeatures.length}</span>
          </div>
        </header>

        <section className="print-section">
          <h2 className="section-title">ملخص الإنجاز</h2>
          <div className="metrics-grid">
            <div className="metric-card accent">
              <span className="metric-label">نسبة الإنجاز الحالية</span>
              <span className="metric-value">{progressPercent}%</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">الإطلاق المتوقع</span>
              <span className="metric-value">{releaseWindow}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">أقرب مرحلة تنفيذ</span>
              <span className="metric-value">{nearestLaunch}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">آخر مرحلة مجدولة</span>
              <span className="metric-value">{finalLaunch}</span>
            </div>
          </div>
        </section>

        <section className="print-section">
          <h2 className="section-title">الميزات القادمة</h2>
          <p className="section-description">تفاصيل وحدات التقارير التي سيتم إطلاقها تباعاً لدعم اتخاذ القرار في المركز.</p>
          <div className="print-table-wrapper">
            <table className="print-table">
              <thead>
                <tr>
                  <th>التسلسل</th>
                  <th>اسم التقرير</th>
                  <th>الوصف المختصر</th>
                  <th>الجدول الزمني</th>
                </tr>
              </thead>
              <tbody>
                {upcomingFeatures.map((feature, index) => (
                  <tr key={feature.title}>
                    <td>{index + 1}</td>
                    <td>{feature.title}</td>
                    <td>{feature.description}</td>
                    <td>{feature.estimatedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="print-section">
          <h2 className="section-title">خطط التنفيذ القادمة</h2>
          <div className="detail-cards">
            {upcomingFeatures.map((feature, index) => (
              <article className="detail-card" key={`feature-${index}`}>
                <div className="detail-card-header">
                  <h3 className="detail-title">{feature.title}</h3>
                  <span className="status-pill" style={timelineBadgeStyle}>{feature.estimatedDate}</span>
                </div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="item-label">الوصف</span>
                    <span className="item-value">{feature.description}</span>
                  </div>
                </div>
              </article>
            ))}
            <article className="detail-card" key="next-steps">
              <div className="detail-card-header">
                <h3 className="detail-title">الخطوات التالية</h3>
                <span className="status-pill" style={planBadgeStyle}>خطة العمل</span>
              </div>
              <ul className="list bullet-list">
                {nextSteps.map((step, index) => (
                  <li key={`step-${index}`}>{step}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      </>
    ));
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handlePrintReports}
          className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] touch-target"
        >
          <Printer className="w-4 h-4 ml-2" />
          <span className="arabic-text">طباعة الملخص</span>
        </Button>
      </div>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-[#13312A] rounded-full flex items-center justify-center">
            <Wrench className="w-12 h-12 text-[#F6E9CA]" />
          </div>
        </div>
        <h1 className="text-3xl text-[#13312A] arabic-text">التقارير</h1>
        <p className="text-xl text-[#155446] arabic-text">قريباً</p>
      </div>

      {/* Coming Soon Message */}
      <Card className="bg-gradient-to-br from-[#13312A] to-[#155446] border-[#C69A72] text-center">
        <CardContent className="p-8">
          <div className="flex justify-center mb-4">
            <Sparkles className="w-16 h-16 text-[#F6E9CA]" />
          </div>
          <h2 className="text-2xl text-[#F6E9CA] arabic-text mb-4">
            نعمل على تطوير نظام التقارير
          </h2>
          <p className="text-[#C69A72] arabic-text text-lg mb-6">
            سيتضمن النظام تقارير شاملة ومفصلة لمساعدتك في إدارة المركز
          </p>
          <Button className="bg-[#C69A72] hover:bg-[#b8886a] text-[#13312A] px-8 py-3 touch-target">
            <span className="arabic-text">سيتم الإشعار عند الإطلاق</span>
          </Button>
        </CardContent>
      </Card>

      {/* Upcoming Features */}
      <div className="space-y-4">
        <h3 className="text-xl text-[#13312A] arabic-text text-center mb-6">الميزات القادمة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcomingFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="bg-white border-[#C69A72] hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#155446] rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-[#F6E9CA]" />
                    </div>
                    <div>
                      <CardTitle className="text-[#13312A] arabic-text">{feature.title}</CardTitle>
                      <p className="text-sm text-[#155446] arabic-text">{feature.estimatedDate}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-[#155446] arabic-text">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Progress Indicator */}
      <Card className="bg-white border-[#C69A72]">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg text-[#13312A] arabic-text">تقدم التطوير</h3>
            <div className="w-full bg-[#C69A72] rounded-full h-4">
              <div className="bg-[#155446] h-4 rounded-full transition-all duration-300" style={{ width: '35%' }}></div>
            </div>
            <p className="text-[#155446] arabic-text">35% مكتمل</p>
            <p className="text-sm text-[#155446] arabic-text">
              الإطلاق المتوقع: الربع الثاني من عام 2026
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}