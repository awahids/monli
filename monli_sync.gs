// ---------------------------------------------
//  MONLI SYNC - Google Apps Script
//  Paste seluruh file ini ke: Extensions -> Apps Script
//  Deploy sebagai Web App: Execute as Me, Anyone
// ---------------------------------------------

const TX_SHEET_NAME   = 'Transaksi';
const DASH_SHEET_NAME = 'Dashboard';
const TREN_SHEET_NAME = 'Tren Bulanan';

const TX_HEADERS = [
  'ID','Tanggal','Bulan','Tahun',
  'Kategori ID','Kategori','Tipe','Nominal','Catatan'
];

const GAJI = 11000000;

const CATEGORIES = [
  { id:'istri',     name:'Uang Istri',         budget:2000000, type:'expense', group:'Pengeluaran Rutin' },
  { id:'kontrakan', name:'Kontrakan & Listrik', budget:2000000, type:'expense', group:'Pengeluaran Rutin' },
  { id:'spp',       name:'SPP',                 budget:600000,   type:'expense', group:'Pengeluaran Rutin' },
  { id:'ojek',      name:'Ojek Harian',         budget:900000,   type:'expense', group:'Pengeluaran Rutin' },
  { id:'transport', name:'Transport CI-BDG',    budget:900000,   type:'expense', group:'Pengeluaran Rutin' },
  { id:'makan',     name:'Makan & Harian',      budget:350000,   type:'expense', group:'Pengeluaran Rutin' },
  { id:'internet',  name:'Internet & Pulsa',    budget:150000,   type:'expense', group:'Pengeluaran Rutin' },
  { id:'jajan',     name:'Jajan Pribadi',       budget:800000,   type:'expense', group:'Pengeluaran Rutin' },
  { id:'langganan', name:'Langganan Digital',   budget:500000,   type:'expense', group:'Pengeluaran Rutin' },
  { id:'darurat',   name:'Dana Darurat',        budget:800000,   type:'saving',  group:'Tabungan & Investasi' },
  { id:'liburan',   name:'Liburan Triwulan',    budget:200000,   type:'saving',  group:'Tabungan & Investasi' },
  { id:'mudik',     name:'Mudik Maret-Sumbawa', budget:1200000, type:'saving',  group:'Tabungan & Investasi' },
  { id:'saham',     name:'Investasi Saham',     budget:300000,   type:'saving',  group:'Tabungan & Investasi' },
];

// Warna brand
const C = {
  green:      '#0B5E48',
  greenMid:   '#157A5F',
  greenLight: '#E6F4F0',
  greenPale:  '#F2FAF7',
  coral:      '#C94028',
  coralLight: '#FAECEA',
  amber:      '#9E5B09',
  amberLight: '#FDF3E3',
  blue:       '#1456A3',
  blueLight:  '#EAF1FB',
  gray1:      '#F7F6F4',
  gray2:      '#EDEBE8',
  gray3:      '#B8B5AE',
  gray4:      '#6B6863',
  white:      '#FFFFFF',
  dark:       '#1A1917',
};

// -- Entry Points ------------------------------
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    _ensureTxSheet(ss);

    if (payload.action === 'sync') {
      _writeTxs(ss, payload.transactions || []);
      _rebuildAll(ss);
      return _ok({ synced: (payload.transactions || []).length });
    }
    if (payload.action === 'add') {
      _appendTx(ss, payload.tx);
      _rebuildAll(ss);
      return _ok({ added: 1 });
    }
    if (payload.action === 'delete') {
      _deleteTx(ss, payload.id);
      _rebuildAll(ss);
      return _ok({ deleted: payload.id });
    }
    return _err('Action tidak dikenal: ' + payload.action);
  } catch (err) {
    return _err(err.message);
  }
}

function doGet() {
  return _ok({ status: 'Monli Sync API aktif ' });
}

// -- Sheet Transaksi ---------------------------
function _ensureTxSheet(ss) {
  let sh = ss.getSheetByName(TX_SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(TX_SHEET_NAME);
    const hdr = sh.getRange(1, 1, 1, TX_HEADERS.length);
    hdr.setValues([TX_HEADERS]);
    hdr.setFontWeight('bold').setBackground(C.green).setFontColor(C.white);
    sh.setFrozenRows(1);
    sh.setColumnWidths(1, TX_HEADERS.length, 120);
    sh.setColumnWidth(9, 200);
  }
  return sh;
}

