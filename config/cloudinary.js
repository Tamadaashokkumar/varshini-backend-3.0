import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

/**
 * 1. Configure Cloudinary
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * 2. Configure Storage
 * Logic: Checks if file is Image or Audio and sets folder/settings accordingly.
 */
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folderName = "hyundai-spares/others";
    let resourceType = "image"; // Default

    // Determine Folder and Resource Type
    if (file.fieldname === "avatar") {
      folderName = "hyundai-spares/admin-profiles";
    } else if (file.fieldname === "productImage") {
      folderName = "hyundai-spares/products";
    } else if (file.mimetype.startsWith("audio")) {
      folderName = "hyundai-spares/chat-audio";
      resourceType = "video"; // IMPORTANT: Cloudinary treats Audio as 'video' resource type
    } else if (file.mimetype.startsWith("video")) {
      folderName = "hyundai-spares/chat-videos";
      resourceType = "video";
    }

    const uploadParams = {
      folder: folderName,
      resource_type: resourceType,
    };

    // Apply Format & Transformation based on file type
    if (resourceType === "image") {
      // Only resize images
      uploadParams.allowed_formats = ["jpg", "jpeg", "png", "webp"];
      uploadParams.transformation = [
        { width: 800, height: 800, crop: "limit" },
      ];
    } else {
      // For Audio/Video (Voice Records usually come as 'webm' or 'mp3')
      uploadParams.allowed_formats = ["mp3", "wav", "webm", "mp4", "mkv"];
      // No transformations for audio
    }

    return uploadParams;
  },
});

/**
 * 3. Multer Upload Middleware
 */
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Increased to 10MB (Audio/Video might be larger)
  },
  fileFilter: (req, file, cb) => {
    // 🔥 Allow Image, Audio, and Video types
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("audio/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image, audio, and video files are allowed!"), false);
    }
  },
});

/**
 * 4. Helper to Delete Image/Video/Audio
 * Note: You need to know resource_type to delete non-images properly in Cloudinary
 */
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    console.log(`File deleted from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error(`Error deleting file: ${error.message}`);
  }
};

// IMPORTANT: export 'upload' as default
export { cloudinary, upload, deleteFromCloudinary };
