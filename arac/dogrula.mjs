// Ders içeriği doğrulayıcı. Kullanım: node arac/dogrula.mjs A   (veya: node arac/dogrula.mjs A B C D E)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hedef = process.argv.slice(2).filter(Boolean);
if (!hedef.length) { console.error('Paket harfi ver: A B C D E'); process.exit(2); }

const strip = (s) => String(s).replace(/<[^>]+>/g, ' ');
const kelime = (s) => strip(s).split(/\s+/).filter(Boolean).length;
const IZIN = new Set(['p', 'b', 'i', 'ul', 'ol', 'li', 'br']);
const SATIR_IZIN = new Set(['b', 'i']);

function denetle(paketAd) {
  const hatalar = [];
  const uyarilar = [];
  const hata = (m) => hatalar.push(m);
  const paket = JSON.parse(fs.readFileSync(path.join(ROOT, 'kaynak', `paket-${paketAd}.json`), 'utf8'));
  const dosya = path.join(ROOT, 'icerik', `dersler-${paketAd}.json`);
  if (!fs.existsSync(dosya)) return { hatalar: [`dosya yok: ${dosya}`], uyarilar };
  let v;
  try { v = JSON.parse(fs.readFileSync(dosya, 'utf8')); } catch (e) { return { hatalar: [`JSON bozuk: ${e.message}`], uyarilar }; }

  const metinDenet = (etiket, s, { satir = false, tr = true } = {}) => {
    if (typeof s !== 'string' || !s.trim()) { hata(`${etiket}: boş`); return; }
    for (const m of s.matchAll(/<\/?([a-zA-Z0-9]+)/g)) {
      const t = m[1].toLowerCase();
      if (!(satir ? SATIR_IZIN : IZIN).has(t)) hata(`${etiket}: izinsiz etiket <${t}>`);
    }
    if (/on\w+\s*=|javascript:|https?:\/\//i.test(s)) hata(`${etiket}: yasak içerik (bağlantı veya olay özniteliği)`);
    if (/\bmock\s*Q?\d*/i.test(s)) hata(`${etiket}: "mock" ifadesi kullanılamaz`);
    if (tr && s.includes('—')) hata(`${etiket}: uzun tire (—) kullanma`);
    if (tr) {
      const harf = (strip(s).match(/\p{L}/gu) || []).length;
      const trh = (strip(s).match(/[çğıöşüÇĞİÖŞÜ]/g) || []).length;
      if (harf > 60 && trh / harf < 0.03) hata(`${etiket}: Türkçe karakter oranı çok düşük (ASCII Türkçe ya da İngilizce olabilir)`);
    }
  };
  const altSinir = (etiket, s, n) => { if (kelime(s) < n) hata(`${etiket}: en az ${n} kelime olmalı, ${kelime(s)} var`); };

  if (!Array.isArray(v.chapters)) hata('chapters dizi değil');
  if (!Array.isArray(v.lessons)) hata('lessons dizi değil');
  if (hatalar.length) return { hatalar, uyarilar };

  const chs = v.chapters.map((c) => c.ch).sort((a, b) => a - b).join(',');
  if (chs !== [...paket.chapters].sort((a, b) => a - b).join(',')) hata(`chapters eşleşmiyor: ${chs}`);
  for (const c of v.chapters) {
    const e = `ch${c.ch}`;
    metinDenet(`${e}.ad`, c.ad, { satir: true });
    metinDenet(`${e}.giris`, c.giris); altSinir(`${e}.giris`, c.giris, 45);
    metinDenet(`${e}.baglanti`, c.baglanti); altSinir(`${e}.baglanti`, c.baglanti, 15);
    metinDenet(`${e}.sinav`, c.sinav); altSinir(`${e}.sinav`, c.sinav, 12);
    if (!c.okul || typeof c.okul !== 'object') { hata(`${e}.okul yok`); continue; }
    metinDenet(`${e}.okul.once`, c.okul.once); altSinir(`${e}.okul.once`, c.okul.once, 12);
    metinDenet(`${e}.okul.sonra`, c.okul.sonra); altSinir(`${e}.okul.sonra`, c.okul.sonra, 12);
    if (!Array.isArray(c.okul.odak) || c.okul.odak.length < 3 || c.okul.odak.length > 5) hata(`${e}.okul.odak 3-5 madde olmalı`);
    else c.okul.odak.forEach((s, i) => metinDenet(`${e}.okul.odak[${i}]`, s, { satir: true }));
  }

  const beklenen = new Map(paket.units.map((u) => [u.id, u]));
  const gorulen = new Set();
  const bankaSorular = new Set(paket.bank.map((b) => b.q.trim().toLowerCase()));
  const adimSorular = new Set();

  for (const l of v.lessons) {
    const u = beklenen.get(l.id);
    if (!u) { hata(`bilinmeyen ders id: ${l.id}`); continue; }
    if (gorulen.has(l.id)) hata(`${l.id}: tekrar`);
    gorulen.add(l.id);
    const e = l.id;
    if (!Number.isInteger(l.sure) || l.sure < 10 || l.sure > 50) hata(`${e}.sure 10-50 tam sayı olmalı`);
    metinDenet(`${e}.ad`, l.ad, { satir: true });
    metinDenet(`${e}.neden`, l.neden); altSinir(`${e}.neden`, l.neden, 25);
    if (!Array.isArray(l.hedefler) || l.hedefler.length < 3 || l.hedefler.length > 5) hata(`${e}.hedefler 3-5 olmalı`);
    else l.hedefler.forEach((s, i) => { metinDenet(`${e}.hedefler[${i}]`, s, { satir: true }); altSinir(`${e}.hedefler[${i}]`, s, 5); });
    metinDenet(`${e}.sinavda`, l.sinavda); altSinir(`${e}.sinavda`, l.sinavda, 15);
    metinDenet(`${e}.aklinda`, l.aklinda, { tr: false });
    if (!Array.isArray(l.ozet) || l.ozet.length < 4 || l.ozet.length > 9) hata(`${e}.ozet 4-9 olmalı`);
    else l.ozet.forEach((s, i) => metinDenet(`${e}.ozet[${i}]`, s, { satir: true }));
    if (!Array.isArray(l.tuzaklar) || l.tuzaklar.length < 2) hata(`${e}.tuzaklar en az 2 olmalı`);
    else l.tuzaklar.forEach((t, i) => { metinDenet(`${e}.tuzaklar[${i}].yanlis`, t.yanlis, { satir: true }); metinDenet(`${e}.tuzaklar[${i}].dogru`, t.dogru, { satir: true }); });

    if (!Array.isArray(l.adimlar) || l.adimlar.length < 3 || l.adimlar.length > 10) { hata(`${e}.adimlar 3-10 olmalı`); continue; }
    const seg = new Set();
    const ter = new Set();
    const terimAdlari = new Set(u.terms.map((t) => t[0]));
    l.adimlar.forEach((a, i) => {
      const s = `${e}.adim[${i}]`;
      metinDenet(`${s}.baslik`, a.baslik, { satir: true });
      metinDenet(`${s}.anlatim`, a.anlatim); altSinir(`${s}.anlatim`, a.anlatim, 80);
      if (!/<p>/.test(a.anlatim || '')) hata(`${s}.anlatim <p> ile yazılmalı`);
      metinDenet(`${s}.ornek`, a.ornek); altSinir(`${s}.ornek`, a.ornek, 22);
      if (!Array.isArray(a.kaynak) || !a.kaynak.length) hata(`${s}.kaynak boş`);
      else a.kaynak.forEach((k) => { if (!u.segments.some((x) => x.i === k)) hata(`${s}.kaynak geçersiz: ${k}`); else seg.add(k); });
      if (!Array.isArray(a.terimler)) hata(`${s}.terimler dizi değil`);
      else a.terimler.forEach((t) => { if (!terimAdlari.has(t)) hata(`${s}.terimler: "${t}" birim terim listesinde yok`); else ter.add(t); });
      const q = a.soru;
      if (!q || typeof q !== 'object') { hata(`${s}.soru yok`); return; }
      metinDenet(`${s}.soru.q`, q.q, { tr: false });
      metinDenet(`${s}.soru.x`, q.x); altSinir(`${s}.soru.x`, q.x, 12);
      if (!Array.isArray(q.o) || q.o.length !== 4) { hata(`${s}.soru.o tam 4 seçenek olmalı`); return; }
      if (new Set(q.o.map((x) => x.trim().toLowerCase())).size !== 4) hata(`${s}.soru.o tekrar eden seçenek`);
      q.o.forEach((x, k) => metinDenet(`${s}.soru.o[${k}]`, x, { satir: true, tr: false }));
      if (/all of the above|none of the above/i.test(q.o.join(' '))) hata(`${s}.soru: all/none of the above kullanma`);
      const enUzunDiger = Math.max(...q.o.slice(1).map((x) => x.length));
      if (q.o[0].length > 1.6 * enUzunDiger + 10) hata(`${s}.soru: doğru seçenek diğerlerinden belirgin uzun (ipucu oluyor)`);
      const nq = String(q.q).trim().toLowerCase();
      if (bankaSorular.has(nq)) hata(`${s}.soru: bankadaki soruyla aynı`);
      if (adimSorular.has(nq)) hata(`${s}.soru: başka adımla aynı`);
      adimSorular.add(nq);
    });
    for (const x of u.segments) if (!seg.has(x.i)) hata(`${e}: kaynak bölüm kapsanmadı -> #${x.i} "${x.baslik}"`);
    for (const t of terimAdlari) if (!ter.has(t)) hata(`${e}: terim hiçbir adımda yok -> "${t}"`);
  }
  for (const id of beklenen.keys()) if (!gorulen.has(id)) hata(`ders eksik: ${id}`);
  return { hatalar, uyarilar };
}

let kotu = 0;
for (const p of hedef) {
  const { hatalar } = denetle(p);
  if (hatalar.length) {
    kotu += hatalar.length;
    console.log(`PAKET ${p}: ${hatalar.length} hata`);
    hatalar.slice(0, 80).forEach((h) => console.log('  - ' + h));
    if (hatalar.length > 80) console.log(`  ... ve ${hatalar.length - 80} hata daha`);
  } else console.log(`PAKET ${p}: TAMAM`);
}
process.exit(kotu ? 1 : 0);
