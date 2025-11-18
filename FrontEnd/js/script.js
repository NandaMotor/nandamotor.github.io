document.addEventListener('DOMContentLoaded', function() {
    const navbarToggle = document.getElementById('navbar-toggle');
    const navbarContent = document.getElementById('navbar-content');

    if (navbarToggle && navbarContent) {
        navbarToggle.addEventListener('click', function() {
            navbarContent.classList.toggle('hidden'); // Menambah/menghapus class 'hidden'
            navbarContent.classList.toggle('flex'); // Mengganti display dari 'hidden' ke 'flex' atau sebaliknya
        });
    }

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterBtn = document.getElementById('show-register-btn');
    const showLoginBtn = document.getElementById('show-login-btn');

    // Cek jika tombol 'Daftar di sini' ada
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Mencegah link pindah halaman
            loginForm.classList.add('hidden'); // Sembunyikan form login
            registerForm.classList.remove('hidden'); // Tampilkan form daftar
        });
    }

    // Cek jika tombol 'Login di sini' ada
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Mencegah link pindah halaman
            loginForm.classList.remove('hidden'); // Tampilkan form login
            registerForm.classList.add('hidden'); // Sembunyikan form daftar
        });
    }

    // Ambil elemen untuk validasi password
    const passwordField = document.getElementById('password-register');
    const confirmPasswordField = document.getElementById('password-confirm-register');
    const errorMessage = document.getElementById('password-error-msg');
    const registerButton = document.getElementById('register-submit-btn');

    // Pastikan kita berada di halaman login (elemen-elemennya ada)
    if (passwordField && confirmPasswordField && errorMessage && registerButton) {
        
        // Buat fungsi untuk memvalidasi
        function validatePassword() {
            if (passwordField.value !== confirmPasswordField.value) {
                // Jika password tidak cocok
                errorMessage.textContent = 'Password tidak cocok.';
                errorMessage.classList.remove('hidden'); // Tampilkan pesan error
                
                // Nonaktifkan tombol submit
                registerButton.disabled = true;
                registerButton.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                // Jika password cocok
                errorMessage.textContent = '';
                errorMessage.classList.add('hidden'); // Sembunyikan pesan error
                
                // Aktifkan tombol submit
                registerButton.disabled = false;
                registerButton.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }

        // Jalankan fungsi validasi setiap kali pengguna mengetik
        passwordField.addEventListener('keyup', validatePassword);
        confirmPasswordField.addEventListener('keyup', validatePassword);
    }

    // Form register
    const registerFormElement = document.querySelector('#register-form form');
    if (registerFormElement) {
        registerFormElement.addEventListener('submit', async function(e) {
            e.preventDefault(); // Mencegah halaman refresh sendiri

            // 1. Ambil data dari input
            const nama = document.getElementById('nama-register').value;
            const email = document.getElementById('email-register').value;
            const password = document.getElementById('password-register').value;
            const confirmPassword = document.getElementById('password-confirm-register').value;

            // 2. Validasi (Cek Password sekali lagi)
            if (password !== confirmPassword) {
                alert("Password tidak cocok!");
                return;
            }

            // 3. Kirim data ke BackEnd (Node.js)
            try {
                // Tampilkan loading (opsional, agar user tahu sedang proses)
                const submitBtn = document.getElementById('register-submit-btn');
                const originalText = submitBtn.innerText;
                submitBtn.innerText = "Memproses...";
                submitBtn.disabled = true;

                const response = await fetch('http://localhost:3000/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nama: nama,
                        email: email,
                        password: password
                    })
                });

                const result = await response.json();

                // Kembalikan tombol seperti semula
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;

                if (response.ok) {
                    // Jika Sukses (Status 201)
                    alert("🎉 BERHASIL: " + result.message);
                    
                    // Otomatis pindah ke tampilan Login
                    document.getElementById('register-form').classList.add('hidden');
                    document.getElementById('login-form').classList.remove('hidden');
                    
                    // Kosongkan form
                    registerFormElement.reset();
                } else {
                    // Jika Gagal (Misal email sudah ada)
                    alert("❌ GAGAL: " + result.message);
                }

            } catch (error) {
                console.error('Error:', error);
                alert("⚠️ Terjadi kesalahan koneksi ke server.");
                document.getElementById('register-submit-btn').disabled = false;
            }
        });
    }

    // Form login
    const loginFormElement = document.querySelector('#login-form form');
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = document.getElementById('email-login').value;
            const password = document.getElementById('password-login').value;
            const loginBtn = loginFormElement.querySelector('button');

            try {
                // Ubah tombol jadi loading
                loginBtn.innerText = "Memproses...";
                loginBtn.disabled = true;

                const response = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const result = await response.json();
                
                // Kembalikan tombol
                loginBtn.innerText = "Login";
                loginBtn.disabled = false;

                if (response.ok) {
                    // === LOGIN SUKSES ===
                    alert("🎉 " + result.message);

                    // 1. Simpan Token ke LocalStorage (Browser)
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('role', result.role);

                    // 2. Cek Role untuk Pengalihan Halaman (Redirect)
                    if (result.role === 'admin') {
                        // HAPUS alert lama, dan BUKA komentar ini:
                        alert("Login Berhasil! Selamat datang Admin.");
                        window.location.href = 'admin.html'; 
                    } else {
                        // Jika User biasa, arahkan ke home
                        window.location.href = 'index.html';
                    }

                } else {
                    // === LOGIN GAGAL ===
                    alert("❌ " + result.message);
                }

            } catch (error) {
                console.error(error);
                alert("⚠️ Gagal terhubung ke server.");
                loginBtn.innerText = "Login";
                loginBtn.disabled = false;
            }
        });
    }

});