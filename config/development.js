// config/development.js
module.exports = {
  env: 'development',
  server: {
    port: 3000,
  },
  storage: {
    uploadsDir: 'uploads',
    segmentsDir: 'segments',
    maxFileSize: 500 * 1024 * 1024, // 500MB for testing
  },
  ffmpeg: {
    threads: 1,
    timeout: 600000, // 10 minutes for testing
  }
};