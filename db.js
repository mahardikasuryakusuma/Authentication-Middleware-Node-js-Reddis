const mysql = require("mysql2");
const redis = require("redis");
require("dotenv").config();

// Inisialisasi MySQL menggunakan Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const db = pool.promise(); // Gunakan promise untuk query async/await

// Inisialisasi Redis
const redisClient = redis.createClient({
  socket: {
    host: "127.0.0.1",
    port: 6379,
  },
});

redisClient.on("error", (err) => console.error("❌ Redis Error:", err));
redisClient.on("connect", () => console.log("✅ Redis Connected"));
redisClient.on("ready", () => console.log("🚀 Redis Ready"));

// Pastikan Redis terkoneksi
(async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
})();

// Export database dan Redis client
module.exports = { db, redisClient };
