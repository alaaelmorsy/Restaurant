// Reports screen
const btnBack = document.getElementById('btnBack');
if(btnBack){ btnBack.onclick = ()=>{ window.location.href = '../main/index.html'; } }

// Fetch permissions from DB and hide cards not allowed
let __keys = new Set();
async function loadPerms(){
  try{
    const u = JSON.parse(localStorage.getItem('pos_user')||'null');
    if(!u || !u.id) return;
    const r = await window.api.perms_get_for_user(u.id);
    if(r && r.ok){ __keys = new Set(r.keys||[]); }
  }catch(_){ __keys = new Set(); }
}
function canReport(k){ return __keys.has('reports') && __keys.has(k); }
function hide(id){ const el=document.getElementById(id); if(el){ el.classList.add('hidden'); el.style.display='none'; } }
(async ()=>{
  await loadPerms();
  if(!canReport('reports.view_daily')) hide('dailyReport');
  if(!canReport('reports.view_period')) hide('periodReport');
  if(!canReport('reports.view_all_invoices')) hide('allInvoicesReport');
  if(!canReport('reports.view_purchases')) hide('purchasesReport');
  if(!canReport('reports.view_customer_invoices')) hide('customerInvoicesReport');
  if(!canReport('reports.view_credit_invoices')) hide('creditInvoicesReport');
  if(!canReport('reports.view_unpaid_invoices')) hide('unpaidInvoicesReport');
  if(!canReport('reports.view_types')) hide('typesReport');
  if(!canReport('reports.view_municipality')) hide('municipalityReport');
})();

const dailyCard = document.getElementById('dailyReport');
if(dailyCard){ dailyCard.onclick = ()=>{ window.location.href = './daily.html'; } }

const periodCard = document.getElementById('periodReport');
if(periodCard){ periodCard.onclick = ()=>{ window.location.href = './period.html'; } }

const allInvCard = document.getElementById('allInvoicesReport');
if(allInvCard){ allInvCard.onclick = ()=>{ window.location.href = './all_invoices.html'; } }

const purchasesCard = document.getElementById('purchasesReport');
if(purchasesCard){ purchasesCard.onclick = ()=>{ window.location.href = './purchases.html'; } }

const custInvCard = document.getElementById('customerInvoicesReport');
if(custInvCard){ custInvCard.onclick = ()=>{ window.location.href = './customer_invoices.html'; } }

const creditInvCard = document.getElementById('creditInvoicesReport');
if(creditInvCard){ creditInvCard.onclick = ()=>{ window.location.href = './credit_invoices.html'; } }

const unpaidInvCard = document.getElementById('unpaidInvoicesReport');
if(unpaidInvCard){ unpaidInvCard.onclick = ()=>{ window.location.href = './unpaid_invoices.html'; } }

const typesCard = document.getElementById('typesReport');
if(typesCard){ typesCard.onclick = ()=>{ window.location.href = './types.html'; } }

const municipalityCard = document.getElementById('municipalityReport');
if(municipalityCard){ municipalityCard.onclick = ()=>{ window.location.href = './municipality.html'; } }

