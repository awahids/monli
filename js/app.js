// ─────────────────────────────────────────────
//  MONLI — v2.0 Mobile Design
// ─────────────────────────────────────────────

const GAJI = 11_000_000;

// ── Google Sheets Sync Config ─────────────────
// Paste URL Web App kamu di sini setelah deploy Apps Script:
const DEFAULT_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbz301tB6_kX1iMrBNuB6DyZo5gDy4Zgv8bR9ZPrrpl3CvRMfOJqzXzlKVsO8G37324t/exec';
let SHEETS_URL = localStorage.getItem('monliConfig_sheets_url') || DEFAULT_SHEETS_URL;

// ── Design tokens untuk setiap kategori ──────
const CAT_TOKENS = {
  coral:  { color: '#C94028', bg: '#FAEDEB', text: '#7A1F14' },
  amber:  { color: '#9E5B09', bg: '#FDF3E3', text: '#5A3205' },
  green:  { color: '#0B5E48', bg: '#E6F4F0', text: '#073D30' },
  blue:   { color: '#1456A3', bg: '#EAF1FB', text: '#0B3568' },
  purple: { color: '#5040B0', bg: '#EEEAFB', text: '#2E2570' },
};

const CATEGORIES = [
  // ── Pengeluaran Rutin ──────────────────────
  {
    id: 'istri',
    name: 'Uang Istri',
    abbr: 'UI',
    budget: 2_000_000,
    token: CAT_TOKENS.coral,
    type: 'expense',
    group: 'Pengeluaran Rutin',
  },
  {
    id: 'kontrakan',
    name: 'Kontrakan & Listrik',
    abbr: 'KL',
    budget: 2_000_000,
    token: CAT_TOKENS.coral,
    type: 'expense',
    group: 'Pengeluaran Rutin',
  },
  {
    id: 'spp',
    name: 'SPP',
    abbr: 'SP',
    budget: 600_000,
    token: CAT_TOKENS.coral,
    type: 'expense',
    group: 'Pengeluaran Rutin',
  },
  {
    id: 'ojek',
    name: 'Ojek Harian',
    abbr: 'OJ',
    budget: 900_000,
    token: CAT_TOKENS.amber,
    type: 'expense',
    group: 'Pengeluaran Rutin',
  },
  {
    id: 'transport',
    name: 'Transport CI–BDG',
    abbr: 'TR',
    budget: 900_000,
    token: CAT_TOKENS.amber,
    type: 'expense',
    group: 'Pengeluaran Rutin',
  },
  {
    id: 'makan',
    name: 'Makan & Harian',
    abbr: 'MK',
    budget: 350_000,
    token: CAT_TOKENS.amber,
    type: 'expense',
    group: 'Pengeluaran Rutin',
  },
  {
    id: 'internet',
    name: 'Internet & Pulsa',
    abbr: 'IP',
    budget: 150_000,
    token: CAT_TOKENS.amber,
    type: 'expense',
    group: 'Pengeluaran Rutin',
  },
  {
    id: 'jajan',
    name: 'Jajan Pribadi',
    abbr: 'JP',
    budget: 800_000,
    token: CAT_TOKENS.amber,
    type: 'expense',
    group: 'Pengeluaran Rutin',
  },
  {
    id: 'langganan',
    name: 'Langganan Digital',
    abbr: 'LD',
    budget: 500_000,
    token: CAT_TOKENS.purple,
    type: 'expense',
    group: 'Pengeluaran Rutin',
  },
  // ── Tabungan & Investasi ───────────────────
  {
    id: 'darurat',
    name: 'Dana Darurat',
    abbr: 'DD',
    budget: 800_000,
    token: CAT_TOKENS.green,
    type: 'saving',
    group: 'Tabungan & Investasi',
  },
  {
    id: 'liburan',
    name: 'Liburan Triwulan',
    abbr: 'LB',
    budget: 200_000,
    token: CAT_TOKENS.green,
    type: 'saving',
    group: 'Tabungan & Investasi',
  },
  {
    id: 'mudik',
    name: 'Mudik Maret — Sumbawa',
    abbr: 'MD',
    budget: 1_200_000,
    token: CAT_TOKENS.green,
    type: 'saving',
    group: 'Tabungan & Investasi',
  },
  {
    id: 'saham',
    name: 'Investasi Saham',
    abbr: 'IS',
    budget: 300_000,
    token: CAT_TOKENS.blue,
    type: 'saving',
    group: 'Tabungan & Investasi',
  },
];

