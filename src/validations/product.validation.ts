import Joi from "joi";

export const electronicsValidationSchema = Joi.object({
    product_images: Joi.array().min(1).required(),
    name: Joi.string().required(),
    description: Joi.string(),
    owner: Joi.object().required(),
    location: Joi.string().required(),
    price: Joi.number().required(),
    is_biddable: Joi.boolean().required(),
    // ownership_documents_url: Joi.array().items(Joi.string()).min(10).required(),
    ownership_documents: Joi.array().min(1).required(),
    brand: Joi.string().required(),
    item_model: Joi.string().required(),
    condition: Joi.string().allow("new", "used"),
    category: Joi.allow(
        "electronics",
        "landed_properties",
        "gadgets",
        "vehicles",
        "furnitures",
        "machineries",
        "fashion_wears",
        "others").required()
});

export const landedPropertyValidationSchema = Joi.object({
    product_images: Joi.array().min(1).required
})