// ---------------------------------------------------------------------------
// hook مساعد لجلب البيانات من الـ API مع حالات: تحميل / خطأ / فارغ / معلّق
// يوحّد سلوك كل الشاشات التي تسحب من أودو.
// ---------------------------------------------------------------------------
import { useState, useEffect, useCallback } from 'react';
import { CONFIG } from './odoo';

/**
 * useApiList(fetchFn, selectFn, deps)
 *   fetchFn  : دالة async ترجع { ok, ... }  (مثل api.fetchTeam)
 *   selectFn : (res) => Array   تستخرج المصفوفة من الاستجابة
 *
 * ترجع: { data, loading, error, pending, empty, reload }
 *   pending: true عندما يرجع الباك اند pending (مسار غير جاهز بعد)
 */
export function useApiList(fetchFn, selectFn, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(CONFIG.USE_API);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [loaded, setLoaded] = useState(!CONFIG.USE_API);

  const load = useCallback(() => {
    if (!CONFIG.USE_API) { setLoaded(true); return; }
    let alive = true;
    setLoading(true);
    setError('');
    setPending(false);
    (typeof fetchFn !== 'function'
      ? Promise.reject(new Error('fetchFn غير دالة! نوعها: ' + typeof fetchFn))
      : Promise.resolve(fetchFn()))
      .then((res) => {
        if (!alive) return;
        if (res && res.ok) {
          if (res.pending) setPending(true);
          const list = selectFn ? selectFn(res) : [];
          setData(Array.isArray(list) ? list : []);
        } else {
          setError(errText(res));
        }
      })
      .catch((e) => alive && setError('تعذّر الاتصال بالخادم: ' + (e.message || '')))
      .finally(() => { if (alive) { setLoading(false); setLoaded(true); } });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  const empty = loaded && !loading && !error && !pending && data.length === 0;
  return { data, loading, error, pending, empty, reload: load, setData };
}

// رسائل الأخطاء الشائعة بالعربية
export function errText(res) {
  if (!res) return 'تعذّر جلب البيانات';
  const map = {
    network_error: 'تعذّر الاتصال بالخادم',
    server_error: 'خطأ في الخادم',
    not_allowed: 'لا تملك صلاحية لهذا الإجراء',
    store_not_found: 'المتجر غير موجود',
    order_not_found: 'الطلب غير موجود',
    missing_fields: 'تحقّق من الحقول المطلوبة',
    invalid_login: 'بيانات الدخول غير صحيحة',
  };
  return map[res.error] || ('خطأ: ' + (res.error || 'غير معروف'));
}
