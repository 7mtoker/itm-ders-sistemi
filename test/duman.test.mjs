// Duman testi: derlenmiş sayfanın betiğini sahte DOM ile çalıştırır, bütün ekranları çizer ve gerçekçi akışları sürer.
// Akışlar üç kez koşar: Türkçe, İngilizce (gerçek icerik/en dosyalarıyla) ve İngilizce (her ders için sahte İngilizce içerikle;
// bu koşuda çizilen HTML'de ğ Ğ ş Ş ı İ aranır: çevrilmemiş her arayüz metni burada yakalanır).
import fs from 'node:fs'; import vm from 'node:vm'; import assert from 'node:assert';
const html = fs.readFileSync('ITM-Ders-Sistemi.html', 'utf8');
const kodAsil = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
const AC = ';globalThis.__T={get S(){return S},normalize,adimSoru,haftalar,bugunNo,get BG(){return BG},get ONERI(){return ONERI},get icsMetin(){return icsMetin},get icsMesaj(){return icsMesaj},Z,VIEWS,TABS,HCD,DIL,tx,ders,chBilgi,DERSLER,DERSLER_EN};';
const bekle = () => new Promise((r) => setTimeout(r, 0));
const LKEY = 'itmders.v1', TR_HARF = /[ğĞşŞıİ]/;

// Sahte İngilizce içerik: Türkçe derslerin aynısı, Türkçeye özgü harfler ASCII'ye çevrilmiş (biçim ve id'ler birebir).
const duz = (s) => s.replace(/ğ/g, 'g').replace(/Ğ/g, 'G').replace(/ş/g, 's').replace(/Ş/g, 'S').replace(/ı/g, 'i').replace(/İ/g, 'I');
const dersSatir = /^const DERSLER=(.*);$/m.exec(kodAsil);
assert.ok(dersSatir && /^const DERSLER_EN=.*;$/m.test(kodAsil), 'DERSLER ve DERSLER_EN sayfada olmalı');
const sahteEn = duz(JSON.stringify(JSON.parse(dersSatir[1]))).replace(/</g, '\u003c').split(String.fromCharCode(0x2028)).join('\u2028').split(String.fromCharCode(0x2029)).join('\u2029');
const kodSahte = kodAsil.replace(/^const DERSLER_EN=.*;$/m, () => 'const DERSLER_EN=' + sahteEn + ';');
const kodEnsiz = kodAsil.replace(/^const DERSLER_EN=.*;$/m, () => 'const DERSLER_EN={"chapters":{},"lessons":{"c1a":{"id":"c1a","ad":"Only this one","adimlar":[]},"c1b":null}};');

