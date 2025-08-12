const multer = require("multer");
const path = require("path");

// Temporary local storage before upload to Cloudinary
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads"); // Save locally first
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Allow both images and videos
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Images
    "image/jpeg", "image/png", "image/jpg", "image/webp",
    // Videos
    "video/mp4", "video/avi", "video/quicktime",
    "video/x-ms-wmv", "video/x-flv", "video/x-matroska"
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images and videos are allowed."), false);
  }
};

// Set different file size limits for images & videos
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max (covers videos)
  },
});

module.exports = upload;
