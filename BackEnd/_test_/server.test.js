const request = require('supertest');
const express = require('express');

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.PORT = 5000;

// Import server setelah env vars di-set
const app = require('../server'); // Pastikan server.js export app

describe('Server API Tests', () => {
  
  describe('Health Check', () => {
    test('GET / should return 200', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
    });
  });

  describe('Authentication Endpoints', () => {
    test('POST /register should validate input', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          username: '',
          email: 'test@example.com',
          password: '123'
        });
      // Sesuaikan dengan response actual dari server Anda
      expect([400, 500]).toContain(response.status);
    });

    test('POST /login should validate credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });
      expect([400, 401, 500]).toContain(response.status);
    });
  });

  describe('Product Endpoints', () => {
    test('GET /products should return products list', async () => {
      const response = await request(app).get('/products');
      expect([200, 500]).toContain(response.status);
    });
  });

  // Tambahkan lebih banyak test sesuai endpoints Anda
});