// o: {kod, dil, harf} — dil "en" ise boş depoya İngilizce kayıt konur; harf true ise her çizimde Türkçe harf aranır.
function kur(depo, claude, o = {}) {
  if (o.dil === 'en' && !(LKEY in depo)) depo[LKEY] = JSON.stringify({ dil: 'en' });
  const el = {}, h = {}, uyari = [];
  const yeni = (id) => ({ id, innerHTML: '', textContent: '', hidden: false, value: '', scrollLeft: 0, style: {}, dataset: {},
    classList: { contains: () => false }, querySelector: () => null, querySelectorAll: () => [], select() {}, focus() {} });
  const document = {
    documentElement: {}, activeElement: null, body: { appendChild() {} },
    getElementById: (id) => el[id] || (el[id] = yeni(id)),
    querySelector: () => null, querySelectorAll: () => [],
    addEventListener: (t, f) => { (h[t] = h[t] || []).push(f); },
  };
  const ls = { getItem: (k) => (k in depo ? depo[k] : null), setItem: (k, v) => { depo[k] = String(v); } };
  const ctx = { document, localStorage: ls, navigator: {}, console: { log() {}, warn: (...a) => uyari.push(a.join(' ')), error: (...a) => uyari.push(a.join(' ')) },
    setInterval: () => 0, setTimeout: (f, ms) => (ms > 1000 ? 0 : setTimeout(f, 0)), clearTimeout: () => {}, Promise, Date, Math, JSON };
  ctx.window = ctx; ctx.scrollTo = () => {}; ctx.innerHeight = 800; ctx.speechSynthesis = { cancel() {}, speak() {} };
  ctx.SpeechSynthesisUtterance = function (t) { this.text = t; };
  if (claude) ctx.claude = claude;
  vm.createContext(ctx); vm.runInContext((o.kod || kodAsil) + AC, ctx);
  const T = ctx.__T, main = el.main;
  const kontrol = (ne) => {
    for (const id of ['main', 'pills', 'rail', 'brand', 'toast']) {
      const s = (el[id] ? el[id].innerHTML + ' ' + el[id].textContent : '');
      for (const kotu of ['undefined', 'NaN', '[object Object]']) assert.ok(!s.includes(kotu), `${ne}: #${id} içinde ${kotu}: …${s.slice(Math.max(0, s.indexOf(kotu) - 120), s.indexOf(kotu) + 40)}`);
      if (o.harf && T.S.dil === 'en') { const m = TR_HARF.exec(s); assert.ok(!m, `${ne}: İngilizce modda #${id} içinde Türkçe harf: …${m ? s.slice(Math.max(0, m.index - 140), m.index + 60) : ''}`); }
    }
  };
  const tikla = (act, data = {}) => {
    const b = { dataset: Object.assign({ act }, data), disabled: false };
    h.click.forEach((f) => f({ target: { closest: () => b } }));
    kontrol(act + ' ' + JSON.stringify(data));
  };
  const degis = (t) => { h.change.forEach((f) => f({ target: Object.assign({ id: '', value: '', dataset: {} }, t) })); kontrol('change'); };
  const yaz = (t) => h.input.forEach((f) => f({ target: Object.assign({ id: '', value: '', dataset: {} }, t) }));
  kontrol('ilk çizim');
  return { T, el, main, tikla, degis, yaz, uyari, depo, document };
}
const kopya = (x) => JSON.parse(JSON.stringify(x));
const turDongu = (A) => { const S = A.T.S; const rt = A.T.normalize(kopya(S)); assert.deepStrictEqual(kopya(rt), kopya(S), 'normalize tur dönüşü'); };

// Akışların dile göre beklediği arayüz metinleri.
const BEKLE = {
  tr: { bildim: 'Bildim', bitti: 'tekrarı bitti', eminY: 'Emin, yanlış', anlat: 'Kendi cümlenle anlat', neden: 'Neden yanlış?', hc: 'Çalışma arkadaşı', hafta: 'Bu hafta', ayar: 'Ayarlar', ics: 'ITM Hafta', model: ['Tanım doğru', 'Örnek yok', 'Bir örnek ekle.'] },
  en: { ics: 'ITM week', model: ['Definition is right', 'No example', 'Add one example.'] },
};

