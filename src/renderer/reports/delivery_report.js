const companyFilter = document.getElementById('companyFilter');
const fromAt = document.getElementById('fromAt');
const toAt = document.getElementById('toAt');
const tbody = document.getElementById('tbody');
const companyTotalsBody = document.getElementById('companyTotalsBody');
const rangeEl = document.getElementById('range');

let _lastItems = [];
let _lastTotals = {};

function fmt(n) { return Number(n || 0).toFixed(2); }
const RIYAL_SYMBOL_HTML = '<span class="currency-symbol-inline">&#xE900;</span>';

function formatDateEnglish(v) {
  if (!v) return '—';
  const raw = String(v).trim();
  const normalized = raw
    .replace('GM ', 'GMT ')
    .replace(/\s*\(.*?\)\s*$/, '');
  let d = new Date(normalized);
  if (Number.isNaN(d.getTime())) {
    d = new Date(raw);
  }
  if (Number.isNaN(d.getTime())) return raw;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h24 = d.getHours();
  const hours12 = h24 % 12 || 12;
  const hours = String(hours12).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  const meridiem = h24 >= 12 ? 'PM' : 'AM';
  return `${year}-${month}-${day} ${hours}:${mins} ${meridiem}`;
}

function dt(v) { return formatDateEnglish(v); }
function formatInputDateTime(v) { return formatDateEnglish(v); }

