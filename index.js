const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 3000;

// Konfigurasi EJS
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Middleware untuk parsing JSON dan form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Konfigurasi koneksi ke MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Ganti dengan username MySQL Anda
  password: '', // Ganti dengan password MySQL Anda
  database: 'pertemuan11', // Ganti dengan nama database Anda
});

// Koneksi ke MySQL
connection.connect((err) => {
  if (err) throw err;
  console.log('Terhubung ke MySQL Server!');

  // Buat tabel mahasiswa jika belum ada
  const createTable = `
    CREATE TABLE IF NOT EXISTS mahasiswa (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nim VARCHAR(20) NOT NULL UNIQUE,
      nama VARCHAR(255) NOT NULL,
      alamat TEXT NOT NULL
    )`;
  connection.query(createTable, (err) => {
    if (err) throw err;
    console.log('Tabel mahasiswa siap digunakan!');

    // Masukkan data awal jika tabel kosong
    const initialData = `
      INSERT IGNORE INTO mahasiswa (nim, nama, alamat) VALUES
      ('123456', 'Budi Santoso', 'Jl. Merdeka No. 1, Jakarta'),
      ('654321', 'Ani Lestari', 'Jl. Sudirman No. 5, Bandung'),
      ('112233', 'Citra Dewi', 'Jl. Gatot Subroto No. 10, Surabaya')
    `;
    connection.query(initialData, (err) => {
      if (err) throw err;
      console.log('Data awal mahasiswa dimasukkan!');
    });
  });
});

// Log semua request
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// Middleware untuk Validasi
function validateMahasiswaFields(req, res, next) {
  const { nim, nama, alamat } = req.body;
  if (!nim || !nama || !alamat) {
    return res.status(400).json({ error: 'NIM, Nama, dan Alamat harus diisi' });
  }
  next();
}

// GET - Menampilkan daftar mahasiswa (halaman HTML)
app.get('/mahasiswa', (req, res) => {
  connection.query('SELECT * FROM mahasiswa', (err, results) => {
    if (err) throw err;
    res.render('index', { mahasiswa: results, searchQuery: '' });
  });
});

// GET - Form untuk menambah mahasiswa
app.get('/add-mahasiswa', (req, res) => {
  res.render('add');
});

// POST - Membuat data mahasiswa baru
app.post('/add-mahasiswa', validateMahasiswaFields, (req, res) => {
  const { nim, nama, alamat } = req.body;
  const query = 'INSERT INTO mahasiswa (nim, nama, alamat) VALUES (?, ?, ?)';
  connection.query(query, [nim, nama, alamat], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).send('NIM sudah digunakan!');
      }
      throw err;
    }
    res.redirect('/mahasiswa');
  });
});

// GET - Form untuk memperbarui mahasiswa
app.get('/update-mahasiswa/:id', (req, res) => {
  const mahasiswaId = req.params.id;
  connection.query('SELECT * FROM mahasiswa WHERE id = ?', [mahasiswaId], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      res.render('edit', { mahasiswa: results[0] });
    } else {
      res.status(404).send('Mahasiswa tidak ditemukan');
    }
  });
});

// POST - Memperbarui data mahasiswa berdasarkan ID
app.post('/update-mahasiswa/:id', validateMahasiswaFields, (req, res) => {
  const mahasiswaId = req.params.id;
  const { nim, nama, alamat } = req.body;
  const query = 'UPDATE mahasiswa SET nim = ?, nama = ?, alamat = ? WHERE id = ?';
  connection.query(query, [nim, nama, alamat, mahasiswaId], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).send('NIM sudah digunakan!');
      }
      throw err;
    }
    res.redirect('/mahasiswa');
  });
});

// GET - Menghapus data mahasiswa berdasarkan ID
app.get('/delete-mahasiswa/:id', (req, res) => {
  const mahasiswaId = req.params.id;
  connection.query('DELETE FROM mahasiswa WHERE id = ?', [mahasiswaId], (err, result) => {
    if (err) throw err;
    res.redirect('/mahasiswa');
  });
});

// GET - Pencarian mahasiswa berdasarkan NIM
app.get('/search-mahasiswa', (req, res) => {
  const searchQuery = req.query.nim || '';
  let query = 'SELECT * FROM mahasiswa';
  if (searchQuery) {
    query += ' WHERE nim LIKE ?';
    connection.query(query, [`%${searchQuery}%`], (err, results) => {
      if (err) throw err;
      res.render('index', { mahasiswa: results, searchQuery });
    });
  } else {
    connection.query(query, (err, results) => {
      if (err) throw err;
      res.render('index', { mahasiswa: results, searchQuery });
    });
  }
});

// Halaman utama
app.get('/', (req, res) => {
  res.redirect('/mahasiswa');
});

app.listen(port, () => {
  console.log(`Server http://localhost:${port}`);
});
