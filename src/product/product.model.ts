import { model, Schema } from "mongoose";
import { IFashionProduct, IFurniture, IMachinery } from "../types/generic.schema";
import IProduct from "../types/product.schema";
import IElectronics from "../types/electronics.schema";
import IGadget from "../types/gadget.schema";
import ILandedProperty from "../types/landed_property.schema";
import IVehicle from "../types/vehicle.schema";

const ProductSchema = new Schema({
    product_images: [
        {
            type: String,
            required: true,
            unique: true,
        },
    ],
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: Number,
    },
    is_biddable: {
        type: Boolean,
        required: true,
    },
    ownership_documents: [
        {
            type: String,
            unique: true
        },
    ],
    category: {
        type: String,
        enum: [
            "electronics",
            "landed_properties",
            "gadgets",
            "vehicles",
            "furnitures",
            "machineries",
            "fashion_wears",
            "others"
        ],
        required: true,
    },
}, { timestamps: true, descriminatorKey: "category" });

const ElectronicsSchema = new Schema({
    brand: {
        type: String,
        required: true
    },
    item_model: {
        type: String,
        required: true
    },
    condition: {
        type: String,
        enum: ["new", "used"],
        required: true
    }
});

const FashionProductSchema = new Schema({
    condition: {
        type: String,
        enum: ["used" , "new"],
        required: true
    }
});

const FurnitureSchema = new Schema({
    condition: {
        type: String,
        enum: ["used" , "new"],
        required: true
    }
});

const GadgetSchema = new Schema({
    brand: {
        type: String,
        required: true
    },
    item_model: {
        type: String,
        required: true
    },
    RAM: {
        type: String,
        required: true
    },
    condition: {
        type: String,
        enum: ["used", "new"],
        required: true
    }

});

const OtherProductSchema = new Schema({
    condition: {
        type: String,
        enum: ["used" , "new"],
        required: true
    }
});

const LandedPropertySchema = new Schema({
    localty: {
        type: String,
        required: true,
    },
    dimensions: {
        type: String,
        required: true
    },
    condition: {
        type: String,
        enum: [
            "fairly_used",
            "newly_built",
            "old",
            "renovated",
            "under_construction",
            "empty_land",
        ],
        required: true
    }
});

const MachinerySchema = new Schema({
    condition: {
        type: String,
        enum: ["used" , "new"],
        required: true
    }
});

const VehicleSchema = new Schema({
    make: {
        type: String,
        required: true
    },
    registered:  {
        type: Boolean,
        required: true
    },
    item_model:  {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    condition:  {
        type: String,
        enum: ["used", "new"],
        required: true
    },
    vin:  {
        type: String,
        required: true
    },
    //! TODO => Check what transmission type is and update accordingly
    transmission_type:  {
        type: String,
        required: true
    }
});


const Product = model<IProduct>("product", ProductSchema);

export const Vehicle = Product.discriminator<IVehicle>("vehicle", VehicleSchema);
export const Machinery = Product.discriminator<IMachinery>("machinery", MachinerySchema);
export const LandedProperty = Product.discriminator<ILandedProperty>("landed_property", LandedPropertySchema);
export const OtherProduct = Product.discriminator("other_product", OtherProductSchema);
export const Gadget = Product.discriminator<IGadget>("gadget", GadgetSchema);
export const Furniture = Product.discriminator<IFurniture>("furniture", FurnitureSchema);
export const FashionProduct = Product.discriminator<IFashionProduct>("fashion_product", FashionProductSchema);
export const Electronics = Product.discriminator<IElectronics>("electronics", ElectronicsSchema);

export default Product;