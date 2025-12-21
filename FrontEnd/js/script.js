/* =================================================================
   FILE: script.js
   Deskripsi: Mengatur Logika Global (Navbar, Keranjang, Auth)
   Versi: Final & Stabil (Refactored)
   ================================================================= */

// =========================================
// 1. FUNGSI GLOBAL (Bisa dipanggil dari mana saja)
// =========================================

// --- Helper LocalStorage Aman ---
function getCartSafe() {
    try {
        const data = localStorage.getItem('cart');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.warn("⚠️ Gagal baca LocalStorage:", e);
        return [];
    }
}

function saveCartSafe(cart) {
    try {
        localStorage.setItem('cart', JSON.stringify(cart));
    } catch (e) {
        console.error("⚠️ Gagal simpan LocalStorage:", e);
        alert("Penyimpanan lokal bermasalah. Data mungkin tidak tersimpan.");
    }
}

// --- Logika Keranjang ---

// Update Badge Angka di Navbar
window.updateCartCount = function() {
    const cart = getCartSafe();
    const cartCountElement = document.getElementById('cart-count');
    
    if (cartCountElement) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (totalItems > 0) {
            cartCountElement.innerText = totalItems;
            cartCountElement.classList.remove('hidden');
        } else {
            cartCountElement.classList.add('hidden');
        }
    }
};

// Buka/Tutup Modal Keranjang
window.toggleCart = function() { 
    const modal = document.getElementById('cart-modal');
    const sidebar = document.getElementById('cart-sidebar');
    
    if (!modal || !sidebar) return;

    if (modal.classList.contains('hidden')) {
        // Buka Modal
        modal.classList.remove('hidden');
        // Force display flex via inline style incase Tailwind fails
        modal.style.display = 'flex';
        // Animasi slide-in
        setTimeout(() => {
            sidebar.classList.remove('translate-x-full');
        }, 10);
        // Render isi keranjang terbaru
        window.renderCartItems(); 
    } else {
        // Tutup Modal
        sidebar.classList.add('translate-x-full');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.style.display = ''; // Reset inline style
        }, 300); // Tunggu durasi transisi CSS (300ms)
    }
};

// Render (Tampilkan) Isi Keranjang
window.renderCartItems = function() {
    const cart = getCartSafe();
    const container = document.getElementById('cart-items-container');
    const totalPriceEl = document.getElementById('cart-total-price');

    if (!container) return;

    container.innerHTML = ''; 
    let totalHarga = 0;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-gray-400">
                <i class="fas fa-shopping-basket text-6xl mb-4"></i>
                <p>Keranjang belanja Anda kosong.</p>
            </div>`;
        if(totalPriceEl) totalPriceEl.innerText = 'Rp 0';
        return;
    }

    cart.forEach((item, index) => {
        const subtotal = item.harga * item.quantity;
        totalHarga += subtotal;

        // Gunakan gambar placeholder jika gambar rusak/null
        const gambar = item.gambar || "https://via.placeholder.com/150";

        const itemHTML = `
            <div class="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm border border-gray-100 mb-2">
                <img src="${gambar}" alt="${item.nama_produk}" class="w-16 h-16 object-cover rounded-md border">
                
                <div class="flex-1">
                    <h4 class="text-sm font-bold text-gray-800 line-clamp-1">${item.nama_produk}</h4>
                    <p class="text-xs text-gray-500">@ Rp ${parseInt(item.harga).toLocaleString('id-ID')}</p>
                    <p class="text-blue-600 font-bold text-sm mt-1">Rp ${subtotal.toLocaleString('id-ID')}</p>
                </div>

                <div class="flex flex-col items-end gap-2">
                    <button onclick="window.hapusItem(${index})" class="text-red-400 hover:text-red-600 text-xs" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                    <div class="flex items-center border rounded">
                        <button onclick="window.updateQty(${index}, -1)" class="px-2 py-0.5 text-gray-600 hover:bg-gray-100">-</button>
                        <span class="px-2 text-xs font-semibold">${item.quantity}</span>
                        <button onclick="window.updateQty(${index}, 1)" class="px-2 py-0.5 text-gray-600 hover:bg-gray-100">+</button>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', itemHTML);
    });

    if(totalPriceEl) totalPriceEl.innerText = 'Rp ' + totalHarga.toLocaleString('id-ID');
};

