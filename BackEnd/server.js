// 1. Impor 'tools' yang dibutuhkan
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const jwt = require("jsonwebtoken");
const SECRET_KEY = "rahasia_nanda_motor_123";

// 2. Buat aplikasi Express
const app = express();
const PORT = 3000; // Menjalankan server di Port 3000

// 3. Middleware
app.use(cors());
app.use(express.json());

// 4. Buat Koneksi Pool ke Database MySQL
const db = mysql
  .createPool({
    host: "localhost", // Alamat server database Anda (dari Laragon)
    user: "root", // Username default MySQL
    password: "", // Password default MySQL (kosong)
    database: "nanda_motor_db", // Nama database yang Anda buat
  })
  .promise(); // Tambahkan .promise() agar bisa pakai syntax modern (async/await)

// 5. Tes Koneksi Database
async function testDbConnection() {
  try {
    // Ambil satu koneksi dari pool dan jalankan query sederhana
    await db.query("SELECT 1");
    console.log("🎉 Berhasil terhubung ke database MySQL!");
  } catch (error) {
    console.error("❌ Gagal terhubung ke database:", error);
  }
}
testDbConnection(); // Jalankan fungsi tes koneksi

// 6. Definisikan "Rute" (Routes)
app.get("/", (req, res) => {
  res.send("Halo! Server BackEnd Nanda Motor sudah berjalan.");
});

// RUTE REGISTRASI
app.post("/api/register", async (req, res) => {
  const { nama, email, password } = req.body; // Ambil data yang dikirim

  // 1. Validasi sederhana: Pastikan data tidak kosong
  if (!nama || !email || !password) {
    return res.status(400).json({ message: "Semua kolom harus diisi!" });
  }

  try {
    // 2. Cek apakah email sudah terdaftar?
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length > 0) {
      return res.status(400).json({ message: "Email sudah terdaftar!" });
    }

    // 3. Enkripsi Password (Hashing)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Simpan ke Database
    // Role otomatis diisi 'user' (sesuai default database)
    await db.query(
      "INSERT INTO users (nama, email, password) VALUES (?, ?, ?)",
      [nama, email, hashedPassword]
    );

    // 5. Kirim respon sukses
    res.status(201).json({ message: "Registrasi berhasil! Silakan login." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan di server." });
  }
});

// RUTE LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email dan password harus diisi!" });
  }

  try {
    // 1. Cari user berdasarkan email
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({ message: "Email atau password salah!" });
    }
    const user = users[0];

    // 2. Cek password (bandingkan password input dengan password hash di DB)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email atau password salah!" });
    }

    // 3. Buat Token (JWT)
    const token = jwt.sign(
      { id: user.id, role: user.role }, // Isi token
      SECRET_KEY, // Kunci rahasia
      { expiresIn: "1h" } // Token kadaluwarsa dalam 1 jam
    );

    // 4. Kirim Token dan Role kembali ke FrontEnd
    res.json({
      message: "Login berhasil!",
      token: token,
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
});

// RUTE AMBIL SEMUA PRODUK (READ)
app.get("/api/products", async (req, res) => {
  try {
    // Ambil semua data dari tabel products
    const [rows] = await db.query(
      "SELECT * FROM products ORDER BY created_at DESC"
    );

    // Kirim datanya ke FrontEnd
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data produk" });
  }
});

// RUTE TAMBAH PRODUK (CREATE)
app.post("/api/products", async (req, res) => {
  const { nama_produk, harga, stok, kategori } = req.body;

  // Validasi sederhana
  if (!nama_produk || !harga || !stok) {
    return res.status(400).json({ message: "Data produk tidak lengkap!" });
  }

  try {
    // Simpan ke database
    const sql =
      "INSERT INTO products (nama_produk, harga, stok, kategori, gambar) VALUES (?, ?, ?, ?, ?)";
    const values = [nama_produk, harga, stok, kategori, "default.jpg"];

    await db.query(sql, values);

    res.status(201).json({ message: "Produk berhasil ditambahkan!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal menambah produk." });
  }
});

// RUTE HAPUS PRODUK (DELETE)
app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params; // Ambil ID dari URL

  try {
    // Hapus data dari database berdasarkan ID
    await db.query("DELETE FROM products WHERE id = ?", [id]);

    res.json({ message: "Produk berhasil dihapus!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal menghapus produk." });
  }
});

// RUTE AMBIL 1 PRODUK (Untuk diisi ke Form Edit)
app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error mengambil data' });
  }
});

// RUTE UPDATE PRODUK (PUT)
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { nama_produk, harga, stok, kategori } = req.body;

  try {
    const sql = 'UPDATE products SET nama_produk = ?, harga = ?, stok = ?, kategori = ? WHERE id = ?';
    await db.query(sql, [nama_produk, harga, stok, kategori, id]);
    res.json({ message: 'Produk berhasil diupdate!' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengupdate produk' });
  }
});

// Jalankan Server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
