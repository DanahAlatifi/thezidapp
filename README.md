# منصة وصل · Connector Portal (React Native / Expo · SDK 54)

تطبيق جوال (عربي · RTL) لربط متاجر زد وسلة وفودكس مع أودو.

## مهم جداً قبل التشغيل: استخدمي Node 20
النسخ الأحدث من Node (22 و24) تكسر عملية التجميع وتطلّع أخطاء
مثل "private properties are not supported" و "runtime not ready".
الحل الأكيد هو Node 20 (LTS).

### تركيب Node 20 عبر nvm
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node --version     # لازم يطلّع v20.x.x
```

## التشغيل (من داخل مجلد المشروع)
```bash
cd rn-app
npm install
npx expo start -c
```
ثم امسحي الـ QR بتطبيق Expo Go (لازم يكون SDK 54).

> إذا كان عندك Expo Go بإصدار مختلف، نزّلي الإصدار المطابق،
> أو استخدمي development build.

## حل المشاكل الشائعة
- **private properties / runtime not ready** ← نسخة Node غلط. استخدمي Node 20 (فوق).
- **Cannot find module babel-preset-expo** ← شغّلي `npm install` من داخل rn-app.
- **Unable to find expo** ← أنتِ في المجلد الغلط. لازم تكوني داخل rn-app اللي فيه package.json.
- بعد أي تغيير في الإعدادات: `npx expo start -c` (بالـ c لمسح الكاش).

## الشاشات
تسجيل الدخول (منصة وصل) · إنشاء حساب (أفراد/شريك) · الرئيسية (ملخص اليوم +
حالة المزامنة + نظرة عامة) · الطلبات المزامَنة + تفاصيل الطلب · المزامنة + السجل ·
المزيد (الخدمات، ربط جديد، الفريق، العملاء، الفوترة، الملف الشخصي).

## الربط مع أودو (لاحقاً)
كل شيء جاهز في `src/api/odoo.js` — عدّلي BASE_URL و DB وطابقي أسماء
الموديلات مع موديول connector_zid، ثم استبدلي بيانات `src/data/mock.js`.
# zidapp
# thezidapp
