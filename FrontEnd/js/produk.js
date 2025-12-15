/* =========================================
   1. KONFIGURASI API
   ========================================= */
const API_URL = "http://localhost:3000/api/products";

/* =========================================
   2. FUNGSI TAMPILKAN PRODUK (PUBLIC)
   ========================================= */
async function tampilkanProduk() {
    const container = document.getElementById("daftar-produk-container");
    if (!container) return; // Mencegah error jika elemen tidak ada

    try {
        // Ambil Data dari API
        const response = await fetch(API_URL);
        const products = await response.json();

        container.innerHTML = ""; // Bersihkan loading text

        // Jika Data Kosong
        if (products.length === 0) {
            container.innerHTML = '<p class="text-center col-span-full text-gray-500 py-10">Belum ada produk yang tersedia.</p>';
            return;
        }

        // Render Setiap Produk
        products.forEach((produk) => {
            const hargaRupiah = parseInt(produk.harga).toLocaleString("id-ID");
            
            // Gambar Fallback jika null
            const gambar = produk.gambar || "https://via.placeholder.com/300x300?text=No+Image";
            
            // Tentukan Badge Stok (Merah/Hijau)
            const stokBadge = produk.stok > 0 
                ? `<span class="text-green-600 font-semibold text-xs"><i class="fas fa-check-circle"></i> Stok: ${produk.stok}</span>` 
                : `<span class="text-red-500 font-semibold text-xs"><i class="fas fa-times-circle"></i> Habis</span>`;

            // HTML Card Produk
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
                                class="bg-gray-800 hover:bg-gray-700 text-white w-10 h-10 rounded-full flex items-center justify-center transition duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                ${produk.stok <= 0 ? 'disabled' : ''}
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

/* =========================================
   3. FUNGSI KERANJANG (PLACEHOLDER)
   ========================================= */
function addToCart(id) {
    alert("Fitur keranjang akan segera hadir! ID Produk: " + id);
}

// Jalankan saat halaman siap
document.addEventListener("DOMContentLoaded", tampilkanProduk);