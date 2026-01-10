-- migrate:up
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    provider VARCHAR(50) DEFAULT 'local',
    provider_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) DEFAULT 'regular',
    status VARCHAR(20) DEFAULT 'available' -- caching status
);

CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    spot_id INT REFERENCES spots(id),
    user_id INT REFERENCES users(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data (if empty)
INSERT INTO users (username, password_hash, role, provider)
SELECT 'driver1', crypt('password123', gen_salt('bf')), 'user', 'local' WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'driver1')
UNION ALL
SELECT 'driver2', crypt('password123', gen_salt('bf')), 'user', 'local' WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'driver2')
UNION ALL
SELECT 'test', crypt('test', gen_salt('bf')), 'user', 'local' WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'test');

INSERT INTO spots (name, type) 
SELECT 'Spot 1', 'regular' WHERE NOT EXISTS (SELECT 1 FROM spots)
UNION ALL
SELECT 'Spot 2', 'regular' WHERE NOT EXISTS (SELECT 1 FROM spots)
UNION ALL
SELECT 'Spot 3', 'handicap' WHERE NOT EXISTS (SELECT 1 FROM spots)
UNION ALL
SELECT 'Spot 4', 'regular' WHERE NOT EXISTS (SELECT 1 FROM spots)
UNION ALL
SELECT 'Spot 5', 'regular' WHERE NOT EXISTS (SELECT 1 FROM spots);

-- migrate:down
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS spots;