async function akislar(dil, o = {}) {
  const ops = Object.assign({ dil }, o);
  // 1. Boş durum: bütün ekranlar ve konu sekmeleri
  const A = kur({}, null, ops);
  // İngilizce beklentiler sözlükten okunur (metin düzeltmeleri testi kırmasın); Türkçe beklentiler sabit kalır.
  const De = A.T.DIL.en, X = dil === 'tr' ? BEKLE.tr : Object.assign({ bildim: De['bg.n2'], bitti: De['bg.bitti'], eminY: De['ts.kal'][1][0], anlat: De['hc.anlatH'], neden: De['hc.neden'], hc: De['hc.ad'], hafta: De['nav.hafta'], ayar: De['nav.ayar'] }, BEKLE.en);
  for (const k of Object.keys(BEKLE.tr)) if (k !== 'model') assert.ok(typeof X[k] === 'string' && X[k] && (dil === 'tr' || X[k] !== BEKLE.tr[k]), 'beklenti ' + k);
  assert.strictEqual(A.T.S.dil, dil); assert.strictEqual(A.document.documentElement.lang, dil, 'html lang');
  assert.ok(A.el.rail.innerHTML.includes('>' + X.hafta) && A.el.rail.innerHTML.includes('>' + X.ayar), dil + ' gezinme');
  assert.ok(A.el.pills.innerHTML.includes('data-act="dil"') && A.el.pills.innerHTML.includes(`data-d="${dil}" aria-pressed="true"`), 'üst bantta dil seçici');
  for (const v of A.T.VIEWS) if (v !== 'unit' && v !== 'kontrol') A.tikla('go', { v });
  assert.ok(A.main.innerHTML.split('data-act="dil"').length === 3, 'ayarlarda dil seçici');
  const uids = Object.keys(kopya(A.T.S.u));
  for (const u of uids) for (const t of A.T.TABS) A.tikla('unit', { u, t });
  assert.strictEqual(A.uyari.filter((x) => x.includes('DUZELT')).length, 0, 'düzeltmeler uygulanmalı: ' + A.uyari);

  // 2. Anlatım adımları: bazıları yanlış; her konunun girişi, bütün adımları ve özeti çizilir
  for (const u of uids) { const N = A.T.ders(u).adimlar.length; A.tikla('unit', { u, t: 'anlatim' }); for (let p = 0; p <= N + 1; p++) A.tikla('apos', { p: String(p) }); A.tikla('apos', { p: '0' }); }
  A.tikla('unit', { u: 'c11e', t: 'anlatim' });
  const n = A.T.ders('c11e').adimlar.length;
  for (let i = 0; i < n; i++) { A.tikla('apos', { p: String(i + 1) }); const q = A.T.adimSoru('c11e', i); A.tikla('sans', { i: String(i % 2 ? q.a : (q.a + 1) % q.o.length) }); }
  A.tikla('apos', { p: String(n + 1) });
  assert.ok(Object.keys(A.T.S.tk.k).some((k) => k.startsWith('t:')), 'terim kartı eklendi');
  assert.ok(Object.keys(A.T.S.tk.k).some((k) => k.startsWith('a:c11e-adim-')), 'yanlış adım kartı eklendi');

  // 3. Kontrol testi: önce emin, sonra "emin değilim" ile
  for (const tur of [0, 1]) {
    A.tikla('tab', { t: 'check' }); A.tikla('startquiz', { k: 'check' });
    for (let i = 0; i < 8; i++) {
      const z = A.T.Z(), q = z.qs[z.i];
      if (tur && i % 2 === 0) { A.tikla('emin', { q: q.id }); assert.ok(A.main.innerHTML.includes('aria-pressed="true"')); }
      A.tikla('ans', { i: String(i % 3 ? q.a : (q.a + 1) % q.o.length) }); A.tikla('qnext');
    }
    assert.ok(A.T.Z().done);
  }
  assert.ok(Object.values(A.T.S.ts.e).some((v) => v[2] + v[3] > 0), 'emin değilim kaydı');
  assert.ok(Object.keys(A.T.S.tk.k).some((k) => k.startsWith('q:')), 'yanlış soru kartı');
  for (const t of ['chal', 'practice', 'cards']) A.tikla('tab', { t });
  A.tikla('tab', { t: 'chal' }); A.tikla('startquiz', { k: 'chal' });
  while (!A.T.Z().done) { const z = A.T.Z(); A.tikla('ans', { i: String(z.qs[z.i].a) }); A.tikla('qnext'); }
  A.tikla('go', { v: 'mistakes' }); A.tikla('redo'); { const z = A.T.Z(); A.tikla('ans', { i: String(z.qs[z.i].a) }); A.tikla('qnext'); }
  A.tikla('go', { v: 'cases' }); A.tikla('cz-open', { id: 'rc0' }); A.tikla('czans', { k: '0', i: '0' }); A.tikla('cz-close');
  A.tikla('go', { v: 'terms' }); for (const m of ['drill', 'compare', 'list', 'drill']) A.tikla('kt-mode', { m }); A.tikla('ktans', { i: '0' }); A.tikla('kt-next'); A.tikla('ktans', { i: '1' }); A.tikla('ktans', { i: '2' });
  turDongu(A);

  // 4. Bugün: terim ve soru kartları (soru kartlarını bugüne çek)
  for (const k of Object.keys(A.T.S.tk.k)) A.T.S.tk.k[k][0] = A.T.bugunNo();
  A.tikla('go', { v: 'bugun' });
  let tur = 0, t = 0, s = 0;
  while (A.T.BG.cur && tur++ < 40) {
    const c = A.T.BG.cur;
    if (c.tur === 't') { t++; A.tikla('bgac'); assert.ok(A.main.innerHTML.includes(X.bildim)); A.tikla('bgnot', { n: String(tur % 3) }); }
    else { s++; if (tur % 2) A.tikla('emin', { q: c.q.id }); A.tikla('ans', { i: String(tur % 2 ? c.q.a : (c.q.a + 1) % c.q.o.length) }); A.tikla('bgnext'); }
  }
  assert.ok(t > 0 && s > 0, `terim ${t}, soru ${s} kartı görülmeli`);
  assert.ok(A.main.innerHTML.includes(X.bitti), `tekrar bitmedi: tur ${tur}, i ${A.T.BG.i}/${A.T.BG.keys.length}, view ${A.T.S.view}, kars ${!!A.T.S.z.kars} :: ${A.main.innerHTML.slice(0, 600)}`);

  // 5. Fark çalışması
  A.T.S.ts.c['c11e|Role modeling|Training'] = [3, Date.now()];
  A.tikla('go', { v: 'bugun' });
  const ki = A.T.ONERI.findIndex((x) => x.tip === 'karisma'); assert.ok(ki >= 0, 'karışma önerisi');
  A.tikla('kars', { i: String(ki) }); assert.ok(A.T.S.z.kars && A.T.S.z.kars.qs.length > 0);
  while (!A.T.S.z.kars.done) { const z = A.T.S.z.kars; A.tikla('ans', { i: String(z.qs[z.i].a) }); A.tikla('qnext'); }
  A.tikla('karsbit'); assert.ok(!A.T.S.z.kars);
  A.tikla('go', { v: 'teshis' }); assert.ok(A.main.innerHTML.includes(X.eminY));

  // 6. Ayarlar, takvim dosyası, tatil haftası, yedek, geride kalan haftalar
  A.tikla('go', { v: 'ayar' });
  A.degis({ value: '90', dataset: { gpm: '0' } }); assert.strictEqual(A.T.S.gp.musaitlik[0], 90);
  A.degis({ value: '2', dataset: { gpders: '1' } }); assert.strictEqual(A.T.S.gp.dersGunu, 2);
  A.tikla('ics'); await bekle(); await bekle();
  assert.ok(A.T.icsMetin.startsWith('BEGIN:VCALENDAR') && A.main.innerHTML.includes('icsmetin'), 'ics metni gösterilir');
  assert.ok(A.T.icsMetin.replace(/\r\n /g, '').includes('SUMMARY:' + X.ics), 'takvim dosyası ' + dil);
  A.tikla('ykopya'); A.el.yedek.value = 'bozuk'; A.tikla('yal'); A.el.yedek.value = JSON.stringify(A.T.S); A.tikla('yal'); A.tikla('rsor'); A.tikla('rvazgec');
  A.degis({ id: 'p-exam', value: 'bozuk' }); assert.ok(A.el.toast.textContent.length > 3, 'tarih uyarısı');
  const W = A.T.haftalar(), tatil = W.find((w) => w.kind === 'ders');
  A.tikla('ptatil', { iso: tatil.iso }); assert.ok(A.T.S.plan.skip.includes(tatil.iso));
  A.tikla('go', { v: 'hafta' }); A.tikla('go', { v: 'takvim' }); A.tikla('ptatil', { iso: tatil.iso });
  for (const w of A.T.haftalar()) A.tikla('hsec', { iso: w.iso, git: '1' });
  A.tikla('hstart', { iso: A.T.haftalar()[0].iso, devam: '0' });
  for (let i = 0; i < 20 && !A.T.Z().done; i++) { A.tikla('ans', { i: '0' }); A.tikla('qnext'); }
  for (const v of A.T.VIEWS) if (v !== 'unit') A.tikla('go', { v });
  // plan başlangıcı geçmişte: telafi paneli ve günlük plan cümleleri (yetişir / sınırda / yetişmez)
  const basla = A.T.S.plan.start, eskiGun = (g) => { const d = new Date(Date.now() - g * 864e5); return d.toISOString().slice(0, 10); };
  for (const [g, dk] of [[28, '60'], [56, '5'], [21, '300']]) { A.tikla('go', { v: 'ayar' }); A.degis({ id: 'p-start', value: eskiGun(g) }); for (let i = 0; i < 7; i++) A.degis({ value: dk, dataset: { gpm: String(i) } }); for (const v of ['hafta', 'bugun', 'takvim']) A.tikla('go', { v }); }
  A.tikla('go', { v: 'ayar' }); A.degis({ id: 'p-start', value: basla });
  turDongu(A);

  // 7. Eski biçimli kayıt (tk/ts/gp/hc/dil yok)
  const eski = kopya(A.T.S); for (const k of ['tk', 'ts', 'gp', 'hc', 'dil']) delete eski[k]; eski.view = 'bugun';
  const B = kur({ [LKEY]: JSON.stringify(eski) }, null, o);
  assert.strictEqual(B.T.S.dil, 'tr', 'dili olmayan eski kayıt Türkçe açılır');
  assert.deepStrictEqual(Object.keys(B.T.S.tk.k), []); assert.strictEqual(B.T.S.gp.musaitlik.length, 7);
  assert.strictEqual(B.T.S.u.c11e.check, A.T.S.u.c11e.check, 'eski ilerleme korunur');
  if (dil === 'en') B.tikla('dil', { d: 'en' });
  for (const v of B.T.VIEWS) if (v !== 'unit') B.tikla('go', { v });
  turDongu(B);
  assert.ok(JSON.stringify(A.T.S).length < 240000, 'bulut sınırı');

  // 8. Çalışma arkadaşı ve indirme yetkisi (sahte claude)
  let kaydedilen = null, sonIstem = '';
  const sample = async (p, so) => { sonIstem = p; so.onText && so.onText({ text: 'Mer', delta: 'Mer' }); return { text: 'Merhaba **dünya** <b>x</b>' }; };
  sample.json = async (p) => { sonIstem = p; return { puan: 2, dogru: [X.model[0]], eksik: [X.model[1]], yanlis: [], ipucu: X.model[2], ornek: 'Role modeling means leaders show the behaviour.' }; };
  const claude = { use: async (c) => { if (c === 'sample') return sample; if (c === 'downloads') return { save: async (x) => { kaydedilen = x; } }; throw Object.assign(new Error('x'), { code: 'not_declared' }); } };
  const C = kur({}, claude, ops); await bekle(); await bekle();
  C.tikla('unit', { u: 'c11e', t: 'anlatim' }); C.tikla('apos', { p: '1' });
  assert.ok(C.main.innerHTML.includes('hc-soru') && !C.main.innerHTML.includes('hc-anlat'), 'soru satırı var, anlatım paneli cevaptan sonra');
  const q0 = C.T.adimSoru('c11e', 0); C.tikla('sans', { i: String((q0.a + 1) % q0.o.length) });
  assert.ok(C.main.innerHTML.includes(X.anlat) && C.main.innerHTML.includes(X.neden));
  C.el['hc-anlat'] = { value: 'Role modeling: the leader shows the new behaviour so staff copy it.' };
  C.tikla('hcanlat', { k: 'c11e-0' }); await bekle(); await bekle();
  assert.ok(C.el['hco-anlat'].innerHTML.includes('2/3') && C.el['hco-anlat'].innerHTML.includes('lang="en"'));
  assert.ok(sonIstem.includes(dil === 'en' ? 'Write to the student in English' : 'Write to the student in Turkish'), 'istem dili ' + dil);
  assert.ok(sonIstem.includes('ornek: a model answer in ENGLISH'), 'örnek cevap iki dilde de İngilizce');
  C.tikla('hcneden', { k: 'neden:' + q0.id + ':' + ((q0.a + 1) % q0.o.length) }); await bekle(); await bekle();
  assert.ok(sonIstem.includes(dil === 'en' ? 'Write in English' : 'Write in Turkish'), 'neden istemi dili');
  const nedenEl = Object.keys(C.el).find((k) => k.startsWith('hco-') && C.el[k].innerHTML.includes('Merhaba'));
  assert.ok(nedenEl && !C.el[nedenEl].innerHTML.includes('<b>x'), 'model çıktısı kaçışlı');
  assert.strictEqual(Object.values(C.T.S.hc.g)[0], 2, 'iki kullanım sayıldı');
  C.T.HCD['soru:c11e-0'] = { durum: 'hata', kod: 'rate_limited' }; C.tikla('apos', { p: '1' });
  assert.ok(C.main.innerHTML.includes('hchata') && C.main.innerHTML.includes('Biraz bekleyip') === (dil === 'tr'), 'yardım hatası ' + dil);
  delete C.T.HCD['soru:c11e-0'];
  C.tikla('go', { v: 'ayar' }); C.tikla('ics'); await bekle(); await bekle();
  assert.ok(kaydedilen && kaydedilen.filename === 'itm-plan.ics' && kaydedilen.data.includes('BEGIN:VCALENDAR'));
  // yetkisiz: hiç görünmez
  const D = kur({}, { use: async () => { throw Object.assign(new Error('x'), { code: 'not_granted' }); } }, ops); await bekle(); await bekle();
  D.tikla('unit', { u: 'c11e', t: 'anlatim' }); D.tikla('apos', { p: '1' }); assert.ok(!D.main.innerHTML.includes(X.hc));
}

