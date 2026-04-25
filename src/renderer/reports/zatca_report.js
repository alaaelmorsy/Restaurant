// ZATCA Report — هيئة الزكاة والضريبة والجمارك

// ========== Language System ==========
const __langKey = 'app_lang';
let __currentLang = {};
function __applyLang(lang) {
  const base = (typeof lang === 'string' ? lang.split('-')[0].toLowerCase() : 'ar');
  const isAr = (base === 'ar');
  const t = {
    pageTitle: isAr ? 'تقرير هيئة الزكاة والضريبة والجمارك' : 'ZATCA Report',
    systemTitle: isAr ? 'نظام إدارة المطاعم' : 'Restaurant Management System',
    back: isAr ? 'رجوع' : 'Back',
    from: isAr ? 'من' : 'From',
    to: isAr ? 'إلى' : 'To',
    apply: isAr ? 'تطبيق' : 'Apply',
    exportPDF: isAr ? 'تصدير PDF' : 'Export PDF',
    exportExcel: isAr ? 'تصدير Excel' : 'Export Excel',
    period: isAr ? 'الفترة:' : 'Period:',
    specifyRange: isAr ? 'يرجى تحديد الفترة (من وإلى)' : 'Please specify the period (from and to)',
    applyFirst: isAr ? 'يرجى تحديد الفترة والضغط على تطبيق' : 'Please specify the period and click Apply',
    loading: isAr ? 'جارٍ التحميل...' : 'Loading...',
    exportFailedPdf: isAr ? 'تعذر إنشاء PDF' : 'Failed to create PDF',
    exportFailedExcel: isAr ? 'تعذر إنشاء Excel' : 'Failed to create Excel',
    // Sections
    invSectionTitle: isAr ? 'الفواتير (مدفوعة وغير مدفوعة) ضمن الفترة' : 'Invoices (Paid & Unpaid) within the period',
    cnSectionTitle: isAr ? 'الفواتير المرتجعة (إشعارات دائنة) ضمن الفترة' : 'Returned Invoices (Credit Notes) within the period',
    expSectionTitle: isAr ? 'المصروفات ضمن الفترة' : 'Expenses within the period',
    summaryTitle: isAr ? 'ملخص الإجماليات' : 'Summary Totals',
    // Table headers
    thInvNo: isAr ? 'رقم الفاتورة' : 'Invoice No.',
    thInvDate: isAr ? 'التاريخ' : 'Date',
    thInvCustomer: isAr ? 'العميل' : 'Customer',
    thInvPayment: isAr ? 'طريقة الدفع' : 'Payment Method',
    thInvStatus: isAr ? 'الحالة' : 'Status',
    thInvPre: isAr ? 'قبل الضريبة' : 'Pre-VAT',
    thInvVat: isAr ? 'الضريبة' : 'VAT',
    thInvGrand: isAr ? 'الإجمالي' : 'Total',
    thCnNo: isAr ? 'رقم الإشعار' : 'Credit Note No.',
    thCnDate: isAr ? 'التاريخ' : 'Date',
    thCnCustomer: isAr ? 'العميل' : 'Customer',
    thCnBase: isAr ? 'رقم الفاتورة الأصلية' : 'Original Invoice No.',
    thCnPre: isAr ? 'قبل الضريبة' : 'Pre-VAT',
    thCnVat: isAr ? 'الضريبة' : 'VAT',
    thCnGrand: isAr ? 'الإجمالي' : 'Total',
    thExpTitle: isAr ? 'البيان' : 'Description',
    thExpDate: isAr ? 'التاريخ' : 'Date',
    thExpPayment: isAr ? 'طريقة الدفع' : 'Payment Method',
    thExpPre: isAr ? 'قبل الضريبة' : 'Pre-VAT',
    thExpVat: isAr ? 'الضريبة' : 'VAT',
    thExpGrand: isAr ? 'الإجمالي' : 'Total',
    thSumDesc: isAr ? 'البيان' : 'Description',
    thSumPre: isAr ? 'قبل الضريبة' : 'Pre-VAT',
    thSumVat: isAr ? 'الضريبة' : 'VAT',
    thSumGrand: isAr ? 'بعد الضريبة' : 'After VAT',
    // Footer labels
    footInvTotal: isAr ? 'إجمالي الفواتير' : 'Total Invoices',
    footCnTotal: isAr ? 'إجمالي المرتجعات' : 'Total Returns',
    footExpTotal: isAr ? 'إجمالي المصروفات' : 'Total Expenses',
    lblSales: isAr ? 'المبيعات' : 'Sales',
    lblLessReturns: isAr ? 'ناقص: المرتجعات' : 'Less: Returns',
    lblNetSales: isAr ? 'المبيعات بعد خصم المرتجعات' : 'Sales after returns',
    lblLessExpenses: isAr ? 'ناقص: المصروفات' : 'Less: Expenses',
    lblFinalTotal: isAr ? 'الإجمالي النهائي' : 'Final Total',
    // Status badges
    paid: isAr ? 'مدفوعة' : 'Paid',
    unpaid: isAr ? 'غير مدفوعة' : 'Unpaid',
    // Empty messages
    noInvoices: isAr ? 'لا توجد فواتير ضمن الفترة' : 'No invoices within the period',
    noReturns: isAr ? 'لا توجد مرتجعات ضمن الفترة' : 'No returns within the period',
    noExpenses: isAr ? 'لا توجد مصروفات ضمن الفترة' : 'No expenses within the period',
    // Payment methods
    cash: isAr ? 'نقدًا' : 'Cash',
    network: isAr ? 'شبكة' : 'Network',
    credit: isAr ? 'آجل' : 'Credit',
    tamara: isAr ? 'تمارا' : 'Tamara',
    tabby: isAr ? 'تابي' : 'Tabby',
    bankTransfer: isAr ? 'تحويل بنكي' : 'Bank Transfer',
    mixed: isAr ? 'مختلط' : 'Mixed',
    // CSV headers
    csvPeriod: isAr ? 'الفترة' : 'Period',
    csvInvoices: isAr ? 'الفواتير' : 'Invoices',
    csvReturns: isAr ? 'المرتجعات' : 'Returns',
    csvExpenses: isAr ? 'المصروفات' : 'Expenses',
    csvSummary: isAr ? 'ملخص الإجماليات' : 'Summary Totals',
  };

  __currentLang = t;

  document.documentElement.lang = isAr ? 'ar' : 'en';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  document.title = t.pageTitle;

  const pageHeading = document.getElementById('pageHeading');
  if (pageHeading) pageHeading.textContent = t.pageTitle;

  const systemTitle = document.getElementById('systemTitle');
  if (systemTitle) systemTitle.textContent = t.systemTitle;

  const btnBack = document.getElementById('btnBack');
  if (btnBack) btnBack.textContent = t.back;

  const fromLabel = document.querySelector('label[for="fromAt"]');
  if (fromLabel) fromLabel.textContent = t.from;

  const toLabel = document.querySelector('label[for="toAt"]');
  if (toLabel) toLabel.textContent = t.to;

  const applyBtn = document.getElementById('applyRangeBtn');
  if (applyBtn) applyBtn.textContent = t.apply;

  const exportPdfBtn = document.getElementById('exportPdfBtn');
  if (exportPdfBtn) exportPdfBtn.textContent = t.exportPDF;

  const exportExcelBtn = document.getElementById('exportExcelBtn');
  if (exportExcelBtn) exportExcelBtn.textContent = t.exportExcel;

  // Section titles
  const ids = ['invSectionTitle','cnSectionTitle','expSectionTitle','summaryTitle'];
  const keys = ['invSectionTitle','cnSectionTitle','expSectionTitle','summaryTitle'];
  ids.forEach((id, i) => { const el = document.getElementById(id); if (el) el.textContent = t[keys[i]]; });

  // Table headers
  const thIds = ['thInvNo','thInvDate','thInvCustomer','thInvPayment','thInvStatus','thInvPre','thInvVat','thInvGrand','thCnNo','thCnDate','thCnCustomer','thCnBase','thCnPre','thCnVat','thCnGrand','thExpTitle','thExpDate','thExpPayment','thExpPre','thExpVat','thExpGrand','thSumDesc','thSumPre','thSumVat','thSumGrand'];
  const thKeys = ['thInvNo','thInvDate','thInvCustomer','thInvPayment','thInvStatus','thInvPre','thInvVat','thInvGrand','thCnNo','thCnDate','thCnCustomer','thCnBase','thCnPre','thCnVat','thCnGrand','thExpTitle','thExpDate','thExpPayment','thExpPre','thExpVat','thExpGrand','thSumDesc','thSumPre','thSumVat','thSumGrand'];
  thIds.forEach((id, i) => { const el = document.getElementById(id); if (el) el.textContent = t[thKeys[i]]; });

  // Footer labels
  const footIds = ['footInvTotal','footCnTotal','footExpTotal'];
  const footKeys = ['footInvTotal','footCnTotal','footExpTotal'];
  footIds.forEach((id, i) => { const el = document.getElementById(id); if (el) el.textContent = t[footKeys[i]]; });

  // Summary labels
  const sumIds = ['lblSales','lblLessReturns','lblNetSales','lblLessExpenses','lblFinalTotal'];
  const sumKeys = ['lblSales','lblLessReturns','lblNetSales','lblLessExpenses','lblFinalTotal'];
  sumIds.forEach((id, i) => { const el = document.getElementById(id); if (el) el.textContent = t[sumKeys[i]]; });

  try { localStorage.setItem(__langKey, base); } catch (_) { }
}