async function loadCompanies() {
  const res = await window.api.delivery_companies_list({});
  const items = (res && res.ok && res.items) ? res.items : [];
  companyFilter.innerHTML = `<option value="">اختر شركة التوصيل</option>` + items.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function renderTable(items) {
  const rows = (items || []).map((s, i) => {
    const cust = s.customer_name || s.customer_phone || '—';
    const companyName = s.delivery_company_name || '—';
    const isReturn = (String(s.doc_type || '') === 'credit_note') || String(s.invoice_no || '').startsWith('CN-');
    const rowClass = isReturn ? 'bg-orange-50' : '';
    const kind = isReturn ? 'مرتجع' : 'فاتورة';
    return `<tr>
      <td class="text-center ${rowClass}">${i + 1}</td>
      <td class="text-center ${rowClass}">${s.invoice_no || ''}</td>
      <td class="text-center ${rowClass}">${kind}</td>
      <td class="text-right ${rowClass}">${companyName}</td>
      <td class="text-center ${rowClass}">${dt(s.created_at)}</td>
      <td class="text-right ${rowClass}">${cust}</td>
      <td class="text-center ${rowClass}">${fmt(Math.abs(Number(s.sub_total || 0)))}</td>
      <td class="text-center ${rowClass}">${fmt(Math.abs(Number(s.vat_total || 0)))}</td>
      <td class="text-center ${rowClass}">${fmt(Math.abs(Number(s.grand_total || 0)))}</td>
      <td class="text-center ${rowClass}">${fmt(Math.abs(Number(s.delivery_discount_amount || 0)))}</td>
    </tr>`;
  }).join('');
  tbody.innerHTML = rows || '<tr><td colspan="10" class="p-6 text-center text-gray-500 font-bold">لا توجد بيانات</td></tr>';
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderTotals(totals) {
  setText('sumCount', String((totals && totals.count) || 0));
  setText('invCount', String((totals && totals.invoice_count) || 0));
  setText('retCount', String((totals && totals.return_count) || 0));
  setText('invSumSub', fmt(totals && totals.invoice_sub_total));
  setText('invSumVat', fmt(totals && totals.invoice_vat_total));
  setText('invSumGrand', fmt(totals && totals.invoice_grand_total));
  setText('invSumDiscount', fmt(totals && totals.invoice_delivery_discount));
  setText('retSumSub', fmt(totals && totals.return_sub_total));
  setText('retSumVat', fmt(totals && totals.return_vat_total));
  setText('retSumGrand', fmt(totals && totals.return_grand_total));
  setText('retSumDiscount', fmt(totals && totals.return_delivery_discount));
  setText('netSumSub', fmt(totals && totals.net_sub_total));
  setText('netSumVat', fmt(totals && totals.net_vat_total));
  setText('netSumGrand', fmt(totals && totals.net_grand_total));
  setText('netSumDiscount', fmt(totals && totals.net_delivery_discount));
}

function updateReportMeta() {
  const periodText = (fromAt.value && toAt.value)
    ? `${formatInputDateTime(fromAt.value)}  —  ${formatInputDateTime(toAt.value)}`
    : '—';
  const selectedCompanyText = companyFilter.options[companyFilter.selectedIndex]?.text || 'كل الشركات';
  const companyText = companyFilter.value ? selectedCompanyText : 'كل الشركات';
  setText('reportPeriod', periodText);
  setText('reportCompany', companyText);
}

function renderCompanyTotals(items) {
  const grouped = new Map();
  (items || []).forEach((item) => {
    const companyName = item.delivery_company_name || 'غير محدد';
    const isReturn = (String(item.doc_type || '') === 'credit_note') || String(item.invoice_no || '').startsWith('CN-');
    const grand = Math.abs(Number(item.grand_total || 0));
    const discount = Math.abs(Number(item.delivery_discount_amount || 0));
    if (!grouped.has(companyName)) {
      grouped.set(companyName, { invoiceCount: 0, returnCount: 0, invoiceGrand: 0, returnGrand: 0, invoiceDiscount: 0, returnDiscount: 0 });
    }
    const bucket = grouped.get(companyName);
    if (isReturn) {
      bucket.returnCount += 1;
      bucket.returnGrand += grand;
      bucket.returnDiscount += discount;
    } else {
      bucket.invoiceCount += 1;
      bucket.invoiceGrand += grand;
      bucket.invoiceDiscount += discount;
    }
  });
  const rows = Array.from(grouped.entries()).map(([companyName, total], i) => {
    const netGrand = total.invoiceGrand - total.returnGrand;
    const netDiscount = total.invoiceDiscount - total.returnDiscount;
    return `<tr>
      <td class="text-center">${i + 1}</td>
      <td class="text-right">${companyName}</td>
      <td class="text-center">${total.invoiceCount}</td>
      <td class="text-center">${total.returnCount}</td>
      <td class="text-center font-bold">${fmt(netGrand)}</td>
      <td class="text-center font-bold">${fmt(netDiscount)}</td>
    </tr>`;
  }).join('');
  companyTotalsBody.innerHTML = rows || '<tr><td colspan="6" class="p-6 text-center text-gray-500 font-bold">لا توجد بيانات</td></tr>';
}

function renderSelectionRequired() {
  updateReportMeta();
  tbody.innerHTML = '<tr><td colspan="10" class="p-6 text-center text-amber-700 font-bold">يرجى تحديد الفترة (من/إلى) ثم الضغط على تطبيق</td></tr>';
  if (companyTotalsBody) {
    companyTotalsBody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-amber-700 font-bold">يرجى تحديد الفترة (من/إلى) ثم الضغط على تطبيق</td></tr>';
  }
  renderTotals({});
}

async function loadReport() {
  updateReportMeta();
  const hasFrom = Boolean(fromAt.value);
  const hasTo = Boolean(toAt.value);
  if (!(hasFrom && hasTo)) {
    if (rangeEl) rangeEl.textContent = 'حدد الفترة الزمنية لعرض التقرير';
    renderSelectionRequired();
    return;
  }
  if (rangeEl) {
    rangeEl.textContent = `الفترة: ${formatInputDateTime(fromAt.value)}  ←  ${formatInputDateTime(toAt.value)}`;
  }
  const res = await window.api.sales_delivery_report({
    company_id: companyFilter.value || null,
    from: fromAt.value ? fromAt.value.replace('T', ' ') + ':00' : null,
    to: toAt.value ? toAt.value.replace('T', ' ') + ':59' : null,
  });
  if (!(res && res.ok)) { alert((res && res.error) || 'تعذر تحميل التقرير'); return; }
  if (rangeEl && !companyFilter.value) {
    rangeEl.textContent += ' | الشركة: جميع الشركات';
  } else if (rangeEl && companyFilter.value) {
    const sel = companyFilter.options[companyFilter.selectedIndex]?.text || '';
    if (sel) rangeEl.textContent += ` | الشركة: ${sel}`;
  }
  _lastItems = res.items || [];
  _lastTotals = res.totals || {};
  renderTable(_lastItems);
  renderCompanyTotals(_lastItems);
  renderTotals(_lastTotals);
}

function buildCompanyData(items) {
  const grouped = new Map();
  (items || []).forEach((item) => {
    const cn = item.delivery_company_name || 'غير محدد';
    const isRet = (String(item.doc_type || '') === 'credit_note') || String(item.invoice_no || '').startsWith('CN-');
    const grand = Math.abs(Number(item.grand_total || 0));
    const disc = Math.abs(Number(item.delivery_discount_amount || 0));
    if (!grouped.has(cn)) grouped.set(cn, { invoiceCount: 0, returnCount: 0, invoiceGrand: 0, returnGrand: 0, invoiceDiscount: 0, returnDiscount: 0 });
    const b = grouped.get(cn);
    if (isRet) { b.returnCount++; b.returnGrand += grand; b.returnDiscount += disc; }
    else { b.invoiceCount++; b.invoiceGrand += grand; b.invoiceDiscount += disc; }
  });
  return Array.from(grouped.entries()).map(([name, d]) => ({
    name,
    invoiceCount: d.invoiceCount,
    returnCount: d.returnCount,
    netGrand: d.invoiceGrand - d.returnGrand,
    invoiceGrand: d.invoiceGrand,
    returnGrand: d.returnGrand,
    netDiscount: d.invoiceDiscount - d.returnDiscount,
  }));
}

function buildBarChartSVG(companies) {
  if (!companies || companies.length === 0) return '<p style="color:#6b7280;text-align:center;padding:20px;">لا توجد بيانات كافية</p>';
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
  const maxVal = Math.max(...companies.map(c => Math.max(c.netGrand, 0)), 1);
  const barH = 30;
  const gap = 10;
  const labelW = 110;
  const valueW = 80;
  const svgW = 520;
  const chartW = svgW - labelW - valueW - 10;
  const topPad = 36;
  const svgH = topPad + companies.length * (barH + gap) + 16;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => {
    const x = labelW + f * chartW;
    return `<line x1="${x.toFixed(1)}" y1="${topPad - 6}" x2="${x.toFixed(1)}" y2="${svgH - 6}" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="3,3"/>`;
  }).join('');

  const bars = companies.map((c, i) => {
    const y = topPad + i * (barH + gap);
    const w = Math.max((Math.max(c.netGrand, 0) / maxVal) * chartW, 2);
    const color = COLORS[i % COLORS.length];
    const label = c.name.length > 13 ? c.name.slice(0, 13) + '..' : c.name;
    return `
      <text x="${(labelW - 8).toFixed(0)}" y="${(y + barH / 2 + 5).toFixed(0)}" text-anchor="end" font-size="10.5" fill="#374151">${label}</text>
      <rect x="${labelW}" y="${y}" width="${w.toFixed(1)}" height="${barH}" fill="${color}" rx="4" opacity="0.88"/>
      <text x="${(labelW + w + 5).toFixed(0)}" y="${(y + barH / 2 + 5).toFixed(0)}" font-size="10" fill="#374151" font-weight="bold">${fmt(c.netGrand)}</text>`;
  }).join('');

  return `<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg" font-family="Cairo, Arial, sans-serif">
  <rect width="${svgW}" height="${svgH}" fill="#f8fafc" rx="10"/>
  <text x="${(svgW / 2).toFixed(0)}" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e3a8a">صافي المبيعات لكل شركة</text>
  ${gridLines}
  ${bars}
</svg>`;
}

function buildPieChartSVG(companies) {
  const validCompanies = (companies || []).filter(c => c.netGrand > 0);
  if (validCompanies.length === 0) return '<p style="color:#6b7280;text-align:center;padding:20px;">لا توجد بيانات</p>';
  const total = validCompanies.reduce((s, c) => s + c.netGrand, 0);
  if (total <= 0) return '';
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
  const cx = 120, cy = 120, r = 96;
  const svgW = 460;
  const svgH = Math.max(260, validCompanies.length * 26 + 50);

  let angle = -Math.PI / 2;
  const slices = validCompanies.map((c, i) => {
    const frac = c.netGrand / total;
    const sweep = frac * 2 * Math.PI;
    const endAngle = angle + sweep;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const large = sweep > Math.PI ? 1 : 0;
    const pct = Math.round(frac * 100);
    const result = {
      path: `<path d="M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${COLORS[i % COLORS.length]}" stroke="white" stroke-width="2"/>`,
      color: COLORS[i % COLORS.length],
      name: c.name,
      pct,
    };
    angle = endAngle;
    return result;
  });

  const legendY0 = 40;
  const legend = slices.map((s, i) => {
    const name = s.name.length > 18 ? s.name.slice(0, 18) + '..' : s.name;
    return `
    <rect x="258" y="${legendY0 + i * 26}" width="13" height="13" fill="${s.color}" rx="3"/>
    <text x="276" y="${legendY0 + i * 26 + 11}" font-size="10.5" fill="#374151">${name} (${s.pct}%)</text>`;
  }).join('');

  return `<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg" font-family="Cairo, Arial, sans-serif">
  <rect width="${svgW}" height="${svgH}" fill="#f8fafc" rx="10"/>
  <text x="${cx}" y="20" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e3a8a">توزيع المبيعات بالشركات</text>
  ${slices.map(s => s.path).join('')}
  ${legend}
</svg>`;
}

function generatePDFHtml(items, totals, fromVal, toVal, companyText) {
  const fromFmt = formatInputDateTime(fromVal);
  const toFmt = formatInputDateTime(toVal);
  const now = new Date();
  const nowFmt = formatDateEnglish(now.toISOString().slice(0, 16));
  const baseHref = new URL('.', window.location.href).href;
  const companies = buildCompanyData(items);

  const invCount = totals.invoice_count || 0;
  const retCount = totals.return_count || 0;
  const netGrand = fmt(totals.net_grand_total || 0);
  const netDiscount = fmt(totals.net_delivery_discount || 0);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

  const invoiceRows = (items || []).map((s, i) => {
    const isRet = (String(s.doc_type || '') === 'credit_note') || String(s.invoice_no || '').startsWith('CN-');
    const rowBg = isRet ? '#fff7ed' : (i % 2 === 0 ? '#ffffff' : '#f8fafc');
    const typeBadge = isRet
      ? `<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:10px;font-size:9.5px;font-weight:700;white-space:nowrap;">مرتجع</span>`
      : `<span style="background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:10px;font-size:9.5px;font-weight:700;white-space:nowrap;">فاتورة</span>`;
    return `<tr style="background:${rowBg};">
      <td style="text-align:center;padding:5px 6px;border:1px solid #e5e7eb;font-size:10px;">${i + 1}</td>
      <td style="text-align:center;padding:5px 6px;border:1px solid #e5e7eb;font-size:10px;font-weight:600;">${s.invoice_no || ''}</td>
      <td style="text-align:center;padding:5px 6px;border:1px solid #e5e7eb;">${typeBadge}</td>
      <td style="text-align:right;padding:5px 6px;border:1px solid #e5e7eb;font-size:10px;">${s.delivery_company_name || '—'}</td>
      <td style="text-align:center;padding:5px 6px;border:1px solid #e5e7eb;font-size:10px;white-space:nowrap;">${dt(s.created_at)}</td>
      <td style="text-align:right;padding:5px 6px;border:1px solid #e5e7eb;font-size:10px;">${s.customer_name || s.customer_phone || '—'}</td>
      <td style="text-align:center;padding:5px 6px;border:1px solid #e5e7eb;font-size:10px;">${fmt(Math.abs(Number(s.sub_total || 0)))}</td>
      <td style="text-align:center;padding:5px 6px;border:1px solid #e5e7eb;font-size:10px;">${fmt(Math.abs(Number(s.vat_total || 0)))}</td>
      <td style="text-align:center;padding:5px 6px;border:1px solid #e5e7eb;font-size:10px;font-weight:700;">${fmt(Math.abs(Number(s.grand_total || 0)))}</td>
      <td style="text-align:center;padding:5px 6px;border:1px solid #e5e7eb;font-size:10px;color:#059669;font-weight:600;">${fmt(Math.abs(Number(s.delivery_discount_amount || 0)))}</td>
    </tr>`;
  }).join('');

  const companyRows = companies.map((c, i) => {
    const rowBg = i % 2 === 0 ? '#ffffff' : '#f0fdf4';
    return `<tr style="background:${rowBg};">
      <td style="text-align:center;padding:8px 10px;border:1px solid #d1fae5;font-size:11px;">${i + 1}</td>
      <td style="text-align:right;padding:8px 10px;border:1px solid #d1fae5;font-size:11.5px;font-weight:700;">${c.name}</td>
      <td style="text-align:center;padding:8px 10px;border:1px solid #d1fae5;font-size:11px;color:#1e40af;font-weight:700;">${c.invoiceCount}</td>
      <td style="text-align:center;padding:8px 10px;border:1px solid #d1fae5;font-size:11px;color:#dc2626;font-weight:700;">${c.returnCount}</td>
      <td style="text-align:center;padding:8px 10px;border:1px solid #d1fae5;font-size:11px;font-weight:800;color:#059669;white-space:nowrap;">${fmt(c.netGrand)}</td>
      <td style="text-align:center;padding:8px 10px;border:1px solid #d1fae5;font-size:11px;font-weight:700;color:#7c3aed;">${fmt(c.netDiscount)}</td>
    </tr>`;
  }).join('');

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<base href="${baseHref}">
<style>
  @font-face { font-family: 'saudi_riyal'; src: url('../../../assets/fonts/saudi-riyal.woff') format('woff'), url('../../../assets/fonts/saudi-riyal.ttf') format('truetype'); font-weight: 400; }
  @font-face { font-family: 'Cairo'; src: url('../../../assets/fonts/Cairo-Regular.ttf') format('truetype'); font-weight: 400; }
  @font-face { font-family: 'Cairo'; src: url('../../../assets/fonts/Cairo-Bold.ttf') format('truetype'); font-weight: 700; }
  @font-face { font-family: 'Cairo'; src: url('../../../assets/fonts/Cairo-ExtraBold.ttf') format('truetype'); font-weight: 800; }
  @font-face { font-family: 'Cairo'; src: url('../../../assets/fonts/Cairo-Black.ttf') format('truetype'); font-weight: 900; }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Cairo', Arial, sans-serif; background: #fff; color: #111827; font-size: 12px; }

  .report-header {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #1d4ed8 100%);
    color: white;
    padding: 22px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-brand { display: flex; align-items: center; gap: 16px; }
  .header-icon-box {
    width: 54px; height: 54px;
    background: rgba(255,255,255,0.15);
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 26px;
    border: 1px solid rgba(255,255,255,0.2);
  }
  .header-title { font-size: 21px; font-weight: 900; line-height: 1.2; }
  .header-subtitle { font-size: 11px; opacity: 0.75; margin-top: 3px; letter-spacing: 0.3px; }
  .header-right { text-align: left; }
  .header-right-item { font-size: 11px; opacity: 0.8; margin-bottom: 5px; display: flex; align-items: center; gap: 6px; }
  .header-right-item strong { font-size: 12px; opacity: 1; font-weight: 800; }
  .header-badge {
    display: inline-block;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 20px;
    padding: 3px 12px;
    font-size: 11px;
    font-weight: 700;
  }

  .period-band {
    background: linear-gradient(90deg, #eff6ff 0%, #dbeafe 60%, #eff6ff 100%);
    border-bottom: 2px solid #bfdbfe;
    border-top: 3px solid #3b82f6;
    padding: 13px 32px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 32px;
    flex-wrap: wrap;
  }
  .period-item { display: flex; align-items: center; gap: 10px; }
  .period-label {
    background: #1e40af;
    color: white;
    padding: 3px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 800;
  }
  .period-value { font-size: 13px; font-weight: 700; color: #1e3a8a; }
  .period-sep { color: #93c5fd; font-size: 18px; font-weight: 300; }

  .body-content { padding: 20px 28px; }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 22px;
  }
  .kpi-card {
    border-radius: 14px;
    padding: 18px 16px 14px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0,0,0,0.10);
  }
  .kpi-card::after {
    content: '';
    position: absolute;
    top: -22px; right: -22px;
    width: 90px; height: 90px;
    border-radius: 50%;
    background: rgba(255,255,255,0.12);
  }
  .kpi-card.blue  { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; }
  .kpi-card.amber { background: linear-gradient(135deg, #b45309 0%, #f59e0b 100%); color: white; }
  .kpi-card.green { background: linear-gradient(135deg, #047857 0%, #10b981 100%); color: white; }
  .kpi-card.purple{ background: linear-gradient(135deg, #5b21b6 0%, #8b5cf6 100%); color: white; }
  .kpi-icon { font-size: 24px; margin-bottom: 10px; display: block; }
  .kpi-value { font-size: 26px; font-weight: 900; line-height: 1; margin-bottom: 5px; }
  .kpi-label { font-size: 10.5px; opacity: 0.88; font-weight: 600; }
  .currency-symbol-inline {
    font-family: 'saudi_riyal', 'Cairo', sans-serif;
    font-weight: 900;
    font-size: 1.05em;
    vertical-align: middle;
    margin: 0 2px;
  }

  .section-title {
    font-size: 14px;
    font-weight: 800;
    color: #1e3a8a;
    padding: 9px 16px;
    margin-bottom: 14px;
    border-right: 5px solid #3b82f6;
    background: linear-gradient(90deg, #eff6ff 0%, #f8fafc 100%);
    border-radius: 0 8px 8px 0;
  }
  .section-title.green-border { border-right-color: #10b981; background: linear-gradient(90deg, #ecfdf5 0%, #f8fafc 100%); color: #065f46; }

  .report-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
    font-size: 10.5px;
  }
  .report-table thead th {
    background: linear-gradient(135deg, #1e3a8a, #1e40af);
    color: white;
    padding: 10px 8px;
    text-align: center;
    font-weight: 800;
    font-size: 10.5px;
    border: 1px solid #1d4ed8;
  }
  .report-table tfoot th {
    background: #1e3a8a;
    color: white;
    padding: 8px;
    text-align: center;
    font-weight: 800;
    font-size: 10.5px;
    border: 1px solid #1d4ed8;
  }
  /* Prevent repeating totals on every printed page */
  .report-table tfoot { display: table-row-group; }
  .report-table tfoot tr:nth-child(2) th { background: #1e3a8a; }
  .report-table tfoot tr:last-child th { background: #0f172a; }

  .company-table thead th {
    background: linear-gradient(135deg, #047857, #059669);
    border-color: #10b981;
  }
  .company-table tfoot th {
    background: #047857;
    border-color: #10b981;
  }

  .counts-band {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 10px;
    padding: 10px 18px;
    margin-bottom: 24px;
    display: flex;
    gap: 28px;
    align-items: center;
    flex-wrap: wrap;
  }
  .count-item { display: flex; align-items: center; gap: 8px; font-size: 12px; }
  .count-dot { width: 10px; height: 10px; border-radius: 50%; }
  .count-label { color: #374151; font-weight: 600; }
  .count-value { font-weight: 900; font-size: 14px; color: #1e3a8a; }

  .report-footer {
    margin-top: 8px;
    border-top: 2px solid #e5e7eb;
    padding: 12px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(90deg, #f8fafc, #eff6ff);
    color: #6b7280;
    font-size: 10px;
  }
  .footer-brand { font-weight: 700; color: #1e3a8a; }

  @page { margin: 0.6cm; size: A4; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .report-table { page-break-inside: auto; }
    .report-table tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- ===== HEADER ===== -->
<div class="report-header">
  <div class="header-brand">
    <div class="header-icon-box">🚚</div>
    <div>
      <div class="header-title">تقرير التوصيل</div>
      <div class="header-subtitle">Delivery Report &nbsp;|&nbsp; نظام إدارة المطاعم</div>
    </div>
  </div>
  <div class="header-right">
    <div class="header-right-item">تاريخ الإصدار: <strong>${nowFmt}</strong></div>
    <div class="header-right-item">إجمالي السجلات: <strong>${(items || []).length}</strong></div>
    <div style="margin-top:6px;"><span class="header-badge">Delivery Management System</span></div>
  </div>
</div>

<!-- ===== PERIOD BAND ===== -->
<div class="period-band">
  <div class="period-item">
    <span class="period-label">من</span>
    <span class="period-value">${fromFmt}</span>
  </div>
  <span class="period-sep">→</span>
  <div class="period-item">
    <span class="period-label">إلى</span>
    <span class="period-value">${toFmt}</span>
  </div>
  <div class="period-item" style="margin-right:auto;">
    <span class="period-label">الشركة</span>
    <span class="period-value">${companyText}</span>
  </div>
</div>

<!-- ===== BODY ===== -->
<div class="body-content">

  <!-- KPI CARDS -->
  <div class="kpi-grid">
    <div class="kpi-card blue">
      <span class="kpi-icon">📄</span>
      <div class="kpi-value">${invCount}</div>
      <div class="kpi-label">عدد الفواتير</div>
    </div>
    <div class="kpi-card amber">
      <span class="kpi-icon">↩</span>
      <div class="kpi-value">${retCount}</div>
      <div class="kpi-label">عدد المرتجعات</div>
    </div>
    <div class="kpi-card green">
      <span class="kpi-icon">💰</span>
      <div class="kpi-value">${netGrand}</div>
      <div class="kpi-label">صافي الإجمالي (${RIYAL_SYMBOL_HTML})</div>
    </div>
    <div class="kpi-card purple">
      <span class="kpi-icon">🎁</span>
      <div class="kpi-value">${netDiscount}</div>
      <div class="kpi-label">خصم التوصيل (${RIYAL_SYMBOL_HTML})</div>
    </div>
  </div>

  <!-- COUNTS BAND -->
  <div class="counts-band">
    <div class="count-item">
      <div class="count-dot" style="background:#3b82f6;"></div>
      <span class="count-label">إجمالي السجلات:</span>
      <span class="count-value">${(items || []).length}</span>
    </div>
    <div class="count-item">
      <div class="count-dot" style="background:#10b981;"></div>
      <span class="count-label">الفواتير:</span>
      <span class="count-value">${invCount}</span>
    </div>
    <div class="count-item">
      <div class="count-dot" style="background:#f59e0b;"></div>
      <span class="count-label">المرتجعات:</span>
      <span class="count-value">${retCount}</span>
    </div>
    <div class="count-item">
      <div class="count-dot" style="background:#8b5cf6;"></div>
      <span class="count-label">عدد الشركات:</span>
      <span class="count-value">${companies.length}</span>
    </div>
  </div>

  <!-- COMPANY TOTALS -->
  <div class="section-title green-border">🏢 ملخص شركات التوصيل — Delivery Companies Summary</div>
  <table class="report-table company-table">
    <thead>
      <tr>
        <th>#</th>
        <th>شركة التوصيل</th>
        <th>عدد الفواتير</th>
        <th>عدد المرتجعات</th>
        <th>صافي الإجمالي</th>
        <th>خصم التوصيل</th>
      </tr>
    </thead>
    <tbody>
      ${companyRows || '<tr><td colspan="6" style="text-align:center;padding:20px;color:#6b7280;">لا توجد بيانات</td></tr>'}
    </tbody>
    <tfoot>
      <tr>
        <th colspan="2">الإجمالي الكلي</th>
        <th>${invCount}</th>
        <th>${retCount}</th>
        <th>${netGrand}</th>
        <th>${netDiscount}</th>
      </tr>
    </tfoot>
  </table>

  <!-- INVOICES DETAIL -->
  <div class="section-title">📋 تفاصيل الفواتير — Invoices Detail</div>
  <table class="report-table">
    <thead>
      <tr>
        <th>#</th>
        <th>رقم الفاتورة</th>
        <th>النوع</th>
        <th>شركة التوصيل</th>
        <th>التاريخ</th>
        <th>العميل</th>
        <th>قبل الضريبة</th>
        <th>الضريبة</th>
        <th>الإجمالي</th>
        <th>خصم التوصيل</th>
      </tr>
    </thead>
    <tbody>
      ${invoiceRows || '<tr><td colspan="10" style="text-align:center;padding:20px;color:#6b7280;">لا توجد بيانات</td></tr>'}
    </tbody>
    <tfoot>
      <tr>
        <th colspan="6">إجمالي الفواتير</th>
        <th>${fmt(totals.invoice_sub_total)}</th>
        <th>${fmt(totals.invoice_vat_total)}</th>
        <th>${fmt(totals.invoice_grand_total)}</th>
        <th>${fmt(totals.invoice_delivery_discount)}</th>
      </tr>
      <tr>
        <th colspan="6">إجمالي المرتجعات</th>
        <th>${fmt(totals.return_sub_total)}</th>
        <th>${fmt(totals.return_vat_total)}</th>
        <th>${fmt(totals.return_grand_total)}</th>
        <th>${fmt(totals.return_delivery_discount)}</th>
      </tr>
      <tr>
        <th colspan="6">الصافي (الفواتير − المرتجعات)</th>
        <th>${fmt(totals.net_sub_total)}</th>
        <th>${fmt(totals.net_vat_total)}</th>
        <th>${fmt(totals.net_grand_total)}</th>
        <th>${fmt(totals.net_delivery_discount)}</th>
      </tr>
    </tfoot>
  </table>

</div>

<!-- ===== FOOTER ===== -->
<div class="report-footer">
  <span class="footer-brand">🍽 نظام إدارة المطاعم — Restaurant Management System</span>
  <span>Generated: ${nowFmt} &nbsp;|&nbsp; Delivery Report</span>
</div>

</body>
</html>`;
}

function initRange() {
  fromAt.value = '';
  toAt.value = '';
}

function setupDatePickerOpen() {
  document.querySelectorAll('.date-picker-wrap').forEach((wrap) => {
    const input = wrap.querySelector('input[type="datetime-local"]');
    if (!input) return;
    wrap.addEventListener('click', () => {
      input.focus();
      if (typeof input.showPicker === 'function') input.showPicker();
    });
  });
}

document.getElementById('btnBack')?.addEventListener('click', () => { window.location.href = './index.html'; });
document.getElementById('applyBtn')?.addEventListener('click', loadReport);
document.getElementById('pdfBtn')?.addEventListener('click', async () => {
  if (!fromAt.value || !toAt.value) {
    alert('يرجى تحديد الفترة (من/إلى) أولاً ثم الضغط على تطبيق');
    return;
  }
  if (_lastItems.length === 0 && Object.keys(_lastTotals).length === 0) {
    alert('يرجى الضغط على تطبيق أولاً لتحميل البيانات');
    return;
  }
  const selectedCompanyText = companyFilter.options[companyFilter.selectedIndex]?.text || 'كل الشركات';
  const companyText = companyFilter.value ? selectedCompanyText : 'كل الشركات';
  const html = generatePDFHtml(_lastItems, _lastTotals, fromAt.value, toAt.value, companyText);
  await window.api.pdf_export(html, {
    saveMode: 'auto',
    filename: `delivery-report-${Date.now()}.pdf`,
    pageSize: 'A4',
    printBackground: true,
  });
});

(async () => { initRange(); setupDatePickerOpen(); await loadCompanies(); await loadReport(); })();
