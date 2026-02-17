// Renderer script for login page with Remember Me (supports multiple accounts)
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const rememberCheck = document.getElementById('rememberCheck');
const errorDiv = document.getElementById('error');
const savedWrap = document.getElementById('savedWrap');
const savedUsersDiv = document.getElementById('savedUsers');
const toggleEye = document.getElementById('toggleEye');
const savedUsersList = document.getElementById('savedUsersList');
const deleteSavedBtn = document.getElementById('deleteSavedBtn');

// Link-to-primary elements
const serverIpInput = document.getElementById('serverIp');
const testIpBtn = document.getElementById('testIpBtn');
const saveIpBtn = document.getElementById('saveIpBtn');
const clearIpBtn = document.getElementById('clearIpBtn');
const savePrimaryBtn = document.getElementById('savePrimaryBtn');
const ipMsg = document.getElementById('ipMsg');
const openConnDialogBtn = document.getElementById('openConnDialog');
const connModal = document.getElementById('connModal');
const connClose = document.getElementById('connClose');
const modePrimary = document.getElementById('modePrimary');
const modeSecondary = document.getElementById('modeSecondary');
const secondaryFields = document.getElementById('secondaryFields');
const primarySaveBtn = document.getElementById('primarySaveBtn');

// عنصر الرسالة التحذيرية
const trialWarning = document.getElementById('trialWarning');

// التحقق من الإعدادات لإظهار/إخفاء الرسالة التحذيرية
(async function checkTrialWarning() {
  try {
    if (!trialWarning) return;
    
    // قراءة الإعدادات من قاعدة البيانات
    const settings = await window.api.settings_get();
    if (settings && settings.ok && settings.item) {
      if (settings.item.show_trial_warning) {
        trialWarning.style.display = 'flex';
      } else {
        trialWarning.style.display = 'none';
      }
    }
  } catch (e) {
    console.error('Error checking trial warning:', e);
  }
})();

