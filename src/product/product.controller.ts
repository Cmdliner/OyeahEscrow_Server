import { Request, Response } from "express";
import IElectronics from "../types/electronics.schema";
import { electronicsValidationSchema } from "../validations/product.validation";
import { Electronics } from "./product.model";
import { ReqFile } from "../types/multer_file";
import ILandedProperty from "../types/landed_property.schema";

class ProductController {

    // Add new electronics
    static async addElectronicProduct(req: Request, res: Response) {
        try {
            const { ownership_documents, product_images } = req.files as ReqFile;

            //!TODO => validate the image paths
            const ownershipDocumentsURL = ownership_documents.map(doc => doc.path);
            const productImagesURL = product_images.map(prodImg => prodImg.path);
            
            const electronicProductData: Partial<IElectronics> = {
                name: req.body.name,
                description: req.body.description,
                location: req.body.location,
                price: req.body.price,
                is_biddable: req.body.is_biddable,
                brand: req.body.brand,
                item_model: req.body.item_model,
                category: req.body.category,
                condition : req.body.condition,
                owner: req.user?._id,
                product_images: productImagesURL,
                ownership_documents: ownershipDocumentsURL
            };

            const { error } = electronicsValidationSchema.validate(electronicProductData);
            if (error) return res.status(422).json({ error: error.details[0] });

            const newElectronics = new Electronics(electronicProductData);
            if (!newElectronics) return res.status(400).json({ error: "Error uploading product" });

            await newElectronics.save();
            return res.status(200).json({ success: "Electronics uploaded successfully", electronics: newElectronics });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "An error occured during electronics product upload" });
        }
    }

    // Add new landed property
    static async addLandedProperty(req: Request, res: Response) {
        try {
            const { ownership_documents, product_images } = req.files as ReqFile;

            //!TODO => validate the image paths
            const ownershipDocumentsURL = ownership_documents.map(doc => doc.path);
            const productImagesURL = product_images.map(prodImg => prodImg.path);

            const landedPropertyData: Partial<ILandedProperty> = {
                name: req.body.name,
                description: req.body.description,
                location: req.body.location,
                price: req.body.price,
                is_biddable: req.body.is_biddable,
                category: req.body.categories,
                ownership_documents: ownershipDocumentsURL,
                product_images: productImagesURL,
                owner: req.user?._id,
                localty: req.body.localty,
                dimensions: req.body.dimensions,
                condition: req.body.condition
            };

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "An error occured while upload proeprty" })
        }
    }

    // Add new gadget
    static async uploadGadget() { }

    // Add new vehicle
    static async uploadVehicle() { }

    // Add new furniture 
    static async newFuriture() { }

    // Add new machinery
    static async newMachinery() { }

    // Add fashion wear
    static async uploadFashionProduct() { }

    // Add other products
    static async uploadOtherProduct() {
    }
    // Test products endpoint
    static async testRoute(req: Request, res: Response) {
        return res.status(200).json({ "a": "test product routes" });
    }

}

export default ProductController;