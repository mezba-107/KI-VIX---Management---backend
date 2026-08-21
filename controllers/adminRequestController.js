const Admin = require("../models/Admin");
const AdminRequest = require("../models/AdminRequest");
const Notification = require("../models/Notification");

/* =========================
      requestAccess controller
    ========================= */

exports.requestAccess = async (req, res) => {
  try {
    const { name, email, password, role, position, adminNote } = req.body;

    const existingRequest = await AdminRequest.findOne({ email });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Request already exists",
      });
    }

    const request = await AdminRequest.create({
      name,
      email,
      password,
      role,
      position,
      adminNote,
      status: "pending",
    });

    await Notification.create({
      category: "adminrequest",
      requestId: request._id,
      variant: "amber",
      icon: "fa-user-plus",
      targetRoles: ["Super Admin"],
      title: "New Admin Account Request",
      message: `${name} requested admin access`,

      details: [
        {
          label: "Requester",
          value: name,
        },
        {
          label: "Email",
          value: email,
        },
        {
          label: "Requested Role",
          value: role,
        },
        {
          label: "Admin Note",
          value: adminNote,
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
      message: "Request submitted successfully",
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
      getAllRequests controlle
    ========================= */

exports.getAllRequests = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);

    if (!admin || admin.role !== "Super Admin") {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const requests = await AdminRequest.find({
      status: "pending",
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      requests,
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
      approveRequest controller
    ========================= */

exports.approveRequest = async (req, res) => {
  try {
    const superAdmin = await Admin.findById(req.admin.id);

    if (!superAdmin || superAdmin.role !== "Super Admin") {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const request = await AdminRequest.findById(req.params.id);

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

    const existingAdmin = await Admin.findOne({
      email: request.email,
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin Already Exists",
      });
    }

    // Create new admin
    await Admin.create({
      name: request.name,
      email: request.email,
      password: request.password,
      role: request.role,
      position: request.position,
      status: "approved",
    });

    // Update request status
    request.status = "approved";
    await request.save();

    // Delete old pending notification
    await Notification.deleteMany({
      category: "adminrequest",
      requestId: request._id,
    });

    // Create approved notification
    await Notification.create({
      category: "adminrequest",
      requestId: request._id,
      variant: "green",
      icon: "fa-circle-check",
      title: "Admin Request Approved",
      message: `${request.name} has been approved`,
      details: [
        {
          label: "Name",
          value: request.name,
        },
        {
          label: "Role",
          value: request.role,
        },

        {
          label: "Email",
          value: request.email,
        },
        {
          label: "Admin Note",
          value: request.adminNote || "",
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
      message: "Request Approved Successfully",
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
      rejectRequest controller
    ========================= */

exports.rejectRequest = async (req, res) => {
  try {
    const superAdmin = await Admin.findById(req.admin.id);

    if (!superAdmin || superAdmin.role !== "Super Admin") {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const request = await AdminRequest.findById(req.params.id);

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

    // Update request status
    request.status = "rejected";
    await request.save();

    // Delete old pending notification
    await Notification.deleteMany({
      category: "adminrequest",
      requestId: request._id,
    });

    // Create rejected notification
    await Notification.create({
      category: "adminrequest",
      requestId: request._id,
      variant: "red",
      icon: "fa-xmark",
      title: "Admin Request Rejected",
      message: `${request.name} has been rejected`,
      details: [
        {
          label: "Name",
          value: request.name,
        },
        {
          label: "Role",
          value: request.role,
        },
        {
          label: "Email",
          value: request.email,
        },
        {
          label: "Admin Note",
          value: request.adminNote || "",
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
