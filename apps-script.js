// ================================================================
// APPS SCRIPT - REQUEST MATERIAL + DANA LAPANGAN
// Cara deploy:
// 1. Buka Spreadsheet → Extensions → Apps Script
// 2. Hapus semua → paste kode ini → Save (Ctrl+S)
// 3. Deploy → New Deployment → Web App
//    Execute as: Me | Who has access: Anyone
// 4. Authorize → Copy URL
// ================================================================

function doGet(e) {
  const action = e.parameter.action;
  const sheet  = e.parameter.sheet || 'Sheet1';

  if (action === 'test')        return out({ status: 'ok', message: 'Script berjalan!' });
  if (action === 'getData')     return out(getData(sheet));
  if (action === 'getSisaDana') return out(getSisaDana(sheet));

  return out({ status: 'error', message: 'Unknown action' });
}

function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents);
    const action = body.action;
    const sheet  = body.sheet || 'Sheet1';

    if (action === 'addRow')    return out(addRow(body, sheet));
    if (action === 'updateRow') return out(updateRow(body, sheet));
    if (action === 'deleteRow') return out(deleteRow(body, sheet));
    if (action === 'addDana')   return out(addDana(body, sheet));

    return out({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    return out({ status: 'error', message: err.toString() });
  }
}

function out(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── GET OR CREATE SHEET (Request Material) ──
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange('A1:J1').setValues([[
      'No','Nama Barang','Jumlah','Satuan',
      'Tgl Request','Tgl Diperlukan',
      'Tgl Sampai','Pengantar','Penerima','Status'
    ]]);
    sh.getRange('A1:J1').setFontWeight('bold').setBackground('#c8f54a').setFontColor('#000000');
    sh.setFrozenRows(1);
    [40,200,70,80,120,130,120,120,120,100].forEach((w,i)=>sh.setColumnWidth(i+1,w));
  }
  return sh;
}