// Local storage helpers
const STORAGE_KEY = 'pos_saved_accounts';
function loadSavedAccounts(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e){ return []; }
}
function saveAccounts(list){ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

function upsertAccount(username, password){
  const list = loadSavedAccounts();
  const idx = list.findIndex(x => x.username === username);
  const entry = { username, password, ts: Date.now() };
  if(idx >= 0) list[idx] = entry; else list.push(entry);
  saveAccounts(list);
  // Persist fallback file as well
  try{ window.api.saved_accounts_set && window.api.saved_accounts_set(list); }catch(_){ }
}
function removeAccount(username){
  const list = loadSavedAccounts().filter(x => x.username !== username);
  saveAccounts(list);
  // Update fallback file
  try{ window.api.saved_accounts_set && window.api.saved_accounts_set(list); }catch(_){ }
}

async function syncSavedAccounts(){
  try{
    if(!(window.api && window.api.saved_accounts_get)) return;
    const res = await window.api.saved_accounts_get();
    if(!(res && res.ok)) return;
    const local = loadSavedAccounts();
    const mergedMap = new Map();
    // Put local first
    for(const acc of Array.isArray(local)?local:[]){ mergedMap.set(acc.username, acc); }
    // Merge remote (take most recent ts)
    for(const acc of Array.isArray(res.list)?res.list:[]){
      const cur = mergedMap.get(acc.username);
      if(!cur || (acc.ts && acc.ts > (cur.ts||0))){ mergedMap.set(acc.username, acc); }
    }
    const merged = Array.from(mergedMap.values());
    saveAccounts(merged);
    try{ window.api.saved_accounts_set && window.api.saved_accounts_set(merged); }catch(_){ }
  }catch(_){ }
}

function renderSavedAccounts(){
  const list = loadSavedAccounts()
    .sort((a,b)=>b.ts-a.ts)
    .slice(0,10); // آخر 10
  // أخفِ قسم الحسابات المحفوظة أسفل زر الدخول دائماً
  if(savedWrap) savedWrap.style.display='none';
  // لا نعرض أي chips
  if(savedUsersDiv) savedUsersDiv.innerHTML = '';
  // عبّي فقط قائمة datalist لحقل اسم المستخدم
  if(savedUsersList){
    savedUsersList.innerHTML = '';
    list.forEach(acc => {
      const opt = document.createElement('option');
      opt.value = acc.username;
      savedUsersList.appendChild(opt);
    });
  }
}

renderSavedAccounts();

// Sync with fallback file then re-render options (show all users by default)
(async () => {
  try{
    await syncSavedAccounts();
  }catch(_){ }
  try{
    // After syncing, re-render the datalist so all accounts appear
    renderSavedAccounts();
    // Keep inputs empty so the datalist shows all saved users on first open
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
    updateDeleteBtn();
  }catch(_){ }
})();

function isSaved(username){
  return loadSavedAccounts().some(x=>x.username===username);
}

function updateDeleteBtn(){
  if(!deleteSavedBtn) return;
  const u = usernameInput.value.trim();
  deleteSavedBtn.style.display = u && isSaved(u) ? 'inline-block' : 'none';
}

// تعبئة الحقول إذا كان المستخدم المدخل محفوظاً (بدون دخول تلقائي)
function fillSavedIfExists(username){
  try{
    const list = loadSavedAccounts();
    const acc = list.find(x=>x.username===username);
    if(!acc) return;
    usernameInput.value = acc.username;
    passwordInput.value = acc.password || '';
    rememberCheck.checked = true;
  }catch(_){ }
}
if(savedUsersList && usernameInput){
  usernameInput.addEventListener('change', ()=>{
    fillSavedIfExists(usernameInput.value.trim());
    updateDeleteBtn();
  });
  usernameInput.addEventListener('input', ()=>{
    updateDeleteBtn();
  });
}

if(deleteSavedBtn){
  deleteSavedBtn.addEventListener('click', ()=>{
    const u = usernameInput.value.trim();
    if(!u) return;
    removeAccount(u);
    // امسح كلمة المرور إن كانت معبأة من الحساب المحذوف
    if(passwordInput.value && !isSaved(u)){
      passwordInput.value = '';
    }
    renderSavedAccounts();
    updateDeleteBtn();
  });
}

// Load support end date and render professional badge
(async () => {
  try{
    const r = await window.api.settings_get();
    const st = r && r.ok ? (r.item||{}) : {};

    // Render support info if date present
    const wrap = document.getElementById('supportInfo');
    const dateEl = document.getElementById('supportEndDate');
    const badgeEl = document.getElementById('supportDaysLeft');
    if(st.support_end_date && wrap && dateEl && badgeEl){
      // show and animate bar using flex for stable alignment
      wrap.style.display = 'flex';
      wrap.style.alignItems = 'center';
      wrap.style.justifyContent = 'space-between';
      requestAnimationFrame(()=> wrap.classList.add('show'));
      // Format as YYYY-MM-DD (numbers only) with robust parsing
      try{
        const raw = String(st.support_end_date || '').trim();
        let ymd = null;
        const m = raw.match(/^(\d{4})[-\/.](\d{2})[-\/.](\d{2})$/);
        if(m){ ymd = `${m[1]}-${m[2]}-${m[3]}`; }
        dateEl.textContent = ymd || raw;
      }catch(_){ dateEl.textContent = String(st.support_end_date||''); }
      // Days diff (use parsed parts if available)
      try{
        const raw = String(st.support_end_date || '').trim();
        const mm = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        const end = mm ? new Date(Number(mm[1]), Number(mm[2])-1, Number(mm[3])) : new Date(raw + 'T00:00:00');
        const today = new Date();
        const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const diffDays = Math.ceil((end - base) / (1000*60*60*24));
        if(!isNaN(diffDays)){
          // reset status classes for animation
          badgeEl.classList.remove('status-ok','status-warn','status-expired');
          if(diffDays > 30){
            badgeEl.textContent = `متبقي ${diffDays} يومًا`;
            badgeEl.style.background = '#e0f2fe'; badgeEl.style.color = '#075985'; badgeEl.style.border = '1px solid #bae6fd';
            badgeEl.classList.add('status-ok');
          }else if(diffDays >= 0){
            badgeEl.textContent = `متبقي ${diffDays} يومًا`;
            badgeEl.style.background = '#fef9c3'; badgeEl.style.color = '#854d0e'; badgeEl.style.border = '1px solid #fde68a';
            badgeEl.classList.add('status-warn');
          }else{
            badgeEl.textContent = 'انتهت فترة الدعم';
            badgeEl.style.background = '#fee2e2'; badgeEl.style.color = '#991b1b'; badgeEl.style.border = '1px solid #fecaca';
            badgeEl.classList.add('status-expired');
          }
        }
      }catch(_){ /* ignore */ }
    }

    // Display branch name if present
    const branchNotification = document.getElementById('branchNotification');
    const branchNameEl = document.getElementById('branchName');
    if(st.branch_name && branchNotification && branchNameEl){
      branchNameEl.textContent = st.branch_name;
      branchNotification.style.display = 'flex';
      requestAnimationFrame(() => {
        branchNotification.classList.add('show');
      });
    }

    // Control visibility of connection setup by MySQL flag (app_settings.show_conn_modal)
    const enable = st && (st.show_conn_modal ? 1 : 0);
    if(openConnDialogBtn){ openConnDialogBtn.style.display = enable ? 'inline-block' : 'none'; }
  }catch(_){ if(openConnDialogBtn){ openConnDialogBtn.style.display = 'none'; } }
})();

// Device mode UI toggle
function updateDeviceModeUI(){
  if(!modePrimary || !secondaryFields || !primarySaveBtn) return;
  const isPrimary = modePrimary.checked;
  secondaryFields.style.display = isPrimary ? 'none' : 'block';
  primarySaveBtn.style.display = isPrimary ? 'block' : 'none';
  if(ipMsg) ipMsg.textContent = '';
}

if(modePrimary) modePrimary.addEventListener('change', updateDeviceModeUI);
if(modeSecondary) modeSecondary.addEventListener('change', updateDeviceModeUI);
updateDeviceModeUI();

// Modal open/close logic
if(openConnDialogBtn && connModal){
  openConnDialogBtn.addEventListener('click', async () => {
    try{
      const r = await window.api.db_get_config();
      if(r && r.ok && r.config && serverIpInput){
        const h = String(r.config.host||'');
        serverIpInput.value = (h && !/^127\.0\.0\.1$/.test(h) && !/^localhost$/i.test(h)) ? h : '';
      }
    }catch(_){ serverIpInput.value=''; }
    ipMsg.textContent='';
    connModal.style.display = 'flex';
    updateDeviceModeUI();
  });
}
if(connClose && connModal){
  connClose.addEventListener('click', () => { connModal.style.display = 'none'; });
}

// Toggle password visibility
let visible = false;
function updateEye(){ toggleEye.textContent = visible ? '🙈' : '👁️'; }
updateEye();

toggleEye.addEventListener('click', () => {
  visible = !visible;
  passwordInput.type = visible ? 'text' : 'password';
  updateEye();
});

async function doLogin(){
  errorDiv.textContent = '';
  loginBtn.disabled = true;
  try {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if(!username || !password){ errorDiv.textContent = 'يرجى إدخال اسم المستخدم وكلمة المرور'; return; }

    const res = await window.api.login(username, password);
    if (!res.ok) {
      errorDiv.textContent = res.error || 'حدث خطأ';
      return;
    }

    // Remember Me (اخزن اكتر من مستخدم)
    if (rememberCheck.checked) {
      // ملاحظة: التخزين محلي على الجهاز بصيغة نصية، ولبيئات إنتاجية يُنصح بالتشفير/نظام مفاتيح
      upsertAccount(username, password);
    }

    // Save logged-in user for later (waiter name in kitchen tickets)
    try{ localStorage.setItem('pos_user', JSON.stringify(res.user||{})); }catch(_){ }

    // Fetch and store user permissions for UI control, then redirect accordingly
    let userPerms = [];
    try{
      const permsRes = await window.api.perms_get_for_user(res.user.id);
      if(permsRes && permsRes.ok){ userPerms = permsRes.keys || []; localStorage.setItem('pos_perms', JSON.stringify(userPerms)); }
    }catch(_){ /* ignore */ }

    // Go to New Invoice if user has permission; otherwise go to main screen
    const canOpenNewInvoice = Array.isArray(userPerms) && userPerms.includes('sales');
    window.location.href = canOpenNewInvoice ? '../sales/index.html' : '../main/index.html';
  } catch (e) {
    console.error(e);
    errorDiv.textContent = 'تعذر الاتصال بالتطبيق';
  } finally {
    loginBtn.disabled = false;
  }
}

loginBtn.addEventListener('click', doLogin);

// Submit on Enter
[usernameInput, passwordInput].forEach(el => el.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loginBtn.click();
}));

