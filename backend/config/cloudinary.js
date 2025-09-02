const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Helper function to upload image to Cloudinary
const uploadImage = async (fileBuffer, originalName) => {
  try {
    return new Promise((resolve, reject) => {
      // Create upload stream
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'oralvis-scans', // Organize uploads in a folder
          public_id: `scan_${Date.now()}_${Math.random().toString(36).substring(7)}`, // Unique filename
          format: 'jpg', // Convert all images to JPG for consistency
          quality: 'auto:good', // Optimize quality automatically
          fetch_format: 'auto', // Auto-optimize format for delivery
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' }, // Limit max size
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ],
          tags: ['dental-scan', 'oralvis'] // Add tags for organization
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Image uploaded to Cloudinary:', result.public_id);
            resolve(result);
          }
        }
      );

      // Upload the buffer
      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    console.error('❌ Upload helper error:', error);
    throw error;
  }
};

// Helper function to delete image from Cloudinary (for cleanup if needed)
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('🗑️  Image deleted from Cloudinary:', publicId);
    return result;
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage
};