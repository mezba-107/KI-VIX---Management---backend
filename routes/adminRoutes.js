const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

const Admin = require("../models/Admin");
const adminAuth = require("../middleware/adminAuth");

const multer = require("multer");

const cloudinary = require("../config/cloudinary");

const storage = multer.memoryStorage();

const upload = multer({ storage });

/* =========================
   FIXED ADMINS
========================= */

const fixedAdmins = [
  {
    email: "m.m.simon.107@gmail.com",
    password: "simon.190148",
    name: "",
    role: "Super Admin",
    phone: "",
    address: "",
  },

  {
    email: "tanvirul484@gmail.com",
    password: "tanvir.654321",
    name: "",
    role: "Super Admin",
    phone: "",
    address: "",
  },

  {
    email: "saiyeedbappy895@gmail.com",
    password: "bappy.654321",
    name: "",
    role: "Super Admin",
    phone: "",
    address: "",
  },

  {
    email: "armanriad171@gmail.com",
    password: "arman.654321",
    name: "",
    role: "Super Admin",
    phone: "",
    address: "",
  },
];

/* =========================
   ADMIN LOGIN
========================= */

router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email.trim();
    password = password.trim();

    /* CHECK FIXED ADMIN */

    const fixedAdmin = fixedAdmins.find(
      (a) => a.email === email && a.password === password,
    );

    /* INVALID LOGIN */

    if (!fixedAdmin) {
      return res.status(401).json({
        success: false,
        message: "Invalid Email Or Password",
      });
    }

    /* FIND ADMIN IN DB */

    let admin = await Admin.findOne({ email });

    /* AUTO CREATE ADMIN */

    if (!admin) {
      admin = await Admin.create({
        name: fixedAdmin.name,
        email: fixedAdmin.email,
        password: fixedAdmin.password,
        role: fixedAdmin.role,
        phone: fixedAdmin.phone,
        address: fixedAdmin.address,
      });
    }

    /* TOKEN */

    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d",
      },
    );

    /* SUCCESS */

    res.json({
      success: true,

      message: "Login Success",

      token,

      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        phone: admin.phone,
        address: admin.address,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

/* =========================
   GET PROFILE
========================= */

router.get("/profile", adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-password");

    res.json({
      success: true,
      profile: admin,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

/* =========================
   UPDATE PROFILE
========================= */

router.put("/profile", adminAuth, async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.admin.id,

      {
        name,
        phone,
        address,
      },

      {
        new: true,
      },
    ).select("-password");

    res.json({
      success: true,
      admin: updatedAdmin,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

/* =========================
   UPLOAD PROFILE IMAGE
========================= */

router.post(
  "/upload-profile",
  adminAuth,
  upload.single("image"),

  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No Image Provided",
        });
      }

      /* CONVERT BUFFER */

      const b64 = Buffer.from(req.file.buffer).toString("base64");

      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

      /* DELETE OLD IMAGE */

      const currentAdmin = await Admin.findById(req.admin.id);

      if (currentAdmin.image) {
        const splitUrl = currentAdmin.image.split("/");

        const imageName = splitUrl[splitUrl.length - 1];

        const publicId =
          "kivix-profile/" + imageName.substring(0, imageName.lastIndexOf("."));

        await cloudinary.uploader.destroy(publicId);
      }

      /* UPLOAD CLOUDINARY */

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "kivix-profile",
      });

      /* SAVE DB */

      const updatedAdmin = await Admin.findByIdAndUpdate(
        req.admin.id,

        {
          image: result.secure_url,
        },

        {
          new: true,
        },
      );

      res.json({
        success: true,
        image: updatedAdmin.image,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        success: false,
        message: "Upload Failed",
      });
    }
  },
);

module.exports = router;