await akislar('tr');
await akislar('en');                              // gerçek icerik/en dosyaları (eksik olanlar Türkçeye düşer)
await akislar('en', { kod: kodSahte, harf: true }); // her ders İngilizce: çizimde Türkçe harf kalmamalı

// 9. Dil değişimi: yerinde yeniden çizer, ekranı ve ilerlemeyi korur (anlatımın ve testin ortasında)
{
  const E = kur({}, null, { kod: kodSahte, harf: true });
  assert.strictEqual(E.T.S.dil, 'tr'); assert.ok(E.el.rail.innerHTML.includes('Bu hafta') && E.main.innerHTML.includes('Sınav tarihin kaç?'), 'Türkçe mod Türkçe çizer');
  assert.strictEqual(E.document.title, 'ITM Ders Sistemi');
  E.tikla('unit', { u: 'c11e', t: 'anlatim' });
  for (let i = 0; i < 2; i++) { E.tikla('apos', { p: String(i + 1) }); E.tikla('sans', { i: String(E.T.adimSoru('c11e', i).a) }); }
  E.tikla('apos', { p: '3' });
  assert.ok(E.main.innerHTML.includes('Adım 3 / '), 'Türkçe adım başlığı');
  const once = kopya(E.T.S), soruTr = kopya(E.T.adimSoru('c11e', 2));
  E.tikla('dil', { d: 'en' });
  const fark = (a, b) => { const x = kopya(a), y = kopya(b); delete x.dil; delete y.dil; delete x.updated; delete y.updated; return [x, y]; };
  assert.deepStrictEqual(...fark(E.T.S, once), 'anlatım ortasında dil değişimi durumu değiştirmez');
  assert.strictEqual(E.T.S.dil, 'en'); assert.strictEqual(E.document.documentElement.lang, 'en'); assert.strictEqual(E.document.title, E.T.DIL.en.title); assert.notStrictEqual(E.T.DIL.en.title, E.T.DIL.tr.title);
  assert.ok(E.main.innerHTML.includes(E.T.DIL.en['an.adimN'](3, E.T.ders('c11e').adimlar.length)) && !E.main.innerHTML.includes('Adım 3 / ') && E.el.rail.innerHTML.includes('>' + E.T.DIL.en['nav.hafta']) && !E.el.rail.innerHTML.includes('Bu hafta') && E.el.brand.innerHTML === E.T.DIL.en.brand, 'aynı adım İngilizce çizilir');
  const soruEn = E.T.adimSoru('c11e', 2); assert.strictEqual(soruEn.a, soruTr.a, 'doğru seçenek sırası dilden bağımsız'); assert.strictEqual(soruEn.id, soruTr.id);
  E.tikla('sans', { i: String(soruEn.a) }); assert.strictEqual(Object.keys(E.T.S.u.c11e.adim).length, 3, 'İngilizce modda verilen cevap aynı ilerlemeye yazılır');
  E.tikla('dil', { d: 'tr' }); assert.strictEqual(Object.keys(E.T.S.u.c11e.adim).length, 3); assert.ok(E.main.innerHTML.includes('Adım 3 / ') && E.document.documentElement.lang === 'tr');
  // test ortasında
  E.tikla('tab', { t: 'check' }); E.tikla('startquiz', { k: 'check' });
  for (let i = 0; i < 3; i++) { const z = E.T.Z(); E.tikla('ans', { i: String(z.qs[z.i].a) }); E.tikla('qnext'); }
  { const z = E.T.Z(); E.tikla('ans', { i: String(z.qs[z.i].a) }); }
  const zOnce = kopya(E.T.Z()), sOnce = kopya(E.T.S); assert.ok(E.main.innerHTML.includes('Soru 4 / 8'));
  E.tikla('dil', { d: 'en' });
  assert.deepStrictEqual(kopya(E.T.Z()), zOnce, 'test ortasında dil değişimi soruları ve cevapları korur');
  assert.deepStrictEqual(...fark(E.T.S, sOnce)); assert.ok(E.main.innerHTML.includes(E.T.DIL.en['q.soruN'](4, 8)) && !E.main.innerHTML.includes('Soru 4 / 8') && E.T.S.view === 'unit' && E.T.S.tab === 'check');
  E.tikla('dil', { d: 'en' }); assert.deepStrictEqual(kopya(E.T.Z()), zOnce, 'aynı dile basmak bir şey değiştirmez');
  E.tikla('qnext'); for (let i = 4; i < 8; i++) { const z = E.T.Z(); E.tikla('ans', { i: String(z.qs[z.i].a) }); if (i === 5) E.tikla('dil', { d: 'tr' }); if (i === 6) E.tikla('dil', { d: 'en' }); E.tikla('qnext'); }
  assert.ok(E.T.Z().done && E.T.S.u.c11e.check === 8, 'dil değişimleriyle biten test tam puanı yazar');
  // kalıcılık ve onarım
  assert.strictEqual(JSON.parse(E.depo[LKEY]).dil, 'en', 'dil kaydedilir');
  const F = kur(E.depo, null, { kod: kodSahte, harf: true });
  assert.strictEqual(F.T.S.dil, 'en'); assert.strictEqual(F.document.documentElement.lang, 'en'); assert.strictEqual(F.T.S.u.c11e.check, 8);
  for (const kotu of ['xx', null, 5, 'EN', {}]) assert.strictEqual(F.T.normalize({ dil: kotu }).dil, 'tr', 'bozuk dil Türkçeye onarılır');
  assert.strictEqual(F.T.normalize({ dil: 'en' }).dil, 'en');
  F.tikla('go', { v: 'ayar' }); F.tikla('rsor'); F.tikla('revet'); assert.strictEqual(F.T.S.dil, 'en', 'sıfırlama dili korur');
  // iki sözlük aynı anahtarlara ve aynı türlere sahip
  const D = F.T.DIL; assert.deepStrictEqual(Object.keys(D.en).sort(), Object.keys(D.tr).sort(), 'sözlük anahtarları eşit');
  for (const k of Object.keys(D.tr)) { assert.strictEqual(typeof D.en[k], typeof D.tr[k], 'tür: ' + k); if (Array.isArray(D.tr[k])) assert.strictEqual(D.en[k].length, D.tr[k].length, 'dizi boyu: ' + k); }
  for (const k of Object.keys(D.en)) { const v = D.en[k], s = typeof v === 'function' ? String(v) : JSON.stringify(v); assert.ok(!/[ğĞşŞıİ—]|mock/i.test(s), 'İngilizce metin: ' + k); }
}