function _writeTxs(ss, txs) {
  const sh = _ensureTxSheet(ss);
  if (sh.getLastRow() > 1)
    sh.getRange(2, 1, sh.getLastRow() - 1, TX_HEADERS.length).clearContent();
  if (!txs.length) return;
  const rows = txs.map(_txToRow);
  sh.getRange(2, 1, rows.length, TX_HEADERS.length).setValues(rows);
  sh.getRange(2, 8, rows.length, 1).setNumberFormat('"Rp "#,##0');
}

function _appendTx(ss, tx) {
  const sh = _ensureTxSheet(ss);
  sh.appendRow(_txToRow(tx));
  sh.getRange(sh.getLastRow(), 8).setNumberFormat('"Rp "#,##0');
}

function _deleteTx(ss, id) {
  const sh = _ensureTxSheet(ss);
  const data = sh.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]) === String(id)) { sh.deleteRow(i + 1); break; }
  }
}

function _txToRow(tx) {
  const d = new Date(tx.date);
  return [
    tx.id,
    Utilities.formatDate(d, 'Asia/Jakarta', 'dd/MM/yyyy'),
    tx.month,
    tx.year,
    tx.catId,
    tx.catName,
    tx.type === 'saving' ? 'Tabungan' : 'Pengeluaran',
    tx.amount,
    tx.note || ''
  ];
}

// -- Rebuild semua sheet -----------------------
function _rebuildAll(ss) {
  const allData = _getAllTxData(ss);
  _buildDashboard(ss, allData);
  _buildTrenBulanan(ss, allData);
}

function _getAllTxData(ss) {
  const sh = ss.getSheetByName(TX_SHEET_NAME);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, TX_HEADERS.length).getValues();
}

// -- Hitung spent per kategori (filter bulan/tahun opsional) --
function _calcSpent(allData, year, month) {
  const map = {};
  allData.forEach(row => {
    if (year  !== undefined && row[3] !== year)  return;
    if (month !== undefined && row[2] !== month) return;
    const catId  = row[4];
    const amount = Number(row[7]);
    map[catId] = (map[catId] || 0) + amount;
  });
  return map;
}

// -- Daftar bulan unik dari data ---------------
function _getMonths(allData) {
  const seen = new Set();
  const months = [];
  allData.forEach(row => {
    const key = `${row[3]}_${String(row[2]).padStart(2,'0')}`;
    if (!seen.has(key)) {
      seen.add(key);
      months.push({ year: row[3], month: row[2], key });
    }
  });
  return months.sort((a, b) => a.key.localeCompare(b.key));
}