// Validate basic IPv4 string
function normalizeHost(h){
  h = String(h||'').trim();
  if(/:\d+$/.test(h)){ // if user typed host:port split it
    const m = h.match(/^(.*?):(\d+)$/); if(m){ return { host: m[1], port: parseInt(m[2],10)||3306 }; }
  }
  return { host: h };
}

// Test IP connection
if(testIpBtn){
  testIpBtn.addEventListener('click', async () => {
    ipMsg.textContent = '';
    testIpBtn.disabled = true; saveIpBtn.disabled = true;
    try{
      const raw = serverIpInput.value;
      if(!raw){ ipMsg.textContent = 'يرجى إدخال IP'; return; }
      const { host, port } = normalizeHost(raw);
      const r = await window.api.db_test({ host: host, port: port||3306 });
      if(r && r.ok){ ipMsg.textContent = 'تم الاتصال بنجاح'; ipMsg.style.background = '#dcfce7'; ipMsg.style.borderColor = '#bbf7d0'; ipMsg.style.color = '#166534'; }
      else { ipMsg.textContent = (r && r.error) || 'فشل الاتصال'; ipMsg.style.background = '#fee2e2'; ipMsg.style.borderColor = '#fecaca'; ipMsg.style.color = '#b91c1c'; }
    }catch(e){ ipMsg.textContent = 'فشل الاتصال'; }
    finally{ testIpBtn.disabled = false; saveIpBtn.disabled = false; }
  });
}

