const User = require("../models/User");

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

module.exports = { listProviders, approveProvider, rejectProvider, suspendProvider };
