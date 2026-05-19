const express = require("express");

const router = express.Router();

const Stock = require("../models/Stock");

const upload = require("../middleware/upload");

// =========================
// ADD STOCK
// =========================

router.post("/add", upload.single("image"), async (req, res) => {
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

router.get("/all", async (req, res) => {
  try {
    const stocks = await Stock.find().sort({
      createdAt: -1,
    });

    res.status(200).json(stocks);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch stocks",
    });
  }
});

// =========================
// UPDATE STOCK SELL
// =========================

router.put("/sell/:id", async (req, res) => {
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

    // sold field create if not exists
    if (!stock.sold) {
      stock.sold = 0;
    }

    stock.quantity -= sold;

    stock.sold += sold;

    await stock.save();

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

const cloudinary = require("../config/cloudinary");

router.delete("/delete/:id", async (req, res) => {
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
});

module.exports = router;