(function initLang() {
  (async () => {
    try {
      const r = await window.api.app_get_locale();
      const L = (r && r.lang) || 'ar';
      __applyLang(L);
    } catch (_) {
      __applyLang('ar');
    }
  })();
  try {
    window.api.app_on_locale_changed((L) => {
      __applyLang(L);
    });
  } catch (_) { }
})();

const fmt = (n) => Number(n || 0).toFixed(2);
const rangeEl = document.getElementById('range');
const fromAtEl = document.getElementById('fromAt');
const toAtEl = document.getElementById('toAt');

function labelPaymentMethod(method) {
  const t = __currentLang || {};
  const m = String(method || '').toLowerCase();
  if (m === 'cash') return t.cash || 'Cash';
  if (m === 'card' || m === 'network') return t.network || 'Network';
  if (m === 'credit') return t.credit || 'Credit';
  if (m === 'tamara') return t.tamara || 'Tamara';
  if (m === 'tabby') return t.tabby || 'Tabby';
  if (m === 'transfer' || m === 'bank_transfer') return t.bankTransfer || 'Bank Transfer';
  if (m === 'mixed') return t.mixed || 'Mixed';
  return method || '';
}

function formatDate(val) {
  if (!val) return '';
  let d = new Date(val);
  if (isNaN(d.getTime())) {
    try { d = new Date(String(val).replace(' ', 'T')); } catch (_) { return val; }
  }
  if (isNaN(d.getTime())) return val;
  return new Intl.DateTimeFormat('en-GB-u-ca-gregory', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true
  }).format(d);
}

