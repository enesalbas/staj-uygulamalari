-- developers tablosunu olustur
-- id otomatik artan birincil anahtar, name zorunlu, email ve team opsiyonel
CREATE TABLE developers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  team TEXT
);

-- Tabloya 12 gelistirici kaydi ekle
-- Bazi kayitlarin email'i bilerek NULL birakildi (NULL sorgusu icin)
INSERT INTO developers (name, email, team) VALUES
  ('Ayse Yilmaz', 'ayse@example.com', 'Backend'),
  ('Mehmet Demir', 'mehmet@example.com', 'Frontend'),
  ('Zeynep Kaya', 'zeynep@example.com', 'Backend'),
  ('Ali Can', 'ali@example.com', 'DevOps'),
  ('Fatma Sahin', NULL, 'Frontend'),
  ('Emre Aydin', 'emre@example.com', 'Backend'),
  ('Elif Celik', 'elif@example.com', 'QA'),
  ('Burak Arslan', NULL, 'DevOps'),
  ('Deniz Koc', 'deniz@example.com', 'Frontend'),
  ('Selin Yildiz', 'selin@example.com', 'QA'),
  ('Kerem Ozturk', 'kerem@example.com', 'Backend'),
  ('Ece Aksoy', NULL, 'Frontend');

-- Tum kayitlari listele
SELECT * FROM developers;

-- Sadece Backend takimindaki gelistiricileri getir
SELECT * FROM developers WHERE team = 'Backend';

-- Gelistiricileri isme gore alfabetik sirala
SELECT * FROM developers ORDER BY name;

-- Ilk 5 kaydi getir
SELECT * FROM developers LIMIT 5;

-- Email'i olmayan (NULL) gelistiricileri bul
-- NULL kontrolu icin = degil IS NULL kullanilir
SELECT * FROM developers WHERE email IS NULL;

-- id'si 5 olan gelistiricinin email'ini guncelle
-- WHERE olmasaydi butun satirlarin email'i degisirdi
UPDATE developers SET email = 'fatma@example.com' WHERE id = 5;

-- id'si 12 olan gelistiriciyi sil
-- WHERE olmasaydi tablodaki tum kayitlar silinirdi
DELETE FROM developers WHERE id = 12;