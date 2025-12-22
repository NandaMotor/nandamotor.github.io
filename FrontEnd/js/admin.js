/* =========================================
   FILE: admin.js
   Deskripsi: Mengelola Dashboard Admin & CRUD Produk (Final Fix: ID Dashboard)
   ========================================= */

const API_URL = "http://localhost:3000/api/products";
let allProductsData = []; // Variabel Global

// Elemen Modal & Form
const modal = document.getElementById("modalTambah");
const modalTitle = document.getElementById("modalTitle");
const editIdInput = document.getElementById("editIdInput");
const imgPreview = document.getElementById("imgPreview");
const previewContainer = document.getElementById("previewContainer");
const formTambahProduk = document.getElementById("formTambahProduk");

// --- 1. INISIALISASI ---
document.addEventListener("DOMContentLoaded", () => {
  cekOtorisasiAdmin();
  loadAllData();
  
  const searchInput = document.getElementById("search-input");
  const filterSelect = document.getElementById("filter-kategori");

  if(searchInput) searchInput.addEventListener("input", filterProducts);
  if(filterSelect) filterSelect.addEventListener("change", filterProducts);
});

// Cek Token Admin
function cekOtorisasiAdmin() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "admin") {
    alert("⛔ Akses Ditolak! Anda harus login sebagai Admin.");
    window.location.href = "login.html";
  }
}

// Fungsi Logout
function logout() {
  if (confirm("Yakin ingin keluar?")) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "login.html";
  }
}

// --- 2. FUNGSI NAVIGASI (SPA SWITCHING & SIDEBAR ACTIVE) ---
window.switchView = function(viewName) {
    const dashboardSection = document.getElementById("view-dashboard");
    const managementSection = document.getElementById("view-management");
    
    const navDashboard = document.getElementById("nav-dashboard");
    const navManagement = document.getElementById("nav-management");

    // Class Helper
    const activeClasses = ["bg-blue-600", "text-white", "shadow-md"];
    const inactiveClasses = ["text-gray-400", "hover:text-white", "hover:bg-gray-700"];

    function setInactive(el) {
        if (!el) return;
        el.classList.remove(...activeClasses);
        el.classList.add(...inactiveClasses);
    }

    function setActive(el) {
        if (!el) return;
        el.classList.remove(...inactiveClasses);
        el.classList.add(...activeClasses);
    }

    if (viewName === 'dashboard') {
        dashboardSection.classList.remove("hidden");
        managementSection.classList.add("hidden");
        setActive(navDashboard);
        setInactive(navManagement);
    } else if (viewName === 'management') {
        dashboardSection.classList.add("hidden");
        managementSection.classList.remove("hidden");
        setInactive(navDashboard);
        setActive(navManagement);
        if (typeof filterProducts === "function") filterProducts();
    }
};

/* =========================================
   3. LOGIKA DATA (FETCH & RENDER)
   ========================================= */

async function loadAllData() {
    try {
        const response = await fetch(API_URL);
        const products = await response.json();
        
        allProductsData = products.reverse(); 
        
        // A. Render Statistik
        const elTotal = document.getElementById("total-produk-count");
        if(elTotal) elTotal.innerText = products.length;
        
        // B. Render Tabel Dashboard (5 Teratas)
        renderDashboardTable(allProductsData.slice(0, 5));

        // C. Render Tabel Management (Semua)
        renderManagementTable(allProductsData);

    } catch (error) {
        console.error("Gagal load data:", error);
    }
}

// --- RENDER TABEL DASHBOARD (FIXED: ID FORMAT) ---
function renderDashboardTable(data) {
    const tbody = document.getElementById("dashboard-table-body");
    if(!tbody) return;
    tbody.innerHTML = "";

    data.forEach(produk => {
        // 1. LOGIKA ID (Disamakan dengan Management)
        let prefix = "PRD";
        if (produk.kategori === "Oli") prefix = "OLI";
        else if (produk.kategori === "Ban") prefix = "BAN";
        else if (produk.kategori === "Sparepart") prefix = "SPR";
        else if (produk.kategori === "Service") prefix = "SRV";
        
        const displayID = `${prefix}-${String(produk.id).padStart(3, "0")}`;

        // 2. Style Stok
        const stokClass = produk.stok < 5 ? "text-red-500 font-bold" : "text-green-600 font-bold";
        
        const row = `
            <tr class="border-b border-gray-200 hover:bg-gray-50">
                <td class="py-3 px-6 text-left text-blue-600 font-bold">${displayID}</td>
                <td class="py-3 px-6 text-center"><img src="${produk.gambar || 'https://via.placeholder.com/40'}" class="w-8 h-8 rounded-full mx-auto border object-cover"></td>
                <td class="py-3 px-6 text-left">${produk.nama_produk}</td>
                <td class="py-3 px-6 text-center"><span class="bg-gray-200 px-2 py-1 rounded text-xs text-gray-700">${produk.kategori}</span></td>
                <td class="py-3 px-6 text-right">Rp ${parseInt(produk.harga).toLocaleString("id-ID")}</td>
                <td class="py-3 px-6 text-center ${stokClass}">${produk.stok}</td>
            </tr>
        `;
        tbody.insertAdjacentHTML("beforeend", row);
    });
}

