CREATE TABLE IF NOT EXISTS usersjwt (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

INSERT INTO usersjwt (username, password_hash)
VALUES ('test', '$2a$10$whVtFiEYqKm1tZ5UZqNWUeBaTXxkgsX/6rNBDx/NaroiXj.ovmpRm')
ON CONFLICT (username) DO NOTHING;