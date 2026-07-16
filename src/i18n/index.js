import React, { createContext, useContext, useState } from 'react';
import { I18nManager } from 'react-native';
import { tr as trDict } from './dict';

// نتجنّب forceRTL لأنه غير موثوق في Expo Go — نتحكّم بالاتجاه يدوياً عبر hook
try { I18nManager.allowRTL(false); I18nManager.forceRTL(false); } catch (e) {}

const STR = {
  ar: {
    // عام
    appName: 'منصة وصل',
    tagline: 'بـوابـة واحـدة لـربـط مـنصاتـك.',
    login: 'تسجيل الدخول',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    newHere: 'جديد هنا؟',
    createAccount: 'أنشئ حساباً',
    noAccessBeforeLogin: 'لا يمكن الوصول لأي صفحة قبل تسجيل الدخول.',
    // تسجيل
    createAccountTitle: 'إنشاء حساب',
    step1of2: 'الخطوة 1 من 2 — من أنت؟',
    individuals: 'الأفراد',
    individualsDesc: 'تاجر واحد يدير متجرك (متاجرك الخاصة). الفوترة تحت اسمك الشخصي.',
    partner: 'شريك',
    partnerDesc: 'شركة تدير عدة متاجر وفريق عمل. الفوترة باسم الشركة.',
    fullName: 'الاسم الكامل',
    phone: 'رقم الهاتف',
    location: 'الموقع',
    locationPh: 'المدينة، الحي',
    companyDetails: 'تفاصيل الشركة',
    legalName: 'الاسم القانوني للشركة',
    taxNumber: 'الرقم الضريبي',
    crNumber: 'السجل التجاري',
    continueToPayment: 'المتابعة إلى الدفع',
    // الدفع
    payTitle: 'الدفع',
    step2of2: 'الخطوة 2 من 2 — اختر خطتك',
    planFull: 'الخدمة الكاملة',
    planFullDesc: 'الطلبات والمنتجات والعملاء والفريق والفوترة.',
    planIntegration: 'الربط فقط',
    planIntegrationDesc: 'الطلبات وجلب/إرسال الكتالوج والسجلّات فقط.',
    perMonth: '/ شهرياً',
    cardNumber: 'رقم البطاقة',
    expiry: 'تاريخ الانتهاء',
    cvc: 'رمز التحقق',
    cardHolder: 'اسم حامل البطاقة',
    payNow: 'ادفع واشترك',
    securedNote: 'الدفع آمن ومشفّر. يمكنك الإلغاء في أي وقت.',
    // التبويبات
    tabHome: 'الرئيسية', tabOrders: 'الطلبات', tabSync: 'المزامنة', tabMore: 'المزيد',
    // الرئيسية
    goodEvening: 'مساء الخير',
    companyName: 'شركة رواء التجارية',
    todaySummary: 'ملخص اليوم',
    allOrders: 'كل الطلبات',
    newOrdersToday: 'طلبات جديدة اليوم',
    last7days: 'آخر ٧ أيام',
    salesToday: 'المبيعات اليوم',
    activeStores: 'متاجر نشطة',
    syncStatus: 'حالة المزامنة',
    details: 'التفاصيل',
    synced: 'متزامن', warning: 'تحذير',
    overview: 'نظرة عامة',
    tapToSwitch: 'اضغط للتبديل',
    language: 'اللغة',
    profileTitle: 'الملف الشخصي',
    timezone: 'المنطقة الزمنية',
    timezoneVal: 'الرياض (GMT+3)',
    notifications: 'الإشعارات',
    notificationsOn: 'مفعّلة',
    logout: 'تسجيل الخروج',
    mServices: 'الخدمات والمتاجر',
    mConnect: 'ربط خدمة جديدة',
    mTeam: 'الفريق والصلاحيات',
    mCustomers: 'العملاء',
    mBilling: 'الفوترة والدفع',
    mLogs: 'سجل المزامنة',
    mInvoices: 'الفواتير',
  },
  en: {
    appName: 'Wasl Platform',
    tagline: 'One gateway to connect all your platforms.',
    login: 'Log in',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    newHere: 'New here?',
    createAccount: 'Create an account',
    noAccessBeforeLogin: 'No page is accessible before logging in.',
    createAccountTitle: 'Create account',
    step1of2: 'Step 1 of 2 — Who are you?',
    individuals: 'Individual',
    individualsDesc: 'A single merchant managing your own store(s). Billed under your name.',
    partner: 'Partner',
    partnerDesc: 'A company managing multiple stores and a team. Billed to the company.',
    fullName: 'Full name',
    phone: 'Phone number',
    location: 'Location',
    locationPh: 'City, district',
    companyDetails: 'Company details',
    legalName: 'Company legal name',
    taxNumber: 'Tax number',
    crNumber: 'Commercial registration',
    continueToPayment: 'Continue to payment',
    payTitle: 'Payment',
    step2of2: 'Step 2 of 2 — Choose your plan',
    planFull: 'Full service',
    planFullDesc: 'Orders, products, customers, team and billing.',
    planIntegration: 'Integration only',
    planIntegrationDesc: 'Orders and catalog push/pull and logs only.',
    perMonth: '/ month',
    cardNumber: 'Card number',
    expiry: 'Expiry',
    cvc: 'CVC',
    cardHolder: 'Cardholder name',
    payNow: 'Pay & subscribe',
    securedNote: 'Payment is secure and encrypted. Cancel anytime.',
    tabHome: 'Home', tabOrders: 'Orders', tabSync: 'Sync', tabMore: 'More',
    goodEvening: 'Good evening',
    companyName: 'Rawaa Trading Co.',
    todaySummary: "Today's summary",
    allOrders: 'All orders',
    newOrdersToday: 'New orders today',
    last7days: 'Last 7 days',
    salesToday: 'Sales today',
    activeStores: 'Active stores',
    syncStatus: 'Sync status',
    details: 'Details',
    synced: 'Synced', warning: 'Warning',
    overview: 'Overview',
    tapToSwitch: 'Tap to switch',
    language: 'Language',
    profileTitle: 'Profile',
    timezone: 'Time zone',
    timezoneVal: 'Riyadh (GMT+3)',
    notifications: 'Notifications',
    notificationsOn: 'On',
    logout: 'Log out',
    mServices: 'Services & stores',
    mConnect: 'Connect a new service',
    mTeam: 'Team & permissions',
    mCustomers: 'Customers',
    mBilling: 'Billing & payment',
    mLogs: 'Sync log',
    mInvoices: 'Invoices',
  },
};

const Ctx = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('ar');
  const isRTL = lang === 'ar';

  const t = (key) => (STR[lang] && STR[lang][key]) || key;
  const tr = (text) => trDict(text, lang); // ترجمة نص عربي حرّ
  const toggle = () => setLang((l) => (l === 'ar' ? 'en' : 'ar'));

  // مساعدات الاتجاه — تُستخدم بدل row-reverse الثابتة
  const rowStart = isRTL ? 'row-reverse' : 'row'; // صف يبدأ من جهة القارئ
  const textAlign = isRTL ? 'right' : 'left';
  const writingDirection = isRTL ? 'rtl' : 'ltr';
  const flipIcon = isRTL ? [{ scaleX: -1 }] : []; // لقلب أيقونات الأسهم

  return (
    <Ctx.Provider value={{ lang, isRTL, t, tr, toggle, setLang, rowStart, textAlign, writingDirection, flipIcon }}>
      {children}
    </Ctx.Provider>
  );
}

export const useI18n = () => useContext(Ctx);
