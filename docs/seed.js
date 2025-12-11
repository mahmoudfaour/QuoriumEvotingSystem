const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

// Build connection config
let poolConfig;

if (process.env.DATABASE_URL) {
  // If you set DATABASE_URL, use it directly
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
  };
} else {
  // Otherwise, use individual DB_* vars
  poolConfig = {
    user: process.env.DB_USER || "evoting_user",
    password: process.env.DB_PASSWORD || "evoting_pass",
    database: process.env.DB_NAME || "e_voting",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  };
}

const pool = new Pool(poolConfig);

async function seed() {
  try {
    console.log("📡 Connecting to database with config:", {
      host: poolConfig.host,
      db: poolConfig.database,
      user: poolConfig.user || "(from DATABASE_URL)",
    });

    const client = await pool.connect();

    // 1) Run schema.sql
    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaSQL = fs.readFileSync(schemaPath, "utf8");
    console.log("🧱 Creating tables...");
    await client.query(schemaSQL);

    // 2) Insert seed data
    console.log("🌱 Inserting sample data...");

    const adminHash = "$2b$10$Jby9I9LPXtKnPvGFy2lnheG9yZOaLrXEeGpe9UPAiAZL/S0mvphZi";
    const voterHash = "$2b$10$ncdtJjmpjuGyaIL28MReWOm3vItFTxIXgtL7HP8kEA3Klw53D8AEC";

    await client.query(`
      INSERT INTO users (full_name, email, password_hash, role) VALUES
      ('Admin User', 'admin@uni.com', '${adminHash}', 'admin'),
      ('Student One', 'student1@uni.com', '${voterHash}', 'voter')
      ON CONFLICT (email) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO elections (id, title, description, start_time, end_time, is_active)
      VALUES (
        1,
        'Student Council Election 2025',
        'Election for student council representatives.',
        NOW() - INTERVAL '1 day',
        NOW() + INTERVAL '7 days',
        TRUE
      )
      ON CONFLICT (id) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO candidates (id, election_id, name, description)
      VALUES
      (1, 1, 'Candidate A', 'Represents CS students.'),
      (2, 1, 'Candidate B', 'Represents Engineering students.')
      ON CONFLICT (id) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO eligible_voters (election_id, user_id)
      SELECT 1, id FROM users WHERE email = 'student1@uni.com'
      ON CONFLICT (election_id, user_id) DO NOTHING;
    `);

    console.log("✅ Database seeded successfully!");
    client.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seed();
