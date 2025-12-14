// 1. Impor 'tools' yang dibutuhkan
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const jwt = require("jsonwebtoken");
const SECRET_KEY = "rahasia_nanda_motor_123";
const WEBHOOK_SECRET = 'sLUB3cnOW5Vwj2yGlMPKRykryokyp0j0';

// 2. Buat aplikasi Express
const app = express();
const PORT = 3000; // Menjalankan server di Port 3000

// 3. Middleware
app.use(cors());
app.use(express.json());

// Middleware untuk validasi webhook
function validateWebhookSecret(req, res, next) {
    const secret = req.headers['x-webhook-secret'];
    if (secret !== WEBHOOK_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

app.post('/api/whatsapp/send-reply', validateWebhookSecret, async (req, res) => {
    try {
        const { from, message, messageId } = req.body;

        if (!from || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Normalisasi pesan
        const msgLower = message.toLowerCase().trim();
        let replyText = '';

        // Auto-reply berdasarkan keyword
        if (msgLower.includes('oli') || msgLower.includes('oil')) {
            const [products] = await db.query(
                "SELECT nama_produk, harga, stok FROM products WHERE kategori = 'Oli' AND stok > 0 LIMIT 5"
            );
            if (products.length > 0) {
                replyText = '🛢️ *Daftar Oli Tersedia:*\n\n';
                products.forEach((p, i) => {
                    replyText += `${i + 1}. ${p.nama_produk}\n   Harga: Rp ${p.harga.toLocaleString('id-ID')}\n   Stok: ${p.stok}\n\n`;
                });
                replyText += 'Silakan hubungi admin untuk pemesanan.';
            } else {
                replyText = 'Maaf, stok oli sedang kosong.';
            }
        } else if (msgLower.includes('harga') || msgLower.includes('price')) {
            replyText = 'Silakan sebutkan produk yang ingin Anda tanyakan harganya. Contoh: "harga oli merah"';
        } else if (msgLower.includes('stok') || msgLower.includes('stock')) {
            replyText = 'Silakan sebutkan produk yang ingin dicek stoknya.';
        } else if (msgLower.includes('katalog') || msgLower.includes('produk')) {
            const [count] = await db.query("SELECT COUNT(*) as total FROM products WHERE stok > 0");
            replyText = `Kami memiliki ${count[0].total} produk tersedia.\n\nKategori:\n- Oli\n- Ban\n- Sparepart\n- Service\n\nBalas dengan nama kategori untuk melihat produk.`;
        } else {
            // Default reply
            replyText = `Halo! Selamat datang di Nanda Motor 🏍️\n\nBalas dengan:\n- "oli" untuk lihat produk oli\n- "katalog" untuk lihat semua kategori\n- "harga [produk]" untuk tanya harga\n\nAdmin kami siap melayani Anda.`;
        }

        // Simpan log pesan (opsional)
        try {
            await db.query(
                "INSERT INTO whatsapp_logs (from_number, message, reply, created_at) VALUES (?, ?, ?, NOW())",
                [from, message, replyText]
            );
        } catch (logErr) {
            console.warn('Gagal simpan log WhatsApp:', logErr.message);
        }

        res.json({
            success: true,
            reply: replyText,
            to: from
        });
    } catch (error) {
        console.error('Error webhook WhatsApp:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Multer memory storage untuk meng-handle upload file sebelum dikirim ke Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  }
});

// Konfigurasi Cloudinary (gunakan CLOUDINARY_URL jika tersedia, atau variabel terpisah)
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ url: process.env.CLOUDINARY_URL });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

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

// Pastikan kolom gambar dan public_id ada di tabel products (lebih kompatibel)
(async function ensureProductImageColumns() {
  try {
    const dbName = process.env.DB_NAME || 'nanda_motor_db';

    // Cek kolom 'gambar'
    const [gambarRows] = await db.query(
      `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = 'gambar'`,
      [dbName]
    );
    if (gambarRows[0].cnt === 0) {
      await db.query("ALTER TABLE products ADD COLUMN gambar VARCHAR(255) NULL");
      console.log('✅ Kolom `gambar` ditambahkan ke tabel products.');
    }

    // Cek kolom 'public_id'
    const [publicRows] = await db.query(
      `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = 'public_id'`,
      [dbName]
    );
    if (publicRows[0].cnt === 0) {
      await db.query("ALTER TABLE products ADD COLUMN public_id VARCHAR(255) NULL");
      console.log('✅ Kolom `public_id` ditambahkan ke tabel products.');
    }
  } catch (err) {
    console.warn('⚠️ Gagal memastikan kolom gambar/public_id secara otomatis. Jika perlu, tambahkan kolom secara manual:', err.message);
  }
})();

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
// RUTE TAMBAH PRODUK (meng-handle upload gambar ke Cloudinary)
app.post("/api/products", upload.single('gambar'), async (req, res) => {
  const { nama_produk, harga, stok, kategori } = req.body;

  // Validasi sederhana
  if (!nama_produk || !harga || !stok) {
    return res.status(400).json({ message: "Data produk tidak lengkap!" });
  }

  try {
    let gambarUrl = null;
    let publicId = null;

    if (req.file) {
      const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: 'nanda_motor_products',
        resource_type: 'image'
      });
      gambarUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;
    }

    // Simpan ke database (gambar dan public_id boleh null)
    const sql = "INSERT INTO products (nama_produk, harga, stok, kategori, gambar, public_id) VALUES (?, ?, ?, ?, ?, ?)";
    const values = [nama_produk, harga, stok, kategori || null, gambarUrl, publicId];

    await db.query(sql, values);

    res.status(201).json({ message: "Produk berhasil ditambahkan!", gambar: gambarUrl });
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
// RUTE UPDATE PRODUK (meng-handle optional penggantian gambar)
app.put('/api/products/:id', upload.single('gambar'), async (req, res) => {
  const { id } = req.params;
  const { nama_produk, harga, stok, kategori } = req.body;

  try {
    let gambarUrl = null;
    let publicId = null;

    // Jika ada file baru, unggah ke Cloudinary
    if (req.file) {
      // Ambil public_id lama untuk dihapus (opsional)
      try {
        const [rows] = await db.query('SELECT public_id FROM products WHERE id = ?', [id]);
        if (rows && rows.length > 0 && rows[0].public_id) {
          const oldPublicId = rows[0].public_id;
          // Hapus file lama di Cloudinary (tidak fatal jika gagal)
          try { await cloudinary.uploader.destroy(oldPublicId); } catch (e) { /* ignore */ }
        }
      } catch (e) {
        // ignore
      }

      const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: 'nanda_motor_products',
        resource_type: 'image'
      });
      gambarUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;
    }

    let sql, params;
    if (gambarUrl) {
      sql = `UPDATE products SET nama_produk=?, harga=?, stok=?, kategori=?, gambar=?, public_id=? WHERE id=?`;
      params = [nama_produk, harga, stok, kategori, gambarUrl, publicId, id];
    } else {
      sql = `UPDATE products SET nama_produk=?, harga=?, stok=?, kategori=? WHERE id=?`;
      params = [nama_produk, harga, stok, kategori, id];
    }

    await db.query(sql, params);
    res.json({ message: 'Produk berhasil diupdate!', gambar: gambarUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengupdate produk' });
  }
});

// Jalankan Server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
