# Günlük Blok Takvim — Ürün Spesifikasyonu

## Genel Bakış

Dikkat dağınıklığı ve unutkanlık yaşayan kullanıcılar için tasarlanmış, mobil öncelikli günlük görev takip aracı. Karmaşık sistem yerine sade yapı; uyarılar, odak modu ve alışkanlık desteği öncelikli.

**Hedef kullanıcı:** Neyle başlayacağını bilemeyen, başlayıp bırakan veya unutan; iş, sağlık, kişisel gelişim ve spor görevlerini takip etmek isteyen biri.

**Platform:** PWA (Progressive Web App) — iPhone'da "Ana Ekrana Ekle" ile uygulama gibi çalışır, gerçek push bildirimi verir. GitHub Pages üzerinde yayınlanır (ücretsiz, HTTPS otomatik). Veri tamamen kullanıcının cihazında localStorage'da kalır, sunucuya gitmez.

**Dosya yapısı:**
```
index.html
manifest.json
service-worker.js
icon-192.png
icon-512.png
```

---

## PWA Gereksinimleri

- `manifest.json`: uygulama adı, ikon, tema rengi, `display: standalone`
- `service-worker.js`: offline cache (uygulama dosyaları önbelleğe alınır, veri değil)
- HTTPS: GitHub Pages otomatik sağlar
- iOS 16.4+ Safari: Web Push Notification desteklenir
- Bildirim izni: ilk açılışta kullanıcıdan istenir
- Apple Watch: iPhone'a gelen bildirim otomatik yansır

---

## Veri Modeli

```json
{
  "tasks": {
    "2026-06-26": {
      "8": { "title": "Raporu bitir", "cat": "is", "done": false, "note": "...", "postponed": 0 }
    }
  },
  "repeats": [
    { "id": "abc123", "hour": 8, "title": "İlaç al", "cat": "saglik", "days": [1,2,3,4,5] }
  ],
  "donemap": {
    "2026-06-26_abc123": true
  },
  "priorities": {
    "2026-06-26": [8, 10, 14]
  },
  "streaks": {
    "lastDate": "2026-06-26",
    "current": 5,
    "best": 12
  },
  "scores": {
    "2026-06-26": { "total": 5, "done": 4 }
  },
  "settings": {
    "alertSound": true,
    "pomodoroMinutes": 25
  }
}
```

**Kategoriler:** `is` (İş/kariyer) | `saglik` (Sağlık/rutin) | `kisisel` (Kişisel Gelişim) | `spor` (Spor)

**Tekrar sıklığı:** `days` — haftanın günlerini temsil eden sayı dizisi; 0=Pazar … 6=Cumartesi
Örnek: `[1,2,3,4,5]` = hafta içi, `[0,6]` = hafta sonu, `[0,1,2,3,4,5,6]` = her gün

---

## Özellikler

### 1. Blok Takvim Görünümü
- 07:00–21:00 arası saat satırları
- Her satıra görev eklenebilir (tıklayarak)
- Geçmiş saatler soluk gösterilir, mevcut saat vurgulanır
- Görev renkleri: mavi = iş, yeşil = sağlık, mor = kişisel gelişim, turuncu = spor
- Mobil: görev üzerinde uzun basış (long press) ile eylem menüsü → tamamla / odak / ertele / sil
- Masaüstü: hover'da eylem ikonları görünür

### 2. Tek Seferlik Görev
- Saat, başlık, kategori, not alanı
- Not: toplantı linki, ilaç dozu gibi kısa hatırlatmalar

### 3. Tekrarlayan Görev
- Sıklık: haftanın günleri tek tek seçilir (Pzt / Sal / Çar / Per / Cum / Cmt / Paz)
- Kısayol butonları: "Her gün", "Hafta içi", "Hafta sonu"
- Takvimde 🔁 rozeti ile gösterilir
- Silindiğinde "sadece bugün mü, tamamen mi?" diye sorulur
- Her günün tamamlanma durumu ayrı tutulur (donemap)

