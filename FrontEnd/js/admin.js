/* =========================================
   1. KONFIGURASI & VARIABEL GLOBAL
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

/* =========================================
   2. MANAJEMEN PRODUK (READ)
   ========================================= */
async function loadProducts() {
  try {
    const response = await fetch(API_URL);
    const products = await response.json();
    const tabelBody = document.getElementById("tabel-produk-body");

    tabelBody.innerHTML = ""; // Bersihkan tabel
    let kategoriCounter = {};

    // Balik urutan agar produk terbaru di atas
    const productsSorted = products.reverse();

    productsSorted.forEach((produk) => {
      // Logika ID Kustom (Contoh: OLI-001)
      let prefix = "GEN";
      let kat = produk.kategori;
      if (kat === "Oli") prefix = "OLI";
      else if (kat === "Ban") prefix = "BAN";
      else if (kat === "Sparepart") prefix = "SPR";
      else if (kat === "Service") prefix = "SRV";

      if (!kategoriCounter[kat]) kategoriCounter[kat] = 0;
      kategoriCounter[kat]++;

      const displayID = `${prefix}-${String(kategoriCounter[kat]).padStart(
        3,
        "0"
      )}`;

      // Render Baris Tabel
      const row = `
                <tr class="border-b border-gray-200 hover:bg-gray-50">
                    <td class="py-3 px-6 font-bold text-blue-600">${displayID}</td>
                    <td class="py-3 px-6 flex items-center">
                        <img src="${
                          produk.gambar || "https://via.placeholder.com/40"
                        }" class="w-10 h-10 rounded-full mr-3 object-cover border bg-white">
                        ${produk.nama_produk}
                    </td>
                    <td class="py-3 px-6"><span class="bg-gray-200 text-gray-700 py-1 px-3 rounded-full text-xs">${
                      produk.kategori
                    }</span></td>
                    <td class="py-3 px-6">Rp ${parseInt(
                      produk.harga
                    ).toLocaleString("id-ID")}</td>
                    <td class="py-3 px-6 font-bold ${
                      produk.stok < 5 ? "text-red-500" : "text-green-600"
                    }">${produk.stok}</td>
                    <td class="py-3 px-6 text-center">
                        <div class="flex item-center justify-center">
                            <button onclick="editProduk(${
                              produk.id
                            })" class="w-4 mr-2 transform hover:text-blue-500 hover:scale-110">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="hapusProduk(${
                              produk.id
                            })" class="w-4 transform hover:text-red-500 hover:scale-110">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
      tabelBody.insertAdjacentHTML("afterbegin", row);
    });
  } catch (error) {
    console.error("Error:", error);
    alert("Gagal mengambil data produk. Pastikan server menyala.");
  }
}

/* =========================================
   3. LOGIKA MODAL (BUKA/TUTUP)
   ========================================= */
function bukaModal() {
  modal.classList.remove("hidden");
  formTambahProduk.reset();
  editIdInput.value = "";
  modalTitle.innerText = "Tambah Produk Baru";

  // Reset preview gambar
  if (imgPreview) imgPreview.src = "";
  if (previewContainer) previewContainer.classList.add("hidden");
}

function tutupModal() {
  modal.classList.add("hidden");
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
    editIdInput.value = produk.id;

    // Tampilkan preview gambar lama jika ada
    if (produk.gambar && imgPreview && previewContainer) {
      imgPreview.src = produk.gambar;
      previewContainer.classList.remove("hidden");
    } else if (previewContainer) {
      previewContainer.classList.add("hidden");
    }

    modalTitle.innerText = "Edit Produk";
    modal.classList.remove("hidden");
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
