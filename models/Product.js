const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    desc: {
      type: String,
      required: true,
    },
    img: {
      type: String,
      required: true,
    },
    imgId: {
      type: String,
      required: true,
    },
    cat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    subcat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
    },
    price: {
      type: Number,
      required: true,
    },
    slug: {
      type: String,
      default: "",
    },
    inStock: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", ProductSchema);
