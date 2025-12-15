/**
 * WhatsApp Bot Integration
 * Menggunakan whatsapp-web.js untuk terhubung dengan WhatsApp asli
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const mysql = require('mysql2/promise');

// Nomor WhatsApp owner (ganti dengan nomor asli, format: 6285314627451)
const OWNER_NUMBER = '6285314627451@c.us';

class WhatsAppBot {
    constructor(dbPool) {
        this.db = dbPool;
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        this.initializeBot();
    }

    initializeBot() {
        // Event: QR Code untuk login WhatsApp Web
        this.client.on('qr', (qr) => {
            console.log('\n📱 Scan QR Code di bawah ini dengan WhatsApp Anda:\n');
            qrcode.generate(qr, { small: true });
            console.log('\n⚠️ Buka WhatsApp > Linked Devices > Link a Device\n');
        });

        // Event: WhatsApp siap
        this.client.on('ready', () => {
            console.log('✅ WhatsApp Bot terhubung dan siap!');
        });

        // Event: Terima pesan dari WhatsApp
        this.client.on('message', async (msg) => {
            await this.handleIncomingMessage(msg);
        });

        // Event: Error
        this.client.on('auth_failure', () => {
            console.error('❌ Autentikasi WhatsApp gagal!');
        });

        this.client.on('disconnected', () => {
            console.log('⚠️ WhatsApp Bot terputus!');
        });

        // Initialize client
        this.client.initialize();
    }

    async handleIncomingMessage(msg) {
        try {
            const from = msg.from;
            const message = msg.body;

            console.log(`📩 Pesan dari ${from}: ${message}`);

            // Cek apakah ini balasan owner untuk customer
            if (from === OWNER_NUMBER) {
                // Owner membalas, forward ke website/database
                await this.handleOwnerReply(message);
            } else {
                // Auto-reply untuk customer
                await this.handleCustomerMessage(from, message, msg);
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    async handleCustomerMessage(from, message, msg) {
        const msgLower = message.toLowerCase().trim();
        let replyText = '';

        // Auto-reply berdasarkan keyword
        if (msgLower.includes('oli') || msgLower.includes('oil')) {
            const [products] = await this.db.query(
                "SELECT nama_produk, harga, stok FROM products WHERE kategori = 'Oli' AND stok > 0 LIMIT 5"
            );
            if (products.length > 0) {
                replyText = '🛢️ *Daftar Oli Tersedia:*\n\n';
                products.forEach((p, i) => {
                    replyText += `${i + 1}. ${p.nama_produk}\n   Harga: Rp ${p.harga.toLocaleString('id-ID')}\n   Stok: ${p.stok}\n\n`;
                });
                replyText += '\nKetik *owner* untuk chat langsung dengan kami.';
            } else {
                replyText = 'Maaf, stok oli sedang kosong.';
            }
        } else if (msgLower === 'owner' || msgLower === 'admin' || msgLower === 'help') {
            replyText = '📞 Anda akan terhubung dengan owner kami. Silakan tunggu balasan dari owner.';
            // Forward ke owner
            await this.forwardToOwner(from, message);
        } else if (msgLower.includes('katalog') || msgLower.includes('produk')) {
            const [count] = await this.db.query("SELECT COUNT(*) as total FROM products WHERE stok > 0");
            replyText = `Kami memiliki ${count[0].total} produk tersedia.\n\nKategori:\n- Oli\n- Ban\n- Sparepart\n- Service\n\nBalas dengan nama kategori atau ketik *owner* untuk chat langsung.`;
        } else {
            replyText = `Halo! Selamat datang di Nanda Motor 🏍️\n\nBalas dengan:\n- *oli* - lihat produk oli\n- *katalog* - lihat semua kategori\n- *owner* - chat dengan owner\n\nAtau langsung chat dengan owner kami!`;
        }

        // Kirim balasan
        await msg.reply(replyText);

        // Simpan log ke database
        await this.saveMessageLog(from, message, replyText, 'bot');
    }

    async handleOwnerReply(message) {
        // Parse format balasan owner: "Reply [customer_number]: [message]"
        // Atau simpan context dari pesan sebelumnya
        console.log('Owner reply:', message);
        // Implementasi parsing dan forward ke customer
    }

    async forwardToOwner(customerNumber, message) {
        try {
            const ownerMsg = `📨 *Pesan Baru dari Customer*\n\nDari: ${customerNumber}\nPesan: ${message}\n\n_Balas pesan ini untuk membalas customer_`;
            await this.client.sendMessage(OWNER_NUMBER, ownerMsg);
            console.log(`✅ Pesan diteruskan ke owner: ${customerNumber}`);
        } catch (error) {
            console.error('Error forwarding to owner:', error);
        }
    }

    async sendToCustomer(customerNumber, message) {
        try {
            await this.client.sendMessage(customerNumber, message);
            console.log(`✅ Pesan terkirim ke ${customerNumber}`);
            return true;
        } catch (error) {
            console.error('Error sending to customer:', error);
            return false;
        }
    }

    async saveMessageLog(from, message, reply, source) {
        try {
            await this.db.query(
                "INSERT INTO whatsapp_logs (from_number, message, reply, source, created_at) VALUES (?, ?, ?, ?, NOW())",
                [from, message, reply, source]
            );
        } catch (error) {
            console.warn('Gagal simpan log:', error.message);
        }
    }

    getClient() {
        return this.client;
    }
}

module.exports = WhatsAppBot;
