import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast } from "react-hot-toast";
import API from "../api/api";

const AdminProvidersPage = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProvider, setSelectedProvider] = useState(null);

  const getAuthConfig = () => {
    const user = JSON.parse(localStorage.getItem("safarbot_user") || "{}");

    return {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    };
  };

  const fetchProviders = async () => {
    try {
      setLoading(true);

      const res = await API.get(
        `/api/admin/providers?status=${statusFilter}`,
        getAuthConfig()
      );

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
      return !q || name.includes(q);
    });
  }, [query, providers]);

  const statusBadge = (status) => {
    if (status === "active")
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    if (status === "pending")
      return "bg-amber-50 text-amber-700 border border-amber-200";
    if (status === "suspended")
      return "bg-red-50 text-red-700 border border-red-200";
    if (status === "rejected")
      return "bg-rose-50 text-rose-700 border border-rose-200";
    return "bg-slate-100 text-slate-600 border border-slate-200";
  };

  const providerStatus = (p) => {
    if (p.providerStatus) return p.providerStatus;
    if (p.role !== "provider") return "unknown";
    if (p.isActive === false) return "suspended";
    if (p.isApproved === false) return "pending";
    return "active";
  };

  const countRoutes = (p) => {
    return p.routesCount ?? 0;
  };

  const approve = async (id) => {
    try {
      await API.put(
        `/api/admin/providers/${id}/approve`,
        {},
        getAuthConfig()
      );

      toast.success("Provider approved.");
      fetchProviders();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Approve failed.");
    }
  };

  const suspend = async (id) => {
    try {
      await API.put(
        `/api/admin/providers/${id}/suspend`,
        {},
        getAuthConfig()
      );

      toast.success("Provider suspended.");
      fetchProviders();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Suspend failed.");
    }
  };

  const reject = async (id) => {
    const reason = window.prompt(
      "Reject reason (optional):",
      "Incomplete documents"
    );

    try {
      await API.put(
        `/api/admin/providers/${id}/reject`,
        { reason: reason || "" },
        getAuthConfig()
      );

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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-500 via-blue-50 to-white text-slate-950">
      <Navbar />

      {selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedProvider(null)}
          />

          <div className="relative w-full max-w-2xl rounded-3xl border border-white/60 bg-white shadow-2xl shadow-slate-900/20 overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-200 bg-blue-50/70">
              <div className="min-w-0">
                <h2 className="text-lg md:text-xl font-extrabold text-slate-950 truncate">
                  {selectedProvider.companyName ||
                    selectedProvider.name ||
                    "Provider Details"}
                </h2>
                <p className="mt-1 text-[11px] text-slate-500 truncate">
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
                  className="h-9 w-9 rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[12px] font-semibold text-slate-900 mb-3">
                    Contact
                  </p>

                  <div className="space-y-2 text-xs text-slate-700">
                    <p>
                      <span className="text-slate-500">Contact:</span>{" "}
                      {selectedProvider.contactNumber || "—"}
                    </p>
                    <p>
                      <span className="text-slate-500">City:</span>{" "}
                      {selectedProvider.city || "—"}
                    </p>
                    <p>
                      <span className="text-slate-500">Address:</span>{" "}
                      {selectedProvider.businessAddress || "—"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[12px] font-semibold text-slate-900 mb-3">
                    Verification
                  </p>

                  <div className="space-y-2 text-xs text-slate-700">
                    <p>
                      <span className="text-slate-500">CNIC:</span>{" "}
                      {selectedProvider.cnic || "—"}
                    </p>
                    <p>
                      <span className="text-slate-500">License:</span>{" "}
                      {selectedProvider.licenseNumber || "—"}
                    </p>
                    <p>
                      <span className="text-slate-500">Fleet Size:</span>{" "}
                      {selectedProvider.fleetSize ?? "—"}
                    </p>
                  </div>
                </div>
              </div>

              {selectedProvider.rejectionReason && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-[12px] font-semibold text-rose-700 mb-1">
                    Rejection Reason
                  </p>
                  <p className="text-xs text-rose-700/90">
                    {selectedProvider.rejectionReason}
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedProvider(null)}
                  className="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 text-sm"
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
                      className="px-4 py-2 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 text-sm"
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        await reject(selectedProvider._id);
                        setSelectedProvider(null);
                      }}
                      className="px-4 py-2 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 text-sm"
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
                    className="px-4 py-2 rounded-2xl border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 text-sm"
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
                    className="px-4 py-2 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 text-sm"
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
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl font-extrabold">Manage Providers</h1>
              <p className="text-xs text-slate-600">
                Approve, reject, suspend or review operators on the platform.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search provider..."
                className="w-full sm:w-64 rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 shadow-sm shadow-blue-900/5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-slate-950 shadow-sm shadow-blue-900/5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/55 bg-white/55 p-5 shadow-xl shadow-blue-900/10 ring-1 ring-white/30 backdrop-blur-2xl overflow-x-auto">
            {loading ? (
              <div className="py-10 text-center text-slate-500 text-sm">
                Loading providers...
              </div>
            ) : (
              <table className="min-w-full text-xs">
                <thead className="text-slate-500 border-b border-slate-200/70">
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
                      <tr key={p._id} className="border-b border-slate-200/60">
                        <td className="py-3 pr-3 text-slate-900 font-semibold">
                          {p.companyName || p.name || "—"}
                          <div className="text-[10px] text-slate-500 font-normal">
                            {p.email}
                          </div>
                        </td>

                        <td className="py-3 pr-3 text-slate-700">
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
                            className="px-3 py-1 rounded-full border border-slate-200 bg-white/70 text-slate-700 hover:bg-white"
                          >
                            View
                          </button>

                          {status === "pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() => approve(p._id)}
                                className="px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              >
                                Approve
                              </button>

                              <button
                                type="button"
                                onClick={() => reject(p._id)}
                                className="px-3 py-1 rounded-full border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {status === "active" && (
                            <button
                              type="button"
                              onClick={() => suspend(p._id)}
                              className="px-3 py-1 rounded-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            >
                              Suspend
                            </button>
                          )}

                          {status === "suspended" && (
                            <button
                              type="button"
                              onClick={() => approve(p._id)}
                              className="px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
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
