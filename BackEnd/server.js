// 1. Impor 'tools' yang dibutuhkan
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');

// 2. Buat aplikasi Express
const app = express();
const PORT = 3000; // Menjalankan server di Port 3000

// 3. Middleware
app.use(cors());
app.use(express.json());

// 4. Buat Koneksi Pool ke Database MySQL
const db = mysql.createPool({
  host: 'localhost',      // Alamat server database Anda (dari Laragon)
  user: 'root',           // Username default MySQL
  password: '',           // Password default MySQL (kosong)
  database: 'nanda_motor_db' // Nama database yang Anda buat
}).promise(); // Kita tambahkan .promise() agar bisa pakai syntax modern (async/await)

// 5. Tes Koneksi Database
async function testDbConnection() {
  try {
    // Ambil satu koneksi dari pool dan jalankan query sederhana
    await db.query('SELECT 1');
    console.log('🎉 Berhasil terhubung ke database MySQL!');
  } catch (error) {
    console.error('❌ Gagal terhubung ke database:', error);
  }
}

testDbConnection(); // Jalankan fungsi tes koneksi

// 6. Definisikan "Rute" (Routes)
app.get('/', (req, res) => {
  res.send('Halo! Server BackEnd Nanda Motor sudah berjalan.');
});

app.post('/api/register', async (req, res) => {
  const { nama, email, password } = req.body; // Ambil data yang dikirim

  // 1. Validasi sederhana: Pastikan data tidak kosong
  if (!nama || !email || !password) {
    return res.status(400).json({ message: 'Semua kolom harus diisi!' });
  }

  try {
    // 2. Cek apakah email sudah terdaftar?
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar!' });
    }

    // 3. Enkripsi Password (Hashing)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Simpan ke Database
    // Role otomatis diisi 'user' (sesuai default database)
    await db.query('INSERT INTO users (nama, email, password) VALUES (?, ?, ?)', 
      [nama, email, hashedPassword]);

    // 5. Kirim respon sukses
    res.status(201).json({ message: 'Registrasi berhasil! Silakan login.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan di server.' });
  }
});

// 7. Jalankan Server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});