// 10. İngilizce dersler eksik ya da bozuksa: eksik ders ve bölüm Türkçesine düşer, sayfa kırılmaz
{
  const G = kur({}, null, { kod: kodEnsiz, dil: 'en' });
  assert.strictEqual(G.T.ders('c1a').ad, 'Only this one', 'var olan alan İngilizce');
  assert.strictEqual(G.T.ders('c1a').adimlar.length, G.T.DERSLER.lessons.c1a.adimlar.length, 'biçimi tutmayan alan Türkçeden gelir');
  assert.strictEqual(G.T.ders('c1b'), G.T.DERSLER.lessons.c1b, 'bozuk ders Türkçeye düşer');
  assert.strictEqual(G.T.ders('c2a'), G.T.DERSLER.lessons.c2a, 'eksik ders Türkçeye düşer'); assert.strictEqual(G.T.chBilgi(1), G.T.DERSLER.chapters[1]);
  for (const v of G.T.VIEWS) if (v !== 'unit' && v !== 'kontrol') G.tikla('go', { v });
  for (const u of ['c1a', 'c1b', 'c2a']) { for (const t of G.T.TABS) G.tikla('unit', { u, t }); G.tikla('unit', { u, t: 'anlatim' }); for (let p = 0; p <= G.T.ders(u).adimlar.length + 1; p++) G.tikla('apos', { p: String(p) }); }
  G.tikla('dil', { d: 'tr' }); assert.strictEqual(G.T.ders('c1a'), G.T.DERSLER.lessons.c1a, 'Türkçe modda Türkçe ders');
}
console.log('TAMAM');