// ── Bulan ─────────────────────────────────────
const BULAN = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

// ── State ─────────────────────────────────────
let curY, curM, activeTab = 'all';

// ── Storage ───────────────────────────────────
const storeKey = (y, m) => `monli_${y}_${String(m).padStart(2,'0')}`;

function getTxs() {
  const raw = localStorage.getItem(storeKey(curY, curM));
  return raw ? JSON.parse(raw) : [];
}

function saveTxs(txs) {
  localStorage.setItem(storeKey(curY, curM), JSON.stringify(txs));
}

function addTx(tx) {
  tx.id = Date.now().toString();
  const txs = getTxs();
  txs.unshift(tx);
  saveTxs(txs);
  render();
  toast('Transaksi tersimpan');
}

function deleteTx(id) {
  saveTxs(getTxs().filter(t => t.id !== id));
  render();
  toast('Dihapus');
}

function spent(catId) {
  return getTxs()
    .filter(t => t.catId === catId)
    .reduce((s, t) => s + t.amount, 0);
}

// ── Format ────────────────────────────────────
function fmt(n) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

function fmtS(n) {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return 'Rp ' + (Number.isInteger(v) ? v : v.toFixed(1)) + ' jt';
  }
  if (n >= 1_000) return 'Rp ' + Math.round(n / 1000) + ' rb';
  return 'Rp ' + n;
}

function fmtDate(iso) {
  const d = new Date(iso);
  return `${d.getDate()} ${BULAN[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;
}

// ── SVG icons ─────────────────────────────────
const ICONS = {
  home: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  plus: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  list: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  x: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  empty: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B8B5AE" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>`,
  chevL: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg>`,
  chevR: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="m9 18 6-6-6-6"/></svg>`,
};

// ── Render ─────────────────────────────────────
function render() {
  document.getElementById('monthLabel').textContent =
    `${BULAN[curM - 1]} ${curY}`;
  renderHero();
  renderCats();
  renderTxs();
}

function renderHero() {
  const txs = getTxs();
  const totalExp = CATEGORIES.filter(c => c.type === 'expense').reduce((s,c) => s + spent(c.id), 0);
  const totalSav = CATEGORIES.filter(c => c.type === 'saving').reduce((s,c) => s + spent(c.id), 0);
  const sisa = GAJI - totalExp - totalSav;

  document.getElementById('heroGaji').textContent = fmt(GAJI);
  document.getElementById('pillExp').textContent  = fmtS(totalExp);
  document.getElementById('pillSav').textContent  = fmtS(totalSav);

  const sisaEl = document.getElementById('pillSisa');
  sisaEl.textContent = (sisa < 0 ? '-' : '') + fmtS(Math.abs(sisa));
  sisaEl.className = 'hero-pill-val ' + (sisa < 0 ? 'warn' : 'good');
}

function renderCats() {
  const groups = ['Pengeluaran Rutin', 'Tabungan & Investasi'];
  let html = '';

  for (const grp of groups) {
    if (activeTab === 'expense' && grp === 'Tabungan & Investasi') continue;
    if (activeTab === 'saving'  && grp === 'Pengeluaran Rutin') continue;

    html += `<div class="section-label">${grp}</div>`;

    for (const cat of CATEGORIES.filter(c => c.group === grp)) {
      const s = spent(cat.id);
      const pct = Math.min((s / cat.budget) * 100, 100);
      const rem = cat.budget - s;
      const over  = s > cat.budget;
      const near  = !over && pct >= 80;

      const statusCls = over ? 'status-over' : near ? 'status-near' : 'status-ok';
      const barCls    = over ? 'bar-over'    : near ? 'bar-near'    : 'bar-ok';
      const remText   = over
        ? `Lebih ${fmtS(s - cat.budget)}`
        : rem === 0 ? 'Terpenuhi' : `Sisa ${fmtS(rem)}`;

      html += `
        <div class="cat-card" onclick="openSheet('${cat.id}')">
          <div class="cat-row">
            <div class="cat-avatar" style="background:${cat.token.bg};color:${cat.token.text}">${cat.abbr}</div>
            <div class="cat-info">
              <div class="cat-name">${cat.name}</div>
              <div class="cat-budget-text">Anggaran ${fmtS(cat.budget)}</div>
            </div>
            <div class="cat-right">
              <div class="cat-spent ${statusCls}">${fmtS(s)}</div>
              <div class="cat-remaining ${statusCls}">${Math.round(pct)}%</div>
            </div>
          </div>
          <div class="bar-track">
            <div class="bar-fill ${barCls}" style="width:${pct}%"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:5px;">
            <span style="font-size:11px;color:var(--n-400)">&nbsp;</span>
            <span style="font-size:11px;" class="${statusCls}">${remText}</span>
          </div>
        </div>`;
    }
  }

  document.getElementById('catList').innerHTML = html;
}

