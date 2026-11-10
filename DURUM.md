# ITM Ders Sistemi: durum (2026-11-10)

Çalışıyor, yerelde test edildi. Yayınlanmadı. Ayrıntı: `RAPOR.md`.

## Bitti
- 28 konunun Türkçe anlatımı: `icerik/dersler-A..E.json`, hepsi `node arac/dogrula.mjs` ile TAMAM.
- Banka denetimi: `denetim/banka-onayli.json` (5 düzeltme), kararlar `denetim/banka-karar.md`.
- Yeni modüller: `src/tekrar.js`, `src/teshis.js`, `src/gunluk.js`, `src/hoca.js`, hepsi `src/app.js`'e bağlı.
- Testler: `node test/<plan|tekrar|teshis|gunluk|hoca|duman>.test.mjs`, altısı da TAMAM.
- Derleme: `node arac/derle.mjs` → `ITM-Ders-Sistemi.html` (yaklaşık 1 MB).
- Tarayıcı testi: `Desktop\RADAR\.claude\launch.json` içindeki `itm` sunucusu (port 8177).

## Kalan
1. Yapıt olarak yayınla: `capabilities: {db:{}, user:{}, sample:{}, downloads:true}`.
2. Yayında dene: çalışma arkadaşı (sample), hesaba kayıt (db), takvim dışa aktarma (downloads).
3. Kesin sınav tarihi: rooster.hva.nl, kullanıcı girecek.
