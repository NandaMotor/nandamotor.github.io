# CARA INTEGRASI DENGAN WA-BOT

## File whatsapp-bot.js TIDAK DIGUNAKAN ❌

File `whatsapp-bot.js` yang saya buat tadi **SALAH** - harusnya tidak membuat bot baru, tapi menggunakan bot yang sudah ada di https://github.com/MuhRifa2024/wa-bot

## Yang Benar: Integrasi via API

### Step 1: Clone dan Jalankan wa-bot

```bash
# Buka terminal baru
cd C:\Users\Admin
git clone https://github.com/MuhRifa2024/wa-bot.git
cd wa-bot
npm install
```

### Step 2: Konfigurasi wa-bot

Buat file `.env` di folder `wa-bot`:

```env
# Database Mode
DB_MODE=mysql

# MySQL Configuration (SAMA dengan nandamotor.github.io)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=nanda_motor_db

# Bot Configuration
BOT_PORT=5000
ADMIN_WHATSAPP=6285314627451
```

### Step 3: Jalankan wa-bot

```bash
cd wa-bot
npm start
```

Buka browser: `http://localhost:5000` dan scan QR code dengan WhatsApp

### Step 4: Update server.js Nanda Motor

Tambahkan di bagian atas server.js (setelah require statements):

```javascript
const axios = require('axios');
const WA_BOT_API = 'http://localhost:5000';

// Check WA Bot connection
async function checkWABot() {
    try {
        const res = await axios.get(`${WA_BOT_API}/api/health`);
        console.log('✅ WA Bot connected:', res.data.status);
    } catch (err) {
        console.warn('⚠️ WA Bot offline. Jalankan wa-bot terlebih dahulu.');
    }
}
checkWABot();
```

Ubah endpoint `/api/whatsapp/contact-owner`:

```javascript
app.post('/api/whatsapp/contact-owner', async (req, res) => {
    try {
        const { sessionId, customerName, customerPhone, message } = req.body;

        // Forward ke WA Bot API
        const response = await axios.post(`${WA_BOT_API}/webhook/web-chat`, {
            sessionId: sessionId || `web-${Date.now()}`,
            message: message,
            customerName: customerName || 'Customer',
            customerPhone: customerPhone,
            customerEmail: null
        });

        res.json({
            success: true,
            message: 'Pesan diterima owner via WhatsApp!',
            ownerNumber: '+62 853-1462-7451'
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            message: 'WhatsApp Bot offline. Hubungi: +62 853-1462-7451'
        });
    }
});
```

### Step 5: Install axios

```bash
cd C:\Users\Admin\nandamotor.github.io\BackEnd
npm install axios
```

### Step 6: Hapus file whatsapp-bot.js

```bash
# File ini tidak dipakai
rm whatsapp-bot.js
```

## Testing

1. Jalankan wa-bot di terminal 1:
   ```bash
   cd wa-bot
   npm start
   ```

2. Jalankan nanda motor backend di terminal 2:
   ```bash
   cd nandamotor.github.io/BackEnd
   node server.js
   ```

3. Buka website dan klik tombol "Chat dengan Owner"

4. Owner akan terima pesan di WhatsApp!

## Database Structure

wa-bot akan membuat tabel baru:
- `web_chats` - Chat dari website
- `whatsapp_chats` - Chat WA e-commerce
- `orders` - Orders dari WA
- `whatsapp_customers` - Customer data

Gunakan database yang SAMA (`nanda_motor_db`) untuk kedua aplikasi.

## Keuntungan

✅ Owner terima di WA langsung  
✅ Owner balas dari HP (tidak perlu buka website)  
✅ Chat history tersimpan  
✅ Auto-reply sudah ada di wa-bot  
✅ Satu database untuk semua

## Referensi

- wa-bot README: wa-bot/README.md
- API endpoints: wa-bot berjalan di http://localhost:5000
- Health check: GET http://localhost:5000/api/health
