document.addEventListener("DOMContentLoaded", function () {
  /* =========================================
     1. LOGIKA NAVBAR TOGGLE (MOBILE)
     ========================================= */
  const navbarToggle = document.getElementById("navbar-toggle");
  const navbarContent = document.getElementById("navbar-content");

  if (navbarToggle && navbarContent) {
    navbarToggle.addEventListener("click", function () {
      navbarContent.classList.toggle("hidden");
      navbarContent.classList.toggle("flex");
    });
  }

  /* =========================================
     2. LOGIKA PINDAH REGISTER <-> LOGIN
     ========================================= */
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

  /* =========================================
     3. VALIDASI PASSWORD REAL-TIME
     ========================================= */
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

  /* =========================================
     4. SUBMIT REGISTER
     ========================================= */
  const registerFormElement = document.querySelector("#register-form form");
  if (registerFormElement) {
    registerFormElement.addEventListener("submit", async function (e) {
      e.preventDefault();

      const nama = document.getElementById("nama-register").value;
      const email = document.getElementById("email-register").value;
      const password = document.getElementById("password-register").value;
      const confirmPassword = document.getElementById("password-confirm-register").value;

      // Validasi Email
      if (!email.endsWith("@gmail.com")) {
        alert("❌ Maaf, hanya email @gmail.com yang diperbolehkan!");
        return;
      }

      // Validasi Password Match
      if (password !== confirmPassword) {
        alert("Password tidak cocok!");
        return;
      }

      // Validasi Captcha
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

  /* =========================================
     5. SUBMIT LOGIN
     ========================================= */
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

  /* =========================================
     6. PASSWORD TOGGLE (ICON MATA)
     ========================================= */
  function setupPasswordToggle(buttonId, inputId) {
    const toggleBtn = document.getElementById(buttonId);
    const inputField = document.getElementById(inputId);
    if (toggleBtn && inputField) {
      toggleBtn.addEventListener("click", function () {
        const type = inputField.getAttribute("type") === "password" ? "text" : "password";
        inputField.setAttribute("type", type);
        
        const icon = this.querySelector("i");
        if (icon) {
            if (type === "text") {
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
            } else {
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
            }
        }
      });
    }
  }

  setupPasswordToggle("toggle-password-login", "password-login");
  setupPasswordToggle("toggle-password-register", "password-register");
  setupPasswordToggle("toggle-confirm-password", "password-confirm-register");

  /* =========================================
     7. CEK STATUS LOGIN (UBAH TOMBOL NAVBAR)
     ========================================= */
  function cekStatusLoginNavbar() {
    const token = localStorage.getItem("token");
    const navBtn = document.getElementById("navbar-login-btn");

    if (navBtn) {
      if (token) {
        // --- SUDAH LOGIN ---
        navBtn.innerText = "Logout";
        navBtn.classList.remove("bg-blue-600", "hover:bg-blue-700");
        navBtn.classList.add("bg-red-600", "hover:bg-red-700");
        navBtn.href = "#";

        // Reset Event Listener (agar tidak double)
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
        // --- BELUM LOGIN ---
        navBtn.innerText = "Login";
        navBtn.href = "login.html";
        navBtn.classList.add("bg-blue-600", "hover:bg-blue-700");
        navBtn.classList.remove("bg-red-600", "hover:bg-red-700");
      }
    }
  }

  // Jalankan Cek Login
  cekStatusLoginNavbar();
});