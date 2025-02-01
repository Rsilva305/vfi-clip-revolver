// config/production.js
module.exports = {
  env: 'production',
  server: {
    port: process.env.PORT || 80,
  },
  storage: {
    uploadsDir: '/var/uploads',
    segmentsDir: '/var/segments',
    maxFileSize: 100 * 1024 * 1024, // 100MB
  },
  ffmpeg: {
    threads: 2,
    timeout: 300000, // 5 minutes
  }
};