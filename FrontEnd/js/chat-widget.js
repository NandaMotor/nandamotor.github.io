/**
 * Live Chat Widget JavaScript
 * Dengan console logging untuk debugging
 */

const API_URL = 'https://rif.alwaysdata.net';

console.log('🚀 Chat Widget Loaded');
console.log('📡 API URL:', API_URL);

class ChatWidget {
    constructor() {
        console.log('🔧 Initializing Chat Widget...');
        this.sessionId = this.getOrCreateSessionId();
        this.customerInfo = this.loadCustomerInfo();
        this.messages = [];
        this.pollInterval = null;
        
        console.log('🆔 Session ID:', this.sessionId);
        console.log('👤 Customer Info:', this.customerInfo);
        
        this.init();
    }

    init() {
        console.log('⚙️ Setting up event listeners...');
        
        // Elements
        this.chatButton = document.getElementById('chatButton');
        this.chatWindow = document.getElementById('chatWindow');
        this.closeButton = document.getElementById('closeChat');
        this.chatForm = document.getElementById('chatForm');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendMessage');
        this.startChatButton = document.getElementById('startChat');
        this.badge = document.getElementById('chatBadge');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.connectionStatus = document.getElementById('connectionStatus');

        if (!this.chatButton) {
            console.error('❌ Chat button not found!');
            return;
        }

        console.log('✅ All elements found');

        // Event listeners
        this.chatButton.addEventListener('click', () => this.toggleChat());
        this.closeButton.addEventListener('click', () => this.closeChat());
        this.startChatButton.addEventListener('click', () => this.handleStartChat());
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        console.log('🎯 Event listeners attached');

        // Check backend connection
        this.checkConnection();

        // If customer info exists, skip form
        if (this.customerInfo) {
            console.log('✅ Customer info exists, showing chat interface');
            this.showChatInterface();
            this.sendInitialGreeting();
        }

        console.log('✅ Chat Widget initialized successfully');
    }

