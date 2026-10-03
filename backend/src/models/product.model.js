const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        variants: [
            {
                name: {
                    type: String,
                    required: true,
                    trim: true,
                },

                size: {
                    type: String,
                    required: true,
                    trim: true,
                },

                price: {
                    type: Number,
                    required: true,
                    min: 0,
                },

                stock: {
                    type: Number,
                    required: true,
                    min: 0,
                    default: 0,
                },

                images: [
                    {
                        url: {
                            type: String,
                            required: true,
                        },

                        publicId: {
                            type: String,
                            required: true,
                        },
                    },
                ],

                isActive: {
                    type: Boolean,
                    default: true,
                },
            },
        ],

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Product", productSchema);