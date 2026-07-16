import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../theme';
import { T, Card, ScreenTitle, PrimaryButton } from '../components/ui';
import { ScreenBg } from '../components/ScreenBg';
import { AsyncState } from '../components/StateViews';
import { useI18n } from '../i18n';
import api from '../api/odoo';
import { useApiList } from '../api/useApi';

const money = (n, c = '﷼') => `${c} ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// حالات الفاتورة — مطابقة لـ account.move (paid | pending | overdue)
const INVOICE_STATUS = {
  paid:    { label: 'مدفوعة', bg: '#EEF7F1', fg: '#4B7A5C', dot: '#28A05B' },
  pending: { label: 'مستحقة', bg: '#FDF6E7', fg: '#977219', dot: '#D9A52B' },
  overdue: { label: 'متأخرة', bg: '#FCEDEC', fg: '#9A4038', dot: '#D64545' },
};

const FILTERS = [
  ['all', 'الكل'],
  ['paid', 'مدفوعة'],
  ['pending', 'مستحقة'],
  ['overdue', 'متأخرة'],
];
function mapPaymentState(paymentState, dueDateStr, residual) {
  if (paymentState === 'paid' || paymentState === 'in_payment') return 'paid';
  if (residual > 0 && dueDateStr && new Date(dueDateStr) < new Date()) return 'overdue';
  return 'pending';
}
// ————— قائمة الفواتير —————
export function InvoicesScreen({ navigation }) {
  const { isRTL } = useI18n();
  const row = isRTL ? 'row-reverse' : 'row';
  const [filter, setFilter] = useState('all');

  // الفواتير تُسحب من أودو. لا يوجد endpoint بعد → pending (قائمة فارغة).
  const { data: invoices, loading, error, pending, empty, reload } = useApiList(
    api.fetchInvoices,
    (res) => res.invoices || [],
    [],
  );

  const list = filter === 'all' ? invoices : invoices.filter((i) => i.status === filter);
  const paidCount = invoices.filter((i) => i.status === 'paid').length;
  const dueTotal = invoices.filter((i) => i.status !== 'paid')
    .reduce((s, i) => s + (i.amount_total || 0), 0);

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="الفواتير" onBack={() => navigation.goBack()} />

        {/* بطاقة الملخّص */}
        <LinearGradient colors={[colors.accent, colors.accentDeep]} style={styles.summary}>
          <View style={{ flexDirection: row, justifyContent: 'space-between' }}>
            <View>
              <T size={12} color="rgba(255,255,255,.75)">إجمالي المستحق</T>
              <T size={24} weight="bold" color="#fff" style={{ marginTop: 4 }}>{money(dueTotal)}</T>
            </View>
            <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
              <T size={12} color="rgba(255,255,255,.75)">فواتير مدفوعة</T>
              <T size={24} weight="bold" color="#fff" style={{ marginTop: 4 }}>{paidCount}</T>
            </View>
          </View>
        </LinearGradient>

        {/* فلاتر الحالة */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexDirection: row, gap: 8, marginBottom: 16 }}>
          {FILTERS.map(([k, label]) => {
            const on = filter === k;
            return (
              <Pressable key={k} onPress={() => setFilter(k)}
                style={[styles.pill, { backgroundColor: on ? colors.accent : '#fff', borderColor: on ? colors.accent : '#E2DEEC' }]}>
                <T size={12.5} weight="semi" color={on ? '#fff' : colors.inkSoft}>{label}</T>
              </Pressable>
            );
          })}
        </ScrollView>

        <AsyncState
          loading={loading} error={error} pending={pending} empty={empty} onRetry={reload}
          loadingLabel="جارٍ جلب الفواتير…"
          pendingTitle="الفواتير غير متاحة بعد"
          pendingHint="سيظهر سجل الفواتير فور تجهيز الخدمة في الخادم."
          emptyTitle="لا توجد فواتير"
        >
          {list.length === 0 ? (
            <Card style={{ alignItems: 'center', paddingVertical: 30 }}>
              <T size={13} color={colors.muted}>لا توجد فواتير بهذه الحالة</T>
            </Card>
          ) : (
            list.map((inv) => {
              const st = INVOICE_STATUS[inv.status] || INVOICE_STATUS.pending;
              return (
                <Pressable key={inv.id} onPress={() => navigation.navigate('InvoiceDetail', { invoice: inv })}>
                  <Card style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <T weight="bold" size={14} style={{ writingDirection: 'ltr', textAlign: isRTL ? 'right' : 'left' }}>{inv.number}</T>
                        <T size={11.5} color={colors.muted} style={{ marginTop: 3 }}>{inv.plan}</T>
                        <T size={11} color={colors.mutedLight} style={{ marginTop: 2 }}>{inv.date}</T>
                      </View>
                      <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
                        <T weight="bold" size={15}>{money(inv.amount_total, inv.currency)}</T>
                        <View style={[styles.statusPill, { backgroundColor: st.bg, marginTop: 8, flexDirection: row }]}>
                          <View style={[styles.dot, { backgroundColor: st.dot }]} />
                          <T size={11} weight="bold" color={st.fg}>{st.label}</T>
                        </View>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            })
          )}
        </AsyncState>
      </ScrollView>
    </ScreenBg>
  );
}

// ————— تفاصيل الفاتورة —————
export function InvoiceDetailScreen({ route, navigation }) {
  const { isRTL } = useI18n();
  const row = isRTL ? 'row-reverse' : 'row';
  const summary = route.params?.invoice; // البيانات المختصرة من القائمة (fallback فوري)

  const [inv, setInv] = useState(summary || null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(!!summary?.id);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!summary?.id) return;
    let alive = true;
    api.fetchInvoiceDetail(summary.id)
      .then((res) => {
        if (!alive) return;
        if (res && res.ok && res.invoice) {
          const m = res.invoice;
          setInv({
            id: m.id,
            number: m.name || '—',
            date: m.date || '',
            due: m.due_date || '',
            paid_date: m.payment_state === 'paid' ? (m.date || '') : null,
            amount_total: m.total,
            subtotal: m.subtotal,
            tax: m.tax,
            currency: m.currency || '﷼',
            status: mapPaymentState(m.payment_state, m.due_date, m.residual),
            method: m.payment_method || '—',
            period: '', // ما فيه حقل فترة اشتراك بأودو الفاتورة نفسها — نتركه فاضي
            plan: '',   // نفس الشي، ما فيه ربط مباشر بخطة اشتراك بهذا الـ move
          });
          setLines(res.lines || []);
        } else {
          setError(res?.error || 'تعذّر جلب تفاصيل الفاتورة');
        }
      })
      .catch(() => alive && setError('تعذّر الاتصال بالخادم'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [summary?.id]);

  if (!summary) {
    return (
      <ScreenBg>
        <ScrollView contentContainerStyle={styles.wrap}>
          <ScreenTitle title="الفاتورة" onBack={() => navigation.goBack()} />
          <Card style={{ alignItems: 'center', paddingVertical: 30 }}>
            <T size={13} color={colors.muted}>تعذّر عرض الفاتورة</T>
          </Card>
        </ScrollView>
      </ScreenBg>
    );
  }

  if (loading) {
    return (
      <ScreenBg>
        <ScrollView contentContainerStyle={styles.wrap}>
          <ScreenTitle title={inv?.number || 'الفاتورة'} onBack={() => navigation.goBack()} />
          <T center size={13} color={colors.muted}>جارٍ تحميل التفاصيل…</T>
        </ScrollView>
      </ScreenBg>
    );
  }

  const st = INVOICE_STATUS[inv.status] || INVOICE_STATUS.pending;

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        <ScreenTitle title={inv.number} onBack={() => navigation.goBack()} />

        {error ? <T center size={12.5} color={colors.danger} style={{ marginBottom: 12 }}>{error}</T> : null}

        <Card style={{ marginBottom: 14, alignItems: 'center', paddingVertical: 22 }}>
          <View style={[styles.statusPill, { backgroundColor: st.bg, flexDirection: row }]}>
            <View style={[styles.dot, { backgroundColor: st.dot }]} />
            <T size={12} weight="bold" color={st.fg}>{st.label}</T>
          </View>
          <T size={30} weight="bold" style={{ marginTop: 14 }}>{money(inv.amount_total, inv.currency)}</T>
          {inv.period ? <T size={12.5} color={colors.muted} style={{ marginTop: 4 }}>فاتورة {inv.period}</T> : null}
        </Card>

        <Card style={{ marginBottom: 14 }}>
          <T size={11} weight="bold" color={colors.muted} style={{ marginBottom: 11 }}>التفاصيل</T>
          <DetailRow label="رقم الفاتورة" value={inv.number} ltr row={row} />
          <DetailRow label="تاريخ الإصدار" value={inv.date} row={row} />
          <DetailRow label="تاريخ الاستحقاق" value={inv.due} row={row} />
          {inv.paid_date && <DetailRow label="تاريخ الدفع" value={inv.paid_date} row={row} />}
          <DetailRow label="طريقة الدفع" value={inv.method} row={row} last />
        </Card>

        <Card style={{ marginBottom: 14 }}>
          <T size={11} weight="bold" color={colors.muted} style={{ marginBottom: 11 }}>البنود</T>
          {lines.length === 0 ? (
            <T size={12.5} color={colors.muted}>لا توجد بنود مفصّلة</T>
          ) : lines.map((l, i) => (
            <View key={i} style={[{ flexDirection: row, justifyContent: 'space-between', paddingVertical: 9 },
                                   i > 0 && { borderTopWidth: 1, borderTopColor: colors.borderSoft }]}>
              <View style={{ flex: 1 }}>
                <T size={13.5} weight="semi">{l.name}</T>
                <T size={11} color={colors.muted}>× {l.qty}</T>
              </View>
              <T size={13.5} weight="semi">{money(l.total, inv.currency)}</T>
            </View>
          ))}

          {(inv.subtotal != null && inv.tax != null) && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
              <TotalRow label="المجموع الفرعي" value={money(inv.subtotal, inv.currency)} row={row} />
              <TotalRow label="ضريبة القيمة المضافة" value={money(inv.tax, inv.currency)} row={row} />
              <View style={{ flexDirection: row, justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
                <T size={15} weight="bold">الإجمالي</T>
                <T size={15} weight="bold" color={colors.accent}>{money(inv.amount_total, inv.currency)}</T>
              </View>
            </View>
          )}
        </Card>

        <PrimaryButton label="تحميل PDF" onPress={() => {}} />
        {inv.status !== 'paid' && (
          <Pressable onPress={() => {}} style={styles.payNow}>
            <T center size={14} weight="bold" color={colors.accent}>ادفع الآن</T>
          </Pressable>
        )}
      </ScrollView>
    </ScreenBg>
  );
}

function DetailRow({ label, value, ltr, last, row }) {
  return (
    <View style={[{ flexDirection: row, justifyContent: 'space-between', paddingVertical: 7 }, !last && { borderBottomWidth: 0 }]}>
      <T size={13} color={colors.muted}>{label}</T>
      <T size={13} weight="semi" style={ltr ? { writingDirection: 'ltr' } : null}>{value}</T>
    </View>
  );
}

function TotalRow({ label, value, row }) {
  return (
    <View style={{ flexDirection: row, justifyContent: 'space-between', paddingVertical: 4 }}>
      <T size={13} color={colors.muted}>{label}</T>
      <T size={13} weight="semi">{value}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 18, paddingTop: 52, paddingBottom: 30 },
  summary: { borderRadius: radius.xl, padding: 20, marginBottom: 16 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  statusPill: { alignItems: 'center', gap: 6, paddingVertical: 5, paddingHorizontal: 11, borderRadius: 20, alignSelf: 'flex-start' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  payNow: { marginTop: 12, borderWidth: 1, borderColor: '#E2DEEC', borderRadius: radius.md, paddingVertical: 14, backgroundColor: '#fff' },
});