function renderTxs() {
  const all = getTxs();
  const filtered = all.filter(t => {
    if (activeTab === 'all') return true;
    const cat = CATEGORIES.find(c => c.id === t.catId);
    return cat && cat.type === activeTab.replace('saving','saving').replace('expense','expense');
  });

  if (filtered.length === 0) {
    document.getElementById('txSection').innerHTML = `
      <div class="section-label">Riwayat</div>
      <div class="empty">
        <div class="empty-icon">${ICONS.empty}</div>
        <div class="empty-title">Belum ada transaksi</div>
        <div class="empty-sub">Ketuk kategori atau tombol + untuk mencatat</div>
      </div>`;
    return;
  }

  let rows = filtered.map(tx => {
    const cat = CATEGORIES.find(c => c.id === tx.catId) || { abbr:'?', name: tx.catId, token: CAT_TOKENS.purple, type:'expense' };
    return `
      <div class="tx-item">
        <div class="tx-avatar" style="background:${cat.token.bg};color:${cat.token.text}">${cat.abbr}</div>
        <div class="tx-body">
          <div class="tx-name">${cat.name}</div>
          <div class="tx-meta">${fmtDate(tx.date)}${tx.note ? ' · ' + tx.note : ''}</div>
        </div>
        <div class="tx-right">
          <div class="tx-amount ${cat.type === 'saving' ? 'saving' : 'expense'}">
            ${cat.type === 'saving' ? '+' : '−'} ${fmtS(tx.amount)}
          </div>
          <button class="tx-del-btn" onclick="event.stopPropagation();deleteTx('${tx.id}')" aria-label="Hapus transaksi">
            ${ICONS.x}
          </button>
        </div>
      </div>`;
  }).join('');

  document.getElementById('txSection').innerHTML = `
    <div class="section-label">Riwayat</div>
    <div class="tx-card">${rows}</div>`;
}

// ── Bottom Sheet ──────────────────────────────
function openSheet(catId) {
  if (catId) {
    const cat = CATEGORIES.find(c => c.id === catId);
    document.getElementById('sheetTitle').textContent = cat ? cat.name : 'Catat Transaksi';
    document.getElementById('fCat').value = catId;
  } else {
    document.getElementById('sheetTitle').textContent = 'Catat Transaksi';
    document.getElementById('fCat').value = '';
  }
  document.getElementById('fAmount').value = '';
  document.getElementById('fNote').value = '';
  document.getElementById('fDate').value = new Date().toISOString().slice(0,10);
  document.getElementById('backdrop').classList.add('open');
  setTimeout(() => document.getElementById('fAmount').focus(), 350);
}

function closeSheet() {
  document.getElementById('backdrop').classList.remove('open');
}

function submitTx() {
  const catId  = document.getElementById('fCat').value;
  const rawVal = document.getElementById('fAmount').value.replace(/\./g,'').replace(/,/g,'').replace(/\s/g,'');
  const amount = parseInt(rawVal, 10);
  const note   = document.getElementById('fNote').value.trim();
  const date   = document.getElementById('fDate').value;

  if (!catId)              { toast('Pilih kategori terlebih dahulu'); return; }
  if (!amount || amount<=0){ toast('Masukkan nominal yang valid'); return; }
  if (!date)               { toast('Pilih tanggal'); return; }

  addTx({ catId, amount, note, date });
  closeSheet();
}

// ── Tab ───────────────────────────────────────
function setTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab-pill').forEach(b => b.classList.remove('active'));
  document.getElementById(`tp-${tab}`).classList.add('active');
  render();
}

