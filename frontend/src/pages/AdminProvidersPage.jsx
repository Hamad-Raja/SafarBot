import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast } from "react-hot-toast";
import axios from "axios";

const AdminProvidersPage = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProvider, setSelectedProvider] = useState(null);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/providers?status=${statusFilter}`);
      setProviders(res.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load providers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (providers || []).filter((p) => {
      const name = (p.companyName || p.name || "").toLowerCase();
      const matchesQuery = !q || name.includes(q);
      return matchesQuery;
    });
  }, [query, providers]);

  const statusBadge = (status) => {
    if (status === "active")
      return "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30";
    if (status === "pending")
      return "bg-amber-500/15 text-amber-300 border border-amber-400/30";
    if (status === "suspended")
      return "bg-red-500/15 text-red-300 border border-red-400/30";
    if (status === "rejected")
      return "bg-rose-500/15 text-rose-300 border border-rose-400/30";
    return "bg-slate-500/15 text-slate-300 border border-slate-400/30";
  };

  const providerStatus = (p) => {
    // If backend uses providerStatus, use it; otherwise derive from isApproved/isActive
    if (p.providerStatus) return p.providerStatus;
    if (p.role !== "provider") return "unknown";
    if (p.isActive === false) return "suspended";
    if (p.isApproved === false) return "pending";
    return "active";
  };

  const countRoutes = (p) => {
    // If you later store provider routes/buses, this can be computed by API.
    // For now show 0 if not provided by backend.
    return p.routesCount ?? 0;
  };

  const approve = async (id) => {
    try {
      await axios.put(`/api/admin/providers/${id}/approve`);
      toast.success("Provider approved.");
      fetchProviders();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Approve failed.");
    }
  };

  const suspend = async (id) => {
    try {
      await axios.put(`/api/admin/providers/${id}/suspend`);
      toast.success("Provider suspended.");
      fetchProviders();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Suspend failed.");
    }
  };

  const reject = async (id) => {
    const reason = window.prompt("Reject reason (optional):", "Incomplete documents");
    try {
      await axios.put(`/api/admin/providers/${id}/reject`, { reason: reason || "" });
      toast.success("Provider rejected.");
      fetchProviders();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Reject failed.");
    }
  };

  const view = (p) => {
    setSelectedProvider(p);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />
     {/* Provider Detail Modal */}
{selectedProvider && (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      onClick={() => setSelectedProvider(null)}
    />

    {/* Modal Card */}
    <div className="relative w-full max-w-2xl rounded-3xl border border-cyan-500/30 bg-slate-900 shadow-2xl shadow-cyan-500/20 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-white/10 bg-slate-950/40">
        <div className="min-w-0">
          <h2 className="text-lg md:text-xl font-extrabold text-white truncate">
            {selectedProvider.companyName || selectedProvider.name || "Provider Details"}
          </h2>
          <p className="mt-1 text-[11px] text-slate-400 truncate">
            {selectedProvider.email || "—"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wide ${statusBadge(
              providerStatus(selectedProvider)
            )}`}
          >
            {providerStatus(selectedProvider)}
          </span>

          <button
            type="button"
            onClick={() => setSelectedProvider(null)}
            className="h-9 w-9 rounded-2xl bg-slate-800 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact Card */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-[12px] font-semibold text-slate-200 mb-3">
              Contact
            </p>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                <span className="text-slate-400">Contact:</span>{" "}
                {selectedProvider.contactNumber || "—"}
              </p>
              <p>
                <span className="text-slate-400">City:</span>{" "}
                {selectedProvider.city || "—"}
              </p>
              <p>
                <span className="text-slate-400">Address:</span>{" "}
                {selectedProvider.businessAddress || "—"}
              </p>
            </div>
          </div>

          {/* Verification Card */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-[12px] font-semibold text-slate-200 mb-3">
              Verification
            </p>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                <span className="text-slate-400">CNIC:</span>{" "}
                {selectedProvider.cnic || "—"}
              </p>
              <p>
                <span className="text-slate-400">License:</span>{" "}
                {selectedProvider.licenseNumber || "—"}
              </p>
              <p>
                <span className="text-slate-400">Fleet Size:</span>{" "}
                {selectedProvider.fleetSize ?? "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Rejection reason */}
        {selectedProvider.rejectionReason && (
          <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4">
            <p className="text-[12px] font-semibold text-rose-200 mb-1">
              Rejection Reason
            </p>
            <p className="text-xs text-rose-100/90">
              {selectedProvider.rejectionReason}
            </p>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-end">
          <button
            type="button"
            onClick={() => setSelectedProvider(null)}
            className="px-4 py-2 rounded-2xl bg-slate-800 border border-white/10 text-slate-200 hover:bg-slate-700 transition text-sm"
          >
            Close
          </button>

          {providerStatus(selectedProvider) === "pending" && (
            <>
              <button
                type="button"
                onClick={async () => {
                  await approve(selectedProvider._id);
                  setSelectedProvider(null);
                }}
                className="px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/25 transition text-sm"
              >
                Approve
              </button>

              <button
                type="button"
                onClick={async () => {
                  await reject(selectedProvider._id);
                  setSelectedProvider(null);
                }}
                className="px-4 py-2 rounded-2xl bg-rose-500/15 border border-rose-400/30 text-rose-200 hover:bg-rose-500/25 transition text-sm"
              >
                Reject
              </button>
            </>
          )}

          {providerStatus(selectedProvider) === "active" && (
            <button
              type="button"
              onClick={async () => {
                await suspend(selectedProvider._id);
                setSelectedProvider(null);
              }}
              className="px-4 py-2 rounded-2xl bg-red-500/15 border border-red-400/30 text-red-200 hover:bg-red-500/25 transition text-sm"
            >
              Suspend
            </button>
          )}

          {providerStatus(selectedProvider) === "suspended" && (
            <button
              type="button"
              onClick={async () => {
                await approve(selectedProvider._id);
                setSelectedProvider(null);
              }}
              className="px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/25 transition text-sm"
            >
              Re-Activate
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
)}

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-12 text-white">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl font-extrabold">Manage Providers</h1>
              <p className="text-xs text-slate-400">
                Approve, reject, suspend or review operators on the platform.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search provider..."
                className="w-full sm:w-64 rounded-2xl bg-slate-900/70 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl bg-slate-900/70 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900/80 rounded-3xl border border-white/10 shadow-lg shadow-cyan-500/10 p-5 overflow-x-auto">
            {loading ? (
              <div className="py-10 text-center text-slate-400 text-sm">
                Loading providers...
              </div>
            ) : (
              <table className="min-w-full text-xs">
                <thead className="text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="py-2 text-left">Provider</th>
                    <th className="py-2 text-left">Routes</th>
                    <th className="py-2 text-left">Status</th>
                    <th className="py-2 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((p) => {
                    const status = providerStatus(p);
                    return (
                      <tr key={p._id} className="border-b border-white/5">
                        <td className="py-3 pr-3 text-slate-100 font-semibold">
                          {p.companyName || p.name || "—"}
                          <div className="text-[10px] text-slate-500 font-normal">
                            {p.email}
                          </div>
                        </td>

                        <td className="py-3 pr-3 text-slate-300">
                          {countRoutes(p)}
                        </td>

                        <td className="py-3 pr-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide ${statusBadge(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="py-3 flex items-center gap-2 text-[10px] flex-wrap">
                          <button
                            type="button"
                            onClick={() => view(p)}
                            className="px-3 py-1 rounded-full bg-slate-800 border border-white/15 text-slate-100 hover:bg-slate-700"
                          >
                            View
                          </button>

                          {status === "pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() => approve(p._id)}
                                className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/25"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => reject(p._id)}
                                className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-400/30 text-rose-200 hover:bg-rose-500/25"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {status === "active" && (
                            <button
                              type="button"
                              onClick={() => suspend(p._id)}
                              className="px-3 py-1 rounded-full bg-red-500/15 border border-red-400/30 text-red-200 hover:bg-red-500/25"
                            >
                              Suspend
                            </button>
                          )}

                          {status === "suspended" && (
                            <button
                              type="button"
                              onClick={() => approve(p._id)}
                              className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/25"
                            >
                              Re-Activate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-slate-400">
                        No providers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminProvidersPage;
