// assignCommercialsFromExcel.js
const mongoose = require('mongoose');
const xlsx = require('xlsx');

// ===== الإعدادات =====
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/supemir_db';
const EXCEL_PATH   = process.env.EXCEL_PATH   || './inscrits Supemir 94.xlsx'; // غيّر المسار لو لازم
const SHEET_NAME   = process.env.SHEET || null; // اتركه null لو أول شيت
// كيف نكتب في الطالب؟ 'string' = اسم التجاري كنص (الأبسط)، 'ref' = نخزّن ObjectId للتجاري
const WRITE_MODE   = process.env.WRITE_MODE || 'string'; // 'string' | 'ref'
const DRY_RUN      = (process.env.DRY_RUN || 'false') === 'true'; // جرّب بدون كتابة

// ===== الموديلات (عدّل أسماء الـcollection لو مختلفة) =====
const commercialSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  telephone: String,
  email: { type: String, required: true, unique: true },
  motDePasse: String,
  actif: { type: Boolean, default: true }
}, { collection: 'commercials', timestamps: true });

const etudiantSchema = new mongoose.Schema({
  prenom: String,
  nomDeFamille: String,
  email: String,
  commercial: { type: mongoose.Schema.Types.Mixed } // نستعملها لنحط اسم أو ObjectId
}, { collection: 'etudiants' });

const Commercial = mongoose.model('Commercial', commercialSchema);
const Etudiant   = mongoose.model('Etudiant', etudiantSchema);

// ===== أدوات =====
function deaccent(s) {
  return (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // يشيل التشكيل/اللكنة
}
function norm(s) {
  return deaccent(String(s).trim().toLowerCase())
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ');
}
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// تصحيح أسماء شائعة (تقدر تزيد/تعدّل بحرّية)
const ALIASES = new Map([
  ['aicha achraf', 'aicha achraf'],
  ['aicha achaf', 'aicha achraf'],

  ['fatima zohra rhanem', 'fatima zohra rhanem'],
  ['fatima zohrar rhanem', 'fatima zohra rhanem'],
  ['fatima-zohra rhanem', 'fatima zohra rhanem'],

  ['ismael el kadmiri', 'ismael el kadmiri'],
  ['ismael kadim el kadmiri', 'ismael el kadmiri'],
  ['ismael kadim el kadmiri', 'ismael el kadmiri'],
  ['ismael kadmiri', 'ismael el kadmiri'],
]);

function aliasOrSelf(name) {
  const k = norm(name);
  return ALIASES.get(k) || k;
}

// قراءة الـExcel
function readExcelRows(path, sheetName = null) {
  const wb = xlsx.readFile(path);
  const ws = wb.Sheets[sheetName || wb.SheetNames[0]];
  return xlsx.utils.sheet_to_json(ws, { defval: '' });
}

// محاولة اكتشاف عمود "Gestionnaire du Prospect Name"
function detectManagerColumn(row) {
  const keys = Object.keys(row);
  const wanted = [
    'Gestionnaire du Prospect Name',
    'Gestionnaire',
    'Prospect Manager',
    'Manager',
    'Gestionnaire Name'
  ].map(norm);
  for (const k of keys) if (wanted.includes(norm(k))) return k;
  return null;
}

// نحاول نلقى عمود الإيميل / الاسم
const EMAIL_KEYS = ['Email','email','E-mail','Mail','Adresse e-mail'];
const FN_KEYS    = ['prenom','Prénom','First Name','FirstName','Nom']; // بعض الملفات تكتب "Nom" للـprenom!
const LN_KEYS    = ['nom','Nom de Famille','Last Name','LastName','nomDeFamille'];

async function buildCommercialIndex() {
  const list = await Commercial.find({}, { nom: 1 }).lean();
  const byNorm = new Map();
  for (const c of list) byNorm.set(aliasOrSelf(c.nom), c);
  return byNorm;
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  const commIndex = await buildCommercialIndex();
  console.log('Commercials in DB:', commIndex.size);

  const rows = readExcelRows(EXCEL_PATH, SHEET_NAME);
  if (!rows.length) throw new Error('Excel فارغ أو المسار غير صحيح');
  const colMgr = detectManagerColumn(rows[0]);
  if (!colMgr) throw new Error('لم أجد عمود "Gestionnaire du Prospect Name"');

  const bulk = [];
  let cntTotal = 0, cntNoMgr = 0, cntMgrNotFound = 0, cntNoStudentKey = 0;

  for (const r of rows) {
    cntTotal++;
    const mgrRaw = (r[colMgr] || '').toString().trim();
    if (!mgrRaw) { cntNoMgr++; continue; }
    const mgrKey = aliasOrSelf(mgrRaw);
    const comm = commIndex.get(mgrKey);
    if (!comm) { cntMgrNotFound++; continue; }

    // جرّب بالإيميل أولاً
    let email = '';
    for (const k of EMAIL_KEYS) {
      if (r[k] && String(r[k]).includes('@')) { email = String(r[k]).trim(); break; }
    }

    let filter;
    if (email) {
      filter = { email: new RegExp(`^${escapeRegex(email)}$`, 'i') };
    } else {
      // بديل: match بالاسم + اللقب (لو ما في إيميل)
      let fn = '', ln = '';
      for (const k of FN_KEYS) if (r[k]) { fn = String(r[k]).trim(); break; }
      for (const k of LN_KEYS) if (r[k]) { ln = String(r[k]).trim(); break; }
      if (fn && ln) {
        filter = {
          $and: [
            { prenom: new RegExp(`^${escapeRegex(fn)}$`, 'i') },
            { $or: [
              { nomDeFamille: new RegExp(`^${escapeRegex(ln)}$`, 'i') },
              { nom:         new RegExp(`^${escapeRegex(ln)}$`, 'i') }
            ] }
          ]
        };
      }
    }

    if (!filter) { cntNoStudentKey++; continue; }

    const setDoc = (WRITE_MODE === 'ref') ? { commercial: comm._id } : { commercial: comm.nom };
    bulk.push({ updateOne: { filter, update: { $set: setDoc } } });
  }

  console.log({
    totalRows: cntTotal,
    toUpdate: bulk.length,
    noManagerInRow: cntNoMgr,
    managerNotFoundInDB: cntMgrNotFound,
    studentKeyMissing: cntNoStudentKey,
    WRITE_MODE, DRY_RUN
  });

  if (!DRY_RUN && bulk.length) {
    const res = await Etudiant.bulkWrite(bulk, { ordered: false });
    console.log('Bulk result:', res.result || res);
  } else {
    console.log('DRY_RUN مفعّل أو لا يوجد تحديثات — لم أكتب في القاعدة.');
  }

  await mongoose.disconnect();
  console.log('✅ Done.');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