function setNavTab(tab) {
  document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active'));
  document.getElementById(`nav-${tab}`)?.classList.add('active');
}

// ── Month Nav ─────────────────────────────────
function prevMonth() {
  curM--; if (curM < 1) { curM = 12; curY--; }
  render();
}

function nextMonth() {
  curM++; if (curM > 12) { curM = 1; curY++; }
  render();
}

// ── Google Sheets Sync ────────────────────────
function collectAllTxs() {
  const txs = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key.startsWith('monli_')) continue;
    const parts = key.replace('monli_', '').split('_');
    if (parts.length !== 2) continue;
    const year  = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const raw   = localStorage.getItem(key);
    if (!raw) continue;
    JSON.parse(raw).forEach(tx => {
      const cat = CATEGORIES.find(c => c.id === tx.catId) || { name: tx.catId, type: 'expense' };
      txs.push({ ...tx, year, month, catName: cat.name, type: cat.type });
    });
  }
  return txs;
}

async function syncToSheets() {
  if (!SHEETS_URL) {
    const url = prompt('Masukkan URL Web App Google Apps Script:');
    if (!url) return;
    SHEETS_URL = url.trim();
    localStorage.setItem('monliConfig_sheets_url', SHEETS_URL);
  }

  const btn = document.getElementById('syncBtn');
  const btnOrigHTML = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.textContent = 'Menyinkronkan…'; }

  try {
    const txs  = collectAllTxs();
    const resp = await fetch(SHEETS_URL, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({ action: 'sync', transactions: txs }),
    });

    const text = await resp.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch (_) {
      // Cek apakah Apps Script redirect ke halaman login
      if (text.includes('accounts.google.com') || text.includes('signin')) {
        toast('❌ Perlu login Google — pastikan "Who has access: Anyone"');
      } else if (text.includes('<html') || text.includes('<!DOCTYPE')) {
        toast('❌ Apps Script return HTML — cek deployment-nya (lihat konsol)');
        console.error('[Monli Sync] Response bukan JSON:\n', text.slice(0, 500));
      } else {
        toast('❌ Response tidak valid: ' + text.slice(0, 80));
        console.error('[Monli Sync] Raw response:', text);
      }
      return;
    }

    if (json.status === 'ok') {
      toast(`✅ ${json.synced} transaksi berhasil disinkronkan`);
    } else {
      toast('❌ Gagal: ' + (json.message || 'Unknown error'));
      console.error('[Monli Sync] Error dari Apps Script:', json);
    }
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      toast('❌ Tidak bisa terhubung — cek URL dan koneksi internet');
    } else {
      toast('❌ Error: ' + err.message);
    }
    console.error('[Monli Sync] Fetch error:', err);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = btnOrigHTML; }
  }
}

function resetSheetsUrl() {
  if (!confirm('Reset URL Google Sheets?')) return;
  SHEETS_URL = '';
  localStorage.removeItem('monli_sheets_url');
  toast('URL direset');
}

// ── Toast ─────────────────────────────────────
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2000);
}

// ── Amount input ──────────────────────────────
function onAmountInput(e) {
  let v = e.target.value.replace(/\D/g,'');
  if (v) e.target.value = parseInt(v,10).toLocaleString('id-ID');
}

// ── Init ──────────────────────────────────────
function init() {
  const now = new Date();
  curY = now.getFullYear();
  curM = now.getMonth() + 1;

  // Build select options
  const sel = document.getElementById('fCat');
  ['Pengeluaran Rutin','Tabungan & Investasi'].forEach(grp => {
    const og = document.createElement('optgroup');
    og.label = grp;
    CATEGORIES.filter(c => c.group === grp).forEach(c => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = `${c.abbr} — ${c.name}`;
      og.appendChild(o);
    });
    sel.appendChild(og);
  });

  // Nav icons
  document.getElementById('iconHome').innerHTML = ICONS.home;
  document.getElementById('iconPlus').innerHTML = ICONS.plus;

  // Backdrop click to close
  document.getElementById('backdrop').addEventListener('click', e => {
    if (e.target === document.getElementById('backdrop')) closeSheet();
  });

  // Amount format
  document.getElementById('fAmount').addEventListener('input', onAmountInput);
  document.getElementById('fAmount').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitTx();
  });

  render();
}

document.addEventListener('DOMContentLoaded', init);
