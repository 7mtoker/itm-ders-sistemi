// İngilizce ders dosyası, Türkçe aslıyla aynı iskelette mi? Kullanım: node arac/dogrula-en.mjs A [B ...]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const oku = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const esit = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const duz = (s) => String(s).replace(/<[^>]+>/g, '');
const etiketler = (s) => (String(s).match(/<\/?([a-z0-9]+)/gi) || []).map((x) => x.replace(/[</]/g, '').toLowerCase());
const UZUN = new Set(['p', 'b', 'i', 'ul', 'ol', 'li', 'br']);
let toplam = 0;

for (const P of process.argv.slice(2)) {
  const h = [];
  const trF = `icerik/dersler-${P}.json`, enF = `icerik/en/dersler-${P}.json`;
  if (!fs.existsSync(path.join(ROOT, enF))) { console.log(`PAKET ${P}: dosya yok (${enF})`); toplam++; continue; }
  let tr, en;
  try { tr = oku(trF); en = oku(enF); } catch (e) { console.log(`PAKET ${P}: JSON okunamadı: ${e.message}`); toplam++; continue; }

  // Her metin alanı: dolu, Türkçe harf yok, yasak işaret yok, uzunluk aslına yakın, aynı tür etiketler.
  const metin = (yol, a, b) => {
    if (typeof b !== 'string' || !b.trim()) return h.push(`${yol}: boş ya da metin değil`);
    if (/[ğĞşŞıİ]/.test(b)) h.push(`${yol}: Türkçe harf var (çevrilmemiş olabilir)`);
    if (/—/.test(b)) h.push(`${yol}: em dash var`);
    if (/\bmock\b/i.test(b)) h.push(`${yol}: "mock" geçiyor`);
    const bad = etiketler(b).filter((t) => !UZUN.has(t));
    if (bad.length) h.push(`${yol}: izinsiz etiket ${[...new Set(bad)].join(',')}`);
    const la = duz(a).length, lb = duz(b).length;
    if (la >= 60 && (lb < la * 0.55 || lb > la * 1.9)) h.push(`${yol}: uzunluk aslından çok farklı (${la} → ${lb})`);
  };
  const liste = (yol, a, b) => {
    if (!Array.isArray(b) || b.length !== a.length) return h.push(`${yol}: eleman sayısı farklı (${a.length} → ${Array.isArray(b) ? b.length : 'yok'})`);
    a.forEach((x, i) => metin(`${yol}[${i}]`, x, b[i]));
  };

  if (!esit(tr.chapters.map((c) => c.ch), (en.chapters || []).map((c) => c.ch))) h.push('chapters: ch listesi farklı');
  else tr.chapters.forEach((c, i) => {
    const e = en.chapters[i], y = `ch${c.ch}`;
    for (const k of ['ad', 'giris', 'baglanti', 'sinav']) metin(`${y}.${k}`, c[k], e[k]);
    if (!e.okul) return h.push(`${y}.okul: yok`);
    metin(`${y}.okul.once`, c.okul.once, e.okul.once); liste(`${y}.okul.odak`, c.okul.odak, e.okul.odak); metin(`${y}.okul.sonra`, c.okul.sonra, e.okul.sonra);
  });

  if (!esit(tr.lessons.map((l) => l.id), (en.lessons || []).map((l) => l.id))) h.push('lessons: id listesi farklı');
  else tr.lessons.forEach((l, i) => {
    const e = en.lessons[i], y = l.id;
    if (e.sure !== l.sure) h.push(`${y}.sure: farklı`);
    for (const k of ['ad', 'neden', 'aklinda', 'sinavda']) metin(`${y}.${k}`, l[k], e[k]);
    liste(`${y}.hedefler`, l.hedefler, e.hedefler); liste(`${y}.ozet`, l.ozet, e.ozet);
    if (!Array.isArray(e.tuzaklar) || e.tuzaklar.length !== l.tuzaklar.length) h.push(`${y}.tuzaklar: sayı farklı`);
    else l.tuzaklar.forEach((t, j) => { metin(`${y}.tuzaklar[${j}].yanlis`, t.yanlis, e.tuzaklar[j].yanlis); metin(`${y}.tuzaklar[${j}].dogru`, t.dogru, e.tuzaklar[j].dogru); });
    if (!Array.isArray(e.adimlar) || e.adimlar.length !== l.adimlar.length) return h.push(`${y}.adimlar: sayı farklı`);
    l.adimlar.forEach((a, j) => {
      const b = e.adimlar[j], z = `${y}.adim[${j}]`;
      for (const k of ['baslik', 'anlatim', 'ornek']) metin(`${z}.${k}`, a[k], b[k]);
      if (!esit(a.kaynak, b.kaynak)) h.push(`${z}.kaynak: aslıyla aynı olmalı`);
      if (!esit(a.terimler, b.terimler)) h.push(`${z}.terimler: aslıyla aynı olmalı`);
      if (!b.soru || b.soru.q !== a.soru.q || !esit(a.soru.o, b.soru.o)) h.push(`${z}.soru: q ve o aslıyla birebir aynı olmalı`);
      else metin(`${z}.soru.x`, a.soru.x, b.soru.x);
    });
  });

  console.log(h.length ? `PAKET ${P}: ${h.length} hata\n  - ${h.slice(0, 40).join('\n  - ')}` : `PAKET ${P}: TAMAM`);
  toplam += h.length;
}
process.exit(toplam ? 1 : 0);
