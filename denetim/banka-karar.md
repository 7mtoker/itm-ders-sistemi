# Banka bulgulari: ikinci denetci kararlari

Not: Ithal set sorularinda dogru cevap o[0] degil `a` alaninda; `index` degerleri sakli siradaki gercek konumdur.

## banka-bulgular.json

- k11b-1 (two_defensible): **degistir**. Sorun gercek, c11d notu Kotter 5. adim icin "Old procedures or forms scrapped; staff empowered" diyor ve kok metin model adi vermiyor. Ama o[4]'u silmek yerine kok metne "Schein's culture change process" eklemek daha az mudahale; c11e tuzagi ("read which model the question names") ile ve kardes soru k11b-0 ile tutarli, o[4] bilincli celdirici olarak kalir.
- k11b-1 (explanation_wrong): **degistir**. Sorun gercek ama ayni kok metin duzeltmesiyle cozuluyor; Schein adi eklenince "The question is about Schein" cumlesi dogru olur, x degismez. Onerilen x degisikligi kabul edilseydi o[4] iki dogru cevap sorunu kalirdi, bu yuzden tek duzeltme kok metinde.
- rcase-3-text-0 (FreshLoop, nokta eksik): **ret**. Eksik nokta gercek ve onerilen metin sadece nokta ekliyor, ama alan "text" bu dosyanin q/o/x semasinda yok ve cevaplari etkilemiyor; ayri bir yazim duzeltmesi olarak yapilabilir.
- rcase-7-text-3 (NorthSea, nokta eksik): **ret**. Ayni gerekce: gercek ama zararsiz bir noktalama hatasi, q/o/x kapsami disinda.

## mock-harita.json issues

- 1-2 (ve 2-7): **ret**. c2a tuzagi "conscientiousness, not organizational commitment" diyerek anahtarla celisiyor, ama kok metin "work attitude" soruyor ve c2b'ye gore seceneklerden tek is tutumu organizational commitment; tek savunulabilir cevap var ve x notlara gore dogru. Duzeltmek soruyu tamamen yeniden yazmak olur; asil uyumsuzluk tuzak notunda, insan karari gerek.
- 2-21 (ve 3-24): **ret**. Long-term orientation notlarda yok (c9a dort boyut sayiyor) ama diger uc secenek senaryoya hic uymuyor, tek cevap duruyor; eksik not satirinda, q/o/x ile notlara dayali bir duzeltme yok.
- 2-29 (ve 3-37, 4-37): **ret**. c10a tuzagi bu senaryo icin "storming sonra norming" diyor, anahtar ve x ise "forming sonra norming"; secenekler arasinda storming-norming hic olmamasi soru yazarinin forming'i kastettigini gosteriyor, yani hata buyuk ihtimalle notta. Dogru secenegi yeniden yazmak riskli; insan karari gerek.
- 3-11 (ve 4-15): **ret**. c5a engeller tablosunda seceneklerden yalniz information overload var, noise ve receiver surec modelinin parcasi; "lack of attention" itirazi notlara degil genel anlama dayaniyor.
- 3-30 (ve 4-32): **onay**. Dogru secenek "combining transparency for employees" diye yarim kalmis; c4a servant leadership tanimina uygun olarak "combining transparency with support for employees" yapildi, cevap degismedi.
- 2-34: **onay**. Dogru secenek bozuk ("are owners of the change") ve noktasiz, bu yuzden goze batiyordu; c11d guiding coalition tanimina uygun "formed to lead the change" isim kalibina cevrildi, cevap degismedi.
- 4-43: **onay**. Celdiricide "A" eksikti, eklendi; icerik ayni, c6d PESTEL'e gore yanlis secenek olarak kaliyor.
