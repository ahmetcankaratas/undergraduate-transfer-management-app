# Undergraduate Transfer Management - Server

Yatay Geçiş Yönetim Sistemi backend API servisi. NestJS framework ile geliştirilmiştir.

## Kurulum

```bash
npm install
```

## Çalıştırma

```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

## Veritabanı Seed

Test kullanıcılarını oluşturmak için:

```bash
npm run seed
```

### Test Kullanıcıları

| Rol | Email | Şifre | Ad Soyad | Fakülte/Birim |
|-----|-------|-------|----------|---------------|
| ADMIN | admin@iyte.edu.tr | 123456 | Admin User | Bilgi İşlem |
| STUDENT | ali.veli@metu.edu.tr | 123456 | Ali Veli | - |
| OIDB_STAFF | oidb@iyte.edu.tr | 123456 | Mehmet Yılmaz | Öğrenci İşleri Daire Başkanlığı |
| FACULTY_STAFF | muhendislik@iyte.edu.tr | 123456 | Ayşe Demir | Mühendislik Fakültesi |
| FACULTY_STAFF | mimarlik@iyte.edu.tr | 123456 | Zeynep Arslan | Mimarlık Fakültesi |
| FACULTY_STAFF | fen@iyte.edu.tr | 123456 | Hakan Özdemir | Fen Fakültesi |
| YGK_MEMBER | ygk@iyte.edu.tr | 123456 | Fatma Kaya | Mühendislik Fakültesi / Bilgisayar Müh. |

## Kullanıcı Rolleri

- **ADMIN**: Sistem yöneticisi
- **STUDENT**: Yatay geçiş başvurusu yapan öğrenci
- **OIDB_STAFF**: Öğrenci İşleri Daire Başkanlığı personeli
- **FACULTY_STAFF**: Fakülte personeli (Dekanlık)
- **YGK_MEMBER**: Yatay Geçiş Komisyonu üyesi (Bölüm)

## Örnek Başvuru Senaryosu

Aşağıda bir öğrencinin yatay geçiş başvurusunun tüm aşamalarını gösteren örnek bir senaryo bulunmaktadır.

### Senaryo: Bilgisayar Mühendisliği'ne Yatay Geçiş

**Başvuru Sahibi:** Ali Veli (ODTÜ'den İYTE'ye geçiş yapmak istiyor)

| Adım | Durum | Kullanıcı | Email | İşlem |
|------|-------|-----------|-------|-------|
| 1 | `DRAFT` | Öğrenci | ali.veli@metu.edu.tr | Başvuru formunu doldurur, belgeleri yükler |
| 2 | `SUBMITTED` | Öğrenci | ali.veli@metu.edu.tr | Başvuruyu gönderir |
| 3 | `OIDB_REVIEW` | ÖİDB Personeli | oidb@iyte.edu.tr | Belgeleri kontrol eder, UBYS/ÖSYM/YOKSIS entegrasyonları ile doğrular |
| 4 | `FACULTY_ROUTING` | ÖİDB Personeli | oidb@iyte.edu.tr | Başvuruyu Mühendislik Fakültesi'ne yönlendirir |
| 5 | `DEPARTMENT_ROUTING` | Fakülte Personeli | muhendislik@iyte.edu.tr | Başvuruyu Bilgisayar Mühendisliği bölümüne yönlendirir |
| 6 | `YGK_EVALUATION` | YGK Üyesi | ygk@iyte.edu.tr | GPA, ÖSYM puanı ve İngilizce yeterliliğini değerlendirir |
| 7 | `RANKED` | YGK Üyesi | ygk@iyte.edu.tr | Bileşik puan hesaplanır, sıralama oluşturulur |
| 8 | Yayınlama | ÖİDB Personeli | oidb@iyte.edu.tr | Sonuçları yayınlar, adaylara bildirim gönderilir |
| 9 | `APPROVED` | - | - | Kontenjan dahilinde ise kabul edilir |

### Durum Geçiş Diyagramı

```
┌─────────┐     ┌───────────┐     ┌─────────────┐     ┌─────────────────┐
│  DRAFT  │────▶│ SUBMITTED │────▶│ OIDB_REVIEW │────▶│ FACULTY_ROUTING │
└─────────┘     └───────────┘     └─────────────┘     └─────────────────┘
                                                              │
                     ┌────────────────────────────────────────┘
                     ▼
         ┌────────────────────┐     ┌────────────────┐     ┌────────┐
         │ DEPARTMENT_ROUTING │────▶│ YGK_EVALUATION │────▶│ RANKED │
         └────────────────────┘     └────────────────┘     └────────┘
                                            │                   │
                                            ▼                   ▼
                                      ┌──────────┐        ┌──────────┐
                                      │ REJECTED │        │ APPROVED │
                                      └──────────┘        └──────────┘
                                                                │
                                                          ┌─────┴─────┐
                                                          ▼           ▼
                                                    ┌──────────┐ ┌────────────┐
                                                    │ APPROVED │ │ WAITLISTED │
                                                    └──────────┘ └────────────┘
```

### Puan Hesaplama

Bileşik puan aşağıdaki formülle hesaplanır:

```
Bileşik Puan = (ÖSYM Puanı × 0.90) + (GPA/4.0 × 100 × 0.10)
```

**Uygunluk Kriterleri:**
- GPA ≥ 2.5 (4.0 üzerinden)
- ÖSYM puanı > 0
- İngilizce yeterlilik belgesi (varsa)

### Test Adımları

1. **Öğrenci olarak giriş yapın:** `ali.veli@metu.edu.tr / 123456`
   - Yeni başvuru oluşturun (Mühendislik Fakültesi → Bilgisayar Mühendisliği)
   - Belgeleri yükleyin ve başvuruyu gönderin

2. **ÖİDB personeli olarak giriş yapın:** `oidb@iyte.edu.tr / 123456`
   - Başvuruları inceleyin
   - Belgeleri doğrulayın
   - Fakülteye yönlendirin

3. **Fakülte personeli olarak giriş yapın:** `muhendislik@iyte.edu.tr / 123456`
   - Gelen başvuruları görüntüleyin
   - Bölüme yönlendirin

4. **YGK üyesi olarak giriş yapın:** `ygk@iyte.edu.tr / 123456`
   - Başvuruyu değerlendirin (GPA, ÖSYM, İngilizce)
   - Sıralama oluşturun

5. **ÖİDB personeli olarak tekrar giriş yapın:** `oidb@iyte.edu.tr / 123456`
   - Duyurular sayfasından sonuçları yayınlayın

6. **Öğrenci olarak tekrar giriş yapın:** `ali.veli@metu.edu.tr / 123456`
   - Bildirimleri kontrol edin
   - Başvuru durumunu görüntüleyin

## Testler

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```