// Save as Primary Device
if(savePrimaryBtn){
  savePrimaryBtn.addEventListener('click', async () => {
    if(ipMsg) ipMsg.textContent = '';
    savePrimaryBtn.disabled = true;
    try{
      await window.api.device_set_mode({ mode: 'primary', api_host: '127.0.0.1', api_port: 4310 });
      await window.api.db_apply({ host: '127.0.0.1', port: 3306 });
      if(ipMsg){
        ipMsg.textContent = 'تم الحفظ كجهاز رئيسي بنجاح! ✅';
        ipMsg.style.background = '#dcfce7';
        ipMsg.style.borderColor = '#bbf7d0';
        ipMsg.style.color = '#166534';
      }
      setTimeout(() => {
        if(connModal) connModal.style.display = 'none';
      }, 1500);
    }catch(e){
      if(ipMsg) ipMsg.textContent = 'حدث خطأ أثناء الحفظ';
    }
    finally{ savePrimaryBtn.disabled = false; }
  });
}

// Clear IP button
if(clearIpBtn){
  clearIpBtn.addEventListener('click', async () => {
    ipMsg.textContent = '';
    clearIpBtn.disabled = true;
    try{
      const a = await window.api.db_apply({ host: '127.0.0.1', port: 3306 });
      if(a && a.ok){
        serverIpInput.value = '';
        ipMsg.textContent = 'تم مسح IP. البرنامج يستخدم الاتصال المحلي الآن.';
        ipMsg.style.background = '#dcfce7';
        ipMsg.style.borderColor = '#bbf7d0';
        ipMsg.style.color = '#166534';
      } else {
        ipMsg.textContent = (a && a.error) || 'تعذر المسح';
        ipMsg.style.background = '';
        ipMsg.style.borderColor = '';
        ipMsg.style.color = '';
      }
    }catch(e){
      ipMsg.textContent = 'حدث خطأ أثناء المسح';
      ipMsg.style.background = '';
      ipMsg.style.borderColor = '';
      ipMsg.style.color = '';
    }
    finally{ clearIpBtn.disabled = false; }
  });
}

// Save and apply IP
if(saveIpBtn){
  saveIpBtn.addEventListener('click', async () => {
    ipMsg.textContent = '';
    ipMsg.style.background = '';
    ipMsg.style.borderColor = '';
    ipMsg.style.color = '';
    saveIpBtn.disabled = true; testIpBtn.disabled = true;
    try{
      const raw = serverIpInput.value.trim();
      if(!raw){ ipMsg.textContent = 'يرجى إدخال IP أو استخدم زر "مسح" للعودة للاتصال المحلي'; return; }
      const { host, port } = normalizeHost(raw);
      const t = await window.api.db_test({ host: host, port: port||3306 });
      if(!(t && t.ok)){ ipMsg.textContent = (t && t.error) || 'تعذر الاتصال بالجهاز الرئيسي'; return; }
      const a = await window.api.db_apply({ host: host, port: port||3306 });
      if(a && a.ok){
        await window.api.device_set_mode({ mode: 'secondary', api_host: host, api_port: 4310 });
        ipMsg.textContent = 'تم الحفظ. يمكنك تسجيل الدخول الآن.';
        ipMsg.style.background = '#dcfce7';
        ipMsg.style.borderColor = '#bbf7d0';
        ipMsg.style.color = '#166534';
      }
      else { ipMsg.textContent = (a && a.error) || 'تعذر الحفظ'; }
    }catch(e){ ipMsg.textContent = 'حدث خطأ أثناء الحفظ'; }
    finally{ saveIpBtn.disabled = false; testIpBtn.disabled = false; }
  });
}

