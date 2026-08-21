const express = require("express");
const router = express.Router();

const Stock = require("../models/Stock");
const upload = require("../middleware/upload");
const adminAuth = require("../middleware/adminAuth");
const requireRole = require("../middleware/requireRole");
const cloudinary = require("../config/cloudinary");
const Notification = require("../models/Notification");
const Admin = require("../models/Admin");

// =========================
// ADD STOCK
// =========================

router.post("/add", adminAuth, upload.single("image"), async (req, res) => {
  try {
    const { name, brand, model, size, quantity, price } = req.body;

    const newStock = new Stock({
      name,
      brand,
      model,
      size,
      quantity,
      price,
      image: req.file.path,
    });

    await newStock.save();

    const admin = await Admin.findById(req.admin.id);

    await Notification.create({
      category: "stock",
      variant: "blue",
      icon: "fa-box-archive",

      title: "New Stock Added",

      message: `${newStock.name} stock added successfully`,

      details: [
        {
          label: "Product",
          value: newStock.name,
        },
        {
          label: "Brand",
          value: newStock.brand,
        },
        {
          label: "Size",
          value: newStock.size,
        },
        {
          label: "Quantity",
          value: `${newStock.quantity} pcs`,
        },
        {
          label: "Price",
          value: `৳${newStock.price}`,
        },
        {
          label: "Added By",
          value: admin.name || admin.email,
        },
        {
          label: "Date",
          value: new Date().toLocaleDateString(),
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Stock Added Successfully",
      stock: newStock,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to add stock",
    });
  }
});

// =========================
// GET ALL STOCK
// =========================

router.get("/all", adminAuth, async (req, res) => {
  try {
    const stocks = await Stock.find().sort({
      createdAt: -1,
    });

    res.status(200).json(stocks);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch stocks",
    });
  }
});

// =========================
// UPDATE STOCK SELL
// =========================

router.put("/sell/:id", adminAuth, async (req, res) => {
  try {
    const { sold } = req.body;

    const stock = await Stock.findById(req.params.id);

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock not found",
      });
    }

    if (sold > stock.quantity) {
      return res.status(400).json({
        success: false,
        message: "Not enough stock",
      });
    }

    if (!stock.sold) {
      stock.sold = 0;
    }

    stock.quantity -= sold;
    stock.sold += sold;

    await stock.save();

    const admin = await Admin.findById(req.admin.id);

    await Notification.create({
      category: "addstock",
      variant: "pink",
      icon: "fa-cart-shopping",

      title: "Stock Sold",

      message: `${sold} pcs ${stock.name} sold successfully`,

      details: [
        {
          label: "Product",
          value: stock.name,
        },
        {
          label: "Brand",
          value: stock.brand,
        },
        {
          label: "Sold Quantity",
          value: `${sold} pcs`,
        },
        {
          label: "Sell Amount",
          value: `৳${sold * stock.price}`,
        },
        {
          label: "Remaining Stock",
          value: `${stock.quantity} pcs`,
        },
        {
          label: "Sold By",
          value: admin.name || admin.email,
        },
        {
          label: "Date",
          value: new Date().toLocaleDateString(),
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      stock,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to update stock",
    });
  }
});

// =========================
// DELETE STOCK
// =========================

router.delete(
  "/delete/:id",
  adminAuth,
  requireRole(["Super Admin", "Admin"]),
  async (req, res) => {
    try {
      const stock = await Stock.findById(req.params.id);

      if (!stock) {
        return res.status(404).json({
          success: false,
          message: "Stock not found",
        });
      }

      // =========================
      // DELETE IMAGE FROM CLOUDINARY
      // =========================

      if (stock.image) {
        const imageUrl = stock.image;

        const urlParts = imageUrl.split("/");

        const fileName = urlParts[urlParts.length - 1];

        const publicId = "shoe-stock/" + fileName.split(".")[0];

        await cloudinary.uploader.destroy(publicId);
      }

      // =========================
      // DELETE STOCK FROM DB
      // =========================

      const admin = await Admin.findById(req.admin.id);

      await Notification.create({
        category: "stock",
        variant: "red",
        icon: "fa-trash",

        title: "Stock Deleted",

        message: `${stock.name} stock has been deleted`,

        details: [
          {
            label: "Product",
            value: stock.name,
          },
          {
            label: "Brand",
            value: stock.brand,
          },
          {
            label: "Size",
            value: stock.size,
          },
          {
            label: "Quantity",
            value: `${stock.quantity} pcs`,
          },
          {
            label: "Stock Value",
            value: `৳${stock.quantity * stock.price}`,
          },
          {
            label: "Deleted By",
            value: admin.name || admin.email,
          },
          {
            label: "Date",
            value: new Date().toLocaleDateString(),
          },
        ],
      });

      await Stock.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: "Stock and image deleted successfully",
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        success: false,
        message: "Failed to delete stock",
      });
    }
  },
);

module.exports = router;
