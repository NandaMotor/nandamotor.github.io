/* =========================================
   FILE: produk.js
   Deskripsi: Mengelola Tampilan Katalog & Logika Tambah ke Keranjang
   ========================================= */

const API_URL = "https://rif.alwaysdata.net/api/products";

// --- FILTER STATE ---
let allProducts = []; // Store all products for filtering
let filterState = {
    category: "",
    minPrice: null,
    maxPrice: null
};

// --- 1. TAMPILKAN PRODUK (Load Data) ---
async function tampilkanProduk() {
    const container = document.getElementById("daftar-produk-container");
    if (!container) return; 

    try {
        const response = await fetch(API_URL);
        const products = await response.json();

        // Store all products globally for filtering
        allProducts = products;

        // Populate category filter dropdown
        populateCategoryFilter(products);

        // Render products (with current filters if any)
        renderProducts(products);

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

// --- 2. RENDER PRODUCTS (Display filtered or all products) ---
function renderProducts(products) {
    const container = document.getElementById("daftar-produk-container");
    if (!container) return;

    container.innerHTML = "";

    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-10">
                <i class="fas fa-search text-4xl text-gray-400 mb-3"></i>
                <p class="text-gray-500 text-lg font-semibold">Tidak ada produk yang sesuai dengan filter</p>
                <p class="text-gray-400 text-sm mt-2">Coba ubah kriteria filter Anda</p>
            </div>
        `;
        return;
    }

    products.forEach((produk) => {
        const hargaRupiah = parseInt(produk.harga).toLocaleString("id-ID");
        const gambar = produk.gambar || "https://via.placeholder.com/300x300?text=No+Image";
        
        const stokBadge = produk.stok > 0 
            ? `<span class="text-green-600 font-semibold text-xs"><i class="fas fa-check-circle"></i> Stok: ${produk.stok}</span>` 
            : `<span class="text-red-500 font-semibold text-xs"><i class="fas fa-times-circle"></i> Habis</span>`;

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
}

// --- 3. POPULATE CATEGORY FILTER ---
function populateCategoryFilter(products) {
    const categorySelect = document.getElementById("category-filter");
    if (!categorySelect) return;

    // Get unique categories
    const categories = [...new Set(products.map(p => p.kategori))].filter(Boolean).sort();

    // Clear existing options except "Semua Kategori"
    categorySelect.innerHTML = '<option value="">Semua Kategori</option>';

    // Add category options
    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

// --- 4. APPLY FILTERS ---
function applyFilters() {
    // Get filter values
    const category = document.getElementById("category-filter")?.value || "";
    const minPrice = parseFloat(document.getElementById("min-price")?.value) || null;
    const maxPrice = parseFloat(document.getElementById("max-price")?.value) || null;

    // Validate price range
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
        Swal.fire({
            icon: 'warning',
            title: 'Filter Tidak Valid',
            text: 'Harga minimum tidak boleh lebih besar dari harga maksimum',
            confirmButtonColor: '#3b82f6'
        });
        return;
    }

    // Update filter state
    filterState = { category, minPrice, maxPrice };

    // Filter products
    let filteredProducts = allProducts;

    // Filter by category
    if (category) {
        filteredProducts = filteredProducts.filter(p => p.kategori === category);
    }

    // Filter by price range
    if (minPrice !== null) {
        filteredProducts = filteredProducts.filter(p => parseFloat(p.harga) >= minPrice);
    }
    if (maxPrice !== null) {
        filteredProducts = filteredProducts.filter(p => parseFloat(p.harga) <= maxPrice);
    }

    // Render filtered products
    renderProducts(filteredProducts);

    // Update active filters display
    updateActiveFiltersDisplay();

    // Show feedback
    const filterCount = filteredProducts.length;
    const totalCount = allProducts.length;
    
    if (category || minPrice !== null || maxPrice !== null) {
        console.log(`Filter applied: ${filterCount} of ${totalCount} products shown`);
    }
}

// --- 5. RESET FILTERS ---
function resetFilters() {
    // Clear filter state
    filterState = {
        category: "",
        minPrice: null,
        maxPrice: null
    };

    // Clear filter inputs
    const categorySelect = document.getElementById("category-filter");
    const minPriceInput = document.getElementById("min-price");
    const maxPriceInput = document.getElementById("max-price");

    if (categorySelect) categorySelect.value = "";
    if (minPriceInput) minPriceInput.value = "";
    if (maxPriceInput) maxPriceInput.value = "";

    // Show all products
    renderProducts(allProducts);

    // Hide active filters display
    const activeFiltersDiv = document.getElementById("active-filters");
    if (activeFiltersDiv) {
        activeFiltersDiv.classList.add("hidden");
    }

    console.log("Filters reset - showing all products");
}

// --- 6. UPDATE ACTIVE FILTERS DISPLAY ---
function updateActiveFiltersDisplay() {
    const activeFiltersDiv = document.getElementById("active-filters");
    const activeFiltersList = document.getElementById("active-filters-list");
    
    if (!activeFiltersDiv || !activeFiltersList) return;

    activeFiltersList.innerHTML = "";

    let hasActiveFilters = false;

    // Category filter badge
    if (filterState.category) {
        hasActiveFilters = true;
        const badge = createFilterBadge(`Kategori: ${filterState.category}`, () => {
            document.getElementById("category-filter").value = "";
            applyFilters();
        });
        activeFiltersList.appendChild(badge);
    }

    // Min price filter badge
    if (filterState.minPrice !== null) {
        hasActiveFilters = true;
        const badge = createFilterBadge(`Min: Rp ${filterState.minPrice.toLocaleString("id-ID")}`, () => {
            document.getElementById("min-price").value = "";
            applyFilters();
        });
        activeFiltersList.appendChild(badge);
    }

    // Max price filter badge
    if (filterState.maxPrice !== null) {
        hasActiveFilters = true;
        const badge = createFilterBadge(`Max: Rp ${filterState.maxPrice.toLocaleString("id-ID")}`, () => {
            document.getElementById("max-price").value = "";
            applyFilters();
        });
        activeFiltersList.appendChild(badge);
    }

    // Show/hide active filters section
    if (hasActiveFilters) {
        activeFiltersDiv.classList.remove("hidden");
    } else {
        activeFiltersDiv.classList.add("hidden");
    }
}

// --- 7. CREATE FILTER BADGE ---
function createFilterBadge(text, onRemove) {
    const badge = document.createElement("span");
    badge.className = "inline-flex items-center bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-full";
    badge.innerHTML = `
        ${text}
        <button class="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none" title="Hapus filter">
            <i class="fas fa-times"></i>
        </button>
    `;
    badge.querySelector("button").addEventListener("click", onRemove);
    return badge;
}

// --- 8. LOGIKA ADD TO CART (Simpan ke LocalStorage) ---
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
                Swal.fire({
                    icon: 'warning',
                    title: 'Stok Terbatas',
                    text: `Maaf, stok mentok! Sisa: ${product.stok}`,
                    confirmButtonColor: '#3b82f6'
                });
                return;
            }
            existingItem.quantity += 1;
        } else {
            // Item Baru
            if (product.stok <= 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Stok Habis',
                    text: 'Maaf, stok habis!',
                    confirmButtonColor: '#3b82f6'
                });
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
        Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: 'Gagal menambahkan ke keranjang. Cek koneksi server.',
            confirmButtonColor: '#3b82f6'
        });
    }
}

// Jalankan saat halaman siap
// Jalankan saat halaman siap
document.addEventListener("DOMContentLoaded", () => {
    // Load products
    tampilkanProduk();

    // --- FILTER EVENT LISTENERS ---
    const applyFilterBtn = document.getElementById("apply-filter");
    const resetFilterBtn = document.getElementById("reset-filter");
    const toggleFilterBtn = document.getElementById("toggle-filter");
    const filterContent = document.getElementById("filter-content");
    const filterIcon = document.getElementById("filter-icon");

    // Apply filter button
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener("click", applyFilters);
    }

    // Reset filter button
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener("click", resetFilters);
    }

    // Mobile filter toggle
    if (toggleFilterBtn && filterContent && filterIcon) {
        toggleFilterBtn.addEventListener("click", () => {
            filterContent.classList.toggle("hidden");
            filterIcon.classList.toggle("fa-chevron-down");
            filterIcon.classList.toggle("fa-chevron-up");
        });
    }

    // Apply filters on Enter key in price inputs
    const minPriceInput = document.getElementById("min-price");
    const maxPriceInput = document.getElementById("max-price");

    if (minPriceInput) {
        minPriceInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") applyFilters();
        });
    }

    if (maxPriceInput) {
        maxPriceInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") applyFilters();
        });
    }
});