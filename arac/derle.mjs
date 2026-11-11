// Kaynak veri + yazılan dersler + motor => tek HTML. Kullanım: node arac/derle.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const oku = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const var_ = (p) => fs.existsSync(path.join(ROOT, p));
const js = (o) => JSON.stringify(o).replace(/</g, "\u003c").split(String.fromCharCode(0x2028)).join("\u2028").split(String.fromCharCode(0x2029)).join("\u2029");

const lines = oku('kaynak/orijinal.html').split(/\r?\n/);
const bul = (t) => { const i = lines.findIndex((l) => l.startsWith(t)); if (i < 0) throw new Error('bulunamadı: ' + t); return i; };

// CSS: yalnızca sınav odasına ait kurallar çıkar.
const cssBas = bul('<style>');
const cssSon = bul('</style>');
const ATILACAK = /^\s*(\.exbar|\.navg|\.navrow|\.nb[.{]|\.rmsets|\.rmset |\.chip\.main\.mock|\/\* mock room)/;
let css = lines.slice(cssBas + 1, cssSon).filter((l) => !ATILACAK.test(l)).join('\n').replace(/\.exbar\{top:env\(safe-area-inset-top,0px\)\}/, '');

const baglantilar = lines.slice(bul('<link rel="preconnect" href="https://fonts.googleapis.com">'), cssBas).join('\n');

// Veri: dersler dışındaki kaynak aynen kalır, mock listeleri ayrı işlenir.
const veriBas = bul('const UNITS = [');
const rmockI = bul('const RMOCK = [');
const rcaseI = bul('const RCASE = [');
let veri = lines.slice(veriBas, rmockI).join('\n');
const onceki = veri.length;
veri = veri.replace(/\s*\(mock Q\d+(?:\s*,\s*Q\d+)*\)/g, '').replace(/almost every mock question/g, 'almost every exam question');
console.log('mock referansı temizlendi, bayt farkı:', onceki - veri.length);

const rmock = JSON.parse(lines[rmockI].replace(/^const RMOCK = /, '').replace(/;\s*$/, ''));
const rcase = JSON.parse(lines[rcaseI].replace(/^const RCASE = /, '').replace(/;\s*$/, ''));

// Onaylı banka düzeltmeleri: set-<set>-<soru> olanlar burada, ORİJİNAL seçenek sırasında uygulanır
// (doğru seçenek henüz başa alınmadı). Geri kalanlar sayfaya DUZELT olarak gider.
let duzelt = [];
if (var_('denetim/banka-onayli.json')) {
  const onay = JSON.parse(oku('denetim/banka-onayli.json'));
  let sette = 0;
  for (const d of onay) {
    const m = /^set-(\d+)-(\d+)$/.exec(String(d.id || ''));
    if (!m) { duzelt.push(d); continue; }
    const q = rmock[+m[1]] && rmock[+m[1]].qs[+m[2]];
    if (!q) { console.log('UYARI: düzeltme için set sorusu yok', d.id); continue; }
    if (d.field === 'q' || d.field === 'x') q[d.field] = d.to;
    else if (d.field === 'o' && Number.isInteger(d.index) && d.index >= 0 && d.index < q.o.length) q.o[d.index] = d.to;
    else { console.log('UYARI: geçersiz düzeltme', d.id); continue; }
    sette++;
  }
  console.log('banka düzeltmesi:', onay.length, '· derlemede uygulanan (set):', sette, '· sayfaya giden:', duzelt.length);
}

const harita = JSON.parse(oku('icerik/mock-harita.json')).map;
const EK_SORULAR = [];
const vakaSorulari = new Map();
const goruldu = new Set();
let atlanan = 0;
rmock.forEach((s, si) => s.qs.forEach((q, qi) => {
  if (q.skip) { atlanan++; return; }
  if (goruldu.has(q.q)) return;
  goruldu.add(q.q);
  const m = harita[`${si}-${qi}`];
  if (!m) throw new Error(`eşleme eksik: ${si}-${qi}`);
  const o = [q.o[q.a], ...q.o.filter((_, i) => i !== q.a)];
  if (q.cs >= 0) {
    if (!vakaSorulari.has(q.cs)) vakaSorulari.set(q.cs, []);
    vakaSorulari.get(q.cs).push({ q: q.q, o, x: q.x, u: m.u });
  } else EK_SORULAR.push({ id: `set-${si}-${qi}`, u: m.u, d: m.d, q: q.q, o, x: q.x, set: true });
}));
const EK_VAKALAR = rcase.map((c, i) => ({ id: `rc${i}`, ch: Number(String(c.ch).replace(/\D/g, '')), title: c.title, text: c.text, set: true, qs: vakaSorulari.get(i) || [] })).filter((c) => c.qs.length);

const yama = `\n/* Denetimde doğrulanmış düzeltmeler (banka ve vaka soruları; set soruları derlemede uygulandı) */\nconst DUZELT=${js(duzelt)};\n`;

// Dersler
const DERSLER = { chapters: {}, lessons: {} };
for (const p of ['A', 'B', 'C', 'D', 'E']) {
  const f = `icerik/dersler-${p}.json`;
  if (!var_(f)) { console.log('UYARI: paket yok', p); continue; }
  let v;
  try { v = JSON.parse(oku(f)); } catch (e) { console.log('UYARI: paket okunamadı (yazılıyor olabilir)', p, e.message); continue; }
  if (!v || !Array.isArray(v.chapters) || !Array.isArray(v.lessons)) { console.log('UYARI: paket eksik', p); continue; }
  v.chapters.forEach((c) => { DERSLER.chapters[c.ch] = c; });
  v.lessons.forEach((l) => { DERSLER.lessons[l.id] = l; });
}

// İngilizce dersler (icerik/en): varsa ve okunabiliyorsa eklenir; eksik ders sayfada Türkçesine düşer.
const DERSLER_EN = { chapters: {}, lessons: {} };
for (const p of ['A', 'B', 'C', 'D', 'E']) {
  const f = `icerik/en/dersler-${p}.json`;
  if (!var_(f)) { console.log('EN paket yok', p); continue; }
  let v;
  try { v = JSON.parse(oku(f)); } catch (e) { console.log('UYARI: EN paket okunamadı (yazılıyor olabilir)', p, e.message); continue; }
  if (!v || !Array.isArray(v.chapters) || !Array.isArray(v.lessons)) { console.log('UYARI: EN paket eksik', p); continue; }
  v.chapters.forEach((c) => { if (c && DERSLER.chapters[c.ch]) DERSLER_EN.chapters[c.ch] = c; });
  v.lessons.forEach((l) => { if (l && DERSLER.lessons[l.id]) DERSLER_EN.lessons[l.id] = l; });
}

const planVars = JSON.parse(oku('icerik/plan-varsayilan.json'));

const sayfa = `<title>ITM Ders Sistemi</title>
<meta name="claude:viewport-fit-sides" content="cover">
${baglantilar}
<style>
${css}
${oku('src/tema.css')}
</style>

<header class="top"><div class="wrap">
  <div class="topbar">
    <div class="brand" id="brand"><h1>ITM <i>Ders Sistemi</i></h1><span>Introduction to Management · Radtke · 11 ders, 28 konu</span></div>
    <div class="pills" id="pills"></div>
  </div>
  <nav class="rail" id="rail" aria-label="Bölümler ve konular"></nav>
</div></header>
<main class="wrap" id="main"></main>
<div class="toast" id="toast" hidden></div>
<script>
${veri}
const EK_SORULAR=${js(EK_SORULAR)};
const EK_VAKALAR=${js(EK_VAKALAR)};
const DERSLER=${js(DERSLER)};
const DERSLER_EN=${js(DERSLER_EN)};
const PLAN_VARSAYILAN=${js(planVars)};
${yama}
${['plan', 'tekrar', 'teshis', 'gunluk', 'hoca', 'dil', 'app'].map((m) => oku(`src/${m}.js`)).join('\n')}
</script>
`;

if (/<\/script>/i.test(sayfa.slice(sayfa.indexOf('<script>') + 8, sayfa.lastIndexOf('</script>')))) throw new Error('script içinde kapanış etiketi');
fs.writeFileSync(path.join(ROOT, 'ITM-Ders-Sistemi.html'), sayfa);
// GitHub Pages için tam belge: yapıt iskeletinin aynısı + arama motoruna kapalı.
fs.writeFileSync(path.join(ROOT, 'index.html'), '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><style>*{box-sizing:border-box}body{margin:0}</style></head><body>' + sayfa + '</body></html>');
console.log({
  kb: Math.round(sayfa.length / 1024),
  dersler: Object.keys(DERSLER.lessons).length,
  bolumler: Object.keys(DERSLER.chapters).length,
  derslerEn: Object.keys(DERSLER_EN.lessons).length + ' / ' + Object.keys(DERSLER.lessons).length,
  bolumlerEn: Object.keys(DERSLER_EN.chapters).length,
  ekSoru: EK_SORULAR.length,
  ekVaka: EK_VAKALAR.length,
  ekVakaSoru: EK_VAKALAR.reduce((a, c) => a + c.qs.length, 0),
  atlanan,
});