### 4. Günü Başlat
- Sabah akışı: o günün görevlerinden 3 öncelik seç
- Seçilenler altın çerçeveyle vurgulanır
- Seçilmeyenler soluklaşır (odak dışı)
- Öncelikler `priorities[tarih]` olarak kaydedilir
- Manuel sıfırlama butonu

### 5. Odak Modu
- Herhangi bir görev için tam ekran açılır
- Pomodoro süresi: 15 / 25 / 50 dk (kullanıcı seçer, `settings.pomodoroMinutes` kaydedilir)
- Başlat / Duraklat / Tamamlandı butonları
- İlerleme çubuğu
- Süre bitince bip sesi + push bildirim (uygulama arka plandaysa)

### 6. Erteleme
- Görevi 1 saat ileri taşır
- Kaç kez ertelendiği görev üzerinde gösterilir (`+2x ertelendi`)
- 21:00'den sonra erteleme yapılamaz
- Tekrarlayan görev ertelenince sadece o gün kayar; ertesi gün normal saatinde çıkar

### 7. Uyarı Sistemi
- Push bildirim (PWA, uygulama arka plandayken de çalışır)
- Yalnızca bugün tetiklenir, tamamlanmamış görev varsa
- Aralık: 07–12 → 30 dk, 12–16 → 15 dk, 16–19 → 10 dk, 19+ → 5 dk
- Seviyeler: sarı (sabah) / turuncu (öğleden sonra) / kırmızı (akşam)
- Uygulama açıkken: banner + bip sesi (sabah 1x, öğle 2x, akşam 3x)
- Ses toggle ile kapatılabilir (`settings.alertSound`)
- Banner kapatılabilir; kapatınca o süre boyunca tekrar çıkmaz
- Sonraki uyarı saati gösterilir

### 8. İstatistik Kartları (üst bar)
- Toplam görev / Tamamlanan / Tamamlanma %

### 9. Veri Yedekleme
- "Dışa aktar" butonu → JSON dosyası indir
- "İçe aktar" butonu → JSON yükle (cihaz değişiminde veya yedekten dönüş için)

### 10. Haftalık Isı Haritası *(2. tur — İstatistik sekmesi)*
- Son 7 günün tamamlanma oranı renk skalasıyla
- Tıklayınca o güne geçiş

### 11. Seri Takibi *(2. tur — İstatistik sekmesi)*
- Kaç gün üst üste en az 1 görev tamamlandı
- Mevcut seri + en iyi seri
- Seri kırılınca sıfırlanır

### 12. Günlük Puan *(2. tur — İstatistik sekmesi)*
- Tamamlanan/toplam oranı 0–100 puan
- Son 7 günün çizgi grafiği

### 13. Akşam Özeti *(2. tur)*
- 20:00'den sonra push bildirim + uygulama içi banner
- "Bugün X/Y görev tamamlandı. Yarına Y görev kaldı."
- Günde bir kez gösterilir (localStorage flag)

---

## Arayüz

### Sekmeler (alt navigasyon — mobil öncelikli)
- 📅 **Bugün** — takvim görünümü
- 📊 **İstatistik** — ısı haritası, seri, puan (2. tur)

### Navigasyon (Bugün sekmesi)
- Sol/sağ ok veya swipe ile gün değiştirme
- Tarih etiketi ortada (örn. "Pazartesi, 26 Haz")

### Butonlar
- 🚀 Günü başlat
- 🔁 Tekrarlayan görev ekle
- ➕ Görev ekle

### Modal — Görev Ekle
Sekmeler: Tek seferlik | Tekrarlayan

**Tek seferlik alanları:** Saat · Görev adı · Not (isteğe bağlı) · Kategori

**Tekrarlayan alanları:** Saat · Görev adı · Kategori · Gün seçici (Pzt–Paz toggle) · Kısayollar (Her gün / Hafta içi / Hafta sonu) · Mevcut tekrarlayan listesi

### Renk Sistemi
| Kategori | Arka plan | Kenarlık |
|----------|-----------|----------|
| İş | #E6F1FB (açık mavi) | #378ADD |
| Sağlık | #E1F5EE (açık yeşil) | #1D9E75 |
| Kişisel Gelişim | #F3E8FF (açık mor) | #7C3AED |
| Spor | #FFF3E0 (açık turuncu) | #EA580C |
| Öncelik | + #BA7517 çerçeve | — |

