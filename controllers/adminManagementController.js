const Admin = require("../models/Admin");

const Notification = require("../models/Notification");

const FIXED_ADMIN_EMAIL = "m.m.simon.107@gmail.com";

/* =========================
   getAllAdmins controller
========================= */

exports.getAllAdmins = async (req, res) => {
  try {
    console.log("================================");
    console.log("req.admin =", req.admin);

    const currentAdmin = await Admin.findById(req.admin.id);

    console.log("db admin =", currentAdmin);
    console.log("admin role =", currentAdmin?.role);
    console.log("admin email =", currentAdmin?.email);
    console.log("================================");

    if (!currentAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const admins = await Admin.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    const now = Date.now();

    const updatedAdmins = admins.map((admin) => {
      const lastSeenTime = admin.lastSeen
        ? new Date(admin.lastSeen).getTime()
        : 0;

      // Last heartbeat 2 minutes এর মধ্যে হলে Online
      const isOnline = lastSeenTime > 0 && now - lastSeenTime <= 2 * 60 * 1000;

      return {
        ...admin.toObject(),
        isOnline,
      };
    });

    console.log("Total Admins Found:", updatedAdmins.length);

    res.json({
      success: true,
      admins: updatedAdmins,
    });
  } catch (error) {
    console.log("GET ALL ADMINS ERROR:");
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
/* =========================
   makePartner controller
========================= */

exports.makePartner = async (req, res) => {
  try {
    const superAdmin = await Admin.findById(req.admin.id);

    if (!superAdmin || superAdmin.role !== "Super Admin") {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    if (admin.email === FIXED_ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Fixed Admin Cannot Be Made Partner",
      });
    }

    admin.isPartner = true;

    await admin.save();

    await Notification.create({
      category: "adminrequest",
      variant: "green",
      icon: "fa-handshake",

      title: "Partner Added",

      message: `${admin.name || admin.email} is now a Partner`,

      details: [
        {
          label: "Member",
          value: admin.name || admin.email,
        },
        {
          label: "Role",
          value: admin.role,
        },
        {
          label: "Added By",
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
      message: "Partner Added Successfully",
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
   removePartner controller
========================= */

exports.removePartner = async (req, res) => {
  try {
    const superAdmin = await Admin.findById(req.admin.id);

    if (!superAdmin || superAdmin.role !== "Super Admin") {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    if (admin.email === FIXED_ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Fixed Admin Partner Status Cannot Be Changed",
      });
    }

    admin.isPartner = false;

    await Notification.create({
      category: "adminrequest",
      variant: "red",
      icon: "fa-user-minus",

      title: "Partner Removed",

      message: `${admin.name || admin.email} is no longer a Partner`,

      details: [
        {
          label: "Member",
          value: admin.name || admin.email,
        },
        {
          label: "Role",
          value: admin.role,
        },
        {
          label: "Removed By",
          value: superAdmin.name || superAdmin.email,
        },
        {
          label: "Date",
          value: new Date().toLocaleDateString(),
        },
      ],
    });

    await admin.save();

    res.json({
      success: true,
      message: "Partner Removed Successfully",
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
   removeAdmin controller
========================= */

exports.removeAdmin = async (req, res) => {
  try {
    const superAdmin = await Admin.findById(req.admin.id);

    if (!superAdmin || superAdmin.role !== "Super Admin") {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const targetAdmin = await Admin.findById(req.params.id);

    if (!targetAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    if (targetAdmin.role === "Super Admin") {
      return res.status(400).json({
        success: false,
        message: "Super Admin Cannot Be Removed",
      });
    }

    if (targetAdmin._id.toString() === superAdmin._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You Cannot Delete Yourself",
      });
    }

    await Admin.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Admin Removed Successfully",
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
   getFinanceAdmins controller
========================= */

exports.getFinanceAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({
      isPartner: true,
    })
      .select("name email image investment expense role history")
      .sort({ createdAt: 1 });

    const updatedAdmins = admins.map((admin) => ({
      ...admin.toObject(),
      balance: admin.investment || 0,
    }));

    res.json({
      success: true,
      admins: updatedAdmins,
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
   changeRole controller
========================= */

exports.changeRole = async (req, res) => {
  try {
    const superAdmin = await Admin.findById(req.admin.id);

    if (!superAdmin || superAdmin.role !== "Super Admin") {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const { role } = req.body;

    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    const oldRole = admin.role;

    await Notification.create({
      category: "adminrequest",
      variant: "blue",
      icon: "fa-user-gear",

      title: "User Role Updated",

      message: `${admin.name || admin.email}'s role has been changed`,

      details: [
        {
          label: "Member",
          value: admin.name || admin.email,
        },
        {
          label: "Previous Role",
          value: oldRole,
        },
        {
          label: "New Role",
          value: role,
        },
        {
          label: "Updated By",
          value: superAdmin.name || superAdmin.email,
        },
        {
          label: "Date",
          value: new Date().toLocaleDateString(),
        },
      ],
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    if (admin.email === FIXED_ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Fixed Admin Role Cannot Be Changed",
      });
    }

    admin.role = role;

    await admin.save();

    res.json({
      success: true,
      message: "Role Updated Successfully",
      admin,
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
   resetPassword controller
========================= */

exports.resetPassword = async (req, res) => {
  try {
    const superAdmin = await Admin.findById(req.admin.id);

    if (!superAdmin || superAdmin.role !== "Super Admin") {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    admin.password = "11111111";

    await admin.save();

    res.json({
      success: true,
      message: "Password Reset Successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
