# Günlük Blok Takvim — Spec v2 (Yeniden Tasarım)

> v1'in eleştirel incelemesi sonrası güncellenmiş tasarım. Mevcut deploy: https://virtue10-cyber.github.io/takvim

---

## v1'de Tespit Edilen Sorunlar

### 🔴 Kritik: iOS Web Push sunucusuz çalışmaz
- Web Push, bildirimi **bir sunucunun tetiklemesini** gerektirir (VAPID + push servisi)
- Saf istemci-taraflı PWA, kapalıyken kendine bildirim gönderemez
- iOS'ta web için zamanlanmış yerel bildirim API'si **yok**
- **Sonuç:** v1'deki "arka planda push + Watch yansıması" vaadi, sıfır-sunucu kararıyla teknik olarak imkânsız

### 🟡 Davranışsal eksikler (asıl problem: dikkat + unutma)
- Uygulamayı **açmayı unutursan** hiçbir şey çalışmıyor — sistemin tek zayıf halkası kullanıcının hafızası
- Saatlik grid, "şu an ne yapmalıyım?" sorusuna hızlı cevap vermiyor — göz gezdirme yükü var
- Ertelemede "+2x ertelendi" etiketi utandırma riski taşıyor; motivasyonu düşürebilir
- Seri (streak) kırılınca sıfırlanma cezası, bir kötü günün ertesi gün bırakmaya dönüşmesine yol açar (bilinen tuzak)
- Görev ekleme 4 alanlı modal — dikkat dağınıklığında sürtünme ne kadar azsa o kadar iyi

---

## Bildirim Mimarisi (v2 kararı)

Katmanlı yaklaşım — her katman bir öncekinin açığını kapatır:

### Katman 1 — Uygulama açıkken (mevcut, korunur)
- Banner + bip, güne göre sıklaşan aralıklar (07–12: 30dk / 12–16: 15dk / 16–19: 10dk / 19+: 5dk)

### Katman 2 — Rozet (Badge API) ✅ iOS 16.4+ PWA'da çalışır
- `navigator.setAppBadge(n)` → ana ekran ikonunda bekleyen görev sayısı
- Uygulama kapansa bile son ayarlanan rozet kalır
- Telefonu her açtığında ikon "3" gösteriyorsa görsel dürtme etkisi yapar

### Katman 3 — Takvim köprüsü (.ics dışa aktarma) ✅ Watch dahil gerçek bildirim
- "Bugünü Takvime Gönder" butonu → günün görevlerini alarm'lı `.ics` dosyası olarak üretir
- iPhone'da açınca yerel Takvim'e eklenir → **iOS kendi bildirimini verir → Watch'a otomatik yansır**
- Sıfır sunucu, sıfır izin karmaşası; Apple'ın kendi bildirim altyapısı kullanılmış olur
- Tekrarlayan görevler `RRULE` ile bir kez eklenir, her gün kendiliğinden çalar

### Katman 4 — (İleride, istenirse) Gerçek push
- Ücretsiz tier bir backend (Cloudflare Workers / Supabase) + VAPID → gerçek zamanlı push
- v2 kapsamı DIŞI; katman 1–3 ihtiyacın %90'ını karşılar

---

## Davranışsal Yeniden Tasarım

### "Şimdi" kartı (yeni — en üstte)
Saat grid'inin ÜSTÜNDE tek büyük kart:
- **Şu anki saat diliminin görevi** büyük puntoyla: "Şimdi: Raporu bitir"
- Altında tek satır: "Sonraki: 15:00 — Spor"
- Kartın kendisi tık → tamamla; uzun bas → odak modu
- Boşsa: "Bu saat boş — sıradaki 15:00'te"
- **Amaç:** Uygulamayı açan kişi 1 saniyede "ne yapmalıyım"ı görsün, grid'i taramasın

### Hızlı ekleme (sürtünme azaltma)
- Alt köşede kalıcı ➕ → tek input açılır: yaz, Enter
- Saat = bir sonraki boş slot (otomatik), kategori = son kullanılan
- Detay (not, saat değişikliği) sonradan düzenlenebilir
- Modal'lı tam form korunur ama varsayılan yol bu

### Erteleme dili (nötrleştirme)
- "+2x ertelendi" yerine sadece küçük saat ikonu 🕐
- Erteleme sayısı **İstatistik sekmesinde** toplu görünür ("bu hafta en çok ertelenen: X") — günlük görünümde utandırma yok
- 3+ ertelemede yumuşak öneri: "Bu görev büyük olabilir — ikiye bölmek ister misin?"

### Affedici seri (streak)
- Haftada 1 "donmuş gün" hakkı: hiç görev yapılmayan gün seriyi kırmaz, dondurur
- Rozet: mevcut seri 🔥 + en iyi seri 🏆 + kalan dondurma hakkı ❄️
- **Amaç:** Bir kötü gün = sistem çöktü hissini engellemek

### Akşam kapanışı (yarını kurma)
- 20:00 sonrası ilk açılışta tek kart: "Bugün 4/6 ✓ — Yarın için 3 öncelik seç?"
- Tek dokunuşla yarının öncelik seçim ekranı açılır
- Sabah "Günü başlat"a alternatif: akşam kurulan gün, sabah karar yükü olmadan başlar

---

## v1'den Korunanlar (değişiklik yok)

- Veri modeli (tasks / repeats / donemap / priorities / streaks / scores / settings)
- 4 kategori ve renkleri (iş-mavi, sağlık-yeşil, kişisel-mor, spor-turuncu)
- Gün-bazlı tekrar seçimi (`days: [1,2,3,4,5]`) + kısayollar
- Odak modu: 15/25/50 dk, tam ekran, ilerleme çubuğu
- Günü başlat: 3 öncelik, altın çerçeve, diğerleri soluk, manuel sıfırlama
- Uyarı ses toggle'ı
- JSON dışa/içe aktarma
- Sekmeler: Bugün / İstatistik
- Swipe ile gün değiştirme, long press eylem menüsü, 44px dokunma hedefi
- GitHub Pages dağıtımı, tüm veriler localStorage'da

---

## Değişiklik Özeti (Claude Code'a verilecek iş listesi)

| # | İş | Öncelik |
|---|-----|---------|
| 1 | "Şimdi" kartı — grid üstüne, mevcut saat görevi + sonraki | Yüksek |
| 2 | Badge API — bekleyen görev sayısı ikonda | Yüksek |
| 3 | .ics dışa aktarma — "Bugünü Takvime Gönder" + tekrarlayanlar için RRULE | Yüksek |
| 4 | Hızlı ekleme — kalıcı ➕, tek input, akıllı varsayılanlar | Orta |
| 5 | Erteleme dilini nötrleştir + böl önerisi | Orta |
| 6 | Donmuş gün'lü seri sistemi | Orta |
| 7 | Akşam kapanışı kartı — yarının önceliklerini akşamdan seç | Orta |
| 8 | v1 spec'teki "arka plan push" ifadelerini kaldır (yanıltıcı) | Düşük |

---

## Bilinen Sınırlar (dürüst liste)

- Uygulama hiç açılmazsa katman 1 uyarıları çalışmaz → çözüm: .ics ile Takvim bildirimi + rozet
- Badge, iOS'ta yalnızca Ana Ekrana Ekle yapılmış PWA'da çalışır
- Safari verisi silinirse localStorage gider → düzenli JSON yedeği şart
- .ics tek yönlü: uygulamada görevi silersen Takvim'dekini elle silmen gerekir
