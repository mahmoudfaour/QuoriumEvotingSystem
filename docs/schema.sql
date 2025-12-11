-- 1) Users (admin + voters)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'voter' -- 'admin' or 'voter'
);

-- 2) Elections (off-chain metadata)
CREATE TABLE IF NOT EXISTS elections (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 3) Candidates (off-chain metadata)
-- IMPORTANT: (election_id, id) should match what you configured on-chain.
CREATE TABLE IF NOT EXISTS candidates (
    id SERIAL PRIMARY KEY,
    election_id INT NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT
);

-- 4) Eligible voters (who can vote in what)
CREATE TABLE IF NOT EXISTS eligible_voters (
    id SERIAL PRIMARY KEY,
    election_id INT NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (election_id, user_id)
);

-- 5) Local vote status (off-chain check to prevent double vote)
CREATE TABLE IF NOT EXISTS local_vote_status (
    id SERIAL PRIMARY KEY,
    election_id INT NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    has_voted BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (election_id, user_id)
);
