const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/script.js', express.static(path.join(__dirname, 'script.js')));
app.use('/segments', express.static(path.join(__dirname, 'segments')));

// Debug function to check directory existence and write permissions
function checkDirectory(dir) {
  console.log(`Checking directory: ${dir}`);
  if (!fs.existsSync(dir)) {
    console.log(`Directory doesn't exist, creating: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
  try {
    const testFile = path.join(dir, 'test.txt');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log(`Directory ${dir} is writable`);
    return true;
  } catch (error) {
    console.error(`Error accessing directory ${dir}:`, error);
    return false;
  }
}

// Route to handle video uploads
app.post('/upload', upload.array('videos'), async (req, res) => {
  console.log('Upload request received');
  const files = req.files;
  const outputDir = path.join(__dirname, 'segments');

  console.log('Files received:', files?.map(f => f.originalname));
  
  try {
    checkDirectory(outputDir);

    const segments = await Promise.all(files.map(async (file, index) => {
      const extension = path.extname(file.originalname);
      const newName = `segment_${String(index + 1).padStart(3, '0')}${extension}`;
      const outputPath = path.join(outputDir, newName);

      console.log(`Moving file from ${file.path} to ${outputPath}`);
      fs.renameSync(file.path, outputPath);
      
      return `/segments/${newName}`;
    }));

    console.log('Processed segments:', segments);
    res.json({ segments });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to handle exporting concatenated video
app.post('/export', express.json(), async (req, res) => {
  console.log('Export request received');
  const { segments } = req.body;
  
  // Log the received segments
  console.log('Received segments:', segments);

  const outputDir = path.join(__dirname, 'segments');
  const outputPath = path.join(outputDir, 'concatenated_output.mp4');
  const listFilePath = path.join(outputDir, 'file_list.txt');

  try {
    // Validate input
    if (!Array.isArray(segments) || segments.length === 0) {
      throw new Error('No segments provided for export');
    }

    // Ensure directory exists and is writable
    if (!checkDirectory(outputDir)) {
      throw new Error('Cannot access segments directory');
    }

    // Clean up any existing files
    [outputPath, listFilePath].forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`Removing existing file: ${file}`);
        fs.unlinkSync(file);
      }
    });

    // Create file list with absolute paths
    const segmentPaths = segments.map(segment => {
      const filename = segment.replace('/segments/', '');
      const absolutePath = path.join(outputDir, filename);
      
      console.log(`Checking segment: ${absolutePath}`);
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Segment file not found: ${filename}`);
      }
      
      // Use absolute paths in the file list
      return `file '${absolutePath.replace(/\\/g, '/')}'`;
    });

    // Write the file list
    console.log('Writing file list to:', listFilePath);
    console.log('File list contents:\n', segmentPaths.join('\n'));
    
    fs.writeFileSync(listFilePath, segmentPaths.join('\n'), 'utf8');

    // Verify file was created
    if (!fs.existsSync(listFilePath)) {
      throw new Error('Failed to create file list');
    }

    // Read back the file to verify contents
    const fileContents = fs.readFileSync(listFilePath, 'utf8');
    console.log('Verified file list contents:\n', fileContents);

    // Run FFmpeg
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(listFilePath)
        .inputOptions([
          '-f concat',
          '-safe 0'
        ])
        .outputOptions('-c copy')
        .output(outputPath)
        .on('start', command => {
          console.log('FFmpeg command:', command);
        })
        .on('progress', progress => {
          console.log('Processing:', progress);
        })
        .on('end', () => {
          console.log('FFmpeg processing completed');
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(new Error(`FFmpeg processing failed: ${err.message}`));
        })
        .run();
    });

    // Verify output file exists
    if (!fs.existsSync(outputPath)) {
      throw new Error('Output file was not created');
    }

    console.log('Sending file:', outputPath);
    res.download(outputPath, 'concatenated_output.mp4', (err) => {
      if (err) {
        console.error('Error sending file:', err);
      }
      
      // Clean up
      try {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        if (fs.existsSync(listFilePath)) fs.unlinkSync(listFilePath);
        console.log('Cleaned up temporary files');
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      error: 'Export failed',
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Working directory: ${__dirname}`);
  
  // Check directories on startup
  ['uploads', 'segments'].forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    checkDirectory(fullPath);
  });
});