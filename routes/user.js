const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
} = require("./verifyToken");
const { cloudinary } = require("../utils/cloudinary");

//REGISTER
// router.post("/", verifyTokenAndAdmin, async (req, res) => {
//REGISTER
router.post("/", async (req, res) => {
  try {
    //generate new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    //create new user
    const newUser = new User({
      fullname: req.body.fullName,
      email: req.body.email,
      mobile: req.body.mobile,
      password: hashedPassword,
      isAdmin: true,
      // imgId: req.body.imgId,
      // img: req.body.img,
    });
    const oldemail = await User.findOne({ email: req.body.email });
    if (oldemail) {
      return res.status(400).json("Email Already Exist");
    } else {
      const savedUser = await newUser.save();
      res.status(200).json(savedUser);
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//LOGIN
// generate token

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, isAdmin: user.isAdmin },
    process.env.JWT_SEC,
    {
      expiresIn: "1w",
    }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, isAdmin: user.isAdmin },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "1w",
    }
  );
};

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    !user && res.status(400).json("Email is Incorrect");

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    !validPassword && res.status(400).json("Wrong Password");

    if (user && validPassword) {
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.cookie("jwt", refreshToken, {
        httpOnly: true,
        secure: false,
        // sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const { password, updatedAt, ...others } = user._doc;
      res.status(200).json({
        ...others,
        accessToken: accessToken,
      });
    } else {
      res.status(400).json("email or password incorrect!");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/logout", async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie("jwt", { httpOnly: true });
  res.json({ message: "Cookie cleared" });
});

//UPDATE
router.put("/:id", verifyTokenAndAuthorization, async (req, res) => {
  const user = await User.findById(req.params.id);
  const data = {
    fullname: req.body.fullname,
    email: req.body.email,
    mobile: req.body.mobile,
  };
  if ("img" in req.body) {
    data.img = req.body.img;
    data.imgId = req.body.imgId;
    const path = user.imgId;
    await cloudinary.uploader.destroy(path);
  }

  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    data.password = hashedPassword;
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: data,
      },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json(err);
  }
});

//DELETE
router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json("User has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET USER
router.get("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const { password, ...others } = user._doc;
    res.status(200).json(others);
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET ALL USER
router.get("/", verifyTokenAndAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json(err);
  }
});
router.get("/checkAuth/valid", verifyTokenAndAdmin, async (req, res) => {
  try {
    // const authHeader = req.headers.token;
    const accessToken = req.header("token")?.split(" ")[1] || "";
    const payload = jwt.verify(accessToken, process.env.JWT_SEC);

    if (!payload) {
      return res.status(401).send({
        message: "unauthenticated",
      });
    }
    const user = await User.findOne({ email: payload.email });
    if (!user) {
      return res.status(401).send({
        message: "unauthenticated",
      });
    }
    const newAccessToken = generateAccessToken(user);
    const { password, ...data } = user._doc;
    // res.send(data);
    res.status(200).json({
      ...data,
      accessToken: newAccessToken,
    });
  } catch (e) {
    return res.status(401).send({
      message: "unauthenticated",
    });
  }
});

//GET USER STATS

router.get("/stats", verifyTokenAndAdmin, async (req, res) => {
  const date = new Date();
  const lastYear = new Date(date.setFullYear(date.getFullYear() - 1));

  try {
    const data = await User.aggregate([
      { $match: { createdAt: { $gte: lastYear } } },
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
