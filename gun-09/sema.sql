-- Tablo yapilari
-- merge_requests: her MR bir gelistiriciye ait (developer_id -> developers.id)
-- commits: her commit hem bir gelistiriciye hem bir MR'a ait

-- SQLite'ta foreign key kontrolu varsayilan olarak KAPALI.
-- Her baglantida ayri ayri acilmasi gerekiyor, yoksa FOREIGN KEY tanimlari
-- sadece belge niteliginde kalir, hicbir seyi engellemez.
PRAGMA foreign_keys = ON;

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
