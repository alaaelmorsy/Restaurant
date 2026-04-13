// ZATCA Report — هيئة الزكاة والضريبة والجمارك

const fmt = (n) => Number(n || 0).toFixed(2);
const rangeEl = document.getElementById('range');
const fromAtEl = document.getElementById('fromAt');
const toAtEl = document.getElementById('toAt');

function labelPaymentMethod(method) {
  const m = String(method || '').toLowerCase();
  if (m === 'cash') return 'نقدًا';
  if (m === 'card' || m === 'network') return 'شبكة';
  if (m === 'credit') return 'آجل';
  if (m === 'tamara') return 'تمارا';
  if (m === 'tabby') return 'تابي';
  if (m === 'transfer' || m === 'bank_transfer') return 'تحويل بنكي';
  if (m === 'mixed') return 'مختلط';
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
            let html = '<h1 style="font-size:24px;font-weight:900;color:#0b3daa;margin-bottom:6px;font-family:Cairo,sans-serif;">تقرير هيئة الزكاة والضريبة والجمارك</h1>';
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
      } catch (e) { console.error(e); alert('تعذر إنشاء PDF'); }
      finally { exporting = false; btnPdf.disabled = false; }
    });
  }

  // ─── Export CSV/Excel ──────────────────────────────────────────────────────
  const btnExcel = document.getElementById('exportExcelBtn');
  if (btnExcel) {
    btnExcel.addEventListener('click', async () => {
      if (exporting) return; exporting = true; btnExcel.disabled = true;
      try {
        const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
        const lines = [];

        // الفترة
        lines.push(esc('الفترة'));
        lines.push(esc((rangeEl && rangeEl.textContent) ? rangeEl.textContent.trim() : ''));
        lines.push('');

        // الفواتير
        lines.push(esc('الفواتير'));
        lines.push([esc('رقم الفاتورة'), esc('التاريخ'), esc('العميل'), esc('طريقة الدفع'), esc('الحالة'), esc('قبل الضريبة'), esc('الضريبة'), esc('الإجمالي')].join(','));
        document.querySelectorAll('#invTbody tr').forEach(tr => {
          const tds = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
          if (tds.length) lines.push(tds.map(esc).join(','));
        });
        lines.push([esc('إجمالي الفواتير'), '', '', '', '', esc(document.getElementById('invSumPre')?.textContent || ''), esc(document.getElementById('invSumVat')?.textContent || ''), esc(document.getElementById('invSumGrand')?.textContent || '')].join(','));
        lines.push('');

        // المرتجعات
        lines.push(esc('المرتجعات'));
        lines.push([esc('رقم الإشعار'), esc('التاريخ'), esc('العميل'), esc('رقم الفاتورة الأصلية'), esc('قبل الضريبة'), esc('الضريبة'), esc('الإجمالي')].join(','));
        document.querySelectorAll('#cnTbody tr').forEach(tr => {
          const tds = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
          if (tds.length) lines.push(tds.map(esc).join(','));
        });
        lines.push([esc('إجمالي المرتجعات'), '', '', '', esc(document.getElementById('cnSumPre')?.textContent || ''), esc(document.getElementById('cnSumVat')?.textContent || ''), esc(document.getElementById('cnSumGrand')?.textContent || '')].join(','));
        lines.push('');

        // المصروفات
        lines.push(esc('المصروفات'));
        lines.push([esc('البيان'), esc('التاريخ'), esc('طريقة الدفع'), esc('قبل الضريبة'), esc('الضريبة'), esc('الإجمالي')].join(','));
        document.querySelectorAll('#expTbody tr').forEach(tr => {
          const tds = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
          if (tds.length) lines.push(tds.map(esc).join(','));
        });
        lines.push([esc('إجمالي المصروفات'), '', '', esc(document.getElementById('expSumPre')?.textContent || ''), esc(document.getElementById('expSumVat')?.textContent || ''), esc(document.getElementById('expSumGrand')?.textContent || '')].join(','));
        lines.push('');

        // ملخص الإجماليات
        lines.push(esc('ملخص الإجماليات'));
        lines.push([esc('البيان'), esc('قبل الضريبة'), esc('الضريبة'), esc('بعد الضريبة')].join(','));
        lines.push([esc('المبيعات'), esc(document.getElementById('sumInvPre')?.textContent || ''), esc(document.getElementById('sumInvVat')?.textContent || ''), esc(document.getElementById('sumInvGrand')?.textContent || '')].join(','));
        lines.push([esc('ناقص: المرتجعات'), esc(document.getElementById('sumCnPre')?.textContent || ''), esc(document.getElementById('sumCnVat')?.textContent || ''), esc(document.getElementById('sumCnGrand')?.textContent || '')].join(','));
        lines.push([esc('المبيعات بعد خصم المرتجعات'), esc(document.getElementById('sumNetSalesPre')?.textContent || ''), esc(document.getElementById('sumNetSalesVat')?.textContent || ''), esc(document.getElementById('sumNetSalesGrand')?.textContent || '')].join(','));
        lines.push([esc('ناقص: المصروفات'), esc(document.getElementById('sumExpPre')?.textContent || ''), esc(document.getElementById('sumExpVat')?.textContent || ''), esc(document.getElementById('sumExpGrand')?.textContent || '')].join(','));
        lines.push([esc('الإجمالي النهائي'), esc(document.getElementById('sumNetPre')?.textContent || ''), esc(document.getElementById('sumNetVat')?.textContent || ''), esc(document.getElementById('sumNetGrand')?.textContent || '')].join(','));

        const csv = lines.join('\n');
        const period = (rangeEl && rangeEl.textContent) ? rangeEl.textContent.replace(/[^0-9\-_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') : String(Date.now());
        const filename = `zatca-report-${period}.csv`;
        await window.api.csv_export(csv, { saveMode: 'auto', filename });
      } catch (e) { console.error(e); alert('تعذر إنشاء Excel'); }
      finally { exporting = false; btnExcel.disabled = false; }
    });
  }
})();