    getOrCreateSessionId() {
        let sessionId = localStorage.getItem('chat_session_id');
        if (!sessionId) {
            sessionId = `WEB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('chat_session_id', sessionId);
            console.log('🆕 Created new session ID:', sessionId);
        } else {
            console.log('📦 Loaded existing session ID:', sessionId);
        }
        return sessionId;
    }

    loadCustomerInfo() {
        const info = localStorage.getItem('chat_customer_info');
        return info ? JSON.parse(info) : null;
    }

    saveCustomerInfo(info) {
        localStorage.setItem('chat_customer_info', JSON.stringify(info));
        this.customerInfo = info;
        console.log('💾 Saved customer info:', info);
    }

    toggleChat() {
        this.chatWindow.classList.toggle('show');
        const isOpen = this.chatWindow.classList.contains('show');
        console.log(isOpen ? '📂 Chat window opened' : '📁 Chat window closed');
        
        if (isOpen) {
            if (this.customerInfo) {
                this.messageInput.focus();
            }
            this.resetBadge();
        }
    }

    closeChat() {
        this.chatWindow.classList.remove('show');
        console.log('❌ Chat window closed');
    }

    handleStartChat() {
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();

        console.log('🎬 Starting chat with:', { name, phone });

        if (!name) {
            alert('Nama harus diisi');
            console.warn('⚠️ Name is required');
            return;
        }

        this.saveCustomerInfo({ name, phone });
        this.showChatInterface();
        this.sendInitialGreeting();
    }

    showChatInterface() {
        this.chatForm.style.display = 'none';
        this.chatMessages.style.display = 'block';
        this.chatInput.style.display = 'flex';
        console.log('✅ Chat interface shown');
    }

    async sendInitialGreeting() {
        console.log('👋 Sending initial greeting...');
        
        const greetingMessage = `Halo ${this.customerInfo.name}! Selamat datang di Nanda Motor 🏍️\n\nBalas dengan:\n- "oli" untuk lihat produk oli\n- "katalog" untuk lihat semua kategori\n- "harga [produk]" untuk tanya harga\n\nAtau klik tombol di bawah untuk chat langsung dengan owner.`;
        
        this.addMessageToUI({
            message: greetingMessage,
            direction: 'incoming',
            created_at: new Date().toISOString()
        });

        // Tambahkan tombol "Chat dengan Owner"
        this.addOwnerButton();
    }

    addOwnerButton() {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'owner-button-container';
        buttonContainer.innerHTML = `
            <button class="chat-with-owner-btn" id="chatWithOwner">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                </svg>
                💬 Chat dengan Owner via WhatsApp
            </button>
        `;
        this.chatMessages.appendChild(buttonContainer);

        // Event listener untuk tombol
        document.getElementById('chatWithOwner').addEventListener('click', () => this.initiateOwnerChat());
    }

    async initiateOwnerChat() {
        const confirmMsg = 'Pesan Anda akan diteruskan ke owner via WhatsApp. Owner akan membalas langsung ke nomor WhatsApp Anda. Lanjutkan?';
        if (!confirm(confirmMsg)) return;

        console.log('📞 Initiating owner chat...');

        // Tampilkan status
        this.addMessageToUI({
            message: 'Menghubungkan Anda dengan owner...',
            direction: 'incoming',
            created_at: new Date().toISOString()
        });

        try {
            const response = await fetch(`${API_URL}/api/whatsapp/contact-owner`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    customerName: this.customerInfo.name,
                    message: `Saya ingin bertanya tentang produk Nanda Motor. Nomor HP: ${this.customerInfo.phone || 'Tidak disebutkan'}`
                })
            });

            const result = await response.json();
            console.log('📡 Owner contact result:', result);

            if (result.success) {
                this.addMessageToUI({
                    message: `✅ Pesan Anda telah diteruskan ke owner!\n\nOwner akan menghubungi Anda via WhatsApp:\n📱 ${result.ownerNumber}\n\nAnda juga bisa langsung chat ke nomor tersebut.`,
                    direction: 'incoming',
                    created_at: new Date().toISOString()
                });
            } else {
                this.addMessageToUI({
                    message: `⚠️ ${result.message || 'Gagal terhubung dengan owner'}\n\nSilakan hubungi langsung:\n📱 +62 853-1462-7451`,
                    direction: 'incoming',
                    created_at: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('❌ Error contacting owner:', error);
            this.addMessageToUI({
                message: '❌ Gagal terhubung dengan owner.\n\nSilakan hubungi langsung via WhatsApp:\n📱 +62 853-1462-7451',
                direction: 'incoming',
                created_at: new Date().toISOString()
            });
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        console.log('📤 Sending message:', message);

        // Clear input
        this.messageInput.value = '';

        // Add message to UI
        this.addMessageToUI({
            message,
            direction: 'outgoing',
            created_at: new Date().toISOString()
        });

        // Show typing indicator
        this.typingIndicator.classList.add('show');
        console.log('⌨️ Typing indicator shown');

        // Send to server
        try {
            console.log('🌐 Sending to API:', `${API_URL}/api/whatsapp/send-reply`);
            
            const payload = {
                from: this.customerInfo.phone || this.sessionId,
                message: message,
                messageId: `msg_${Date.now()}`
            };
            
            console.log('📦 Payload:', payload);

            const response = await fetch(`${API_URL}/api/whatsapp/send-reply`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-webhook-secret': 'sLUB3cnOW5Vwj2yGlMPKRykryokyp0j0'
                },
                body: JSON.stringify(payload)
            });

            console.log('📡 Response status:', response.status);
            
            const result = await response.json();
            console.log('📥 Response data:', result);
            
            // Hide typing indicator
            this.typingIndicator.classList.remove('show');

            if (result.success && result.reply) {
                console.log('✅ Got bot reply:', result.reply);
                
                // Add bot reply to UI
                setTimeout(() => {
                    this.addMessageToUI({
                        message: result.reply,
                        direction: 'incoming',
                        created_at: new Date().toISOString()
                    });
                }, 500);
            } else {
                console.warn('⚠️ No reply from bot');
            }
        } catch (error) {
            console.error('❌ Error sending message:', error);
            this.typingIndicator.classList.remove('show');
            alert('Gagal mengirim pesan. Pastikan server berjalan di ' + API_URL);
        }
    }

    addMessageToUI(msg) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${msg.direction}`;

        const time = new Date(msg.created_at).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageEl.innerHTML = `
            <div class="message-bubble">
                ${this.escapeHtml(msg.message).replace(/\n/g, '<br>')}
                <div class="message-time">${time}</div>
            </div>
        `;

        this.chatMessages.appendChild(messageEl);
        this.scrollToBottom();
        
        console.log('💬 Message added to UI:', msg.direction);
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    resetBadge() {
        this.badge.textContent = '0';
        this.badge.classList.remove('show');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async checkConnection() {
        console.log('🔌 Checking backend connection...');
        try {
            const response = await fetch(`${API_URL}/api/products`, {
                method: 'GET'
            });
            
            if (response.ok) {
                console.log('✅ Backend connected!');
                this.updateConnectionStatus(true);
            } else {
                console.warn('⚠️ Backend responded but with error:', response.status);
                this.updateConnectionStatus(false);
            }
        } catch (error) {
            console.error('❌ Backend not reachable:', error.message);
            this.updateConnectionStatus(false);
        }
    }

    updateConnectionStatus(isConnected) {
        if (!this.connectionStatus) return;
        
        if (isConnected) {
            this.connectionStatus.textContent = '🟢 Terhubung';
            this.connectionStatus.classList.add('connected');
            this.connectionStatus.classList.remove('disconnected');
        } else {
            this.connectionStatus.textContent = '🔴 Terputus';
            this.connectionStatus.classList.add('disconnected');
            this.connectionStatus.classList.remove('connected');
        }
    }
}

// Initialize widget when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM Content Loaded');
        window.chatWidget = new ChatWidget();
    });
} else {
    console.log('📄 DOM already loaded');
    window.chatWidget = new ChatWidget();
}