const BULAN_ID = ['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

// -- Progress bar teks -------------------------
function _bar(pct) {
  const n = Math.min(Math.round(Math.min(pct, 1) * 12), 12);
  return '#'.repeat(n) + '.'.repeat(12 - n);
}

// ===============================================
//  DASHBOARD SHEET
// ===============================================
function _buildDashboard(ss, allData) {
  let sh = ss.getSheetByName(DASH_SHEET_NAME);
  if (sh) {
    sh.clearContents();
    sh.clearFormats();
    sh.clearConditionalFormatRules();
    sh.getCharts().forEach(c => sh.removeChart(c));
  } else {
    sh = ss.insertSheet(DASH_SHEET_NAME, 0);
  }

  sh.setColumnWidth(1, 200);
  sh.setColumnWidth(2, 130);
  sh.setColumnWidth(3, 130);
  sh.setColumnWidth(4, 130);
  sh.setColumnWidth(5, 80);
  sh.setColumnWidth(6, 140);
  sh.setColumnWidth(7, 80);

  // Hitung data all-time
  const spentAll = _calcSpent(allData);
  const months   = _getMonths(allData);

  // Hitung data bulan terbaru
  const latest      = months[months.length - 1];
  const spentLatest = latest ? _calcSpent(allData, latest.year, latest.month) : {};
  const periodLabel = latest
    ? `${BULAN_ID[latest.month]} ${latest.year}`
    : 'Belum ada data';

  let r = 1; // baris saat ini

  // -- 1. HEADER UTAMA --------------------------
  sh.getRange(r, 1, 1, 7).merge()
    .setValue('MONLI - Laporan Keuangan Pribadi')
    .setFontSize(18).setFontWeight('bold')
    .setFontColor(C.white).setBackground(C.green)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sh.setRowHeight(r, 48); r++;

  sh.getRange(r, 1, 1, 4)
    .setValue(`Periode terkini: ${periodLabel}`)
    .setFontColor(C.gray4).setFontSize(10).setFontStyle('italic');
  sh.getRange(r, 5, 1, 3).merge()
    .setValue('Diperbarui: ' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd MMM yyyy HH:mm'))
    .setFontColor(C.gray3).setFontSize(9)
    .setHorizontalAlignment('right');
  r += 2;

  // -- 2. RINGKASAN EKSEKUTIF -------------------
  _sectionHeader(sh, r, 'RINGKASAN EKSEKUTIF'); r++;

  const totalExp = CATEGORIES.filter(c => c.type === 'expense').reduce((s,c) => s + (spentLatest[c.id]||0), 0);
  const totalSav = CATEGORIES.filter(c => c.type === 'saving' ).reduce((s,c) => s + (spentLatest[c.id]||0), 0);
  const sisa     = GAJI - totalExp - totalSav;

  const cards = [
    { label:'Gaji Bulan Ini', value: GAJI,     bg: C.greenLight, fg: C.green  },
    { label:'Pengeluaran',    value: totalExp,  bg: C.coralLight, fg: C.coral  },
    { label:'Tabungan',       value: totalSav,  bg: C.blueLight,  fg: C.blue   },
    { label:'Sisa',           value: sisa,      bg: sisa < 0 ? C.coralLight : C.greenLight,
                                                fg: sisa < 0 ? C.coral       : C.green   },
  ];

  // Label row
  cards.forEach((card, i) => {
    sh.getRange(r, i * 2 + 1, 1, 2).merge()
      .setValue(card.label)
      .setFontWeight('bold').setFontSize(9).setFontColor(card.fg)
      .setBackground(card.bg).setHorizontalAlignment('center');
  });
  sh.setRowHeight(r, 24); r++;

  // Value row
  cards.forEach((card, i) => {
    sh.getRange(r, i * 2 + 1, 1, 2).merge()
      .setValue(card.value)
      .setNumberFormat('"Rp "#,##0')
      .setFontWeight('bold').setFontSize(14).setFontColor(card.fg)
      .setBackground(card.bg).setHorizontalAlignment('center').setVerticalAlignment('middle');
  });
  sh.setRowHeight(r, 40); r++;

  // Persentase dari gaji
  const pctCards = [
    { label: '100% gaji', fg: C.green },
    { label: `${Math.round(totalExp/GAJI*100)}% dari gaji`, fg: C.coral },
    { label: `${Math.round(totalSav/GAJI*100)}% dari gaji`, fg: C.blue  },
    { label: sisa >= 0 ? `${Math.round(sisa/GAJI*100)}% dari gaji` : '! Melebihi gaji', fg: sisa < 0 ? C.coral : C.green },
  ];
  pctCards.forEach((p, i) => {
    sh.getRange(r, i * 2 + 1, 1, 2).merge()
      .setValue(p.label).setFontSize(9).setFontColor(p.fg)
      .setHorizontalAlignment('center')
      .setBackground(cards[i].bg);
  });
  sh.setRowHeight(r, 20); r += 2;

  // -- 3. PENGELUARAN RUTIN ---------------------
  _sectionHeader(sh, r, 'PENGELUARAN RUTIN  -  ' + periodLabel); r++;
  _tableHeader(sh, r); r++;

  const expCats = CATEGORIES.filter(c => c.type === 'expense');
  expCats.forEach((cat, idx) => {
    const spent = spentLatest[cat.id] || 0;
    r = _tableRow(sh, r, cat, spent, idx % 2 === 0);
  });

  // Total baris
  const totalBudgetExp = expCats.reduce((s,c) => s + c.budget, 0);
  _totalRow(sh, r, 'Total Pengeluaran', totalBudgetExp, totalExp);
  r += 2;

  // -- 4. TABUNGAN & INVESTASI ------------------
  _sectionHeader(sh, r, 'TABUNGAN & INVESTASI  -  ' + periodLabel); r++;
  _tableHeader(sh, r); r++;

  const savCats = CATEGORIES.filter(c => c.type === 'saving');
  savCats.forEach((cat, idx) => {
    const spent = spentLatest[cat.id] || 0;
    r = _tableRow(sh, r, cat, spent, idx % 2 === 0);
  });

  const totalBudgetSav = savCats.reduce((s,c) => s + c.budget, 0);
  _totalRow(sh, r, 'Total Tabungan', totalBudgetSav, totalSav);
  r += 2;

  // -- 5. CATATAN ALL-TIME (jika > 1 bulan) ----
  if (months.length > 1) {
    _sectionHeader(sh, r, `AKUMULASI SEMUA BULAN  (${months.length} bulan)`); r++;
    _tableHeader(sh, r); r++;

    CATEGORIES.forEach((cat, idx) => {
      const spent = spentAll[cat.id] || 0;
      r = _tableRow(sh, r, cat, spent, idx % 2 === 0, true);
    });
    r++;
  }

  // -- 6. CHART: PIE pengeluaran -----------------
  if (totalExp > 0) {
    // Data untuk chart - tulis di kolom tersembunyi (I & J)
    const chartStartRow = r + 1;
    sh.getRange(r, 9).setValue('Kategori').setFontWeight('bold');
    sh.getRange(r, 10).setValue('Nominal').setFontWeight('bold');
    r++;

    expCats.forEach(cat => {
      const spent = spentLatest[cat.id] || 0;
      if (spent > 0) {
        sh.getRange(r, 9).setValue(cat.name);
        sh.getRange(r, 10).setValue(spent);
        r++;
      }
    });

    const chartEndRow = r - 1;
    if (chartEndRow >= chartStartRow) {
      const chartRange = sh.getRange(chartStartRow - 1, 9, chartEndRow - chartStartRow + 2, 2);
      const pie = sh.newChart()
        .setChartType(Charts.ChartType.PIE)
        .addRange(chartRange)
        .setPosition(5, 9, 0, 0)
        .setOption('title', `Pengeluaran - ${periodLabel}`)
        .setOption('titleTextStyle', { color: C.green, fontSize: 13, bold: true })
        .setOption('pieHole', 0.4)
        .setOption('width', 420)
        .setOption('height', 300)
        .setOption('legend', { position: 'right', textStyle: { fontSize: 10 } })
        .build();
      sh.insertChart(pie);
    }
  }

  // -- 7. CHART: BAR budget vs actual -----------
  const barChartDataRow = r + 1;
  sh.getRange(r, 9).setValue('Kategori').setFontWeight('bold');
  sh.getRange(r, 10).setValue('Anggaran').setFontWeight('bold');
  sh.getRange(r, 11).setValue('Realisasi').setFontWeight('bold');
  r++;

  CATEGORIES.forEach(cat => {
    sh.getRange(r, 9).setValue(cat.name);
    sh.getRange(r, 10).setValue(cat.budget);
    sh.getRange(r, 11).setValue(spentLatest[cat.id] || 0);
    r++;
  });

  const barRange = sh.getRange(barChartDataRow - 1, 9, CATEGORIES.length + 1, 3);
  const bar = sh.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(barRange)
    .setPosition(22, 9, 0, 0)
    .setOption('title', `Anggaran vs Realisasi - ${periodLabel}`)
    .setOption('titleTextStyle', { color: C.green, fontSize: 13, bold: true })
    .setOption('series', {
      0: { color: C.greenMid },
      1: { color: C.coral },
    })
    .setOption('width', 420)
    .setOption('height', 400)
    .setOption('legend', { position: 'top' })
    .build();
  sh.insertChart(bar);

  // Sembunyikan kolom helper chart
  sh.hideColumns(9, 3);
  sh.setFrozenRows(1);
}

// -- Helper: section header --------------------
function _sectionHeader(sh, r, label) {
  sh.getRange(r, 1, 1, 7).merge()
    .setValue(label)
    .setFontWeight('bold').setFontSize(11)
    .setFontColor(C.white).setBackground(C.greenMid)
    .setVerticalAlignment('middle');
  sh.setRowHeight(r, 30);
}

// -- Helper: table header row ------------------
function _tableHeader(sh, r) {
  const hdrs = ['Kategori','Anggaran','Realisasi','Sisa','%','Progress','Status'];
  const rng  = sh.getRange(r, 1, 1, 7);
  rng.setValues([hdrs])
    .setFontWeight('bold').setBackground(C.gray2)
    .setFontColor(C.dark).setHorizontalAlignment('center');
  sh.getRange(r, 1).setHorizontalAlignment('left');
  sh.setRowHeight(r, 22);
}

// -- Helper: table data row --------------------
function _tableRow(sh, r, cat, spent, stripe, allTime) {
  const rem    = cat.budget - spent;
  const pct    = cat.budget > 0 ? spent / cat.budget : 0;
  const over   = rem < 0;
  const near   = !over && pct >= 0.8;
  const status = over ? 'Lebih' : near ? 'Hampir' : 'OK';
  const bg     = stripe ? C.gray1 : C.white;

  sh.getRange(r, 1).setValue(cat.name).setBackground(bg).setFontColor(C.dark);
  sh.getRange(r, 2).setValue(allTime ? '-' : cat.budget)
    .setNumberFormat(allTime ? '@' : '"Rp "#,##0').setBackground(bg).setHorizontalAlignment('right');
  sh.getRange(r, 3).setValue(spent)
    .setNumberFormat('"Rp "#,##0').setBackground(bg).setHorizontalAlignment('right')
    .setFontColor(over ? C.coral : C.dark);
  sh.getRange(r, 4).setValue(allTime ? '' : rem)
    .setNumberFormat('"Rp "#,##0').setBackground(bg).setHorizontalAlignment('right')
    .setFontColor(over ? C.coral : rem === 0 ? C.green : C.dark);
  sh.getRange(r, 5).setValue(allTime ? '' : pct)
    .setNumberFormat('0%').setBackground(bg).setHorizontalAlignment('center')
    .setFontColor(over ? C.coral : near ? C.amber : C.green);
  sh.getRange(r, 6).setValue(allTime ? '' : _bar(pct))
    .setFontFamily('Courier New').setFontSize(9)
    .setBackground(bg).setHorizontalAlignment('left')
    .setFontColor(over ? C.coral : near ? C.amber : C.green);
  sh.getRange(r, 7).setValue(allTime ? '' : status)
    .setBackground(bg).setHorizontalAlignment('center');

  sh.setRowHeight(r, 22);
  return r + 1;
}

// -- Helper: total row -------------------------
function _totalRow(sh, r, label, budget, spent) {
  const rem  = budget - spent;
  const pct  = budget > 0 ? spent / budget : 0;
  const over = rem < 0;
  const row  = [[label, budget, spent, rem, pct, _bar(pct), over ? 'Lebih' : 'OK']];
  const rng  = sh.getRange(r, 1, 1, 7);
  rng.setValues(row).setFontWeight('bold').setBackground(C.gray2);
  sh.getRange(r, 2, 1, 2).setNumberFormat('"Rp "#,##0');
  sh.getRange(r, 4).setNumberFormat('"Rp "#,##0').setFontColor(over ? C.coral : C.green);
  sh.getRange(r, 5).setNumberFormat('0%').setFontColor(over ? C.coral : C.green);
  sh.getRange(r, 6).setFontFamily('Courier New').setFontSize(9).setFontColor(over ? C.coral : C.green);
  sh.setRowHeight(r, 24);
}

// ===============================================
//  TREN BULANAN SHEET
// ===============================================
function _buildTrenBulanan(ss, allData) {
  let sh = ss.getSheetByName(TREN_SHEET_NAME);
  if (sh) { sh.clearContents(); sh.clearFormats(); sh.getCharts().forEach(c => sh.removeChart(c)); }
  else     { sh = ss.insertSheet(TREN_SHEET_NAME); }

  const months = _getMonths(allData);
  if (!months.length) {
    sh.getRange(1,1).setValue('Belum ada data transaksi.');
    return;
  }

  // -- Header -----------------------------------
  sh.getRange(1, 1, 1, months.length + 3).merge()
    .setValue('TREN BULANAN - MONLI')
    .setFontSize(16).setFontWeight('bold')
    .setFontColor(C.white).setBackground(C.green)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sh.setRowHeight(1, 40);

  sh.getRange(2, 1, 1, months.length + 3).merge()
    .setValue(`${months.length} bulan tercatat  ,  Diperbarui: ` +
              Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd MMM yyyy'))
    .setFontColor(C.gray3).setFontSize(9);

  // -- Kolom header: Kategori | Jan | Feb | ... | Total | Rata-rata --
  const headerRow = ['Kategori', ...months.map(m => `${BULAN_ID[m.month]} ${m.year}`), 'Total', 'Rata-rata'];
  sh.getRange(4, 1, 1, headerRow.length)
    .setValues([headerRow])
    .setFontWeight('bold').setBackground(C.gray2)
    .setHorizontalAlignment('center');
  sh.getRange(4, 1).setHorizontalAlignment('left');

  sh.setColumnWidth(1, 200);
  months.forEach((_, i) => sh.setColumnWidth(i + 2, 110));
  sh.setColumnWidth(months.length + 2, 120);
  sh.setColumnWidth(months.length + 3, 110);

  let r = 5;

  // -- Pengeluaran Rutin -------------------------
  const expHdrRng = sh.getRange(r, 1, 1, headerRow.length);
  expHdrRng.merge()
    .setValue('PENGELUARAN RUTIN')
    .setFontWeight('bold').setBackground(C.greenMid).setFontColor(C.white);
  sh.setRowHeight(r, 26); r++;

  const expCats = CATEGORIES.filter(c => c.type === 'expense');
  expCats.forEach((cat, idx) => {
    r = _trenRow(sh, r, cat, months, allData, idx % 2 === 0);
  });
  r = _trenTotalRow(sh, r, 'Total Pengeluaran', expCats, months, allData);
  r++;

  // -- Tabungan & Investasi ----------------------
  sh.getRange(r, 1, 1, headerRow.length).merge()
    .setValue('TABUNGAN & INVESTASI')
    .setFontWeight('bold').setBackground(C.greenMid).setFontColor(C.white);
  sh.setRowHeight(r, 26); r++;

  const savCats = CATEGORIES.filter(c => c.type === 'saving');
  savCats.forEach((cat, idx) => {
    r = _trenRow(sh, r, cat, months, allData, idx % 2 === 0);
  });
  r = _trenTotalRow(sh, r, 'Total Tabungan', savCats, months, allData);
  r++;

  // -- Sisa per bulan ----------------------------
  sh.getRange(r, 1, 1, headerRow.length).merge()
    .setValue('SISA GAJI')
    .setFontWeight('bold').setBackground(C.greenMid).setFontColor(C.white);
  sh.setRowHeight(r, 26); r++;

  const sisaVals = months.map(m => {
    const spent = _calcSpent(allData, m.year, m.month);
    const totalOut = CATEGORIES.reduce((s,c) => s + (spent[c.id]||0), 0);
    return GAJI - totalOut;
  });
  const totalSisa = sisaVals.reduce((a,b) => a+b, 0);
  const avgSisa   = sisaVals.length ? totalSisa / sisaVals.length : 0;

  const sisaRow = ['Sisa Gaji', ...sisaVals, totalSisa, avgSisa];
  const sisaRng = sh.getRange(r, 1, 1, sisaRow.length);
  sisaRng.setValues([sisaRow]).setFontWeight('bold').setBackground(C.greenPale);
  sh.getRange(r, 2, 1, sisaRow.length - 1).setNumberFormat('"Rp "#,##0');
  // Warnai merah kalau negatif
  sisaVals.forEach((v, i) => {
    if (v < 0) sh.getRange(r, i + 2).setFontColor(C.coral);
    else        sh.getRange(r, i + 2).setFontColor(C.green);
  });
  sh.setRowHeight(r, 24); r += 2;

  // -- Chart: Tren pengeluaran & tabungan bulanan --
  const chartDataStartRow = r;
  sh.getRange(r, 1).setValue('Bulan');
  sh.getRange(r, 2).setValue('Pengeluaran');
  sh.getRange(r, 3).setValue('Tabungan');
  r++;

  months.forEach(m => {
    const spent  = _calcSpent(allData, m.year, m.month);
    const exp    = expCats.reduce((s,c) => s + (spent[c.id]||0), 0);
    const sav    = savCats.reduce((s,c) => s + (spent[c.id]||0), 0);
    sh.getRange(r, 1).setValue(`${BULAN_ID[m.month]} ${m.year}`);
    sh.getRange(r, 2).setValue(exp);
    sh.getRange(r, 3).setValue(sav);
    r++;
  });

  if (months.length >= 2) {
    const trendRange = sh.getRange(chartDataStartRow, 1, months.length + 1, 3);
    const lineChart  = sh.newChart()
      .setChartType(Charts.ChartType.LINE)
      .addRange(trendRange)
      .setPosition(chartDataStartRow, 5, 0, 0)
      .setOption('title', 'Tren Pengeluaran & Tabungan Bulanan')
      .setOption('titleTextStyle', { color: C.green, fontSize: 13, bold: true })
      .setOption('series', {
        0: { color: C.coral,    lineWidth: 2, pointSize: 5 },
        1: { color: C.blue,     lineWidth: 2, pointSize: 5 },
      })
      .setOption('width', 500).setOption('height', 300)
      .setOption('legend', { position: 'top' })
      .build();
    sh.insertChart(lineChart);
  }

  sh.setFrozenRows(4);
  sh.setFrozenColumns(1);
}

// -- Helper: baris tren per kategori -----------
function _trenRow(sh, r, cat, months, allData, stripe) {
  const bg = stripe ? C.gray1 : C.white;
  sh.getRange(r, 1).setValue(cat.name).setBackground(bg);

  let total = 0;
  months.forEach((m, i) => {
    const spent = _calcSpent(allData, m.year, m.month);
    const val   = spent[cat.id] || 0;
    total += val;
    sh.getRange(r, i + 2).setValue(val).setBackground(bg)
      .setNumberFormat('"Rp "#,##0').setHorizontalAlignment('right');
  });

  const avg = months.length ? total / months.length : 0;
  sh.getRange(r, months.length + 2).setValue(total)
    .setNumberFormat('"Rp "#,##0').setBackground(bg).setFontWeight('bold').setHorizontalAlignment('right');
  sh.getRange(r, months.length + 3).setValue(avg)
    .setNumberFormat('"Rp "#,##0').setBackground(bg).setHorizontalAlignment('right').setFontColor(C.gray4);
  sh.setRowHeight(r, 22);
  return r + 1;
}

// -- Helper: baris total tren ------------------
function _trenTotalRow(sh, r, label, cats, months, allData) {
  sh.getRange(r, 1).setValue(label).setFontWeight('bold').setBackground(C.gray2);
  let grandTotal = 0;
  months.forEach((m, i) => {
    const spent = _calcSpent(allData, m.year, m.month);
    const val   = cats.reduce((s,c) => s + (spent[c.id]||0), 0);
    grandTotal += val;
    sh.getRange(r, i + 2).setValue(val).setFontWeight('bold').setBackground(C.gray2)
      .setNumberFormat('"Rp "#,##0').setHorizontalAlignment('right');
  });
  const avg = months.length ? grandTotal / months.length : 0;
  sh.getRange(r, months.length + 2).setValue(grandTotal)
    .setNumberFormat('"Rp "#,##0').setFontWeight('bold').setBackground(C.gray2).setHorizontalAlignment('right');
  sh.getRange(r, months.length + 3).setValue(avg)
    .setNumberFormat('"Rp "#,##0').setFontWeight('bold').setBackground(C.gray2).setHorizontalAlignment('right').setFontColor(C.gray4);
  sh.setRowHeight(r, 24);
  return r + 1;
}

// -- Helpers response --------------------------
function _ok(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', ...data }))
    .setMimeType(ContentService.MimeType.JSON);
}
function _err(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'error', message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
