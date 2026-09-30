const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const PasswordResetRequest = require("../models/PasswordResetRequest");
const Notification = require("../models/Notification");

const multer = require("multer");

const cloudinary = require("../config/cloudinary");

const storage = multer.memoryStorage();

const upload = multer({ storage });

const fixedAdmins = [
  {
    email: "m.m.simon.107@gmail.com",
    password: "simon.190148",
    name: "Simon",
    role: "Super Admin",
    phone: "",
    address: "",
  },
];

/* =========================
       login controller
    ========================= */

exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email.trim();
    password = password.trim();

    const fixedAdmin = fixedAdmins.find((a) => a.email === email);

    if (fixedAdmin) {
      let admin = await Admin.findOne({ email });

      if (!admin) {
        admin = await Admin.create({
          name: fixedAdmin.name,
          email: fixedAdmin.email,
          password: fixedAdmin.password,
          role: "Super Admin",
          status: "approved",
          phone: fixedAdmin.phone,
          address: fixedAdmin.address,
        });
      }

      if (admin.password !== password) {
        return res.status(401).json({
          success: false,
          message: "Invalid Password",
        });
      }

      admin.lastSeen = new Date();
      admin.isOnline = true;
      await admin.save();

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

      return res.json({
        success: true,
        message: "Login Success",
        token,
        admin,
      });
    }

    const admin = await Admin.findOne({
      email,
      password,
      status: "approved",
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid Email Or Password",
      });
    }

    admin.lastSeen = new Date();
    admin.isOnline = true;
    await admin.save();

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

    res.json({
      success: true,
      message: "Login Success",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        position: admin.position,
        phone: admin.phone,
        address: admin.address,
        image: admin.image,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
/* =========================
       getProfile
    ========================= */

exports.getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-password");

    let totalInvestment = 0;

    admin.history.forEach((item) => {
      if (item.type === "Deposit") {
        totalInvestment += Number(item.amount || 0);
      }
    });

    res.json({
      success: true,
      profile: {
        ...admin.toObject(),
        totalInvestment,
        currentBalance: admin.investment,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/* =========================
       updateProfile
    ========================= */

exports.updateProfile = async (req, res) => {
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
};

/* =========================
       uploadProfile
    ========================= */

exports.uploadProfile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No Image Provided",
      });
    }

    const b64 = Buffer.from(req.file.buffer).toString("base64");

    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    const currentAdmin = await Admin.findById(req.admin.id);

    if (currentAdmin.image) {
      const splitUrl = currentAdmin.image.split("/");

      const imageName = splitUrl[splitUrl.length - 1];

      const publicId =
        "kivix-profile/" + imageName.substring(0, imageName.lastIndexOf("."));

      await cloudinary.uploader.destroy(publicId);
    }

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "kivix-profile",
    });

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
};

/* =========================
   CHANGE PASSWORD
========================= */

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    if (admin.password !== currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Current Password Incorrect",
      });
    }

    admin.password = newPassword;

    await admin.save();

    res.json({
      success: true,
      message: "Password Changed Successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/* =========================
   UPDATE LAST SEEN
========================= */

exports.updateLastSeen = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.admin.id,
      {
        lastSeen: new Date(),
        isOnline: true,
      },
      {
        new: true,
      },
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    res.json({
      success: true,
      lastSeen: admin.lastSeen,
      isOnline: admin.isOnline,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/* =========================
   requestPasswordReset controller
   (public — user isn't logged in, that's the whole point)
========================= */

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    const existingRequest = await PasswordResetRequest.findOne({
      adminId: admin._id,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message:
          "A password reset request is already pending for this account",
      });
    }

    const request = await PasswordResetRequest.create({
      adminId: admin._id,
      name: admin.name,
      email: admin.email,
      status: "pending",
    });

    await Notification.create({
      category: "passwordreset",
      requestId: request._id,
      variant: "amber",
      icon: "fa-key",
      targetRoles: ["Super Admin"],
      title: "Password Reset Request",
      message: `${admin.name} requested a password reset`,

      details: [
        {
          label: "Requester",
          value: admin.name,
        },
        {
          label: "Email",
          value: admin.email,
        },
        {
          label: "Role",
          value: admin.role,
        },
        {
          label: "Date",
          value: new Date().toLocaleDateString(),
        },
      ],

      actions: {
        type: "approve-reject",
      },
    });

    res.json({
      success: true,
      message: "Request submitted. A Super Admin will review it shortly.",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/* =========================
   approvePasswordReset controller
========================= */

exports.approvePasswordReset = async (req, res) => {
  try {
    const superAdmin = await Admin.findById(req.admin.id);

    if (!superAdmin || superAdmin.role !== "Super Admin") {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const request = await PasswordResetRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request Not Found",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request already ${request.status}`,
      });
    }

    const admin = await Admin.findById(request.adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    // Same default-reset behaviour as the Super Admin's manual
    // "Reset Password" action on the Admins & Mods page.
    admin.password = "11111111";
    await admin.save();

    request.status = "approved";
    await request.save();

    // Delete old pending notification
    await Notification.deleteMany({
      category: "passwordreset",
      requestId: request._id,
    });

    // Create approved notification — visible to everyone, so the
    // requester sees confirmation once they're able to log back in.
    await Notification.create({
      category: "passwordreset",
      requestId: request._id,
      variant: "green",
      icon: "fa-circle-check",
      title: "Password Reset Approved",
      message: `${request.name}'s password has been reset to the default password`,
      details: [
        {
          label: "Name",
          value: request.name,
        },
        {
          label: "Email",
          value: request.email,
        },
        {
          label: "Approved By",
          value: superAdmin.name || superAdmin.email,
        },
        {
          label: "Date",
          value: new Date().toLocaleDateString(),
        },
      ],
    });

    res.json({
      success: true,
      message: `${request.name}'s password has been reset to 11111111`,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/* =========================
   rejectPasswordReset controller
========================= */

exports.rejectPasswordReset = async (req, res) => {
  try {
    const superAdmin = await Admin.findById(req.admin.id);

    if (!superAdmin || superAdmin.role !== "Super Admin") {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const request = await PasswordResetRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request Not Found",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request already ${request.status}`,
      });
    }

    request.status = "rejected";
    await request.save();

    await Notification.deleteMany({
      category: "passwordreset",
      requestId: request._id,
    });

    await Notification.create({
      category: "passwordreset",
      requestId: request._id,
      variant: "red",
      icon: "fa-xmark",
      title: "Password Reset Rejected",
      message: `${request.name}'s password reset request was rejected`,
      details: [
        {
          label: "Name",
          value: request.name,
        },
        {
          label: "Email",
          value: request.email,
        },
        {
          label: "Rejected By",
          value: superAdmin.name || superAdmin.email,
        },
        {
          label: "Date",
          value: new Date().toLocaleDateString(),
        },
      ],
    });

    res.json({
      success: true,
      message: "Request Rejected Successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
