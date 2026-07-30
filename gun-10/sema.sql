-- SQLite'ta foreign key kontrolu varsayilan olarak KAPALI.
-- Her baglantida ayri ayri acilmasi gerekiyor, yoksa FOREIGN KEY tanimlari
-- sadece belge niteliginde kalir, hicbir seyi engellemez.
PRAGMA foreign_keys = ON;

-- Üyeler Tablosu
CREATE TABLE Uyeler (
    uye_id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad_soyad TEXT NOT NULL,       -- NOT NULL: İsimsiz bir üye kaydı açılmasını engeller (örneğin boş veya null veri girmeyi önler).
    email TEXT UNIQUE NOT NULL,   -- UNIQUE: Aynı e-posta adresiyle ikinci bir kişinin kayıt olmasını (mükerrer hesabı) engeller.
    kayit_tarihi DATE DEFAULT CURRENT_DATE
);

-- Kitaplar Tablosu
CREATE TABLE Kitaplar (
    kitap_id INTEGER PRIMARY KEY AUTOINCREMENT,
    baslik TEXT NOT NULL,         -- NOT NULL: Sisteme başlığı olmayan hayalet kitapların eklenmesini engeller.
    yazar TEXT NOT NULL,
    isbn TEXT UNIQUE,             -- UNIQUE: Aynı barkoda (ISBN) sahip farklı kitapların sisteme girilmesini engeller.
    yayin_yili INTEGER
);

-- Ödünç İşlemleri Tablosu (Kesişim Tablosu)
CREATE TABLE OduncIslemleri (
    islem_id INTEGER PRIMARY KEY AUTOINCREMENT,
    kitap_id INTEGER NOT NULL,    
    uye_id INTEGER NOT NULL,      
    odunc_tarihi DATE NOT NULL DEFAULT CURRENT_DATE,
    iade_tarihi DATE,             -- NOT NULL DEĞİL: Çünkü kitap henüz iade edilmemişse bu alan boş (NULL) kalmalıdır.
    
    -- FOREIGN KEY (Yabancı Anahtar) Kısıtları:
    -- Kütüphanede kayıtlı olmayan bir kitabın (olmayan kitap_id) ödünç verilmesini engeller (Tutarlılık/Referential Integrity).
    FOREIGN KEY (kitap_id) REFERENCES Kitaplar(kitap_id),
    
    -- Sisteme kayıtlı olmayan bir kişiye (olmayan uye_id) kitap verilmesini engeller.
    FOREIGN KEY (uye_id) REFERENCES Uyeler(uye_id)
);

-- iade_tarihi uzerinde index: "disaridaki kitaplar" sorgusu bu sutunu filtreliyor.
-- Index olmadan tum tablo taraniyor (SCAN), index ile dogrudan hedefe gidiliyor (SEARCH).
CREATE INDEX idx_iade_tarihi ON OduncIslemleri(iade_tarihi);