// ─── Load Range ───────────────────────────────────────────────────────────────
async function loadRange(startStr, endStr) {
  try {
    // ضمان شمول آخر ثانية في الدقيقة المحددة
    let adjEnd = endStr;
    if (adjEnd && adjEnd.match(/:\d\d:00$/)) adjEnd = adjEnd.replace(/:00$/, ':59');

    if (rangeEl) rangeEl.textContent = `الفترة: ${startStr} — ${endStr}`;

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
        invTbody.innerHTML = '<tr><td colspan="8" style="color:#64748b;text-align:center;">لا توجد فواتير ضمن الفترة</td></tr>';
      } else {
        invTbody.innerHTML = invoices.map(s => {
          const isUnpaid = String(s.payment_method || '').toLowerCase() === 'credit'
            && String(s.payment_status || 'paid') === 'unpaid';
          const statusBadge = isUnpaid
            ? '<span class="badge-unpaid">غير مدفوعة</span>'
            : '<span class="badge-paid">مدفوعة</span>';
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
        cnTbody.innerHTML = '<tr><td colspan="7" style="color:#64748b;text-align:center;">لا توجد مرتجعات ضمن الفترة</td></tr>';
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
        expTbody.innerHTML = '<tr><td colspan="6" style="color:#64748b;text-align:center;">لا توجد مصروفات ضمن الفترة</td></tr>';
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
  const now = new Date();
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const s = toStr(start);
  const e = toStr(now);
  if (fromAtEl) fromAtEl.value = s.replace(' ', 'T').slice(0, 16);
  if (toAtEl) toAtEl.value = e.replace(' ', 'T').slice(0, 16);

  const empty = '<tr><td colspan="8" style="color:#64748b;text-align:center;padding:16px;">يرجى تحديد الفترة والضغط على تطبيق</td></tr>';
  const empty7 = '<tr><td colspan="7" style="color:#64748b;text-align:center;padding:16px;">يرجى تحديد الفترة والضغط على تطبيق</td></tr>';
  const empty6 = '<tr><td colspan="6" style="color:#64748b;text-align:center;padding:16px;">يرجى تحديد الفترة والضغط على تطبيق</td></tr>';
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
      const s = fromInputToStr(fromAtEl);
      const e = fromInputToStr(toAtEl);
      if (!s || !e) { alert('يرجى تحديد الفترة (من وإلى)'); return; }
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