// --- RENDER TABEL MANAJEMEN ---
function renderManagementTable(data) {
    const tbody = document.getElementById("management-table-body");
    const noDataMsg = document.getElementById("no-data-msg");
    
    if(!tbody) return;
    tbody.innerHTML = "";

    if (data.length === 0) {
        if(noDataMsg) noDataMsg.classList.remove("hidden");
    } else {
        if(noDataMsg) noDataMsg.classList.add("hidden");
    }

    data.forEach(produk => {
        let prefix = "PRD";
        if (produk.kategori === "Oli") prefix = "OLI";
        else if (produk.kategori === "Ban") prefix = "BAN";
        else if (produk.kategori === "Sparepart") prefix = "SPR";
        else if (produk.kategori === "Service") prefix = "SRV";
        
        const displayID = `${prefix}-${String(produk.id).padStart(3, "0")}`;
        const stokClass = produk.stok < 5 ? "text-red-500 font-bold" : "text-green-600 font-bold";

        const row = `
            <tr class="border-b border-gray-200 hover:bg-gray-50">
                <td class="py-3 px-6 text-left text-blue-600 font-bold whitespace-nowrap">${displayID}</td>
                <td class="py-3 px-6 text-center"><img src="${produk.gambar || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded-full mx-auto border object-cover"></td>
                <td class="py-3 px-6 text-left font-medium">${produk.nama_produk}</td>
                <td class="py-3 px-6 text-center"><span class="bg-blue-100 text-blue-600 py-1 px-3 rounded-full text-xs font-semibold">${produk.kategori}</span></td>
                <td class="py-3 px-6 text-right font-bold text-gray-600">Rp ${parseInt(produk.harga).toLocaleString("id-ID")}</td>
                <td class="py-3 px-6 text-center ${stokClass}">${produk.stok}</td>
                <td class="py-3 px-6 text-center">
                    <div class="flex item-center justify-center space-x-2">
                        <button onclick="editProduk(${produk.id})" class="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 flex items-center justify-center transition" title="Edit"><i class="fas fa-edit"></i></button>
                        <button onclick="hapusProduk(${produk.id})" class="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition" title="Hapus"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML("beforeend", row);
    });
}

// --- LOGIKA FILTER & SEARCH ---
function filterProducts() {
    const searchTerm = document.getElementById("search-input").value.toLowerCase();
    const categoryFilter = document.getElementById("filter-kategori").value;

    const filteredData = allProductsData.filter(produk => {
        const matchName = produk.nama_produk.toLowerCase().includes(searchTerm);
        const matchCategory = categoryFilter === "all" || produk.kategori === categoryFilter;
        return matchName && matchCategory;
    });

    renderManagementTable(filteredData);
}

/* =========================================
   4. LOGIKA MODAL (BUKA/TUTUP)
   ========================================= */
function bukaModal() {
  if(!modal) return;
  modal.classList.remove("hidden");
  if(formTambahProduk) formTambahProduk.reset();
  if(editIdInput) editIdInput.value = "";
  if(modalTitle) modalTitle.innerText = "Tambah Produk Baru";
  if (imgPreview) imgPreview.src = "";
  if (previewContainer) previewContainer.classList.add("hidden");
}

function tutupModal() {
  if(modal) modal.classList.add("hidden");
}

window.onclick = function(event) {
    if (event.target == modal) tutupModal();
}

/* =========================================
   5. LOGIKA EDIT & HAPUS
   ========================================= */
async function editProduk(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    const produk = await response.json();

    document.getElementById("namaInput").value = produk.nama_produk;
    document.getElementById("hargaInput").value = produk.harga;
    document.getElementById("stokInput").value = produk.stok;
    document.getElementById("kategoriInput").value = produk.kategori;
    if(editIdInput) editIdInput.value = produk.id;

    if (produk.gambar && imgPreview && previewContainer) {
      imgPreview.src = produk.gambar;
      previewContainer.classList.remove("hidden");
    } else if (previewContainer) {
      previewContainer.classList.add("hidden");
    }

    if(modalTitle) modalTitle.innerText = "Edit Produk";
    if(modal) modal.classList.remove("hidden");
  } catch (error) {
    console.error(error);
    alert("Gagal mengambil data edit.");
  }
}

async function hapusProduk(id) {
  if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (response.ok) {
        alert("Produk berhasil dihapus!");
        loadAllData();
      } else {
        alert("Gagal menghapus produk.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan koneksi.");
    }
  }
}

/* =========================================
   6. LOGIKA SUBMIT (TAMBAH/UPDATE)
   ========================================= */
if (formTambahProduk) {
  formTambahProduk.addEventListener("submit", async function (e) {
    e.preventDefault();

    const id = editIdInput.value;
    const submitBtn = this.querySelector('button[type="submit"]');
    const textAsli = submitBtn.innerText;

    submitBtn.innerText = "Mengupload...";
    submitBtn.disabled = true;

    const formData = new FormData();
    formData.append("nama_produk", document.getElementById("namaInput").value);
    formData.append("harga", document.getElementById("hargaInput").value);
    formData.append("stok", document.getElementById("stokInput").value);
    formData.append("kategori", document.getElementById("kategoriInput").value);

    const fileGambar = document.getElementById("gambarInput").files[0];
    if (fileGambar) {
      formData.append("gambar", fileGambar);
    }

    try {
      let url = id ? `${API_URL}/${id}` : API_URL;
      let method = id ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || "Berhasil disimpan!");
        tutupModal();
        loadAllData();
      } else {
        alert("Gagal: " + result.message);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan.");
    } finally {
      submitBtn.innerText = textAsli;
      submitBtn.disabled = false;
    }
  });
}

// Preview gambar
const gambarInputEl = document.getElementById("gambarInput");
if (gambarInputEl) {
  gambarInputEl.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file && imgPreview && previewContainer) {
      const reader = new FileReader();
      reader.onload = function (e) {
        imgPreview.src = e.target.result;
        previewContainer.classList.remove("hidden");
      };
      reader.readAsDataURL(file);
    }
  });
}