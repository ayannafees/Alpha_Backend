import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

const deleteFromCloudinary = async (cloudinaryUrl,type) => {
    try {
        if (!cloudinaryUrl) return null;

        // Extract public ID from the URL
        const urlParts = cloudinaryUrl.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];

        // Use Cloudinary's destroy method to delete the file
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: type // Adjust this if you are deleting non-image files
        });

        console.log(response)
        if (response.result === 'ok') {
            return response;
        } else {
            throw new Error('Failed to delete the file on Cloudinary');
        }
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        return null;
    }
}

export {uploadOnCloudinary, deleteFromCloudinary}