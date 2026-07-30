-- =====================================================
-- Gun 9: Cok Tablolu Analiz
-- =====================================================

-- 1. Her gelistiricinin toplam commit sayisi (azalan sirada)
-- developers'tan LEFT JOIN yapiyorum ki hic commit'i olmayanlar da 0 ile gorunsun.
-- COUNT(*) degil COUNT(commits.id) kullaniyorum: COUNT(*) satirlari sayar ve
-- LEFT JOIN'de eslesmeyen satir da bir satir oldugu icin 0 yerine 1 verirdi.
-- GROUP BY developers.id: isme gore gruplasam ayni isimli iki kisi tek satirda birlesirdi.
SELECT developers.name, COUNT(commits.id) AS commit_sayisi
FROM developers
LEFT JOIN commits ON developers.id = commits.developer_id
GROUP BY developers.id, developers.name
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
GROUP BY developers.id, developers.name
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