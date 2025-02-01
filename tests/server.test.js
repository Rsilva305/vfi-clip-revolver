// tests/server.test.js
const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../server');  // You'll need to modify server.js to export the app

describe('Server API Tests', () => {
  afterAll(done => {
    // Cleanup test files
    const testUploads = path.join(__dirname, '../test/uploads');
    const testSegments = path.join(__dirname, '../test/segments');
    fs.rmSync(testUploads, { recursive: true, force: true });
    fs.rmSync(testSegments, { recursive: true, force: true });
    done();
  });

  test('GET / should return 200', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  test('POST /upload should handle file upload', async () => {
    const testFile = path.join(__dirname, 'fixtures/test.mp4');
    const response = await request(app)
      .post('/upload')
      .attach('videos', testFile);
    expect(response.status).toBe(200);
    expect(response.body.segments).toBeDefined();
  });
});