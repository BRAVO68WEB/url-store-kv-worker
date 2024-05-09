DROP TABLE IF EXISTS views;
CREATE TABLE IF NOT EXISTS views (
    linkid TEXT PRIMARY KEY,
    count INTEGER,
    updated_at TEXT
);