// Update Quantity (+/-)
window.updateQty = function(index, change) {
    let cart = getCartSafe();
    if (cart[index]) {
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        } else {
            // Cek stok (jika ada data stok)
            if (cart[index].stok && cart[index].quantity > cart[index].stok) {
                alert(`Maaf, stok hanya tersedia ${cart[index].stok}`);
                cart[index].quantity = cart[index].stok;
            }
        }
        saveCartSafe(cart);
        window.renderCartItems();
        window.updateCartCount();
    }
};

// Hapus Item
window.hapusItem = function(index) {
    let cart = getCartSafe();
    cart.splice(index, 1);
    saveCartSafe(cart);
    window.renderCartItems();
    window.updateCartCount();
};

// Checkout ke WhatsApp
window.checkoutWhatsApp = function() {
    const cart = getCartSafe();
    if (cart.length === 0) {
        alert("Keranjang Anda kosong!");
        return;
    }
    const namaUser = "Pelanggan"; 
    let message = `Halo Nanda Motor, saya ${namaUser} ingin memesan:\n\n`;
    let total = 0;

    cart.forEach((item, i) => {
        const subtotal = item.harga * item.quantity;
        total += subtotal;
        message += `${i + 1}. ${item.nama_produk}\n`;
        message += `   Jumlah: ${item.quantity} x Rp ${parseInt(item.harga).toLocaleString('id-ID')}\n`;
        message += `   Subtotal: Rp ${subtotal.toLocaleString('id-ID')}\n\n`;
    });

    message += `*Total Bayar: Rp ${total.toLocaleString('id-ID')}*\n`;
    message += `\nMohon info ketersediaan dan metode pembayaran. Terima kasih!`;

    const encodedMessage = encodeURIComponent(message);
    const nomorWA = "6285314627451"; 
    window.open(`https://wa.me/${nomorWA}?text=${encodedMessage}`, '_blank');
};


