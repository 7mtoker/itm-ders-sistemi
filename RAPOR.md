# ITM Ders Sistemi: rapor (2026-11-10)

Durum: sistem çalışıyor, yerelde test edildi, **henüz yayınlanmadı**.
Açmak için: `ITM-Ders-Sistemi.html` dosyasına çift tıkla.

## Çalışma düzeni

- Fable 5.2 (bu chat): önceki chatin okunması, ön araştırma, yeni özelliklerin tasarımı ve şartnameleri, taşeron çıktılarının denetimi, tarayıcı testi, tekrar motorundaki yük düzeltmesi.
- Opus 5.5 medium taşeronlar (11 adet): bütün kod ve bütün ders metni.

## Önceki chatten devralınan

Motor ve arayüz iskeleti vardı, tarayıcıda hiç açılmamıştı. 28 konunun Türkçe anlatımı yoktu, soru bankası denetimi doğrulanmamıştı, okul takvimi bulunamamıştı.

## Ön araştırma

- AUAS resmi takvimi: 2. dönem 9 Kasım 2026 – 29 Ocak 2027, yılbaşı tatili 21 Aralık – 3 Ocak. Plan varsayılanı buna uyuyor.
- Kesin sınav günü resmi sayfada yok. rooster.hva.nl'den bakıp sitedeki sarı kutuya girmen gerekiyor; o zamana kadar plan 25 Ocak haftasını varsayar.
- Kaynak: https://www.amsterdamuas.com/study/international-admissions/academic-calendar

## Tamamlananlar

| İş | Sonuç |
|---|---|
| Türkçe ders anlatımı | 28 konu, 173 adım, her adımda örnek ve İngilizce sınav sorusu. Beş paket de doğrulayıcıdan geçti. |
| Soru bankası denetimi | 11 bulgudan 5'i onaylandı ve uygulandı, 6'sı reddedildi. Ayrıntı: `denetim/banka-karar.md` |
| Bugün ekranı (yeni) | Aralıklı tekrar: terimleri ve yanlış yaptığın soruları sınav gününe göre zamanlar. Günün görevleri ve ilk 3 öneri de burada. |
| Teşhis ekranı (yeni) | Hangi iki kavramı karıştırdığın, "emin olup yanlış" yaptığın konular, bölüm ve düzeye göre doğru oranı. Öneriler tahmini sınav puanına göre sıralı. |
| Günlük plan (yeni) | Haftalık işi günlere böler, geride kalınca yetişir mi hesabı yapar, planı telefon takvimine aktarır (.ics). |
| Çalışma arkadaşı (yeni) | Adımı kendi cümlenle anlatırsın, Claude kursun notuna göre değerlendirir. "Başka türlü anlat", "Neden yanlış?" ve "Soru sor" da var. |
| Küçük ekler | Testlerde "Emin değilim" düğmesi (X tuşu), İngilizce terimler için "Dinle" düğmesi. |

## Doğrulama

- Altı otomatik test geçiyor: plan, tekrar, teşhis, günlük, çalışma arkadaşı, duman (bütün ekranları ve akışları süren test).
- Tarayıcıda kendim sürdüm: bir dersi baştan sona, 8 soruluk kontrol testi, Bugün kartları, Teşhis, ayarlar, takvim dışa aktarma. Konsol hatası yok.
- Telefon genişliği (375 px) ve açık/koyu tema: sekiz ekranda yatay taşma yok.

## Doğrulanmayanlar

- **Çalışma arkadaşı canlı denenmedi.** Yalnızca claude.ai yapıtı olarak yayınlanınca çalışır; yerelde sahte yanıtla test edildi. Yerel dosyada bu bölüm hiç görünmez.
- **Hesaba kayıt (bulut eşitleme)** de yalnızca yayınlanınca çalışır; yerelde ilerleme tarayıcıda saklanır.
- "Dinle" düğmesinin sesi kulakla kontrol edilmedi.
- "Bu farkı çalış" alıştırması tarayıcıda değil, yalnızca duman testinde sürüldü.
- B paketinin taşeronu son okuma turunu atladı. Ben bir dersini (karar verme) okudum, sorun görmedim; geri kalan beş dersi satır satır okumadım.

## İçerik taşeronlarının kaynakta işaretlediği noktalar

Kaynak notun kendisinde belirsiz ya da tutarsız görünen yerler. Anlatımlar kaynağa sadık kaldı; hocaya sormaya değer:

- c10a: not "storming'e geri kayar" diyor, bir alıştırma sorusunun cevap anahtarı bununla çelişiyor.
- c11a: vaka %10 proje zamanı diyor, not %15-20.
- c9a: not, GLOBE boyutlarının çoğu Hofstede ile örtüşür diyor; iki boyut Hofstede'de yok.
- c1b: staff manager örnekleri notta ve sözlükte farklı.
- c4b, c7a, c7b, c8b: bazı terimler kaynakta yalnızca adıyla geçiyor, tanımı yok.

## Sıradaki adım

Yapıt olarak yayınlamak (`db`, `user`, `sample`, `downloads` yetkileriyle). Yayınlanınca çalışma arkadaşı ve hesaba kayıt devreye girer, ikisini de orada denemek gerekir.
