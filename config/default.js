// config/default.js - Base configuration
module.exports = {
  server: {
    port: 3000,
  },
  storage: {
    uploadsDir: 'uploads',
    segmentsDir: 'segments',
    maxFileSize: 100 * 1024 * 1024, // 100MB
  },
  ffmpeg: {
    threads: 1,
    timeout: 300000, // 5 minutes
  }
};