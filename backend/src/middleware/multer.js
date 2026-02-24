const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============ STORAGE CONFIGURATION ============

// Configure disk storage for local uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../uploads/prescriptions');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  
  filename: (req, file, cb) => {
    // Generate unique filename: prescription_TIMESTAMP_ORIGINALNAME
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    
    cb(null, `prescription_${uniqueSuffix}${ext}`);
  }
});

// ============ FILE FILTER ============

const fileFilter = (req, file, cb) => {
  // Allowed file types for prescriptions
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
  ];
  
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx'];
  
  // Get file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;
  
  // Check MIME type
  if (!allowedMimes.includes(mime)) {
    return cb(new Error(`Invalid file type: ${mime}. Allowed: PDF, JPG, PNG, WebP, DOC, DOCX`), false);
  }
  
  // Check extension
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error(`Invalid file extension: ${ext}. Allowed: ${allowedExtensions.join(', ')}`), false);
  }
  
  cb(null, true);
};

// ============ MULTER CONFIGURATION ============

const uploadConfig = {
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max file size
    files: 1 // Single file per request
  }
};

// ============ MULTER INSTANCES ============

// Single file upload (for prescriptions)
const uploadSingleFile = multer(uploadConfig);

// Multiple files upload (for batch uploads - optional future use)
const uploadMultipleFiles = multer({
  ...uploadConfig,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5 // Up to 5 files
  }
});

// ============ CUSTOM MIDDLEWARE WRAPPER ============

// Function to handle single file upload with error handling
const uploadPrescriptionFile = (req, res, next) => {
  uploadSingleFile.single('prescriptionFile')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'File size exceeds 10 MB limit'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Please upload only one file'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    next();
  });
};

// ============ OPTIONAL: AWS S3 CONFIGURATION ============
// Uncomment and configure when moving to production S3 storage

// const AWS = require('aws-sdk');
// const multerS3 = require('multer-s3');
// 
// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION
// });
// 
// const s3Storage = multerS3({
//   s3: s3,
//   bucket: process.env.AWS_S3_BUCKET || 'doctor-appointment-prescriptions',
//   acl: 'private',
//   metadata: (req, file, cb) => {
//     cb(null, {
//       fieldName: file.fieldname,
//       uploadedBy: req.user._id,
//       timestamp: new Date().toISOString()
//     });
//   },
//   key: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     const name = path.basename(file.originalname, ext);
//     const uniqueName = `prescriptions/${req.user._id}/${Date.now()}-${name}${ext}`;
//     cb(null, uniqueName);
//   }
// });
// 
// const uploadToS3 = multer({
//   storage: s3Storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 10 * 1024 * 1024
//   }
// });

// ============ EXPORTS ============

module.exports = {
  uploadPrescriptionFile,
  uploadSingleFile,
  uploadMultipleFiles,
  // uploadToS3,  // Uncomment when S3 is configured
};
