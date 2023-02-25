const Category = require("../models/Category");
const { cloudinary } = require("../utils/cloudinary");
const { verifyTokenAndAdmin } = require("./verifyToken");

const router = require("express").Router();
const { slugify } = require("../utils/slug");
//CREATE

router.post("/", verifyTokenAndAdmin, async (req, res) => {
  const data = {
    title: req.body.title,
    slug: slugify(req.body.title),
    imgId: req.body.imgId,
    img: req.body.img,
  };

  const newCategory = new Category(data);
  try {
    const savedCategory = await newCategory.save();
    res.status(200).json(savedCategory);
  } catch (err) {
    res.status(500).json(err);
  }
});

//UPDATE
router.put("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    const data = {
      title: req.body.title,
      slug: slugify(req.body.title),
    };
    if ("img" in req.body) {
      data.img = req.body.img;
      data.imgId = req.body.imgId;
      const path = category.imgId;
      await cloudinary.uploader.destroy(path);
    }

    const updatedCategory = await Category.findByIdAndUpdate(req.params.id, {
      $set: data,
    });
    res.status(200).json(updatedCategory);
  } catch (err) {
    res.status(500).json("Something went wrong Please Try Again Later ");
  }
});

//DELETE
router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    await Category.findByIdAndDelete(req.params.id);

    // category to delete file in the folder
    const path = category.imgId;
    if (path !== "") {
      await cloudinary.uploader.destroy(path);
    }

    res.status(200).json("Category has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET Category
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    res.status(200).json(category);
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET ALL Category
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json(err);
  }
});
//GET ALL Category with sub category
router.get("/category/subcat", async (req, res) => {
  try {
    // const categories = await Category.find().sort({ createdAt: -1 });
    const categories = await Category.aggregate([
      { $match: {} },
      {
        $lookup: {
          from: "subcategories",
          localField: "_id",
          foreignField: "cat",
          as: "subcat",
        },
      },
    ]).exec();

    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
