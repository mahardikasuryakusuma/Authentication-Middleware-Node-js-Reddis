const express = require("express");
const { db } = require("../db"); // Pastikan hanya mengimpor `db`
const { authenticateToken, verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// GET Users (Hanya user yang sedang login)
router.get("/users", authenticateToken, async (req, res) => {
  try {
    const [results] = await db.execute("SELECT id, name, email, age FROM users WHERE id = ?", [req.user.id]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE (Tambah Data)
router.post("/users", authenticateToken, async (req, res) => {
  try {
    const { name, email, age } = req.body;
    const sql = "INSERT INTO users (name, email, age, owner_id) VALUES (?, ?, ?, ?)";
    const [result] = await db.execute(sql, [name, email, age, req.user.id]);
    res.status(201).json({ message: "User added", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE (Ubah Data)
router.put("/users/:id", authenticateToken, async (req, res) => {
  try {
    const { name, email, age } = req.body;
    const sql = "UPDATE users SET name = ?, email = ?, age = ? WHERE id = ? AND id = ?";
    const [result] = await db.execute(sql, [name, email, age, req.params.id, req.user.id]);

    if (result.affectedRows === 0) return res.status(403).json({ error: "Unauthorized" });

    res.json({ message: "User updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE (Hapus Data)
router.delete("/users/:id", authenticateToken, async (req, res) => {
  try {
    const sql = "DELETE FROM users WHERE id = ? AND id = ?";
    const [result] = await db.execute(sql, [req.params.id, req.user.id]);

    if (result.affectedRows === 0) return res.status(403).json({ error: "Unauthorized" });

    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route untuk Profil
router.get("/profile", verifyToken, (req, res) => {
  res.json({ message: "Ini halaman profil", user: req.user });
});

module.exports = router;
