/* =========================================
   1. IMPORT LIBRARIES & KONFIGURASI
   ========================================= */
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken");
const axios = require("axios");
require("dotenv").config();

// WA Bot API URL (dari repo MuhRifa2024/wa-bot)
const WA_BOT_API = process.env.WA_BOT_API || "http://localhost:5000";

const app = express();
const PORT = 3000;
const SECRET_KEY = "rahasia_nanda_motor_123";
const WEBHOOK_SECRET = "sLUB3cnOW5Vwj2yGlMPKRykryokyp0j0";

/* =========================================
   2. MIDDLEWARE & CLOUDINARY
   ========================================= */
app.use(cors());
app.use(express.json());

// Konfigurasi Upload (Multer) - Simpan di Memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Hanya file gambar yang diperbolehkan!"), false);
  },
});

// Konfigurasi Cloudinary
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ url: process.env.CLOUDINARY_URL });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Middleware Validasi Webhook
function validateWebhookSecret(req, res, next) {
  const secret = req.headers["x-webhook-secret"];
  if (secret !== WEBHOOK_SECRET) return res.status(401).json({ error: "Unauthorized" });
  next();
}

/* =========================================
   3. KONEKSI DATABASE & INISIALISASI
   ========================================= */
const db = mysql
  .createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "nanda_motor_db",
  })
  .promise();

// Cek Koneksi & Init Bot WA
let waBot = null;
(async () => {
  try {
    await db.query("SELECT 1");
    console.log("🎉 Terhubung ke Database MySQL!");

    // Cek Kolom Gambar (Migrasi Otomatis)
    const dbName = "nanda_motor_db";
    const checkColumn = async (colName) => {
        const [rows] = await db.query(
            `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = ?`,
            [dbName, colName]
        );
        if (rows[0].cnt === 0) {
            await db.query(`ALTER TABLE products ADD COLUMN ${colName} VARCHAR(255) NULL`);
            console.log(`✅ Kolom '${colName}' berhasil ditambahkan.`);
        }
    };
    await checkColumn('gambar');
    await checkColumn('public_id');

    // Cek koneksi ke WA Bot API
    try {
        const res = await axios.get(`${WA_BOT_API}/api/health`, { timeout: 3000 });
        if (res.data.success) {
            console.log("✅ WA Bot API terhubung:", WA_BOT_API);
            console.log("   WhatsApp:", res.data.whatsapp || "checking...");
        }
    } catch (err) {
        console.warn("⚠️ WA Bot belum aktif. Jalankan wa-bot terlebih dahulu.");
        console.warn("   Clone repo: git clone https://github.com/MuhRifa2024/wa-bot.git");
    }

  } catch (error) {
    console.error("❌ Gagal inisialisasi server:", error.message);
  }
})();


/* =========================================
   3. ROUTE: ROOT (INFO SERVER)
   ========================================= */
app.get("/", (req, res) => {
  res.json({
    name: "Nanda Motor API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      auth: ["/api/register", "/api/login"],
      products: ["/api/products"],
      whatsapp: ["/api/whatsapp/contact-owner", "/api/whatsapp/send-reply"]
    },
    waBot: WA_BOT_API,
    message: "Buka FrontEnd untuk melihat website"
  });
});

/* =========================================
   4. ROUTE: AUTHENTICATION (LOGIN/REGISTER)
   ========================================= */
app.post("/api/register", async (req, res) => {
  const { nama, email, password } = req.body;

  if (!nama || !email || !password) return res.status(400).json({ message: "Semua kolom harus diisi!" });
  if (!email.endsWith("@gmail.com")) return res.status(400).json({ message: "Wajib menggunakan email @gmail.com" });

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length > 0) return res.status(400).json({ message: "Email sudah terdaftar!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query("INSERT INTO users (nama, email, password) VALUES (?, ?, ?)", [nama, email, hashedPassword]);

    res.status(201).json({ message: "Registrasi berhasil! Silakan login." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) return res.status(401).json({ message: "Email atau password salah!" });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Email atau password salah!" });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: "1h" });

    res.json({ message: "Login berhasil!", token, role: user.role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* =========================================
   5. ROUTE: PRODUCTS (CRUD)
   ========================================= */
// GET ALL
app.get("/api/products", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM products ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Gagal ambil data" });
  }
});

// GET ONE
app.get("/api/products/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Produk tidak ditemukan" });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Error ambil data" });
  }
});

