-- =====================================================
-- Gun 9: Cok Tablolu Analiz
-- =====================================================

-- Tablo yapilari
-- merge_requests: her MR bir gelistiriciye ait (developer_id -> developers.id)
-- commits: her commit hem bir gelistiriciye hem bir MR'a ait
CREATE TABLE merge_requests (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  developer_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  merged_at TEXT,
  status TEXT NOT NULL,
  FOREIGN KEY (developer_id) REFERENCES developers(id)
);

CREATE TABLE commits (
  id INTEGER PRIMARY KEY,
  message TEXT NOT NULL,
  developer_id INTEGER NOT NULL,
  merge_request_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (developer_id) REFERENCES developers(id),
  FOREIGN KEY (merge_request_id) REFERENCES merge_requests(id)
);

-- Hic commit'i olmayan gelistirici senaryosunu test edebilmek icin
-- MR/commit uretiminde kullanilmayan iki gelistirici eklendi
INSERT INTO developers (name, email, team) VALUES
  ('Yeni Gelistirici', 'yeni@example.com', 'Backend'),
  ('Stajyer Aday', NULL, 'QA');


-- 1. Her gelistiricinin toplam commit sayisi (azalan sirada)
-- JOIN ile commits ve developers birlestiriliyor, cunku commits tablosunda
-- sadece developer_id var, isim developers tablosunda duruyor.
-- GROUP BY ile her gelistirici ayri bir grup oluyor, COUNT(*) her grubu ayri sayiyor.
SELECT developers.name, COUNT(*) AS commit_sayisi
FROM commits
JOIN developers ON commits.developer_id = developers.id
GROUP BY developers.name
ORDER BY commit_sayisi DESC;


-- 2. Son 30 gunde acilmis ama henuz merge edilmemis MR'lar
-- date('now', '-30 days') SQLite'in tarih fonksiyonu, 30 gun oncesini veriyor.
-- Tarihler ISO formatinda saklandigi icin metin karsilastirmasi (>=) dogru calisiyor.
-- merged_at IS NULL: henuz merge edilmemis olanlar (= NULL calismaz, IS NULL gerekir)
SELECT id, title, created_at, status
FROM merge_requests
WHERE created_at >= date('now', '-30 days')
  AND merged_at IS NULL;


-- 3. En cok commit yapan ilk 5 gelistirici
-- 1. sorgunun sonuna LIMIT 5 eklenmis hali
SELECT developers.name, COUNT(*) AS commit_sayisi
FROM commits
JOIN developers ON commits.developer_id = developers.id
GROUP BY developers.name
ORDER BY commit_sayisi DESC
LIMIT 5;


-- 4. Her takim icin MR sayisi (JOIN + GROUP BY)
-- merge_requests tablosunda takim bilgisi yok, sadece developer_id var.
-- Takimi ogrenmek icin developers tablosuna JOIN yapiliyor.
-- GROUP BY developers.team ile kisi bazinda degil takim bazinda kirilim aliniyor.
SELECT developers.team, COUNT(*) AS mr_sayisi
FROM merge_requests
JOIN developers ON merge_requests.developer_id = developers.id
GROUP BY developers.team
ORDER BY mr_sayisi DESC;


-- 5. Hic commit'i olmayan gelistiriciler (LEFT JOIN ile)
--
-- NEDEN INNER JOIN ILE BULUNAMAZ?
-- INNER JOIN (yani duz JOIN) sadece iki tabloda ESLESEN satirlari getirir.
-- Hic commit'i olmayan bir gelistirici, commits tablosunda hic gecmedigi icin
-- eslesme bulamaz ve sonuctan tamamen silinir. Yani INNER JOIN, tam da aradigimiz
-- kayitlari daha en basta eliyor; bu sorguyu INNER JOIN ile yazmak imkansiz.
--
-- LEFT JOIN ise SOL tablodaki (developers) her satiri korur. Eslesme yoksa
-- sag tablonun (commits) sutunlarini NULL ile doldurur.
-- Bu yuzden WHERE commits.id IS NULL kosulu, "hic commit'i olmayanlar" demek oluyor.
--
-- Tablo sirasi onemli: developers SOLDA olmali, cunku korumak istedigimiz satirlar onun.
SELECT developers.id, developers.name, developers.team
FROM developers
LEFT JOIN commits ON developers.id = commits.developer_id
WHERE commits.id IS NULL;