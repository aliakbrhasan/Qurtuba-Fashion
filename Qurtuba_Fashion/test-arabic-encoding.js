// اختبار ترميز النصوص العربية
// قم بتشغيل هذا الملف لاختبار إصلاح مشكلة الترميز

const { createClient } = require('@supabase/supabase-js');

// إعدادات Supabase (استبدلها بالقيم الصحيحة)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your_supabase_url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your_supabase_anon_key';

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  },
});

// بيانات اختبار عربية
const testData = {
  customer: {
    name: 'أحمد محمد علي',
    phone: '07701234567',
    address: 'بغداد، الكرادة، شارع الرشيد'
  },
  invoice: {
    customer_name: 'فاطمة حسن',
    customer_phone: '07801234567',
    customer_address: 'بصرة، المعقل، حي الجامعة',
    notes: 'ملاحظات خاصة بالطلب - قماش حرير أصلي'
  },
  user: {
    name: 'مدير النظام',
    role: 'ادمن',
    status: 'نشط'
  }
};

async function testArabicEncoding() {
  console.log('🧪 بدء اختبار ترميز النصوص العربية...\n');

  try {
    // اختبار 1: إضافة عميل جديد
    console.log('1️⃣ اختبار إضافة عميل جديد...');
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert(testData.customer)
      .select()
      .single();

    if (customerError) {
      console.error('❌ خطأ في إضافة العميل:', customerError);
    } else {
      console.log('✅ تم إضافة العميل بنجاح:', customer);
      console.log('   الاسم:', customer.name);
      console.log('   العنوان:', customer.address);
    }

    // اختبار 2: إضافة فاتورة جديدة
    console.log('\n2️⃣ اختبار إضافة فاتورة جديدة...');
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        ...testData.invoice,
        total: 150000,
        paid_amount: 0,
        status: 'معلق'
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('❌ خطأ في إضافة الفاتورة:', invoiceError);
    } else {
      console.log('✅ تم إضافة الفاتورة بنجاح:', invoice);
      console.log('   اسم العميل:', invoice.customer_name);
      console.log('   العنوان:', invoice.customer_address);
      console.log('   الملاحظات:', invoice.notes);
    }

    // اختبار 3: إضافة مستخدم جديد
    console.log('\n3️⃣ اختبار إضافة مستخدم جديد...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        ...testData.user,
        code: 'ADM001',
        email: 'admin@qurtuba.com'
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ خطأ في إضافة المستخدم:', userError);
    } else {
      console.log('✅ تم إضافة المستخدم بنجاح:', user);
      console.log('   الاسم:', user.name);
      console.log('   الدور:', user.role);
      console.log('   الحالة:', user.status);
    }

    // اختبار 4: قراءة البيانات المحفوظة
    console.log('\n4️⃣ اختبار قراءة البيانات المحفوظة...');
    
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .limit(5);
    
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .limit(5);

    console.log('📋 العملاء المحفوظون:');
    customers?.forEach(customer => {
      console.log(`   - ${customer.name} (${customer.phone})`);
    });

    console.log('\n📋 الفواتير المحفوظة:');
    invoices?.forEach(invoice => {
      console.log(`   - ${invoice.customer_name} (${invoice.status})`);
    });

    // اختبار 5: التحقق من الترميز
    console.log('\n5️⃣ اختبار الترميز...');
    const testText = 'اختبار النص العربي';
    const encoded = encodeURIComponent(testText);
    const decoded = decodeURIComponent(encoded);
    
    console.log('النص الأصلي:', testText);
    console.log('النص المرمز:', encoded);
    console.log('النص المفكوك:', decoded);
    console.log('الترميز صحيح:', testText === decoded ? '✅' : '❌');

    console.log('\n🎉 انتهى الاختبار!');
    console.log('\n📝 ملاحظات:');
    console.log('- إذا كانت النصوص تظهر بشكل صحيح، فالإصلاح يعمل');
    console.log('- إذا كانت النصوص تظهر مرمزة، تأكد من تطبيق fix-arabic-encoding.sql');
    console.log('- تأكد من أن متغيرات البيئة صحيحة');

  } catch (error) {
    console.error('❌ خطأ عام في الاختبار:', error);
  }
}

// تشغيل الاختبار
if (require.main === module) {
  testArabicEncoding();
}

module.exports = { testArabicEncoding };
