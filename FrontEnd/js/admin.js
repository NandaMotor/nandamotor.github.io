/* =========================================
   FILE: admin.js
   Deskripsi: Admin Dashboard (Stats Integrated) & CRUD Produk
   ========================================= */

const API_URL = "https://rif.alwaysdata.net/api/products";
let allProductsData = []; 
let kategoriList = [];    

// DEFAULT KATEGORI
const defaultKategori = [
    { name: "Oli",       prefix: "OLI" },
    { name: "Ban",       prefix: "BAN" },
    { name: "Sparepart", prefix: "SPR" }
];

// Elemen Modal
const modal = document.getElementById("modalTambah");
const modalTitle = document.getElementById("modalTitle");
const editIdInput = document.getElementById("editIdInput");
const imgPreview = document.getElementById("imgPreview");
const previewContainer = document.getElementById("previewContainer");
const formTambahProduk = document.getElementById("formTambahProduk");

// --- 1. INISIALISASI ---
document.addEventListener("DOMContentLoaded", () => {
  cekOtorisasiAdmin();
  initKategori(); 
  loadAllData();
  
  const searchInput = document.getElementById("search-input");
  const filterSelect = document.getElementById("filter-kategori");

  if(searchInput) searchInput.addEventListener("input", filterProducts);
  if(filterSelect) filterSelect.addEventListener("change", filterProducts);
});

// --- KATEGORI DINAMIS ---
function initKategori() {
    const stored = localStorage.getItem("kategoriList");
    if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0 && typeof parsed[0] === 'string') {
            kategoriList = defaultKategori;
            localStorage.setItem("kategoriList", JSON.stringify(kategoriList));
        } else {
            kategoriList = parsed;
        }
    } else {
        kategoriList = defaultKategori;
        localStorage.setItem("kategoriList", JSON.stringify(kategoriList));
    }
    renderKategoriOptions();
}

function renderKategoriOptions() {
    const selectInput = document.getElementById("kategoriInput");
    const selectFilter = document.getElementById("filter-kategori");
    
    if(selectInput) {
        const oldValue = selectInput.value;
        selectInput.innerHTML = "";
        kategoriList.forEach(kat => {
            const opt = document.createElement("option");
            opt.value = kat.name;
            opt.textContent = `${kat.name} (Kode: ${kat.prefix})`;
            selectInput.appendChild(opt);
        });
        const exists = kategoriList.some(k => k.name === oldValue);
        if(exists) selectInput.value = oldValue;
    }

    if(selectFilter) {
        const oldFilter = selectFilter.value;
        selectFilter.innerHTML = '<option value="all">Semua Kategori</option>';
        kategoriList.forEach(kat => {
            const opt = document.createElement("option");
            opt.value = kat.name;
            opt.textContent = kat.name;
            selectFilter.appendChild(opt);
        });
        selectFilter.value = oldFilter;
    }
}

window.tambahKategoriBaru = async function() {
    const { value: formValues } = await Swal.fire({
        title: 'Tambah Kategori Baru',
        html:
            '<div class="text-left">' +
            '<label class="block text-sm font-bold text-gray-700 mb-1">Nama Kategori</label>' +
            '<input id="swal-input-name" class="swal2-input m-0 mb-3 w-full" placeholder="Contoh: Aksesoris">' +
            '<label class="block text-sm font-bold text-gray-700 mb-1">Kode ID (Prefix)</label>' +
            '<input id="swal-input-prefix" class="swal2-input m-0 w-full" placeholder="Contoh: AKS" style="text-transform:uppercase">' +
            '</div>',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Tambah',
        confirmButtonColor: '#10b981',
        preConfirm: () => {
            const name = document.getElementById('swal-input-name').value;
            const prefix = document.getElementById('swal-input-prefix').value.toUpperCase();
            if (!name || !prefix) { Swal.showValidationMessage('Nama dan Kode harus diisi!'); return false; }
            if (kategoriList.some(k => k.name.toLowerCase() === name.toLowerCase())) { Swal.showValidationMessage('Kategori sudah ada!'); return false; }
            return { name: name, prefix: prefix };
        }
    });

    if (formValues) {
        kategoriList.push(formValues);
        localStorage.setItem("kategoriList", JSON.stringify(kategoriList));
        renderKategoriOptions();
        const selectInput = document.getElementById("kategoriInput");
        if(selectInput) selectInput.value = formValues.name;
        Swal.fire({ icon: 'success', title: 'Berhasil', text: `Kategori ditambahkan`, timer: 1500, showConfirmButton: false });
    }
};

