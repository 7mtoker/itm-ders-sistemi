// Duman testi: derlenmiş sayfanın betiğini sahte DOM ile çalıştırır, bütün ekranları çizer ve gerçekçi akışları sürer.
import fs from 'node:fs'; import vm from 'node:vm'; import assert from 'node:assert';
const html = fs.readFileSync('ITM-Ders-Sistemi.html', 'utf8');
const kod = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
const AC = ';globalThis.__T={get S(){return S},normalize,adimSoru,haftalar,bugunNo,get BG(){return BG},get ONERI(){return ONERI},get icsMetin(){return icsMetin},get icsMesaj(){return icsMesaj},Z,VIEWS,TABS,HCD};';
const bekle = () => new Promise((r) => setTimeout(r, 0));

function kur(depo, claude) {
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
  vm.createContext(ctx); vm.runInContext(kod + AC, ctx);
  const T = ctx.__T, main = el.main;
  const kontrol = (ne) => {
    for (const id of ['main', 'pills', 'rail']) {
      const s = el[id].innerHTML;
      for (const kotu of ['undefined', 'NaN', '[object Object]']) assert.ok(!s.includes(kotu), `${ne}: #${id} içinde ${kotu}: …${s.slice(Math.max(0, s.indexOf(kotu) - 120), s.indexOf(kotu) + 40)}`);
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
  return { T, el, main, tikla, degis, yaz, uyari, depo };
}
const turDongu = (A) => { const S = A.T.S; const rt = A.T.normalize(JSON.parse(JSON.stringify(S))); assert.deepStrictEqual(JSON.parse(JSON.stringify(rt)), JSON.parse(JSON.stringify(S)), 'normalize tur dönüşü'); };

// 1. Boş durum: bütün ekranlar ve konu sekmeleri
const A = kur({});
for (const v of A.T.VIEWS) if (v !== 'unit' && v !== 'kontrol') A.tikla('go', { v });
const uids = Object.keys(JSON.parse(JSON.stringify(A.T.S.u)));
for (const u of uids) for (const t of A.T.TABS) A.tikla('unit', { u, t });
assert.strictEqual(A.uyari.filter((x) => x.includes('DUZELT')).length, 0, 'düzeltmeler uygulanmalı: ' + A.uyari);

// 2. Anlatım adımları: bazıları yanlış
A.tikla('unit', { u: 'c11e', t: 'anlatim' });
const n = adimSay();
function adimSay() { let i = 0; while (true) { try { A.T.adimSoru('c11e', i); i++; } catch (e) { return i; } } }
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
turDongu(A);

// 4. Bugün: terim ve soru kartları (soru kartlarını bugüne çek)
for (const k of Object.keys(A.T.S.tk.k)) A.T.S.tk.k[k][0] = A.T.bugunNo();
A.tikla('go', { v: 'bugun' });
let tur = 0, t = 0, s = 0;
while (A.T.BG.cur && tur++ < 40) {
  const c = A.T.BG.cur;
  if (c.tur === 't') { t++; A.tikla('bgac'); assert.ok(A.main.innerHTML.includes('Bildim')); A.tikla('bgnot', { n: String(tur % 3) }); }
  else { s++; if (tur % 2) A.tikla('emin', { q: c.q.id }); A.tikla('ans', { i: String(tur % 2 ? c.q.a : (c.q.a + 1) % c.q.o.length) }); A.tikla('bgnext'); }
}
assert.ok(t > 0 && s > 0, `terim ${t}, soru ${s} kartı görülmeli`);
assert.ok(A.main.innerHTML.includes('tekrarı bitti'));

// 5. Fark çalışması
A.T.S.ts.c['c11e|Role modeling|Training'] = [3, Date.now()];
A.tikla('go', { v: 'bugun' });
const ki = A.T.ONERI.findIndex((o) => o.tip === 'karisma'); assert.ok(ki >= 0, 'karışma önerisi');
A.tikla('kars', { i: String(ki) }); assert.ok(A.T.S.z.kars && A.T.S.z.kars.qs.length > 0);
while (!A.T.S.z.kars.done) { const z = A.T.S.z.kars; A.tikla('ans', { i: String(z.qs[z.i].a) }); A.tikla('qnext'); }
A.tikla('karsbit'); assert.ok(!A.T.S.z.kars);
A.tikla('go', { v: 'teshis' }); assert.ok(A.main.innerHTML.includes('Emin, yanlış'));

// 6. Ayarlar, takvim dosyası, tatil haftası
A.tikla('go', { v: 'ayar' });
A.degis({ value: '90', dataset: { gpm: '0' } }); assert.strictEqual(A.T.S.gp.musaitlik[0], 90);
A.degis({ value: '2', dataset: { gpders: '1' } }); assert.strictEqual(A.T.S.gp.dersGunu, 2);
A.tikla('ics'); await bekle(); await bekle();
assert.ok(A.T.icsMetin.startsWith('BEGIN:VCALENDAR') && A.main.innerHTML.includes('icsmetin'), 'ics metni gösterilir');
const W = A.T.haftalar(), tatil = W.find((w) => w.kind === 'ders');
A.tikla('ptatil', { iso: tatil.iso }); assert.ok(A.T.S.plan.skip.includes(tatil.iso));
A.tikla('go', { v: 'hafta' }); A.tikla('go', { v: 'takvim' }); A.tikla('ptatil', { iso: tatil.iso });
A.tikla('hstart', { iso: A.T.haftalar()[0].iso, devam: '0' });
for (let i = 0; i < 20 && !A.T.Z().done; i++) { const z = A.T.Z(); A.tikla('ans', { i: '0' }); A.tikla('qnext'); }
for (const v of A.T.VIEWS) if (v !== 'unit') A.tikla('go', { v });
turDongu(A);

// 7. Eski biçimli kayıt (tk/ts/gp/hc yok)
const eski = JSON.parse(JSON.stringify(A.T.S)); for (const k of ['tk', 'ts', 'gp', 'hc']) delete eski[k]; eski.view = 'bugun';
const B = kur({ 'itmders.v1': JSON.stringify(eski) });
assert.deepStrictEqual(Object.keys(B.T.S.tk.k), []); assert.strictEqual(B.T.S.gp.musaitlik.length, 7);
assert.strictEqual(B.T.S.u.c11e.check, A.T.S.u.c11e.check, 'eski ilerleme korunur');
for (const v of B.T.VIEWS) if (v !== 'unit') B.tikla('go', { v });
turDongu(B);
assert.ok(JSON.stringify(A.T.S).length < 240000, 'bulut sınırı');

// 8. Çalışma arkadaşı ve indirme yetkisi (sahte claude)
let kaydedilen = null;
const sample = async (p, o) => { o.onText && o.onText({ text: 'Mer', delta: 'Mer' }); return { text: 'Merhaba **dünya** <b>x</b>' }; };
sample.json = async () => ({ puan: 2, dogru: ['Tanım doğru'], eksik: ['Örnek yok'], yanlis: [], ipucu: 'Bir örnek ekle.', ornek: 'Role modeling means leaders show the behaviour.' });
const claude = { use: async (c) => { if (c === 'sample') return sample; if (c === 'downloads') return { save: async (x) => { kaydedilen = x; } }; throw Object.assign(new Error('x'), { code: 'not_declared' }); } };
const C = kur({}, claude); await bekle(); await bekle();
C.tikla('unit', { u: 'c11e', t: 'anlatim' }); C.tikla('apos', { p: '1' });
assert.ok(C.main.innerHTML.includes('hc-soru') && !C.main.innerHTML.includes('hc-anlat'), 'soru satırı var, anlatım paneli cevaptan sonra');
const q0 = C.T.adimSoru('c11e', 0); C.tikla('sans', { i: String((q0.a + 1) % q0.o.length) });
assert.ok(C.main.innerHTML.includes('Kendi cümlenle anlat') && C.main.innerHTML.includes('Neden yanlış?'));
C.el['hc-anlat'] = { value: 'Role modeling: the leader shows the new behaviour so staff copy it.' };
C.tikla('hcanlat', { k: 'c11e-0' }); await bekle(); await bekle();
assert.ok(C.el['hco-anlat'].innerHTML.includes('2/3') && C.el['hco-anlat'].innerHTML.includes('lang="en"'));
C.tikla('hcneden', { k: 'neden:' + q0.id + ':' + ((q0.a + 1) % q0.o.length) }); await bekle(); await bekle();
const nedenEl = Object.keys(C.el).find((k) => k.startsWith('hco-') && C.el[k].innerHTML.includes('Merhaba'));
assert.ok(nedenEl && !C.el[nedenEl].innerHTML.includes('<b>x'), 'model çıktısı kaçışlı');
assert.strictEqual(Object.values(C.T.S.hc.g)[0], 2, 'iki kullanım sayıldı');
C.tikla('go', { v: 'ayar' }); C.tikla('ics'); await bekle(); await bekle();
assert.ok(kaydedilen && kaydedilen.filename === 'itm-plan.ics' && kaydedilen.data.includes('BEGIN:VCALENDAR'));
// yetkisiz: hiç görünmez
const D = kur({}, { use: async () => { throw Object.assign(new Error('x'), { code: 'not_granted' }); } }); await bekle(); await bekle();
D.tikla('unit', { u: 'c11e', t: 'anlatim' }); D.tikla('apos', { p: '1' }); assert.ok(!D.main.innerHTML.includes('Çalışma arkadaşı'));
console.log('TAMAM');