// CREATE (Dengan Gambar)
app.post("/api/products", upload.single("gambar"), async (req, res) => {
  const { nama_produk, harga, stok, kategori } = req.body;
  if (!nama_produk || !harga || !stok) return res.status(400).json({ message: "Data tidak lengkap" });

  try {
    let gambarUrl = null;
    let publicId = null;

    if (req.file) {
      const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const uploadResult = await cloudinary.uploader.upload(dataUri, { folder: "nanda_motor_products" });
      gambarUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;
    }

    await db.query(
      "INSERT INTO products (nama_produk, harga, stok, kategori, gambar, public_id) VALUES (?, ?, ?, ?, ?, ?)",
      [nama_produk, harga, stok, kategori || null, gambarUrl, publicId]
    );

    res.status(201).json({ message: "Produk ditambahkan!", gambar: gambarUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal upload produk" });
  }
});

// UPDATE
app.put("/api/products/:id", upload.single("gambar"), async (req, res) => {
  const { id } = req.params;
  const { nama_produk, harga, stok, kategori } = req.body;

  try {
    let gambarUrl = null;
    let publicId = null;

    if (req.file) {
      // Hapus gambar lama jika ada
      const [rows] = await db.query("SELECT public_id FROM products WHERE id = ?", [id]);
      if (rows.length > 0 && rows[0].public_id) {
         try { await cloudinary.uploader.destroy(rows[0].public_id); } catch (e) {}
      }

      // Upload baru
      const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const uploadResult = await cloudinary.uploader.upload(dataUri, { folder: "nanda_motor_products" });
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
    res.json({ message: "Produk diupdate!", gambar: gambarUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal update produk" });
  }
});

// DELETE
app.delete("/api/products/:id", async (req, res) => {
  try {
    // Hapus gambar di Cloudinary dulu
    const [rows] = await db.query("SELECT public_id FROM products WHERE id = ?", [req.params.id]);
    if (rows.length > 0 && rows[0].public_id) {
        try { await cloudinary.uploader.destroy(rows[0].public_id); } catch (e) {}
    }
    
    await db.query("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ message: "Produk dihapus!" });
  } catch (error) {
    res.status(500).json({ message: "Gagal hapus produk" });
  }
});

/* =========================================
   6. ROUTE: WHATSAPP WEBHOOK (INTEGRASI WA-BOT API)
   ========================================= */
app.post("/api/whatsapp/contact-owner", async (req, res) => {
  const { sessionId, customerName, customerPhone, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    console.log("📤 Forwarding to WA Bot API:", { sessionId, customerName, message });

    // Forward ke wa-bot API endpoint /webhook/web-chat
    const response = await axios.post(
      `${WA_BOT_API}/webhook/web-chat`,
      {
        sessionId: sessionId || `web-${Date.now()}`,
        message: message,
        customerName: customerName || "Customer Website",
        customerPhone: customerPhone || null,
        customerEmail: null,
        metadata: {
          source: "nanda-motor-website",
          timestamp: new Date().toISOString(),
        },
      },
      { timeout: 5000 }
    );

    console.log("✅ WA Bot response:", response.data);

    res.json({
      success: true,
      message: "Pesan Anda telah diterima owner via WhatsApp! Owner akan membalas segera.",
      ownerNumber: "+62 853-1462-7451",
      botStatus: response.data.forwardedToAdmin ? "delivered" : "queued",
    });
  } catch (error) {
    console.error("❌ Error forwarding to WA Bot:", error.message);

    // Fallback jika wa-bot offline
    res.status(503).json({
      success: false,
      error: "WhatsApp Bot sedang offline",
      message: "Silakan hubungi langsung via WhatsApp: +62 853-1462-7451",
      fallbackNumber: "6285314627451",
    });
  }
});

// START SERVER
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));