// ── ADD ROW (Request Material) ──
function addRow(body, sheetName) {
  try {
    const sh = getSheet(sheetName);
    const no = sh.getLastRow();
    sh.appendRow([
      no, body.nama||'', body.jumlah||'', body.satuan||'',
      body.tglRequest||'', body.tglDiperlukan||'',
      '','','','Pending'
    ]);
    const newRow = sh.getLastRow();
    const rowId  = 'ID_' + new Date().getTime();
    sh.getRange(newRow, 11).setValue(rowId);
    return { status: 'ok', rowId, row: newRow };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

// ── GET DATA ──
function getData(sheetName) {
  try {
    const sh   = getSheet(sheetName);
    const last = sh.getLastRow();
    if (last <= 1) return { status: 'ok', data: [] };
    const vals = sh.getRange(2,1,last-1,11).getValues();
    return { status: 'ok', data: vals.map(r=>({
      no:r[0],nama:r[1],jumlah:r[2],satuan:r[3],
      tglRequest:r[4],tglDiperlukan:r[5],
      tglSampai:r[6],pengantar:r[7],penerima:r[8],status:r[9],rowId:r[10]
    }))};
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

// ── UPDATE ROW ──
function updateRow(body, sheetName) {
  try {
    const sh   = getSheet(sheetName);
    const last = sh.getLastRow();
    if (last <= 1) return { status: 'error', message: 'Sheet kosong' };
    const vals = sh.getRange(2,1,last-1,11).getValues();
    let target = -1;
    for (let i=0;i<vals.length;i++) {
      if (String(vals[i][10])===String(body.rowId)) { target=i+2; break; }
    }
    if (target===-1 && body.nama) {
      for (let i=0;i<vals.length;i++) {
        if (String(vals[i][1]).toLowerCase()===String(body.nama).toLowerCase()
            && (!body.tglRequest||String(vals[i][4])===String(body.tglRequest))
            && String(vals[i][9])==='Pending') { target=i+2; break; }
      }
    }
    if (target===-1) return { status: 'error', message: 'Row tidak ditemukan' };
    sh.getRange(target,7).setValue(body.tglSampai||'');
    sh.getRange(target,8).setValue(body.pengantar||'');
    sh.getRange(target,9).setValue(body.penerima||'');
    sh.getRange(target,10).setValue(body.status||'Sampai');
    sh.getRange(target,1,1,10).setBackground('#e8ffd0');
    return { status: 'ok' };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

// ── DELETE ROW ──
function deleteRow(body, sheetName) {
  try {
    const sh   = getSheet(sheetName);
    const last = sh.getLastRow();
    if (last <= 1) return { status: 'error', message: 'Sheet kosong' };
    const vals = sh.getRange(2,1,last-1,11).getValues();
    for (let i=vals.length-1;i>=0;i--) {
      if (String(vals[i][10])===String(body.rowId)) { sh.deleteRow(i+2); return {status:'ok'}; }
    }
    if (body.nama) {
      for (let i=vals.length-1;i>=0;i--) {
        if (String(vals[i][1]).toLowerCase()===String(body.nama).toLowerCase()
            && String(vals[i][9])==='Pending') { sh.deleteRow(i+2); return {status:'ok'}; }
      }
    }
    return { status: 'error', message: 'Row tidak ditemukan' };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

// ══════════════════════════════════════════
// DANA LAPANGAN
// Sheet: [NamaLokasi]_Dana
//
// Kolom:
// A: No Nota
// B: Tanggal
// C: Uraian
// D: Ada/Tidak Ada  ← finance isi
// E: Klasifikasi
// F: Kategori
// G: Masuk          ← finance isi (dana masuk ke kas)
// H: Vol
// I: Satuan
// J: Harga Satuan
// K: Total          (pengeluaran)
// L: Saldo          =L_sebelumnya + G - K
// ══════════════════════════════════════════

function getDanaSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(sheetName);
  if (!sh) {
    sh = ss.insertSheet(sheetName);
    const headers = [
      'No Nota','Tanggal','Uraian','Ada/Tidak Ada',
      'Klasifikasi','Kategori','Masuk',
      'Vol','Satuan','Harga Satuan','Total','Saldo'
    ];
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.getRange(1,1,1,headers.length)
      .setFontWeight('bold')
      .setBackground('#fff2cc')
      .setFontColor('#000000');
    sh.setFrozenRows(1);
    const widths = [60,110,220,110,110,100,100,60,70,120,120,120];
    widths.forEach((w,i)=>sh.setColumnWidth(i+1,w));
  }
  return sh;
}

// body: { no, tanggal, uraian, klasifikasi, vol, satuan, hargaSatuan, total }
function addDana(body, sheetName) {
  try {
    const sh      = getDanaSheet(sheetName);
    const lastRow = sh.getLastRow();
    const total   = parseFloat(body.total)||0;

    // Hitung saldo: ambil saldo baris sebelumnya lalu kurangi total
    let saldoSebelum = 0;
    if (lastRow > 1) {
      // Cari nilai saldo (kolom L=12) dari baris terakhir yang ada isinya
      const vals = sh.getRange(2,12,lastRow-1,1).getValues();
      for (let i=vals.length-1;i>=0;i--) {
        if (vals[i][0]!==''&&vals[i][0]!==null&&!isNaN(vals[i][0])) {
          saldoSebelum = parseFloat(vals[i][0]);
          break;
        }
      }
    }
    // Saldo baru = saldo sebelumnya + masuk - total pengeluaran
    // Kolom G (Masuk) dikosongkan dulu — finance yang isi
    // Jadi saldo sementara = saldoSebelum - total
    const saldoBaru = saldoSebelum - total;

    sh.appendRow([
      body.no          || '',   // A: No Nota
      body.tanggal     || '',   // B: Tanggal
      body.uraian      || '',   // C: Uraian
      '',                       // D: Ada/Tidak Ada — finance isi
      body.klasifikasi || '',   // E: Klasifikasi
      '',                       // F: Kategori — opsional, bisa finance isi
      '',                       // G: Masuk — finance isi
      body.vol         || '',   // H: Vol
      body.satuan      || '',   // I: Satuan
      body.hargaSatuan || '',   // J: Harga Satuan
      total||'',                // K: Total
      saldoBaru                 // L: Saldo
    ]);

    return { status: 'ok' };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

// ── GET SISA DANA (nilai kolom L terakhir yang ada isinya) ──
function getSisaDana(sheetName) {
  try {
    const sh      = getDanaSheet(sheetName);
    const lastRow = sh.getLastRow();
    if (lastRow <= 1) return { status: 'ok', sisa: 0 };
    const values = sh.getRange(2,12,lastRow-1,1).getValues();
    let sisa = 0;
    for (let i=values.length-1;i>=0;i--) {
      const val = values[i][0];
      if (val!==''&&val!==null&&val!==undefined&&!isNaN(val)) { sisa=val; break; }
    }
    return { status: 'ok', sisa };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}
