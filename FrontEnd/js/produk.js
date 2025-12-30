/* =========================================
   FILE: produk.js
   Deskripsi: Mengelola Tampilan Katalog & Logika Tambah ke Keranjang
   ========================================= */

const API_URL = "https://rif.alwaysdata.net/api/products";

// --- 1. TAMPILKAN PRODUK (Load Data) ---
async function tampilkanProduk() {
    const container = document.getElementById("daftar-produk-container");
    if (!container) return; 

    try {
        const response = await fetch(API_URL);
        const products = await response.json();

        container.innerHTML = ""; 

        if (products.length === 0) {
            container.innerHTML = '<p class="text-center col-span-full text-gray-500 py-10">Belum ada produk yang tersedia.</p>';
            return;
        }

        products.forEach((produk) => {
            const hargaRupiah = parseInt(produk.harga).toLocaleString("id-ID");
            const gambar = produk.gambar || "https://via.placeholder.com/300x300?text=No+Image";
            
            const stokBadge = produk.stok > 0 
                ? `<span class="text-green-600 font-semibold text-xs"><i class="fas fa-check-circle"></i> Stok: ${produk.stok}</span>` 
                : `<span class="text-red-500 font-semibold text-xs"><i class="fas fa-times-circle"></i> Habis</span>`;

            // Style tombol saat disabled
            const btnDisabled = produk.stok <= 0 ? 'disabled' : '';
            const btnClass = produk.stok <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700 hover:shadow-lg';

            const cardHTML = `
                <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col h-full">
                    <div class="relative h-48 overflow-hidden bg-gray-50 group">
                        <img src="${gambar}" alt="${produk.nama_produk}" class="w-full h-full object-cover transition duration-500 group-hover:scale-110">
                        <span class="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 m-2 rounded uppercase tracking-wide">
                            ${produk.kategori}
                        </span>
                    </div>
                    
                    <div class="p-5 flex flex-col flex-grow">
                        <h3 class="text-lg font-bold text-gray-800 mb-1 truncate" title="${produk.nama_produk}">
                            ${produk.nama_produk}
                        </h3>
                        
                        <div class="mb-4">
                            ${stokBadge}
                        </div>

                        <div class="mt-auto flex justify-between items-center">
                            <span class="text-lg font-bold text-blue-600">Rp ${hargaRupiah}</span>
                            
                            <button 
                                onclick="addToCart(${produk.id})"
                                class="${btnClass} text-white w-10 h-10 rounded-full flex items-center justify-center transition duration-200 shadow-md"
                                ${btnDisabled}
                                title="Tambah ke Keranjang"
                            >
                                <i class="fas fa-shopping-cart text-sm"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML("beforeend", cardHTML);
        });

    } catch (error) {
        console.error("Gagal mengambil produk:", error);
        container.innerHTML = `
            <div class="col-span-full text-center py-10">
                <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-3"></i>
                <p class="text-red-500">Gagal memuat produk. Pastikan server (BackEnd) menyala.</p>
            </div>
        `;
    }
}

// --- 2. LOGIKA ADD TO CART (Simpan ke LocalStorage) ---
async function addToCart(id) {
    try {
        // Ambil Data Produk Terbaru (Cek Stok Real-time)
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error("Gagal mengambil data produk");
        
        const product = await response.json();

        // Ambil Keranjang Lama
        let cart = [];
        try {
            cart = JSON.parse(localStorage.getItem('cart')) || [];
        } catch(e) { cart = []; }

        // Cek Item di Keranjang
        const existingItem = cart.find(item => item.id === product.id);

        if (existingItem) {
            // Cek Stok
            if (existingItem.quantity + 1 > product.stok) {
                alert(`Maaf, stok mentok! Sisa: ${product.stok}`);
                return;
            }
            existingItem.quantity += 1;
        } else {
            // Item Baru
            if (product.stok <= 0) {
                alert("Maaf, stok habis!");
                return;
            }
            cart.push({
                id: product.id,
                nama_produk: product.nama_produk,
                harga: product.harga,
                gambar: product.gambar,
                quantity: 1,
                stok: product.stok 
            });
        }

        // Simpan & Update UI
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Panggil fungsi global dari script.js untuk update badge
        if (window.updateCartCount) window.updateCartCount();
        if (window.renderCartItems) window.renderCartItems(); // Jika sidebar sedang terbuka, update isinya

        // Feedback Visual Sederhana
        /* alert(`Berhasil menambahkan "${product.nama_produk}" ke keranjang!`); */
        // Atau Log ke console agar tidak mengganggu UX terus-menerus
        console.log(`Added to cart: ${product.nama_produk}`);
        
        // Opsional: Buka sidebar otomatis setelah add (Uncomment jika mau)
        // if (window.toggleCart) window.toggleCart();

    } catch (error) {
        console.error(error);
        alert("Gagal menambahkan ke keranjang. Cek koneksi server.");
    }
}

// Jalankan saat halaman siap
document.addEventListener("DOMContentLoaded", tampilkanProduk);