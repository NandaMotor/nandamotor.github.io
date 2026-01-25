# 📧 Setup Email Verifikasi - Nanda Motor

## 🔴 Masalah yang Ditemukan

1. **EMAIL_PASSWORD salah** - Menggunakan password login biasa, bukan App Password
2. **Konfigurasi Nodemailer tidak lengkap** - Missing port, secure, tls settings
3. **URL verifikasi hardcoded** - Menggunakan localhost, bukan domain production
4. **SKIP_EMAIL_VERIFICATION=false** - Memaksa verifikasi tapi email tidak bisa terkirim

## ✅ Solusi Quick Fix (Development Mode)

**File: `.env`**
```env
SKIP_EMAIL_VERIFICATION=true
```

Dengan setting ini, user langsung bisa login tanpa verifikasi email.

---

## 🚀 Setup Email Verifikasi (Production Mode)

### **Langkah 1: Generate Gmail App Password**

1. **Buka Google Account Security:**
   - URL: https://myaccount.google.com/security

2. **Aktifkan 2-Step Verification** (jika belum):
   - Scroll ke "2-Step Verification"
   - Klik "Get Started" dan ikuti instruksi

3. **Generate App Password:**
   - URL: https://myaccount.google.com/apppasswords
   - **App**: Mail
   - **Device**: Other (Custom name) → Ketik "Nanda Motor Backend"
   - Klik **Generate**

4. **Copy Password:**
   - Akan muncul 16 karakter (contoh: `abcd efgh ijkl mnop`)
   - Copy **TANPA SPASI** → `abcdefghijklmnop`

### **Langkah 2: Update Environment Variables**

**File: `.env`**
```env
# Email Configuration
EMAIL_USER=muhamad.rifaldi174@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop  # <- Ganti dengan App Password dari langkah 1

# Base URL untuk link verifikasi
BASE_URL=https://nandamotor.github.io

# Enable email verification
SKIP_EMAIL_VERIFICATION=false
```

### **Langkah 3: Restart Server**

```bash
cd BackEnd
npm start
```

**Output yang benar:**
```
✅ Email server is ready to send messages
🚀 Server running on http://localhost:3000
🎉 Terhubung ke Database MySQL!
```

**Output jika gagal:**
```
⚠️ Email transporter error: Invalid login: 535-5.7.8 Username and Password not accepted
📧 Email verification will be DISABLED until configuration is fixed.
```

---

## 🧪 Test Email Configuration

Buat endpoint test di `server.js`:

```javascript
// Test endpoint untuk cek email
app.get("/api/test-email", async (req, res) => {
  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Kirim ke diri sendiri
      subject: 'Test Email - Nanda Motor',
      text: 'Email configuration is working! ✅'
    });
    res.json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message,
      hint: "Check EMAIL_USER and EMAIL_PASSWORD in .env file"
    });
  }
});
```

Test via browser:
```
http://localhost:3000/api/test-email
```

---

## 📝 Troubleshooting

### **Error: "Invalid login: 535-5.7.8 Username and Password not accepted"**

**Penyebab:**
- EMAIL_PASSWORD salah (bukan App Password)
- 2-Step Verification belum aktif
- App Password sudah expired/dihapus

**Solusi:**
1. Pastikan 2-Step Verification aktif
2. Generate App Password baru
3. Copy tanpa spasi ke `.env`
4. Restart server

---

### **Error: "getaddrinfo ENOTFOUND smtp.gmail.com"**

**Penyebab:** Tidak ada koneksi internet

**Solusi:** Cek koneksi internet

---

### **Email masuk ke Spam**

**Solusi:**
1. Tambahkan SPF record di domain (jika menggunakan custom domain)
2. Gunakan email domain sendiri, bukan Gmail
3. Atau gunakan service seperti SendGrid, Mailgun, AWS SES

---

## 🎯 Recommended: Gunakan Email Service Provider

Untuk production yang lebih handal, gunakan:

### **1. SendGrid (Recommended)**
- Free tier: 100 email/hari
- Setup mudah
- Reliable delivery
- https://sendgrid.com

### **2. Mailgun**
- Free tier: 5000 email/bulan (3 bulan pertama)
- https://www.mailgun.com

### **3. AWS SES**
- $0.10 per 1000 email
- Sangat murah untuk scale
- https://aws.amazon.com/ses/

---

## 📊 Current Status

- ✅ **SKIP_EMAIL_VERIFICATION=true** → User langsung bisa login
- ✅ **Server configuration sudah diperbaiki** → Siap untuk production
- ⚠️ **Email belum dikonfigurasi** → Butuh App Password yang valid

---

## 🔧 File yang Sudah Diperbaiki

1. ✅ `server.js` → Konfigurasi nodemailer lengkap + email verification test
2. ✅ `.env` → SKIP_EMAIL_VERIFICATION=true (development mode)
3. ✅ `.env.example` → Dokumentasi lengkap cara setup
4. ✅ `EMAIL_SETUP.md` → Panduan ini

---

## 📞 Need Help?

Jika masih error, kirim screenshot error message lengkap ke admin.