window.hapusKategoriTerpilih = async function() {
    const selectInput = document.getElementById("kategoriInput");
    if(!selectInput || !selectInput.value) { Swal.fire('Error', 'Pilih kategori dulu', 'error'); return; }
    
    const selectedName = selectInput.value;
    const result = await Swal.fire({ title: 'Hapus Kategori?', text: `Hapus "${selectedName}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });

    if (result.isConfirmed) {
        kategoriList = kategoriList.filter(k => k.name !== selectedName);
        localStorage.setItem("kategoriList", JSON.stringify(kategoriList));
        renderKategoriOptions();
        Swal.fire({ icon: 'success', title: 'Terhapus', timer: 1500, showConfirmButton: false });
    }
};

// --- OTORISASI & NAVIGASI ---
function cekOtorisasiAdmin() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (!token || role !== "admin") { window.location.href = "login.html"; }
}

function logout() {
  Swal.fire({ title: 'Keluar?', icon: 'question', showCancelButton: true, confirmButtonColor: '#3b82f6' }).then((res) => {
    if (res.isConfirmed) { localStorage.clear(); window.location.href = "login.html"; }
  });
}

// UPDATE: Switch View lebih sederhana (Hanya Dashboard vs Management)
window.switchView = function(viewName) {
    const sections = ["dashboard", "management"];
    sections.forEach(s => {
        document.getElementById(`view-${s}`).classList.add("hidden");
        const nav = document.getElementById(`nav-${s}`);
        if(nav) { nav.classList.remove("bg-blue-600", "text-white", "shadow-md"); nav.classList.add("text-gray-400", "hover:text-white"); }
    });

    document.getElementById(`view-${viewName}`).classList.remove("hidden");
    const activeNav = document.getElementById(`nav-${viewName}`);
    if(activeNav) { activeNav.classList.remove("text-gray-400"); activeNav.classList.add("bg-blue-600", "text-white", "shadow-md"); }
    
    if (viewName === 'dashboard') calculateStats();
    if (viewName === 'management') filterProducts();
};

function calculateStats() {
    if (allProductsData.length === 0) return;
    let totalAset = 0;
    let kategoriCount = {};
    
    allProductsData.forEach(prod => {
        totalAset += (prod.harga * prod.stok);
        if(!kategoriCount[prod.kategori]) kategoriCount[prod.kategori] = 0;
        kategoriCount[prod.kategori]++;
    });

    // Render Aset
    const elAsset = document.getElementById("total-asset-value");
    if(elAsset) elAsset.innerText = "Rp " + totalAset.toLocaleString("id-ID");
    
    // Render Chart
    const chartContainer = document.getElementById("category-chart");
    if(chartContainer) {
        chartContainer.innerHTML = "";
        const totalItems = allProductsData.length;
        for (const [kat, count] of Object.entries(kategoriCount)) {
            const percentage = Math.round((count / totalItems) * 100);
            let color = "bg-blue-500";
            if(kat === "Oli") color = "bg-yellow-400";
            else if(kat === "Ban") color = "bg-gray-800";
            else if(kat === "Sparepart") color = "bg-green-500";

            chartContainer.insertAdjacentHTML("beforeend", `<div><div class="flex justify-between text-sm mb-1"><span class="font-semibold text-gray-700">${kat}</span><span class="text-gray-500">${count} (${percentage}%)</span></div><div class="w-full bg-gray-200 rounded-full h-2.5"><div class="${color} h-2.5 rounded-full" style="width: ${percentage}%"></div></div></div>`);
        }
    }
    
    // Render Top Stock
    const topStockList = document.getElementById("top-stock-list");
    if(topStockList) {
        topStockList.innerHTML = "";
        [...allProductsData].sort((a, b) => b.stok - a.stok).slice(0, 5).forEach(prod => {
            topStockList.insertAdjacentHTML("beforeend", `<li class="flex justify-between items-center border-b pb-2"><div class="flex items-center"><div class="bg-blue-100 text-blue-600 font-bold w-8 h-8 rounded flex items-center justify-center mr-3 text-xs">${prod.stok}</div><span class="text-gray-700 text-sm">${prod.nama_produk}</span></div><span class="text-xs font-bold text-gray-400">Rp ${parseInt(prod.harga).toLocaleString("id-ID")}</span></li>`);
        });
    }
}

// --- DATA & RENDER ---
async function loadAllData() {
    try {
        const response = await fetch(API_URL);
        const products = await response.json();
        allProductsData = products.reverse(); 
        
        // Update Counter
        const elTotal = document.getElementById("total-produk-count");
        if(elTotal) elTotal.innerText = products.length;
        
        // Render Dashboard Stats (Pengganti Tabel Dashboard)
        calculateStats();

        // Render Tabel Manajemen
        renderManagementTable(allProductsData);
    } catch (error) { console.error("Gagal load data:", error); }
}

function getKategoriPrefix(kategoriName) {
    const kat = kategoriList.find(k => k.name === kategoriName);
    return kat ? kat.prefix : "PRD";
}

function renderManagementTable(data) {
    const tbody = document.getElementById("management-table-body");
    const noDataMsg = document.getElementById("no-data-msg");
    if(!tbody) return; tbody.innerHTML = "";
    
    if (data.length === 0) noDataMsg.classList.remove("hidden");
    else noDataMsg.classList.add("hidden");

    data.forEach(produk => {
        const prefix = getKategoriPrefix(produk.kategori);
        const displayID = `${prefix}-${String(produk.id).padStart(3, "0")}`;
        const stokClass = produk.stok < 5 ? "text-red-500 font-bold" : "text-green-600 font-bold";

        tbody.insertAdjacentHTML("beforeend", `
            <tr class="border-b hover:bg-gray-50">
                <td class="py-3 px-6 text-blue-600 font-bold whitespace-nowrap">${displayID}</td>
                <td class="text-center"><img src="${produk.gambar || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded-full mx-auto border object-cover"></td>
                <td class="font-medium">${produk.nama_produk}</td>
                <td class="text-center"><span class="bg-blue-100 text-blue-600 py-1 px-3 rounded-full text-xs font-semibold">${produk.kategori}</span></td>
                <td class="text-right font-bold text-gray-600">Rp ${parseInt(produk.harga).toLocaleString("id-ID")}</td>
                <td class="text-center ${stokClass}">${produk.stok}</td>
                <td class="text-center">
                    <div class="flex item-center justify-center space-x-2">
                        <button onclick="editProduk(${produk.id})" class="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 flex items-center justify-center transition"><i class="fas fa-edit"></i></button>
                        <button onclick="hapusProduk(${produk.id})" class="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            </tr>
        `);
    });
}

function filterProducts() {
    const term = document.getElementById("search-input").value.toLowerCase();
    const kat = document.getElementById("filter-kategori").value;
    renderManagementTable(allProductsData.filter(p => p.nama_produk.toLowerCase().includes(term) && (kat === "all" || p.kategori === kat)));
}

// --- MODAL, EDIT, HAPUS, SUBMIT (SAMA SEPERTI SEBELUMNYA) ---
function bukaModal() {
  if(!modal) return;
  modal.classList.remove("hidden");
  if(formTambahProduk) formTambahProduk.reset();
  if(editIdInput) editIdInput.value = "";
  if(modalTitle) modalTitle.innerText = "Tambah Produk Baru";
  if (imgPreview) imgPreview.src = "";
  if (previewContainer) previewContainer.classList.add("hidden");
  document.getElementById("deskripsiInput").value = ""; 
  const selectInput = document.getElementById("kategoriInput");
  if(selectInput && selectInput.options.length > 0) selectInput.selectedIndex = 0;
}

function tutupModal() { if(modal) modal.classList.add("hidden"); }
window.onclick = function(e) { if (e.target == modal) tutupModal(); }

async function editProduk(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    const produk = await response.json();
    document.getElementById("namaInput").value = produk.nama_produk;
    document.getElementById("deskripsiInput").value = produk.deskripsi || "";
    document.getElementById("hargaInput").value = produk.harga;
    document.getElementById("stokInput").value = produk.stok;
    
    const exists = kategoriList.some(k => k.name === produk.kategori);
    if (!exists) {
         const newPrefix = produk.kategori.substring(0,3).toUpperCase();
         kategoriList.push({ name: produk.kategori, prefix: newPrefix });
         localStorage.setItem("kategoriList", JSON.stringify(kategoriList));
         renderKategoriOptions();
    }
    document.getElementById("kategoriInput").value = produk.kategori;
    if(editIdInput) editIdInput.value = produk.id;
    if (produk.gambar && imgPreview && previewContainer) {
      imgPreview.src = produk.gambar;
      previewContainer.classList.remove("hidden");
    } else { previewContainer.classList.add("hidden"); }
    if(modalTitle) modalTitle.innerText = "Edit Produk";
    if(modal) modal.classList.remove("hidden");
  } catch (error) { console.error(error); Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal data edit.' }); }
}

async function hapusProduk(id) {
  const result = await Swal.fire({ title: 'Yakin hapus?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
  if (result.isConfirmed) {
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (response.ok) { Swal.fire({ icon: 'success', title: 'Terhapus!' }); loadAllData(); }
    } catch (error) { Swal.fire({ icon: 'error', title: 'Error Koneksi' }); }
  }
}

if (formTambahProduk) {
  formTambahProduk.addEventListener("submit", async function (e) {
    e.preventDefault();
    const id = editIdInput.value;
    const submitBtn = this.querySelector('button[type="submit"]');
    const textAsli = submitBtn.innerText;
    submitBtn.innerText = "Mengupload..."; submitBtn.disabled = true;

    const formData = new FormData();
    formData.append("nama_produk", document.getElementById("namaInput").value);
    formData.append("deskripsi", document.getElementById("deskripsiInput").value);
    formData.append("harga", document.getElementById("hargaInput").value);
    formData.append("stok", document.getElementById("stokInput").value);
    formData.append("kategori", document.getElementById("kategoriInput").value);
    const fileGambar = document.getElementById("gambarInput").files[0];
    if (fileGambar) formData.append("gambar", fileGambar);

    try {
      let url = id ? `${API_URL}/${id}` : API_URL;
      let method = id ? "PUT" : "POST";
      const response = await fetch(url, { method: method, body: formData });
      const result = await response.json();
      if (response.ok) {
        Swal.fire({ icon: 'success', title: 'Berhasil!', text: result.message });
        tutupModal(); loadAllData();
      } else { Swal.fire({ icon: 'error', title: 'Gagal', text: result.message }); }
    } catch (error) { Swal.fire({ icon: 'error', title: 'Error' }); } 
    finally { submitBtn.innerText = textAsli; submitBtn.disabled = false; }
  });
}

const gambarInputEl = document.getElementById("gambarInput");
if (gambarInputEl) {
  gambarInputEl.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file && imgPreview && previewContainer) {
      const reader = new FileReader();
      reader.onload = function (e) { imgPreview.src = e.target.result; previewContainer.classList.remove("hidden"); };
      reader.readAsDataURL(file);
    }
  });
}