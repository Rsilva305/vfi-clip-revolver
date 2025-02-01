// config/test.js
module.exports = {
  env: 'test',
  server: {
    port: 3001,
  },
  storage: {
    uploadsDir: 'test/uploads',
    segmentsDir: 'test/segments',
    maxFileSize: 10 * 1024 * 1024, // 10MB for tests
  },
  ffmpeg: {
    threads: 1,
    timeout: 30000, // 30 seconds for tests
  }
};