// Context Menu for username and password fields
(function(){
  const contextMenu = document.getElementById('contextMenu');
  const ctxCopy = document.getElementById('ctxCopy');
  const ctxPaste = document.getElementById('ctxPaste');
  
  if(!contextMenu || !ctxCopy || !ctxPaste || !usernameInput || !passwordInput) return;
  
  let activeField = null;
  
  // Show context menu on right-click for username
  usernameInput.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    activeField = usernameInput;
    contextMenu.style.display = 'block';
    contextMenu.style.left = e.pageX + 'px';
    contextMenu.style.top = e.pageY + 'px';
  });
  
  // Show context menu on right-click for password
  passwordInput.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    activeField = passwordInput;
    contextMenu.style.display = 'block';
    contextMenu.style.left = e.pageX + 'px';
    contextMenu.style.top = e.pageY + 'px';
  });
  
  // Hide context menu when clicking outside
  document.addEventListener('click', (e) => {
    if(!contextMenu.contains(e.target) && e.target !== usernameInput && e.target !== passwordInput){
      contextMenu.style.display = 'none';
      activeField = null;
    }
  });
  
  // Copy action
  ctxCopy.addEventListener('click', () => {
    if(!activeField) return;
    const text = activeField.value;
    if(text){
      navigator.clipboard.writeText(text).then(() => {
        contextMenu.style.display = 'none';
      }).catch(() => {
        // Fallback for older browsers
        activeField.select();
        document.execCommand('copy');
        contextMenu.style.display = 'none';
      });
    }
  });
  
  // Paste action
  ctxPaste.addEventListener('click', () => {
    if(!activeField) return;
    navigator.clipboard.readText().then((text) => {
      activeField.value = text;
      contextMenu.style.display = 'none';
      activeField.focus();
    }).catch(() => {
      // Fallback for older browsers or permission denied
      activeField.focus();
      document.execCommand('paste');
      contextMenu.style.display = 'none';
    });
  });
  
  // Hide on Escape key
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){
      contextMenu.style.display = 'none';
      activeField = null;
    }
  });
})();

(async function checkForUpdatesOnLoad() {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Checking for updates on login page...');
    const result = await window.api.invoke('check-for-updates');
    console.log('Update check result:', result);
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
})();

window.api?.on?.('update-status', (data) => {
  const { status, data: statusData } = data;
  
  console.log('Update status event received:', status, statusData);

  if (status === 'update-available') {
    showUpdateAvailableNotification(statusData);
  }
});

async function showUpdateAvailableNotification(updateInfo) {
  const updateNotification = document.getElementById('updateNotification');
  if (!updateNotification) return;

  const newVersion = updateInfo?.version || 'جديد';
  let currentVersion = '1.0.0';
  
  try {
    currentVersion = await window.api.invoke('get-app-version');
  } catch (e) {
    console.error('Failed to get app version:', e);
  }
  
  console.log('Showing update notification for version:', newVersion);

  updateNotification.querySelector('.icon').textContent = '🎉';
  updateNotification.querySelector('#updateTitle').textContent = `يتوفر تحديث جديد! الإصدار ${newVersion}`;
  updateNotification.querySelector('#updateMessage').textContent = 'توجه إلى الإعدادات للتحديث';
  updateNotification.classList.remove('expired');
  
  updateNotification.style.display = 'flex';
  requestAnimationFrame(() => {
    updateNotification.classList.add('show');
  });
  
  setTimeout(() => {
    updateNotification.classList.remove('show');
    setTimeout(() => {
      updateNotification.style.display = 'none';
    }, 500);
  }, 10000);
}