function toStr(d) {
  const p = (v) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

function fromInputToStr(input) {
  const v = (input?.value || '').trim();
  if (!v) return '';
  return v.replace('T', ' ') + ':00';
}

function setEl(id, val, isNum = true) {
  const el = document.getElementById(id);
  if (el) el.textContent = isNum ? fmt(val) : String(val);
}

// Back button
const btnBack = document.getElementById('btnBack');
if (btnBack) { btnBack.onclick = () => { window.location.href = './index.html'; } }

// ─── Export PDF ───────────────────────────────────────────────────────────────
(function attachExportHandlers() {
  let exporting = false;

  const btnPdf = document.getElementById('exportPdfBtn');
  if (btnPdf) {
    btnPdf.addEventListener('click', async () => {
      if (exporting) return; exporting = true; btnPdf.disabled = true;
      try {
        const period = (rangeEl && rangeEl.textContent) ? rangeEl.textContent.replace(/[^0-9_\-–: —]+/g, '').trim() : '';
        const safe = period.replace(/[: ]/g, '_');
        const title = `zatca-report-${safe || Date.now()}.pdf`;

        const clone = document.documentElement.cloneNode(true);

        // إزالة العناصر غير المطلوبة
        clone.querySelectorAll('header, .range-actions').forEach(el => { try { el.remove(); } catch (_) { } });

        // إضافة ترويسة PDF
        try {
          const container = clone.querySelector('.container');
          if (container) {
            const headerDiv = document.createElement('div');
            headerDiv.style.cssText = 'text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:4px solid #0b3daa;';
            const t = __currentLang || {};
        let html = `<h1 style="font-size:24px;font-weight:900;color:#0b3daa;margin-bottom:6px;font-family:Cairo,sans-serif;">${t.pageTitle || 'ZATCA Report'}</h1>`;
            if (rangeEl && rangeEl.textContent) {
              html += `<div style="font-size:14px;font-weight:700;color:#64748b;font-family:Cairo,sans-serif;">${rangeEl.textContent}</div>`;
            }
            headerDiv.innerHTML = html;
            container.insertBefore(headerDiv, container.firstChild);
          }
        } catch (_) { }

        const style = clone.ownerDocument.createElement('style');
        style.textContent = `
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
          * { font-family: 'Cairo', sans-serif !important; }
          @media print {
            @page { size: A4 portrait; margin: 15px 20px; }
            body { background: #fff !important; }
            .zatca-section { box-shadow: none !important; border-radius: 0 !important; margin-bottom: 16px; }
            .ztable { width: 100%; border-collapse: collapse; font-size: 10px; }
            .ztable thead th { background: #eef2ff !important; color: #0b3daa !important; font-weight: 700; padding: 5px 6px; border: 1px solid #c7d2fe; }
            .ztable tbody td { padding: 4px 6px; border: 1px solid #e6eaf0; }
            .ztable tfoot th { background: #f1f5f9 !important; font-weight: 900; padding: 5px 6px; border: 1px solid #e6eaf0; }
            .row-unpaid td { background: #fef2f2 !important; }
            .row-return td { background: #fff7ed !important; }
            .row-net-sales td { background: #f0fdf4 !important; font-weight: 700; }
            .row-expenses td { background: #fffbeb !important; }
            .row-net-final td, .row-net-final th { background: #f1f5f9 !important; font-weight: 900; }
            .col-final-green { color: #16a34a !important; }
            .overflow-x-auto { overflow: visible !important; }
          }
        `;
        clone.querySelector('head')?.appendChild(style);

        const html = '<!doctype html>' + clone.outerHTML;
        await window.api.pdf_export(html, { saveMode: 'auto', filename: title, pageSize: 'A4' });
      } catch (e) { console.error(e); alert((__currentLang||{}).exportFailedPdf || 'Failed to create PDF'); }
      finally { exporting = false; btnPdf.disabled = false; }
    });
  }

  // ─── Export CSV/Excel ──────────────────────────────────────────────────────
  const btnExcel = document.getElementById('exportExcelBtn');
  if (btnExcel) {
    btnExcel.addEventListener('click', async () => {
      if (exporting) return; exporting = true; btnExcel.disabled = true;
      try {
        const t = __currentLang || {};
        const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
        const lines = [];

        // الفترة
        lines.push(esc(t.csvPeriod || 'Period'));
        lines.push(esc((rangeEl && rangeEl.textContent) ? rangeEl.textContent.trim() : ''));
        lines.push('');

        // الفواتير
        lines.push(esc(t.csvInvoices || 'Invoices'));
        lines.push([esc(t.thInvNo), esc(t.thInvDate), esc(t.thInvCustomer), esc(t.thInvPayment), esc(t.thInvStatus), esc(t.thInvPre), esc(t.thInvVat), esc(t.thInvGrand)].join(','));
        document.querySelectorAll('#invTbody tr').forEach(tr => {
          const tds = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
          if (tds.length) lines.push(tds.map(esc).join(','));
        });
        lines.push([esc(t.footInvTotal), '', '', '', '', esc(document.getElementById('invSumPre')?.textContent || ''), esc(document.getElementById('invSumVat')?.textContent || ''), esc(document.getElementById('invSumGrand')?.textContent || '')].join(','));
        lines.push('');

        // المرتجعات
        lines.push(esc(t.csvReturns || 'Returns'));
        lines.push([esc(t.thCnNo), esc(t.thCnDate), esc(t.thCnCustomer), esc(t.thCnBase), esc(t.thCnPre), esc(t.thCnVat), esc(t.thCnGrand)].join(','));
        document.querySelectorAll('#cnTbody tr').forEach(tr => {
          const tds = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
          if (tds.length) lines.push(tds.map(esc).join(','));
        });
        lines.push([esc(t.footCnTotal), '', '', '', esc(document.getElementById('cnSumPre')?.textContent || ''), esc(document.getElementById('cnSumVat')?.textContent || ''), esc(document.getElementById('cnSumGrand')?.textContent || '')].join(','));
        lines.push('');

        // المصروفات
        lines.push(esc(t.csvExpenses || 'Expenses'));
        lines.push([esc(t.thExpTitle), esc(t.thExpDate), esc(t.thExpPayment), esc(t.thExpPre), esc(t.thExpVat), esc(t.thExpGrand)].join(','));
        document.querySelectorAll('#expTbody tr').forEach(tr => {
          const tds = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
          if (tds.length) lines.push(tds.map(esc).join(','));
        });
        lines.push([esc(t.footExpTotal), '', '', esc(document.getElementById('expSumPre')?.textContent || ''), esc(document.getElementById('expSumVat')?.textContent || ''), esc(document.getElementById('expSumGrand')?.textContent || '')].join(','));
        lines.push('');

        // ملخص الإجماليات
        lines.push(esc(t.csvSummary || 'Summary Totals'));
        lines.push([esc(t.thSumDesc), esc(t.thSumPre), esc(t.thSumVat), esc(t.thSumGrand)].join(','));
        lines.push([esc(t.lblSales), esc(document.getElementById('sumInvPre')?.textContent || ''), esc(document.getElementById('sumInvVat')?.textContent || ''), esc(document.getElementById('sumInvGrand')?.textContent || '')].join(','));
        lines.push([esc(t.lblLessReturns), esc(document.getElementById('sumCnPre')?.textContent || ''), esc(document.getElementById('sumCnVat')?.textContent || ''), esc(document.getElementById('sumCnGrand')?.textContent || '')].join(','));
        lines.push([esc(t.lblNetSales), esc(document.getElementById('sumNetSalesPre')?.textContent || ''), esc(document.getElementById('sumNetSalesVat')?.textContent || ''), esc(document.getElementById('sumNetSalesGrand')?.textContent || '')].join(','));
        lines.push([esc(t.lblLessExpenses), esc(document.getElementById('sumExpPre')?.textContent || ''), esc(document.getElementById('sumExpVat')?.textContent || ''), esc(document.getElementById('sumExpGrand')?.textContent || '')].join(','));
        lines.push([esc(t.lblFinalTotal), esc(document.getElementById('sumNetPre')?.textContent || ''), esc(document.getElementById('sumNetVat')?.textContent || ''), esc(document.getElementById('sumNetGrand')?.textContent || '')].join(','));

        const csv = lines.join('\n');
        const period = (rangeEl && rangeEl.textContent) ? rangeEl.textContent.replace(/[^0-9\-_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') : String(Date.now());
        const filename = `zatca-report-${period}.csv`;
        await window.api.csv_export(csv, { saveMode: 'auto', filename });
      } catch (e) { console.error(e); alert((__currentLang||{}).exportFailedExcel || 'Failed to create Excel'); }
      finally { exporting = false; btnExcel.disabled = false; }
    });
  }
})();

// ─── Load Range ───────────────────────────────────────────────────────────────
async function loadRange(startStr, endStr) {
  try {
    const t = __currentLang || {};
    // ضمان شمول آخر ثانية في الدقيقة المحددة
    let adjEnd = endStr;
    if (adjEnd && adjEnd.match(/:\d\d:00$/)) adjEnd = adjEnd.replace(/:00$/, ':59');

    if (rangeEl) rangeEl.textContent = `${t.period || 'Period:'} ${startStr} — ${endStr}`;

    // ── جلب الفواتير ──────────────────────────────────────────────────────────
    let allSales = [];
    try {
      const res = await window.api.sales_list({ date_from: startStr, date_to: adjEnd, limit: 50000 });
      allSales = (res && res.ok) ? (res.items || []) : [];
    } catch (_) { allSales = []; }

    const invoices = allSales.filter(s =>
      String(s.doc_type || '') !== 'credit_note' &&
      !String(s.invoice_no || '').startsWith('CN-')
    );

    const creditNotes = allSales.filter(s =>
      String(s.doc_type || '') === 'credit_note' ||
      String(s.invoice_no || '').startsWith('CN-')
    );

    // ── جلب المصروفات ─────────────────────────────────────────────────────────
    let expenses = [];
    try {
      const res = await window.api.purchases_list({ from_at: startStr, to_at: adjEnd });
      expenses = (res && res.ok) ? (res.items || []) : [];
    } catch (_) { expenses = []; }

    // ── تجميع الإجماليات ──────────────────────────────────────────────────────
    let INV_PRE = 0, INV_VAT = 0, INV_GRAND = 0;
    invoices.forEach(s => {
      INV_PRE += Number(s.sub_total || 0);
      INV_VAT += Number(s.vat_total || 0);
      INV_GRAND += Number(s.grand_total || 0);
    });

    let CN_PRE = 0, CN_VAT = 0, CN_GRAND = 0;
    creditNotes.forEach(s => {
      CN_PRE += Math.abs(Number(s.sub_total || 0));
      CN_VAT += Math.abs(Number(s.vat_total || 0));
      CN_GRAND += Math.abs(Number(s.grand_total || 0));
    });

    let EXP_PRE = 0, EXP_VAT = 0, EXP_GRAND = 0;
    expenses.forEach(p => {
      EXP_PRE += Number(p.sub_total || 0);
      EXP_VAT += Number(p.vat_total || 0);
      EXP_GRAND += Number(p.grand_total || 0);
    });

    // مبيعات بعد خصم المرتجعات
    const NET_SALES_PRE = INV_PRE - CN_PRE;
    const NET_SALES_VAT = INV_VAT - CN_VAT;
    const NET_SALES_GRAND = INV_GRAND - CN_GRAND;

    // الإجمالي النهائي
    const NET_PRE = NET_SALES_PRE - EXP_PRE;
    const NET_VAT = NET_SALES_VAT - EXP_VAT;
    const NET_GRAND = NET_SALES_GRAND - EXP_GRAND;

    // ── رسم جدول الفواتير ─────────────────────────────────────────────────────
    const invTbody = document.getElementById('invTbody');
    if (invTbody) {
      if (invoices.length === 0) {
        invTbody.innerHTML = `<tr><td colspan="8" style="color:#64748b;text-align:center;">${t.noInvoices || 'No invoices within the period'}</td></tr>`;
      } else {
        invTbody.innerHTML = invoices.map(s => {
          const isUnpaid = String(s.payment_method || '').toLowerCase() === 'credit'
            && String(s.payment_status || 'paid') === 'unpaid';
          const statusBadge = isUnpaid
            ? `<span class="badge-unpaid">${t.unpaid || 'Unpaid'}</span>`
            : `<span class="badge-paid">${t.paid || 'Paid'}</span>`;
          const cust = s.customer_phone || s.disp_customer_phone || s.customer_name || s.disp_customer_name || '';
          const rowClass = isUnpaid ? 'class="row-unpaid"' : '';
          return `<tr ${rowClass}>
            <td>${s.invoice_no || ''}</td>
            <td>${formatDate(s.created_at)}</td>
            <td dir="ltr" style="text-align:left;">${cust}</td>
            <td>${labelPaymentMethod(s.payment_method)}</td>
            <td>${statusBadge}</td>
            <td>${fmt(s.sub_total)}</td>
            <td>${fmt(s.vat_total)}</td>
            <td>${fmt(s.grand_total)}</td>
          </tr>`;
        }).join('');
      }
    }
    setEl('invSumPre', INV_PRE);
    setEl('invSumVat', INV_VAT);
    setEl('invSumGrand', INV_GRAND);

    // ── رسم جدول المرتجعات ────────────────────────────────────────────────────
    const cnTbody = document.getElementById('cnTbody');
    if (cnTbody) {
      if (creditNotes.length === 0) {
        cnTbody.innerHTML = `<tr><td colspan="7" style="color:#64748b;text-align:center;">${t.noReturns || 'No returns within the period'}</td></tr>`;
      } else {
        cnTbody.innerHTML = creditNotes.map(s => {
          const cust = s.customer_phone || s.disp_customer_phone || s.customer_name || s.disp_customer_name || '';
          const baseInv = s.base_invoice_no || s.ref_base_invoice_no || '';
          return `<tr class="row-return">
            <td>${s.invoice_no || ''}</td>
            <td>${formatDate(s.created_at)}</td>
            <td dir="ltr" style="text-align:left;">${cust}</td>
            <td>${baseInv}</td>
            <td>${fmt(Math.abs(Number(s.sub_total || 0)))}</td>
            <td>${fmt(Math.abs(Number(s.vat_total || 0)))}</td>
            <td>${fmt(Math.abs(Number(s.grand_total || 0)))}</td>
          </tr>`;
        }).join('');
      }
    }
    setEl('cnSumPre', CN_PRE);
    setEl('cnSumVat', CN_VAT);
    setEl('cnSumGrand', CN_GRAND);

    // ── رسم جدول المصروفات ────────────────────────────────────────────────────
    const expTbody = document.getElementById('expTbody');
    if (expTbody) {
      if (expenses.length === 0) {
        expTbody.innerHTML = `<tr><td colspan="6" style="color:#64748b;text-align:center;">${t.noExpenses || 'No expenses within the period'}</td></tr>`;
      } else {
        expTbody.innerHTML = expenses.map(p => {
          const title = p.title || p.name || '';
          const dateVal = p.purchase_at || p.created_at || '';
          return `<tr>
            <td style="text-align:right;">${title}</td>
            <td>${formatDate(dateVal)}</td>
            <td>${labelPaymentMethod(p.payment_method)}</td>
            <td>${fmt(p.sub_total)}</td>
            <td>${fmt(p.vat_total)}</td>
            <td>${fmt(p.grand_total)}</td>
          </tr>`;
        }).join('');
      }
    }
    setEl('expSumPre', EXP_PRE);
    setEl('expSumVat', EXP_VAT);
    setEl('expSumGrand', EXP_GRAND);

    // ── رسم ملخص الإجماليات ───────────────────────────────────────────────────
    setEl('sumInvPre', INV_PRE);
    setEl('sumInvVat', INV_VAT);
    setEl('sumInvGrand', INV_GRAND);
    setEl('sumCnPre', CN_PRE);
    setEl('sumCnVat', CN_VAT);
    setEl('sumCnGrand', CN_GRAND);
    setEl('sumNetSalesPre', NET_SALES_PRE);
    setEl('sumNetSalesVat', NET_SALES_VAT);
    setEl('sumNetSalesGrand', NET_SALES_GRAND);
    setEl('sumExpPre', EXP_PRE);
    setEl('sumExpVat', EXP_VAT);
    setEl('sumExpGrand', EXP_GRAND);
    setEl('sumNetPre', NET_PRE);
    setEl('sumNetVat', NET_VAT);
    setEl('sumNetGrand', NET_GRAND);

  } catch (e) { console.error(e); }
}

// ─── Default Range ────────────────────────────────────────────────────────────
function initDefaultRange() {
  const t = __currentLang || {};
  const now = new Date();
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const s = toStr(start);
  const e = toStr(now);
  if (fromAtEl) fromAtEl.value = s.replace(' ', 'T').slice(0, 16);
  if (toAtEl) toAtEl.value = e.replace(' ', 'T').slice(0, 16);

  const msg = t.applyFirst || 'Please specify the period and click Apply';
  const empty = `<tr><td colspan="8" style="color:#64748b;text-align:center;padding:16px;">${msg}</td></tr>`;
  const empty7 = `<tr><td colspan="7" style="color:#64748b;text-align:center;padding:16px;">${msg}</td></tr>`;
  const empty6 = `<tr><td colspan="6" style="color:#64748b;text-align:center;padding:16px;">${msg}</td></tr>`;
  const invTbody = document.getElementById('invTbody');
  if (invTbody) invTbody.innerHTML = empty;
  const cnTbody = document.getElementById('cnTbody');
  if (cnTbody) cnTbody.innerHTML = empty7;
  const expTbody = document.getElementById('expTbody');
  if (expTbody) expTbody.innerHTML = empty6;
}

// ─── Wire Apply Button ────────────────────────────────────────────────────────
(function wireRange() {
  const btn = document.getElementById('applyRangeBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      const t = __currentLang || {};
      const s = fromInputToStr(fromAtEl);
      const e = fromInputToStr(toAtEl);
      if (!s || !e) { alert(t.specifyRange || 'Please specify the period (from and to)'); return; }
      loadRange(s, e);
    });
  }
})();

// فتح التقويم عند اللمس
if (fromAtEl) {
  fromAtEl.addEventListener('click', function () { try { this.showPicker(); } catch (_) { } });
  fromAtEl.addEventListener('focus', function () { try { this.showPicker(); } catch (_) { } });
}
if (toAtEl) {
  toAtEl.addEventListener('click', function () { try { this.showPicker(); } catch (_) { } });
  toAtEl.addEventListener('focus', function () { try { this.showPicker(); } catch (_) { } });
}

initDefaultRange();
