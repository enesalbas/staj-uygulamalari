-- 1. ÖRNEK VERİLERİ EKLEME
INSERT INTO Uyeler (ad_soyad, email) VALUES 
('Ahmet Yılmaz', 'ahmet@email.com'),
('Ayşe Kaya', 'ayse@email.com'),
('Mehmet Demir', 'mehmet@email.com');

INSERT INTO Kitaplar (baslik, yazar, isbn, yayin_yili) VALUES 
('Suç ve Ceza', 'Dostoyevski', '978-111', 1866),
('Sefiller', 'Victor Hugo', '978-222', 1862),
('1984', 'George Orwell', '978-333', 1949),
('Otostopçunun Galaksi Rehberi', 'Douglas Adams', '978-444', 1979);

-- İşlem 1: Ahmet 'Suç ve Ceza'yı aldı, henüz iade etmedi (iade_tarihi NULL)
INSERT INTO OduncIslemleri (kitap_id, uye_id, odunc_tarihi, iade_tarihi) 
VALUES (1, 1, '2023-10-01', NULL);

-- İşlem 2: Ayşe 'Sefiller'i aldı ve iade etti
INSERT INTO OduncIslemleri (kitap_id, uye_id, odunc_tarihi, iade_tarihi) 
VALUES (2, 2, '2023-10-05', '2023-10-15');

-- İşlem 3: Ayşe '1984'ü aldı ve henüz iade etmedi
INSERT INTO OduncIslemleri (kitap_id, uye_id, odunc_tarihi, iade_tarihi) 
VALUES (3, 2, '2023-10-20', NULL);


-- 2. İSTENEN 3 SORGU

-- A. Şu an dışarıda olan kitaplar (iade_tarihi NULL olanlar)
SELECT Kitaplar.baslik, Uyeler.ad_soyad AS alan_kisi
FROM OduncIslemleri
JOIN Kitaplar ON OduncIslemleri.kitap_id = Kitaplar.kitap_id
JOIN Uyeler ON OduncIslemleri.uye_id = Uyeler.uye_id
WHERE OduncIslemleri.iade_tarihi IS NULL;

-- B. En çok ödünç alan üye (İşlem sayısına göre gruplayıp sıralıyoruz)
SELECT Uyeler.ad_soyad, COUNT(OduncIslemleri.islem_id) AS islem_sayisi
FROM OduncIslemleri
JOIN Uyeler ON OduncIslemleri.uye_id = Uyeler.uye_id
GROUP BY Uyeler.uye_id
ORDER BY islem_sayisi DESC
LIMIT 1;

-- C. Hiç ödünç alınmamış kitaplar (OduncIslemleri tablosunda kitap_id'si geçmeyenler)
SELECT baslik 
FROM Kitaplar 
WHERE kitap_id NOT IN (SELECT kitap_id FROM OduncIslemleri);