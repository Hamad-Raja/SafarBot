const User = require("../models/User");

const Booking = require("../models/Booking");
const FraudAlert = require("../models/FraudAlert");

// 1) List providers (pending/active/suspended/rejected)
const listProviders = async (req, res) => {
  try {
    const { status = "all" } = req.query;

    const base = { role: "provider" };
    let filter = { ...base };

    if (status === "pending") {
      // pending means: not approved + still active
      filter = {
        ...base,
        $or: [
          { providerStatus: "pending" },
          { providerStatus: { $exists: false }, isApproved: false, isActive: { $ne: false } },
        ],
      };
    } else if (status === "active") {
      filter = {
        ...base,
        $or: [
          { providerStatus: "active" },
          { providerStatus: { $exists: false }, isApproved: true, isActive: { $ne: false } },
        ],
      };
    } else if (status === "suspended") {
      filter = {
        ...base,
        $or: [
          { providerStatus: "suspended" },
          { providerStatus: { $exists: false }, isActive: false },
        ],
      };
    } else if (status === "rejected") {
      filter = {
        ...base,
        $or: [
          { providerStatus: "rejected" },
          { providerStatus: { $exists: false }, isApproved: false, isActive: false },
        ],
      };
    } else {
      // all: no extra filter
      filter = base;
    }

    const providers = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    return res.json(providers);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};


const getAdminDashboard = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();

    const revenueData = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    const activeUsers = await User.countDocuments({
      role: "user",
      isActive: { $ne: false },
    });

    const confirmedBookings = await Booking.countDocuments({
      status: "confirmed",
    });

    const successRate =
      totalBookings > 0
        ? Math.round((confirmedBookings / totalBookings) * 100)
        : 0;

    const fraudAlerts = await FraudAlert.countDocuments({
      reviewOutcome: "PENDING",
    });

    const pendingProviders = await User.countDocuments({
      role: "provider",
      $or: [
        { providerStatus: "pending" },
        {
          providerStatus: { $exists: false },
          isApproved: false,
          isActive: { $ne: false },
        },
      ],
    });

    const topRoutesData = await Booking.aggregate([
      {
        $group: {
          _id: {
            from: "$from",
            to: "$to",
          },
          bookings: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { bookings: -1 } },
      { $limit: 4 },
    ]);

    const topRoutes = topRoutesData.map((item) => ({
      route: `${item._id.from || "Unknown"} → ${item._id.to || "Unknown"}`,
      bookings: item.bookings,
      revenue: item.revenue || 0,
    }));

    const recentBookingsData = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    const recentBookings = recentBookingsData.map((b) => ({
      id: b._id,
      route: `${b.from || "Unknown"} → ${b.to || "Unknown"}`,
      operator: b.operator || "Unknown Operator",
      amount: b.totalAmount || 0,
      seats: Array.isArray(b.seats) ? b.seats.join(", ") : "N/A",
      time: b.createdAt,
      status: String(b.status || "pending").toLowerCase(),
    }));

    const recentUsers = await User.find()
      .select("name email role")
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    res.json({
      stats: {
        totalBookings,
        totalRevenue,
        activeUsers,
        successRate,
        fraudAlerts,
        pendingProviders,
      },
      topRoutes,
      recentBookings,
      recentUsers,
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard data." });
  }
};

// 2) Approve provider
const approveProvider = async (req, res) => {
  const provider = await User.findById(req.params.id);
  if (!provider || provider.role !== "provider") return res.status(404).json({ message: "Provider not found." });

  provider.isApproved = true;
  provider.isActive = true;
  provider.providerStatus = "active";
  provider.rejectionReason = "";
  await provider.save();

  res.json({ message: "Provider approved.", provider });
};

// 3) Reject provider
const rejectProvider = async (req, res) => {
  const { reason = "Not specified" } = req.body;

  const provider = await User.findById(req.params.id);
  if (!provider || provider.role !== "provider") return res.status(404).json({ message: "Provider not found." });

  provider.isApproved = false;
  provider.isActive = false;
  provider.providerStatus = "rejected";
  provider.rejectionReason = reason;
  await provider.save();

  res.json({ message: "Provider rejected.", provider });
};

// 4) Suspend provider (active ko suspend)
const suspendProvider = async (req, res) => {
  const provider = await User.findById(req.params.id);
  if (!provider || provider.role !== "provider") return res.status(404).json({ message: "Provider not found." });

  provider.isActive = false;
  provider.providerStatus = "suspended";
  await provider.save();

  res.json({ message: "Provider suspended.", provider });
};

const getAdminReports = async (req, res) => {
  try {
    const revenueData = await Booking.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const revenue = revenueData.map((item) => ({
      month: monthNames[item._id.month - 1],
      revenue: item.revenue || 0,
    }));

    const routeData = await Booking.aggregate([
      {
        $group: {
          _id: {
            from: "$from",
            to: "$to",
          },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { bookings: -1 } },
      { $limit: 6 },
    ]);

    const routes = routeData.map((item) => ({
      route: `${item._id.from || "Unknown"}-${item._id.to || "Unknown"}`,
      bookings: item.bookings || 0,
    }));

    res.json({
      revenue,
      routes,
    });
  } catch (err) {
    console.error("Admin reports error:", err);
    res.status(500).json({ message: "Failed to fetch reports." });
  }
};
module.exports = {
  listProviders,
  approveProvider,
  rejectProvider,
  suspendProvider,
  getAdminReports,
  getAdminDashboard,
};
