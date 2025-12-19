# Integrasi WhatsApp Bot - Nanda Motor

## Arsitektur Sistem

```
┌─────────────────────┐         ┌──────────────────────┐
│  Nanda Motor Web    │         │   WA Bot Server      │
│  (localhost:3000)   │◄───────►│  (localhost:5000)    │
│                     │  API    │                      │
│  - FrontEnd         │  Calls  │  - WhatsApp Client   │
│  - BackEnd          │         │  - Auto Reply        │
│  - MySQL DB         │         │  - Web Chat Service  │
└─────────────────────┘         └──────────────────────┘
         │                               │
         │                               │
         ▼                               ▼
   Customer Chat                   Owner WhatsApp
```

## Setup

### 1. Install wa-bot dari GitHub

```bash
# Clone bot repository
git clone https://github.com/MuhRifa2024/wa-bot.git
cd wa-bot

# Install dependencies
npm install

# Setup environment
cp .env.example .env
```

### 2. Konfigurasi wa-bot

Edit `.env` di folder wa-bot:

```env
# Mode database (pilih salah satu)
DB_MODE=mysql

# MySQL Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=nanda_motor_db

# Bot Configuration
BOT_PORT=5000
ADMIN_WHATSAPP=6285314627451
```

### 3. Jalankan wa-bot

```bash
cd wa-bot
npm start

# Buka http://localhost:5000
# Scan QR code dengan WhatsApp
```

### 4. Jalankan Nanda Motor Backend

```bash
cd nandamotor.github.io/BackEnd
npm install axios  # Install axios jika belum
node server.js
```

## Cara Kerja

### Flow Chat dengan Owner:

1. **Customer di Website** → Klik "Chat dengan Owner"
2. **Frontend** → Kirim POST ke `/api/whatsapp/contact-owner`
3. **Backend Website** → Forward ke wa-bot API `/webhook/web-chat`
4. **wa-bot** → Forward pesan ke WhatsApp owner
5. **Owner** → Terima notifikasi di WhatsApp
6. **Owner** → Balas langsung di WhatsApp
7. **wa-bot** → Simpan balasan di database
8. **Website** → Bisa ambil balasan via API (opsional)

### Endpoints yang Digunakan:

#### Dari Website ke wa-bot:
- `POST /webhook/web-chat` - Kirim pesan dari website ke WA owner
- `GET /api/web-chats` - Ambil semua session chat
- `GET /api/web-chats/:sessionId` - Ambil chat tertentu
- `POST /api/web-chats/:sessionId/reply` - Owner balas via admin panel

#### Health Check:
- `GET /api/health` - Cek status wa-bot

## Database Sharing

Kedua aplikasi menggunakan **database MySQL yang sama** (`nanda_motor_db`):

### Tabel yang dipakai bersama:
- `products` - Data produk
- `users` - User website
- `whatsapp_logs` - Log chat (opsional)

### Tabel khusus wa-bot:
- `web_chats` - Chat dari website
- `whatsapp_chats` - Chat e-commerce WA
- `orders` - Order dari WA
- `whatsapp_customers` - Customer WA

## Testing

### Test wa-bot berjalan:

```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "whatsappChat": true,
    "webChat": true
  }
}
```

### Test kirim pesan ke owner:

```bash
curl -X POST http://localhost:3000/api/whatsapp/contact-owner \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "customerName": "John Doe",
    "message": "Halo, saya mau tanya produk"
  }'
```

## Troubleshooting

### wa-bot tidak terhubung:
1. Pastikan wa-bot running di port 5000
2. Cek QR code di http://localhost:5000
3. Scan QR dengan WhatsApp

### Pesan tidak sampai ke owner:
1. Cek `ADMIN_WHATSAPP` di wa-bot `.env`
2. Format: `6285314627451` (tanpa +, -, spasi)
3. Lihat log di terminal wa-bot

### Database error:
1. Pastikan kedua app gunakan DB yang sama
2. Jalankan migration wa-bot:
   ```bash
   cd wa-bot
   npm run migrate  # atau jalankan manual SQL
   ```

## Production Deployment

### Jalankan dengan PM2:

```bash
# wa-bot
cd wa-bot
pm2 start index.js --name wa-bot

# Nanda Motor backend
cd nandamotor.github.io/BackEnd
pm2 start server.js --name nanda-motor-api

# Monitoring
pm2 logs
pm2 status
```

## Keuntungan Integrasi Ini

✅ Owner terima pesan di WhatsApp langsung (no need website)  
✅ Owner balas dari WhatsApp (customer terima notifikasi)  
✅ Semua chat tersimpan di database  
✅ Admin panel bisa monitor chat  
✅ Auto-reply untuk keyword umum (oli, harga, katalog)  
✅ Satu database untuk semua data

## Referensi

- wa-bot repo: https://github.com/MuhRifa2024/wa-bot
- API documentation: wa-bot/README.md
- Database schema: wa-bot/database/schema.sql
