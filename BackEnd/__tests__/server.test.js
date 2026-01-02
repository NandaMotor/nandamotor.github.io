const request = require('supertest');
const bcrypt = require('bcryptjs');

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.SECRET_KEY = 'test-secret-key-for-testing';
process.env.WEBHOOK_SECRET = 'test-webhook-secret';
process.env.PORT = 5000;
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'test_db';
process.env.SKIP_EMAIL_VERIFICATION = 'true';
process.env.WA_BOT_API = 'http://localhost:5000';

// Mock database
const mockDb = {
  users: [],
  products: [],
  query: jest.fn(),
  promise: jest.fn()
};

// Mock mysql2
jest.mock('mysql2', () => ({
  createPool: jest.fn(() => ({
    promise: () => mockDb,
    query: mockDb.query
  }))
}));

// Mock bcryptjs
jest.mock('bcryptjs');

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

// Mock cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({
        secure_url: 'https://cloudinary.com/test.jpg',
        public_id: 'test-public-id'
      }),
      destroy: jest.fn().mockResolvedValue({ result: 'ok' })
    }
  }
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn((options, callback) => {
      if (callback) callback(null, { messageId: 'test-message-id' });
      return Promise.resolve({ messageId: 'test-message-id' });
    })
  }))
}));

// Mock axios
jest.mock('axios');

const app = require('../server');