---

## Tasarım Kuralları
- Mobil öncelikli: minimum dokunma hedefi 44px, alt navigasyon
- Swipe: sola/sağa kaydırarak gün değiştirme
- Long press: görev eylem menüsü (mobil hover alternatifi)
- Dark mode: CSS değişkenleri ile otomatik
- Font: sistem sans-serif stack
- Tüm metinler Türkçe
- localStorage anahtarı: `takvim_v1`

---

## Dağıtım

- **Repo:** GitHub (public)
- **Yayın:** GitHub Pages (otomatik HTTPS)
- **Güncelleme:** Claude Code → git push → otomatik yayın
- **Kurulum (kullanıcı):** Safari → Paylaş → Ana Ekrana Ekle

---

## Kararlaştırılanlar

| Konu | Karar |
|------|-------|
| Platform | PWA, GitHub Pages |
| Öncelik | Mobil (iPhone) önce, masaüstü ikincil |
| Bildirim | Web Push (iOS 16.4+), Watch'a otomatik yansır |
| Pomodoro süresi | Kullanıcı seçebilir: 15 / 25 / 50 dk |
| Tekrarlayan görev erteleme | Sadece o gün kayar; ertesi gün normal saatinde çıkar |
| Öncelik sıfırlama | Kullanıcı manuel sıfırlar |
| Uyarı sesi | Toggle ile açılıp kapatılabilir |
| 2. tur özellikler | Ayrı sekme: "Bugün" ve "İstatistik" |
| Veri güvenliği | Tamamen localStorage, sunucuya gitmez |
| Yedekleme | JSON dışa/içe aktarma |

---

## Kurulum Rehberi

> Bu bölüm Claude Code'un `README.md` olarak ayrıca oluşturması için de kullanılabilir.

### 1. Geliştirme — Claude Code

Spec'i Claude Code'a ver, şu dosyaları oluştursun:

```
index.html          ← uygulamanın kendisi
manifest.json       ← PWA tanımı
service-worker.js   ← offline + push bildirim
icon-192.png        ← uygulama ikonu (192×192)
icon-512.png        ← uygulama ikonu (512×512)
README.md           ← bu rehber
```

### 2. GitHub'a Yükle

```bash
git init
git add .
git commit -m "ilk versiyon"
git remote add origin https://github.com/virtue10-cyber/takvim.git
git push -u origin main
```

> `KULLANICI_ADIN` ve `takvim` kendi GitHub kullanıcı adın ve repo adınla değiştirilecek.

### 3. GitHub Pages'i Aç

1. GitHub'da repo sayfasına git
2. **Settings** → **Pages**
3. Source: **Deploy from branch** → `main` → `/ (root)`
4. **Save** — 1–2 dakika sonra yayında

Adres: `https://KULLANICI_ADIN.github.io/takvim`

### 4. iPhone'a Kur (Ana Ekrana Ekle)

1. iPhone'da **Safari** ile yukarıdaki adresi aç
2. Alt ortadaki **Paylaş** butonuna bas (kare + ok ikonu)
3. **Ana Ekrana Ekle**'ye bas
4. İsim ver (örn. "Takvim") → **Ekle**
5. Ana ekranda uygulama ikonu belirir

> ⚠️ Chrome veya başka tarayıcıda değil, mutlaka **Safari** ile yapılmalı.

### 5. Bildirim İznini Ver

Uygulama ilk açıldığında bildirim izni isteyecek → **İzin Ver**'e bas.
Bu olmadan push bildirimler çalışmaz.

### 6. Güncelleme Yapmak

Koda değişiklik yapınca:

```bash
git add .
git commit -m "güncelleme açıklaması"
git push
```

GitHub Pages otomatik güncellenir. iPhone'da uygulamayı kapatıp açmak yeterli.

### 7. Veri Yedekleme

- Uygulama içi **Dışa Aktar** butonu → JSON dosyası indir
- Telefon değişiminde yeni telefonda **İçe Aktar** ile geri yükle
- Düzenli yedek almak önerilir (veriler sadece cihazda durur)

