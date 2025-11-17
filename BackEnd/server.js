// 1. Impor 'tools' yang dibutuhkan
const express = require('express');
const mysql = require('mysql2'); // Nanti kita pakai ini untuk database

// 2. Buat aplikasi Express
const app = express();
const PORT = 3000; // Menjalankan server di Port 3000

// 3. Middleware
app.use(express.json());

// Definisikan "Rute" (Routes)
app.get('/', (req, res) => {
  res.send('Halo! Server BackEnd Nanda Motor sudah berjalan.');
});

// Jalankan Server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});