// =========================================
// 2. EVENT LISTENER (Dijalankan saat halaman siap)
// =========================================
document.addEventListener("DOMContentLoaded", function () {
  
  // A. Inisialisasi Awal
  window.updateCartCount();

  // B. Event Listener Tombol Keranjang (NAVBAR)
  // ------------------------------------------
  const cartBtn = document.getElementById('cart-btn');
  const closeCartBtn = document.getElementById('close-cart');
  const cartModal = document.getElementById('cart-modal');

  // Buka Modal
  if (cartBtn) {
      console.log("✅ Tombol Keranjang Ditemukan."); // Debugging Log
      cartBtn.addEventListener('click', (e) => {
          e.preventDefault(); 
          window.toggleCart();
      });
  } else {
      // Tidak perlu warning di sini jika memang sengaja tidak ada di halaman tertentu
      // console.warn("Element #cart-btn tidak ditemukan di halaman ini.");
  }

  // Tutup Modal (Tombol X)
  if (closeCartBtn) {
      closeCartBtn.addEventListener('click', window.toggleCart);
  }

  // Tutup Modal (Klik di luar sidebar)
  if (cartModal) {
      cartModal.addEventListener('click', (e) => {
          if (e.target === cartModal) {
              window.toggleCart();
          }
      });
  }

  // C. Logika Navbar Toggle (Mobile)
  // ------------------------------------------
  const navbarToggle = document.getElementById("navbar-toggle");
  const navbarContent = document.getElementById("navbar-content");

  if (navbarToggle && navbarContent) {
    navbarToggle.addEventListener("click", function () {
      navbarContent.classList.toggle("hidden");
      navbarContent.classList.toggle("flex");
    });
  }

  // D. Logika Login & Register Form
  // ------------------------------------------
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const showRegisterBtn = document.getElementById("show-register-btn");
  const showLoginBtn = document.getElementById("show-login-btn");

  if (showRegisterBtn) {
    showRegisterBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (loginForm) loginForm.classList.add("hidden");
      if (registerForm) registerForm.classList.remove("hidden");
    });
  }

  if (showLoginBtn) {
    showLoginBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (loginForm) loginForm.classList.remove("hidden");
      if (registerForm) registerForm.classList.add("hidden");
    });
  }

  // E. Validasi Password Real-time & Submit (Digabungkan)
  // ------------------------------------------
  const passwordField = document.getElementById("password-register");
  const confirmPasswordField = document.getElementById("password-confirm-register");
  const errorMessage = document.getElementById("password-error-msg");
  const registerButton = document.getElementById("register-submit-btn");

  if (passwordField && confirmPasswordField && errorMessage && registerButton) {
    function validatePassword() {
      if (passwordField.value !== confirmPasswordField.value) {
        errorMessage.textContent = "Password tidak cocok.";
        errorMessage.classList.remove("hidden");
        registerButton.disabled = true;
        registerButton.classList.add("opacity-50", "cursor-not-allowed");
      } else {
        errorMessage.textContent = "";
        errorMessage.classList.add("hidden");
        registerButton.disabled = false;
        registerButton.classList.remove("opacity-50", "cursor-not-allowed");
      }
    }
    passwordField.addEventListener("keyup", validatePassword);
    confirmPasswordField.addEventListener("keyup", validatePassword);
  }

  // F. Submit Register
  const registerFormElement = document.querySelector("#register-form form");
  if (registerFormElement) {
    registerFormElement.addEventListener("submit", async function (e) {
      e.preventDefault();

      const nama = document.getElementById("nama-register").value;
      const email = document.getElementById("email-register").value;
      const password = document.getElementById("password-register").value;
      const confirmPassword = document.getElementById("password-confirm-register").value;

      if (!email.endsWith("@gmail.com")) {
        alert("❌ Maaf, hanya email @gmail.com yang diperbolehkan!");
        return;
      }

      if (password !== confirmPassword) {
        alert("Password tidak cocok!");
        return;
      }

      if (typeof grecaptcha !== 'undefined') {
          const captchaResponse = grecaptcha.getResponse();
          if (captchaResponse.length === 0) {
            alert("⚠️ Harap centang CAPTCHA 'Saya bukan robot'!");
            return;
          }
      }

      try {
        const submitBtn = document.getElementById("register-submit-btn");
        const originalText = submitBtn.innerText;
        submitBtn.innerText = "Memproses...";
        submitBtn.disabled = true;

        const response = await fetch("http://localhost:3000/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nama, email, password }),
        });

        const result = await response.json();
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;

        if (response.ok) {
          alert("🎉 BERHASIL: " + result.message);
          document.getElementById("register-form").classList.add("hidden");
          document.getElementById("login-form").classList.remove("hidden");
          registerFormElement.reset();
        } else {
          alert("❌ GAGAL: " + result.message);
        }
      } catch (error) {
        console.error("Error Register:", error);
        alert("⚠️ Terjadi kesalahan koneksi ke server.");
        document.getElementById("register-submit-btn").disabled = false;
      }
    });
  }

  // G. Submit Login
  const loginFormElement = document.querySelector("#login-form form");
  if (loginFormElement) {
    loginFormElement.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = document.getElementById("email-login").value;
      const password = document.getElementById("password-login").value;
      const loginBtn = document.getElementById("btn-login-submit");

      try {
        loginBtn.innerText = "Memproses...";
        loginBtn.disabled = true;

        const response = await fetch("http://localhost:3000/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const result = await response.json();
        loginBtn.innerText = "Login";
        loginBtn.disabled = false;

        if (response.ok) {
          alert("🎉 " + result.message);
          localStorage.setItem("token", result.token);
          localStorage.setItem("role", result.role);

          if (result.role === "admin") {
            window.location.href = "admin.html";
          } else {
            window.location.href = "index.html";
          }
        } else {
          alert("❌ " + result.message);
        }
      } catch (error) {
        console.error("Error Login:", error);
        alert("⚠️ Gagal terhubung ke server.");
        loginBtn.innerText = "Login";
        loginBtn.disabled = false;
      }
    });
  }

  // H. Password Toggle
  // ------------------------------------------
  function setupPasswordToggle(buttonId, inputId) {
    const toggleBtn = document.getElementById(buttonId);
    const inputField = document.getElementById(inputId);
    if (toggleBtn && inputField) {
      toggleBtn.addEventListener("click", function () {
        const type = inputField.getAttribute("type") === "password" ? "text" : "password";
        inputField.setAttribute("type", type);
        const icon = this.querySelector("i");
        if (icon) {
            if (type === 'text') { 
                icon.classList.remove('fa-eye'); 
                icon.classList.add('fa-eye-slash'); 
            } else { 
                icon.classList.remove('fa-eye-slash'); 
                icon.classList.add('fa-eye'); 
            }
        }
      });
    }
  }
  setupPasswordToggle("toggle-password-login", "password-login");
  setupPasswordToggle("toggle-password-register", "password-register");
  setupPasswordToggle("toggle-confirm-password", "password-confirm-register");

  // I. Cek Status Login Navbar
  // ------------------------------------------
  function cekStatusLoginNavbar() {
    try {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role"); // Ambil role user
        const navBtn = document.getElementById("navbar-login-btn");
        const navContainer = navBtn ? navBtn.parentNode : null; // Container tombol navbar

        if (navBtn && navContainer) {
          if (token) {
            // 1. Jika User Login sebagai ADMIN, tambahkan tombol "Panel Admin"
            if (role === 'admin') {
                // Cek apakah tombol admin sudah ada biar gak duplikat
                if (!document.getElementById('btn-back-admin')) {
                    const adminBtn = document.createElement('a');
                    adminBtn.id = 'btn-back-admin';
                    adminBtn.href = 'admin.html';
                    adminBtn.className = 'text-gray-700 hover:text-blue-600 text-xl mr-4';
                    adminBtn.title = "Kembali ke Admin Panel";
                    adminBtn.innerHTML = '<i class="fa-solid fa-user-shield"></i>';
                    
                    // Masukkan sebelum tombol Logout
                    navContainer.insertBefore(adminBtn, navBtn);
                }
            }

            // 2. Ubah Tombol Login jadi Logout
            navBtn.innerText = "Logout";
            navBtn.classList.remove("bg-blue-600", "hover:bg-blue-700");
            navBtn.classList.add("bg-red-600", "hover:bg-red-700");
            navBtn.href = "#";
            
            // Clone untuk reset listener lama
            const newBtn = navBtn.cloneNode(true);
            navBtn.parentNode.replaceChild(newBtn, navBtn);
            
            newBtn.addEventListener("click", function (e) {
              e.preventDefault();
              if (confirm("Apakah Anda yakin ingin keluar?")) {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                window.location.href = "index.html";
              }
            });
          } else {
            // Jika Belum Login
            navBtn.innerText = "Login";
            navBtn.href = "login.html";
            navBtn.classList.add("bg-blue-600", "hover:bg-blue-700");
            navBtn.classList.remove("bg-red-600", "hover:bg-red-700");
            
            // Hapus tombol admin jika ada (misal habis logout)
            const adminBtn = document.getElementById('btn-back-admin');
            if (adminBtn) adminBtn.remove();
          }
        }
    } catch(e) {
        console.warn("Gagal cek status login:", e);
    }
  }
  
  cekStatusLoginNavbar();

});