/* =========================================
   FILE: admin.js
   Deskripsi: Mengelola Dashboard Admin & CRUD Produk (Fixed Layout)
   ========================================= */

const API_URL = "http://localhost:3000/api/products";
const modal = document.getElementById("modalTambah");
const modalTitle = document.getElementById("modalTitle");
const editIdInput = document.getElementById("editIdInput");
const imgPreview = document.getElementById("imgPreview");
const previewContainer = document.getElementById("previewContainer");
const formTambahProduk = document.getElementById("formTambahProduk");

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

// Tambahkan event listener untuk tombol logout di navbar admin (jika ada)
document.getElementById("logout-btn")?.addEventListener("click", function(e) {
    e.preventDefault();
    logout();
});

/* =========================================
   2. MANAJEMEN PRODUK (READ)
   ========================================= */
async function loadProducts() {
  try {
    const response = await fetch(API_URL);
    const products = await response.json();
    const tabelBody = document.getElementById("tabel-produk-body"); // Pastikan ID ini sesuai di HTML (biasanya product-table-body atau tabel-produk-body)
    
    // Fallback jika ID tabel beda
    const targetTable = tabelBody || document.getElementById("product-table-body");
    if(!targetTable) return;

    targetTable.innerHTML = ""; // Bersihkan tabel
    let kategoriCounter = {};

    // Balik urutan agar produk terbaru di atas
    const productsSorted = products.reverse();

    productsSorted.forEach((produk) => {
      // --- LOGIKA ID KUSTOM ---
      let prefix = "GEN";
      let kat = produk.kategori;
      if (kat === "Oli") prefix = "OLI";
      else if (kat === "Ban") prefix = "BAN";
      else if (kat === "Sparepart") prefix = "SPR";
      else if (kat === "Service") prefix = "SRV";

      if (!kategoriCounter[kat]) kategoriCounter[kat] = 0;
      kategoriCounter[kat]++;

      const displayID = `${prefix}-${String(kategoriCounter[kat]).padStart(3, "0")}`;
      
      // --- STYLE STOK ---
      const stokClass = produk.stok < 5 ? "text-red-500 font-bold" : "text-green-600 font-bold";
      
      // --- GAMBAR ---
      const gambar = produk.gambar || "https://via.placeholder.com/40";

      // Render Baris Tabel (7 KOLOM - Sesuai Header Baru)
      const row = `
        <tr class="border-b border-gray-200 hover:bg-gray-50">
            <td class="py-3 px-6 text-left whitespace-nowrap font-bold text-blue-600">
                ${displayID}
            </td>

            <td class="py-3 px-6 text-center">
                <div class="flex items-center justify-center">
                    <img src="${gambar}" class="w-10 h-10 rounded-full border border-gray-200 object-cover">
                </div>
            </td>

            <td class="py-3 px-6 text-left font-medium text-gray-700">
                ${produk.nama_produk}
            </td>

            <td class="py-3 px-6 text-center">
                <span class="bg-blue-100 text-blue-600 py-1 px-3 rounded-full text-xs font-semibold">
                    ${produk.kategori}
                </span>
            </td>

            <td class="py-3 px-6 text-right font-bold text-gray-600">
                Rp ${parseInt(produk.harga).toLocaleString("id-ID")}
            </td>

            <td class="py-3 px-6 text-center ${stokClass}">
                ${produk.stok}
            </td>

            <td class="py-3 px-6 text-center">
                <div class="flex item-center justify-center space-x-2">
                    <button onclick="editProduk(${produk.id})" class="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 flex items-center justify-center transition" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="hapusProduk(${produk.id})" class="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition" title="Hapus">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
      `;
      targetTable.insertAdjacentHTML("beforeend", row);
    });
    
    // Update Statistik Dashboard (Total Produk)
    const elTotalProduk = document.getElementById("total-produk-count");
    if(elTotalProduk) elTotalProduk.innerText = products.length;

  } catch (error) {
    console.error("Error:", error);
    // alert("Gagal mengambil data produk. Pastikan server menyala.");
  }
}

/* =========================================
   3. LOGIKA MODAL (BUKA/TUTUP)
   ========================================= */
function bukaModal() {
  if(!modal) return;
  modal.classList.remove("hidden");
  if(formTambahProduk) formTambahProduk.reset();
  if(editIdInput) editIdInput.value = "";
  if(modalTitle) modalTitle.innerText = "Tambah Produk Baru";

  // Reset preview gambar
  if (imgPreview) imgPreview.src = "";
  if (previewContainer) previewContainer.classList.add("hidden");
}

function tutupModal() {
  if(modal) modal.classList.add("hidden");
}

// Tutup modal jika klik di luar area putih
window.onclick = function(event) {
    if (event.target == modal) {
        tutupModal();
    }
}

/* =========================================
   4. LOGIKA EDIT & HAPUS
   ========================================= */
async function editProduk(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    const produk = await response.json();

    // Isi form dengan data yang ada
    document.getElementById("namaInput").value = produk.nama_produk;
    document.getElementById("hargaInput").value = produk.harga;
    document.getElementById("stokInput").value = produk.stok;
    document.getElementById("kategoriInput").value = produk.kategori;
    if(editIdInput) editIdInput.value = produk.id;

    // Tampilkan preview gambar lama jika ada
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
        loadProducts();
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
   5. LOGIKA SUBMIT (TAMBAH/UPDATE)
   ========================================= */
if (formTambahProduk) {
  formTambahProduk.addEventListener("submit", async function (e) {
    e.preventDefault();

    const id = editIdInput.value;
    const submitBtn = this.querySelector('button[type="submit"]');
    const textAsli = submitBtn.innerText;

    // Ubah tombol jadi loading
    submitBtn.innerText = "Mengupload...";
    submitBtn.disabled = true;

    // Gunakan FormData untuk support upload file
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
        loadProducts();
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

// Preview gambar saat user memilih file
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

/* =========================================
   6. INISIALISASI
   ========================================= */
// Jalankan saat halaman siap
document.addEventListener("DOMContentLoaded", () => {
  cekOtorisasiAdmin();
  loadProducts();
});