describe('Authentication Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.users = [];
  });

  describe('POST /api/register', () => {
    test('should register new user successfully', async () => {
      mockDb.query.mockResolvedValueOnce([{ insertId: 1 }]);
      bcrypt.hash = jest.fn().mockResolvedValue('hashed_password');

      const response = await request(app)
        .post('/api/register')
        .send({
          nama: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
    });

    test('should register with email verification disabled', async () => {
      process.env.SKIP_EMAIL_VERIFICATION = 'false';
      mockDb.query.mockResolvedValueOnce([[]]);
      mockDb.query.mockResolvedValueOnce([{ insertId: 1 }]);
      bcrypt.hash = jest.fn().mockResolvedValue('hashed_password');

      const response = await request(app)
        .post('/api/register')
        .send({
          nama: 'testuser',
          email: 'test2@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      process.env.SKIP_EMAIL_VERIFICATION = 'true';
    });

    test('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          nama: 'testuser'
          // Missing email and password
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    test('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          nama: 'testuser',
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
    });

    test('should reject duplicate email', async () => {
      mockDb.query.mockResolvedValueOnce([[{ id: 1, email: 'existing@example.com' }]]);

      const response = await request(app)
        .post('/api/register')
        .send({
          nama: 'testuser',
          email: 'existing@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
    });

    test('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({});

      expect(response.status).toBe(400);
    });

    test('should handle database error during registration', async () => {
      mockDb.query.mockResolvedValueOnce([[]]);
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));
      bcrypt.hash = jest.fn().mockResolvedValue('hashed_password');

      const response = await request(app)
        .post('/api/register')
        .send({
          nama: 'testuser',
          email: 'test3@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/login', () => {
    test('should login successfully with valid credentials', async () => {
      mockDb.query.mockResolvedValueOnce([[{
        id: 1,
        nama: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password',
        is_verified: 1,
        role: 'user'
      }]]);

      bcrypt.compare = jest.fn().mockResolvedValue(true);
      const jwt = require('jsonwebtoken');
      jwt.sign = jest.fn().mockReturnValue('mock_jwt_token');

      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('message');
    });

    test('should reject unverified email when verification is enabled', async () => {
      process.env.SKIP_EMAIL_VERIFICATION = 'false';
      mockDb.query.mockResolvedValueOnce([[{
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
        is_verified: 0
      }]]);

      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('verified', false);
      process.env.SKIP_EMAIL_VERIFICATION = 'true';
    });

    test('should reject login with missing credentials', async () => {
      mockDb.query.mockResolvedValueOnce([[]]);

      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com'
          // Missing password
        });

      expect(response.status).toBe(401);
    });

    test('should reject login with wrong password', async () => {
      mockDb.query.mockResolvedValueOnce([[{
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
        is_verified: 1
      }]]);

      bcrypt.compare = jest.fn().mockResolvedValue(false);

      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });

    test('should reject login for non-existent user', async () => {
      mockDb.query.mockResolvedValueOnce([[]]);

      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
    });

    test('should handle empty request body', async () => {
      mockDb.query.mockResolvedValueOnce([[]]);

      const response = await request(app)
        .post('/api/login')
        .send({});

      expect(response.status).toBe(401);
    });

    test('should handle database error during login', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/verify-email', () => {
    test('should verify email successfully with valid token', async () => {
      mockDb.query.mockResolvedValueOnce([[{
        id: 1,
        nama: 'Test User',
        email: 'test@example.com',
        is_verified: 0,
        verification_token: 'valid-token'
      }]]);
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const response = await request(app)
        .get('/api/verify-email?token=valid-token');

      expect(response.status).toBe(200);
      expect(response.text).toContain('Berhasil Diverifikasi');
    });

    test('should reject verification without token', async () => {
      const response = await request(app)
        .get('/api/verify-email');

      expect(response.status).toBe(400);
      expect(response.text).toContain('tidak valid');
    });

    test('should handle already verified email', async () => {
      mockDb.query.mockResolvedValueOnce([[{
        id: 1,
        email: 'test@example.com',
        is_verified: 1
      }]]);

      const response = await request(app)
        .get('/api/verify-email?token=some-token');

      expect(response.status).toBe(200);
      expect(response.text).toContain('sudah diverifikasi');
    });

    test('should handle invalid token', async () => {
      mockDb.query.mockResolvedValueOnce([[]]);

      const response = await request(app)
        .get('/api/verify-email?token=invalid-token');

      expect(response.status).toBe(404);
      expect(response.text).toContain('tidak ditemukan');
    });

    test('should handle database error during verification', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/verify-email?token=some-token');

      expect(response.status).toBe(500);
      expect(response.text).toContain('Server Error');
    });
  });

  describe('POST /api/resend-verification', () => {
    test('should resend verification email successfully', async () => {
      mockDb.query.mockResolvedValueOnce([[{
        id: 1,
        nama: 'Test User',
        email: 'test@example.com',
        is_verified: 0
      }]]);
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const response = await request(app)
        .post('/api/resend-verification')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('emailSent');
    });

    test('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/resend-verification')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
    });

    test('should handle non-existent email', async () => {
      mockDb.query.mockResolvedValueOnce([[]]);

      const response = await request(app)
        .post('/api/resend-verification')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(404);
    });

    test('should reject already verified email', async () => {
      mockDb.query.mockResolvedValueOnce([[{
        id: 1,
        email: 'test@example.com',
        is_verified: 1
      }]]);

      const response = await request(app)
        .post('/api/resend-verification')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
    });

    test('should handle database error', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/resend-verification')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(500);
    });
  });
});

describe('Product Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    test('should get all products successfully', async () => {
      mockDb.query.mockResolvedValueOnce([[
        { id: 1, nama_produk: 'Product 1', harga: 100, stok: 10 },
        { id: 2, nama_produk: 'Product 2', harga: 200, stok: 5 }
      ]]);

      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    test('should return empty array when no products', async () => {
      mockDb.query.mockResolvedValueOnce([[]]);

      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should handle database error', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app).get('/api/products');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/products/:id', () => {
    test('should get product by ID successfully', async () => {
      mockDb.query.mockResolvedValueOnce([[
        { id: 1, nama_produk: 'Product 1', harga: 100, stok: 10 }
      ]]);

      const response = await request(app).get('/api/products/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('nama_produk', 'Product 1');
    });

    test('should return 404 for non-existent product', async () => {
      mockDb.query.mockResolvedValueOnce([[]]);

      const response = await request(app).get('/api/products/999');

      expect(response.status).toBe(404);
    });

    test('should handle database error', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app).get('/api/products/1');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/products', () => {
    test('should create new product successfully', async () => {
      mockDb.query.mockResolvedValueOnce([{ insertId: 1 }]);

      const response = await request(app)
        .post('/api/products')
        .send({
          nama_produk: 'New Product',
          harga: 150,
          stok: 20,
          kategori: 'Test Category'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
    });

    test('should create product with image upload', async () => {
      mockDb.query.mockResolvedValueOnce([{ insertId: 1 }]);

      const response = await request(app)
        .post('/api/products')
        .field('nama_produk', 'New Product')
        .field('harga', '150')
        .field('stok', '20')
        .attach('gambar', Buffer.from('test image'), 'test.jpg');

      expect(response.status).toBe(201);
    });

    test('should reject product with missing fields', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({
          nama_produk: 'Product'
          // Missing harga and stok
        });

      expect(response.status).toBe(400);
    });

    test('should handle database error', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/products')
        .send({
          nama_produk: 'Product',
          harga: 100,
          stok: 10
        });

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/products/:id', () => {
    test('should update product successfully', async () => {
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const response = await request(app)
        .put('/api/products/1')
        .send({
          nama_produk: 'Updated Product',
          harga: 200,
          stok: 15,
          kategori: 'Updated Category'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    test('should update product with new image', async () => {
      mockDb.query.mockResolvedValueOnce([[{ public_id: 'old-public-id' }]]);
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const response = await request(app)
        .put('/api/products/1')
        .field('nama_produk', 'Updated Product')
        .field('harga', '200')
        .field('stok', '15')
        .attach('gambar', Buffer.from('new image'), 'new.jpg');

      expect(response.status).toBe(200);
    });

    test('should handle update with partial data', async () => {
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const response = await request(app)
        .put('/api/products/1')
        .send({
          nama_produk: 'Updated Product',
          harga: 200,
          stok: 15
        });

      expect(response.status).toBe(200);
    });

    test('should handle database error', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .put('/api/products/1')
        .send({
          nama_produk: 'Updated Product',
          harga: 200,
          stok: 15
        });

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/products/:id', () => {
    test('should delete product successfully', async () => {
      mockDb.query.mockResolvedValueOnce([[{ public_id: 'test-public-id' }]]);
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const response = await request(app).delete('/api/products/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    test('should handle deletion when product has no image', async () => {
      mockDb.query.mockResolvedValueOnce([[{ public_id: null }]]);
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const response = await request(app).delete('/api/products/1');

      expect(response.status).toBe(200);
    });

    test('should handle database error', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app).delete('/api/products/1');

      expect(response.status).toBe(500);
    });
  });
});

describe('WhatsApp Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/whatsapp/contact-owner', () => {
    test('should forward message to WhatsApp Bot successfully', async () => {
      const axios = require('axios');
      axios.post = jest.fn().mockResolvedValue({
        data: {
          success: true,
          forwardedToAdmin: true
        }
      });

      const response = await request(app)
        .post('/api/whatsapp/contact-owner')
        .send({
          sessionId: 'test-session',
          customerName: 'John Doe',
          customerPhone: '081234567890',
          message: 'Test message'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    test('should reject request without message', async () => {
      const response = await request(app)
        .post('/api/whatsapp/contact-owner')
        .send({
          sessionId: 'test-session',
          customerName: 'John Doe'
          // Missing message
        });

      expect(response.status).toBe(400);
    });

    test('should handle WhatsApp Bot offline', async () => {
      const axios = require('axios');
      axios.post = jest.fn().mockRejectedValue(new Error('Connection refused'));

      const response = await request(app)
        .post('/api/whatsapp/contact-owner')
        .send({
          message: 'Test message'
        });

      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle request with minimal data', async () => {
      const axios = require('axios');
      axios.post = jest.fn().mockResolvedValue({
        data: {
          success: true,
          forwardedToAdmin: true
        }
      });

      const response = await request(app)
        .post('/api/whatsapp/contact-owner')
        .send({
          message: 'Test message only'
        });

      expect(response.status).toBe(200);
    });
  });
});

describe('Root Endpoint', () => {
  test('should return API information', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('endpoints');
  });
});
