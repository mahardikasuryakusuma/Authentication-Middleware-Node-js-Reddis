const jwt = require("jsonwebtoken");
const { redisClient } = require("../db"); // 🔹 Gunakan Redis dari db.js

const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) return res.status(401).json({ message: "Akses ditolak, token tidak ada" });

  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ message: "Token tidak valid" });
  }
};

const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) return res.status(401).json({ message: "Akses ditolak, token tidak ditemukan" });

  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Token tidak valid" });
  }
};

// ✅ Middleware untuk cek blacklist Redis
const checkBlacklist = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Akses ditolak, token tidak ditemukan" });

  try {
    // Pastikan Redis terbuka sebelum digunakan
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    const isBlacklisted = await redisClient.get(token);
    if (isBlacklisted) {
      return res.status(401).json({ error: "Token telah diblacklist, silakan login kembali" });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: "Gagal memeriksa blacklist token" });
  }
};

module.exports = { authenticateToken, verifyToken, checkBlacklist };
