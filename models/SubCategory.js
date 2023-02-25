const mongoose = require("mongoose");

const SubCategorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    cat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    slug: {
      type: String,
      default: "",
    },
    img: {
      type: String,
      default: "",
    },
    imgId: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SubCategory", SubCategorySchema);
