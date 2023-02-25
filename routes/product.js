const Product = require("../models/Product");
const Category = require("../models/Category");
const SubCategory = require("../models/SubCategory");
const { cloudinary } = require("../utils/cloudinary");
const { slugify } = require("../utils/slug");
const {
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
} = require("./verifyToken");

const router = require("express").Router();

//CREATE

router.post("/", verifyTokenAndAdmin, async (req, res) => {
  try {
    const data = {
      title: req.body.title,
      slug: slugify(req.body.title),
      desc: req.body.desc,
      cat: req.body.cat,
      subcat: req.body.subcat,
      price: req.body.price,
      imgId: req.body.imgId,
      img: req.body.img,
    };
    const newProduct = new Product(data);

    const savedProduct = await newProduct.save();
    res.status(200).json(savedProduct);
  } catch (err) {
    res.status(500).json(err);
  }
});

//UPDATE
router.put("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const data = {
      title: req.body.title,
      slug: slugify(req.body.title),
      desc: req.body.desc,
      cat: req.body.cat,
      subcat: req.body.subcat,
      price: req.body.price,
    };
    if ("img" in req.body) {
      data.img = req.body.img;
      data.imgId = req.body.imgId;
      const path = product.imgId;
      await cloudinary.uploader.destroy(path);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: data,
      },
      { new: true }
    );
    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(500).json(err);
  }
});

//DELETE
router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    await Product.findByIdAndDelete(req.params.id);
    const path = product.imgId;
    if (path !== "") {
      await cloudinary.uploader.destroy(path);
    }
    res.status(200).json("Product has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET PRODUCTs
router.get("/byslug/:slug", async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate("cat")
      .populate("subcat");
    if (!product) return res.status(404).json("Product Not Found");
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json(err);
  }
});
router.get("/bySubCatslug/:slug", async (req, res) => {
  try {
    const category = await SubCategory.findOne({ slug: req.params.slug });
    if (!category) return res.status(404).json("Category Not Found");
    const product = await Product.find({ subcat: category._id })
      .populate("cat")
      .populate("subcat");
    res.status(200).json({ catTitle: category.title, products: product });
  } catch (err) {
    res.status(500).json(err);
  }
});
router.get("/byCatslug/:slug", async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) return res.status(404).json("Category Not Found");
    const product = await Product.find({ cat: category._id })
      .populate("cat")
      .populate("subcat");
    res.status(200).json({ catTitle: category.title, products: product });
  } catch (err) {
    res.status(500).json(err);
  }
});
router.get("/relatedByCat/:id", async (req, res) => {
  try {
    const product = await Product.find({ cat: req.params.id })
      .populate("cat")
      .populate("subcat");
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json(err);
  }
});
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("cat")
      .populate("subcat");
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET ALL PRODUCTS
router.get("/", async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate("cat")
      .populate("subcat");

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
