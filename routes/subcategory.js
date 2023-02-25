const SubCategory = require("../models/SubCategory");
const { cloudinary } = require("../utils/cloudinary");
const { verifyTokenAndAdmin } = require("./verifyToken");
const router = require("express").Router();
const { slugify } = require("../utils/slug");

//CREATE

router.post("/", verifyTokenAndAdmin, async (req, res) => {
  const data = {
    title: req.body.title,
    slug: slugify(req.body.title),
    cat: req.body.cat,
    imgId: req.body.imgId,
    img: req.body.img,
  };

  const newSubCategory = new SubCategory(data);
  try {
    const savedSubCategory = await newSubCategory.save();
    res.status(200).json(savedSubCategory);
  } catch (err) {
    res.status(500).json(err);
  }
});

//UPDATE
router.put("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id);
    const data = {
      title: req.body.title,
      slug: slugify(req.body.title),
      cat: req.body.cat,
    };
    if ("img" in req.body) {
      data.img = req.body.img;
      data.imgId = req.body.imgId;
      const path = subCategory.imgId;
      await cloudinary.uploader.destroy(path);
    }

    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      {
        $set: data,
      }
    );
    res.status(200).json(updatedSubCategory);
  } catch (err) {
    res.status(500).json("Something went wrong Please Try Again Later ");
  }
});

//DELETE
router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id);

    await SubCategory.findByIdAndDelete(req.params.id);

    // SubCategory to delete file in the folder
    const path = subCategory.imgId;
    if (path !== "") {
      await cloudinary.uploader.destroy(path);
    }

    res.status(200).json("SubCategory has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET SubCategory
router.get("/:id", async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id).populate(
      "cat"
    );
    res.status(200).json(subCategory);
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET ALL SubCategory
router.get("/", async (req, res) => {
  try {
    const subcategories = await SubCategory.find()
      .sort({ createdAt: -1 })
      .populate("cat")
      .exec();
    res.status(200).json(subcategories);
  } catch (err) {
    res.status(500).json(err);
  }
});
//GET ALL SubCategory by Main category
router.get("/getbymain/:id", async (req, res) => {
  try {
    const subcategories = await SubCategory.find({ cat: req.params.id })
      .sort({ createdAt: -1 })
      .populate("cat")
      .exec();
    res.status(200).json(subcategories);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
