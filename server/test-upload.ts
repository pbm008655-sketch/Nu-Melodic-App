import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const port = 5001;

// Create the upload directories if they don't exist
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure upload middleware
const upload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      const timestamp = Date.now();
      const filename = `file-${timestamp}${path.extname(file.originalname)}`;
      cb(null, filename);
    }
  }),
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB limit
    fieldSize: 2 * 1024 * 1024 * 1024, // 2GB field size limit
  }
}).single('file');

// Create a test HTML page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>File Upload Test</title>
    </head>
    <body>
      <h1>File Upload Test</h1>
      <form action="/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="file" />
        <button type="submit">Upload</button>
      </form>
    </body>
    </html>
  `);
});

// Handle file upload
app.post('/upload', (req, res) => {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(500).send(`Multer error: ${err.message}`);
    } else if (err) {
      console.error('Unknown error:', err);
      return res.status(500).send(`Unknown error: ${err.message}`);
    }
    
    if (!req.file) {
      return res.status(400).send('No file was uploaded.');
    }
    
    res.send(`File uploaded successfully: ${req.file.originalname} (${req.file.size} bytes)`);
  });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Test upload server running at http://localhost:${port}`);
});