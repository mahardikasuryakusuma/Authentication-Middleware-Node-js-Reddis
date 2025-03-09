const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db, redisClient } = require("../db"); // 🔹 Gunakan Redis dari db.js
const { authenticateToken, verifyToken, checkBlacklist } = require("../middleware/authMiddleware");

const router = express.Router();

// Validasi environment variable JWT_SECRET
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET tidak ditemukan di environment variables");
}

// Fungsi untuk menjalankan query dengan Promise
const queryAsync = (sql, values) => {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// REGISTER (Daftar Akun)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, age } = req.body;

    // Cek apakah email sudah digunakan
    const userExists = await queryAsync("SELECT id FROM users WHERE email = ?", [email]);
    if (userExists.length > 0) {
      return res.status(400).json({ message: "Email sudah digunakan" });
    }

    // Hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user ke database
    const sql = "INSERT INTO users (name, email, password, age) VALUES (?, ?, ?, ?)";
    const result = await queryAsync(sql, [name, email, hashedPassword, age]);

    res.status(201).json({ message: "User registered", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN (Masuk Akun)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = await queryAsync("SELECT id, email, password FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: "Email atau password salah" });
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Email atau password salah" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "Login berhasil", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGOUT (Menggunakan Redis untuk blacklist token)
router.post("/logout", verifyToken, checkBlacklist, async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(400).json({ message: "Token tidak ditemukan" });
    }

    // Simpan token ke Redis dengan waktu kedaluwarsa 1 jam (3600 detik)
    await redisClient.setEx(token, 3600, "blacklisted");

    res.json({ message: "Logout berhasil" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
