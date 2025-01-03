import { NextFunction, Request, Response } from "express";
import { ReqFiles } from "../types/multer_file";
import multer from "multer";
import path from "path";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { v2 as cloudinary } from "cloudinary";
import { UploadApiResponse } from "cloudinary";
import { cfg } from "../init";

// Cloudinary configuration
cloudinary.config({
    cloud_name: cfg.CLOUDINARY_CLOUD_NAME,
    api_key: cfg.CLOUDINARY_API_KEY,
    api_secret: cfg.CLOUDINARY_SECRET
});

const MAX_FILE_SIZE = 1024 * 1024 * 10;
const MAX_WIDTH = 2000;
const MAX_HEIGHT = 2000;
const QUALITY = 80;

const isProd = cfg.NODE_ENV === "production";

const storage = multer.memoryStorage();
const fileFilter = (_: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith("image/")) {
        return cb(null, true);
    }
    return cb(new Error("File should be of type image!"));
}
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE }
});

export const UploadMiddleware = upload.fields([
    { name: "product_images", maxCount: 10 },
    { name: "ownership_documents", maxCount: 5 },

]);

// Process the image into high quality webp images using the sharp function
const processLocalImage = async (file: Express.Multer.File): Promise<string> => {
    const fileName = `${uuidv4()}.webp`;
    const filePath = path.join(__dirname, "../../uploads/", fileName);

    await sharp(file.buffer)
        .resize(MAX_WIDTH, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(filePath);

    return filePath;
}

export const ProcessCloudinaryImage = async (file: Express.Multer.File): Promise<string> => {
    const processedImageBuffer = await sharp(file.buffer)
        .resize(MAX_WIDTH, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer();

        // Upload to Cloudinary
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'oyeah/tests',
                resource_type: 'auto',
                format: 'webp'
            },
            (error: any, result: UploadApiResponse | undefined) => {
                if (error) reject(error);
                if (result) resolve(result.secure_url);
                else reject(new Error('No result from Cloudinary'));
            }
        );

        // Write the buffer to the upload stream
        uploadStream.end(processedImageBuffer);
    });
}

export const ValidateAndProcessUpload = async (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as ReqFiles;
    if (!files || !files.product_images) {
        console.log("product_images is undefined in the controller");
        return res.status(400).json({ error: true, message: "product_images is required" });
    }
    const { ownership_documents, product_images } = files;
    try {
        const processImage = isProd ? ProcessCloudinaryImage : processLocalImage;

        const processedProductImages = await Promise.all(product_images.map(processImage));
        const processedOwnershipDocs = ownership_documents ? await Promise.all(ownership_documents.map(processImage)) : [];

        req.processed_images = {
            product_images: processedProductImages,
            ownership_documents: processedOwnershipDocs
        }
        next();
    } catch (error) {
        console.error("Error processing images:", error);
        return res.status(500).json({ error: true, message: "Error processing uploaded images" });
    }
}

export const ValidateAndProcessSingle = async (req: Request, res: Response, next: NextFunction) => {
    // Get single img
    // Process with cloudinary
    // return img
}