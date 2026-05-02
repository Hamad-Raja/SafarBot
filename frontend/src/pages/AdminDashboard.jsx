import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RouteInsightsModal from "../components/RouteInsightsModal";
import { toast } from "react-hot-toast";

const AdminDashboard = () => {
  const [range, setRange] = useState("month");

  const [delayRoutes, setDelayRoutes] = useState([]);
  const [delayLoading, setDelayLoading] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [modalRoute, setModalRoute] = useState(null);
  const [insightsByRoute, setInsightsByRoute] = useState({});
  const [insightsLoadingRouteId, setInsightsLoadingRouteId] = useState(null);
  const [sendingAlertRouteId, setSendingAlertRouteId] = useState(null);
  const [alertResultsByRoute, setAlertResultsByRoute] = useState({});

  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalBookings: 0,
      totalRevenue: 0,
      activeUsers: 0,
      successRate: 0,
      fraudAlerts: 0,
      pendingProviders: 0,
    },
    topRoutes: [],
    recentBookings: [],
    recentUsers: [],
  });

  const API_BASE = "";

  const getAuthConfig = () => {
    const storedUser = JSON.parse(localStorage.getItem("safarbot_user") || "{}");

    return {
      headers: {
        Authorization: `Bearer ${storedUser.token}`,
      },
    };
  };

  const stats = dashboardData.stats;
  const topRoutes = dashboardData.topRoutes;
  const recentBookings = dashboardData.recentBookings;
  const recentUsers = dashboardData.recentUsers;

  const badge = (status) => {
    if (status === "confirmed")
      return "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30";
    if (status === "pending")
      return "bg-amber-500/15 text-amber-300 border border-amber-400/30";
    return "bg-red-500/15 text-red-300 border border-red-400/30";
  };

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/dashboard`, {
        ...getAuthConfig(),
        timeout: 20000,
      });

      setDashboardData({
        stats: res.data?.stats || {
          totalBookings: 0,
          totalRevenue: 0,
          activeUsers: 0,
          successRate: 0,
          fraudAlerts: 0,
          pendingProviders: 0,
        },
        topRoutes: Array.isArray(res.data?.topRoutes) ? res.data.topRoutes : [],
        recentBookings: Array.isArray(res.data?.recentBookings)
          ? res.data.recentBookings
          : [],
        recentUsers: Array.isArray(res.data?.recentUsers)
          ? res.data.recentUsers
          : [],
      });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to fetch dashboard data.");
    }
  };

  const fetchDelayRoutes = async () => {
    try {
      setDelayLoading(true);
      const res = await axios.get(`${API_BASE}/api/routes/provider/my`, {
        ...getAuthConfig(),
        timeout: 20000,
      });
      setDelayRoutes(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to fetch admin routes.");
    } finally {
      setDelayLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchDelayRoutes();
  }, []);

  const handleCheckInsights = async (routeItem) => {
    const routeId = routeItem._id;

    try {
      if (modalRoute?._id === routeId) {
        setModalRoute(null);
        setSelectedRouteId(null);
        return;
      }

      setModalRoute(routeItem);
      setSelectedRouteId(routeId);
      setInsightsLoadingRouteId(routeId);

      const res = await axios.get(`${API_BASE}/api/insights/route/${routeId}`, {
        ...getAuthConfig(),
        timeout: 20000,
      });

      setInsightsByRoute((prev) => ({
        ...prev,
        [routeId]: res.data,
      }));

      setAlertResultsByRoute((prev) => ({
        ...prev,
        [routeId]: null,
      }));
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to fetch insights.");
    } finally {
      setInsightsLoadingRouteId(null);
    }
  };

  const handleSendAlert = async (routeId) => {
    try {
      setSendingAlertRouteId(routeId);

      const res = await axios.post(
        `${API_BASE}/api/insights/route/${routeId}/send-alert`,
        {},
        {
          ...getAuthConfig(),
          timeout: 30000,
        }
      );

      setAlertResultsByRoute((prev) => ({
        ...prev,
        [routeId]: res.data,
      }));

      toast.success(res?.data?.message || "Delay alert sent successfully.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to send delay alert.");
    } finally {
      setSendingAlertRouteId(null);
    }
  };

  const delayPreviewRoutes = useMemo(() => {
    return delayRoutes.slice(0, 6);
  }, [delayRoutes]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-10 text-white">
          {/* Header */}
          <div className="rounded-3xl bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-400 p-[1px] shadow-2xl shadow-cyan-500/30 mb-6">
            <div className="rounded-[1.4rem] bg-slate-950/90 px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold mb-1">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-slate-300 max-w-lg">
                  Monitor system activity, bookings, revenue and operational signals.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-white/10 text-[11px] text-slate-200">
                  Role: ADMIN
                </span>

                <div className="flex rounded-full bg-slate-900/70 border border-white/10 p-1">
                  {["today", "week", "month"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setRange(v)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                        range === v
                          ? "bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-md shadow-cyan-500/30"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      {v.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-6 mb-6">
            <div className="bg-slate-900/80 rounded-3xl border border-white/10 p-4 shadow-lg shadow-cyan-500/10">
              <p className="text-[11px] text-slate-400 mb-1">Bookings</p>
              <p className="text-2xl font-extrabold">{stats.totalBookings}</p>
            </div>

            <div className="bg-slate-900/80 rounded-3xl border border-white/10 p-4 shadow-lg shadow-emerald-500/10">
              <p className="text-[11px] text-slate-400 mb-1">Revenue</p>
              <p className="text-2xl font-extrabold">
                PKR {(stats.totalRevenue || 0).toLocaleString()}
              </p>
            </div>

            <div className="bg-slate-900/80 rounded-3xl border border-white/10 p-4 shadow-lg shadow-sky-500/10">
              <p className="text-[11px] text-slate-400 mb-1">Active Users</p>
              <p className="text-2xl font-extrabold">{stats.activeUsers}</p>
            </div>

            <div className="bg-slate-900/80 rounded-3xl border border-white/10 p-4 shadow-lg shadow-cyan-500/10">
              <p className="text-[11px] text-slate-400 mb-1">Success Rate</p>
              <p className="text-2xl font-extrabold">{stats.successRate}%</p>
            </div>

            <div className="bg-slate-900/80 rounded-3xl border border-white/10 p-4 shadow-lg shadow-red-500/10">
              <p className="text-[11px] text-slate-400 mb-1">Fraud Alerts</p>
              <p className="text-2xl font-extrabold">{stats.fraudAlerts}</p>
            </div>

            <div className="bg-slate-900/80 rounded-3xl border border-white/10 p-4 shadow-lg shadow-amber-500/10">
              <p className="text-[11px] text-slate-400 mb-1">Pending Providers</p>
              <p className="text-2xl font-extrabold">{stats.pendingProviders}</p>
            </div>
          </div>

          {/* Grid */}
          <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            {/* Top routes */}
            <div className="bg-slate-900/80 rounded-3xl border border-white/10 p-5 shadow-lg shadow-cyan-500/10 text-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm">Top Routes</h2>
                <span className="text-[11px] text-slate-400">Performance share</span>
              </div>

              <div className="space-y-3">
                {topRoutes.length === 0 ? (
                  <p className="text-[11px] text-slate-400">No route data available.</p>
                ) : (
                  topRoutes.map((r) => (
                    <div key={r.route}>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-200">{r.route}</span>
                        <span className="text-cyan-300 font-semibold">
                          PKR {(r.revenue || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                          style={{
                            width: `${
                              stats.totalBookings > 0
                                ? Math.min(100, (r.bookings / stats.totalBookings) * 100)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>{r.bookings} bookings</span>
                        <span>
                          Share:{" "}
                          {stats.totalBookings > 0
                            ? Math.round((r.bookings / stats.totalBookings) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Recent bookings */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Recent Bookings</h3>
                  <span className="text-[11px] text-slate-400">Latest activity</span>
                </div>

                <div className="space-y-2">
                  {recentBookings.length === 0 ? (
                    <p className="text-[11px] text-slate-400">No recent bookings found.</p>
                  ) : (
                    recentBookings.map((b) => (
                      <div
                        key={b.id}
                        className="rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-slate-200 text-[11px] font-semibold">
                            {b.route}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {b.operator} • Seats: {b.seats || "N/A"} •{" "}
                            {b.time ? new Date(b.time).toLocaleString() : "N/A"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-cyan-300 text-[11px] font-semibold">
                            PKR {(b.amount || 0).toLocaleString()}
                          </p>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide ${badge(
                              b.status
                            )}`}
                          >
                            {b.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Delay monitoring */}
              <div className="bg-slate-900/80 rounded-3xl border border-white/10 p-5 shadow-lg shadow-amber-500/10 text-xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm">Delay Monitoring</h2>
                  <button
                    type="button"
                    onClick={fetchDelayRoutes}
                    disabled={delayLoading}
                    className="px-3 py-1 rounded-full text-[10px] font-semibold border border-amber-400/50 text-amber-200 hover:bg-amber-500/10 disabled:opacity-50"
                  >
                    {delayLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                {delayPreviewRoutes.length === 0 ? (
                  <p className="text-[11px] text-slate-400">
                    No routes available for delay monitoring.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                    {delayPreviewRoutes.map((r) => {
                      const isModalOpen = modalRoute?._id === r._id;
                      const insightsLoading = insightsLoadingRouteId === r._id;

                      return (
                        <div
                          key={r._id}
                          className="rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-3"
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-slate-100 font-semibold text-[12px]">
                                  {r.fromCity} → {r.toCity}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {r.operator || "Unknown Operator"} •{" "}
                                  {r.departureTime || "N/A"}
                                  {r.travelDate ? ` • ${r.travelDate}` : ""}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1">
                                  Route ID: {r.routeId || r._id}
                                </p>
                              </div>

                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] border ${
                                  r.active
                                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                                    : "bg-slate-800 text-slate-300 border-slate-600/60"
                                }`}
                              >
                                {r.active ? "Active" : "Paused"}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleCheckInsights(r)}
                                disabled={insightsLoading}
                                className="px-3 py-1 rounded-full text-[10px] font-semibold border border-cyan-400/50 text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50"
                              >
                                {insightsLoading
                                  ? "Loading..."
                                  : isModalOpen
                                  ? "Close Insights"
                                  : "Check Insights"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent users */}
              <div className="bg-slate-900/80 rounded-3xl border border-white/10 p-5 shadow-lg shadow-emerald-500/10 text-xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm">Recent Users</h2>
                  <span className="text-[11px] text-slate-400">Latest</span>
                </div>

                <div className="space-y-3">
                  {recentUsers.length === 0 ? (
                    <p className="text-[11px] text-slate-400">No recent users found.</p>
                  ) : (
                    recentUsers.map((u) => (
                      <div
                        key={u.email}
                        className="flex items-center justify-between bg-slate-950/60 rounded-2xl px-3 py-2 border border-white/10"
                      >
                        <div>
                          <p className="text-slate-200">{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide ${
                            u.role === "provider"
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30"
                              : "bg-cyan-500/15 text-cyan-300 border border-cyan-400/30"
                          }`}
                        >
                          {u.role}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* System status */}
              <div className="bg-slate-900/80 rounded-3xl border border-white/10 p-5 shadow-lg shadow-cyan-500/10 text-xs">
                <h2 className="font-semibold text-sm mb-3">System Status</h2>

                <div className="grid gap-2">
                  <div className="rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 flex justify-between">
                    <span className="text-slate-400">API</span>
                    <span className="text-emerald-300 font-semibold">Operational</span>
                  </div>
                  <div className="rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 flex justify-between">
                    <span className="text-slate-400">Payments</span>
                    <span className="text-cyan-300 font-semibold">Sandbox</span>
                  </div>
                  <div className="rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 flex justify-between">
                    <span className="text-slate-400">Monitoring</span>
                    <span className="text-amber-300 font-semibold">
                      {stats.fraudAlerts} Alerts
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-slate-900/80 rounded-3xl border border-white/10 p-5 shadow-lg shadow-sky-500/10 text-xs">
                <h2 className="font-semibold text-sm mb-3">Quick Actions</h2>
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => toast.success("Export report feature not connected yet")}
                    className="w-full px-4 py-2 rounded-2xl bg-slate-950/60 border border-white/10 text-slate-200 hover:bg-slate-950 transition-colors"
                  >
                    Export Summary
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.success("Open providers page to review pending providers")}
                    className="w-full px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-semibold"
                  >
                    Review Pending Providers
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <RouteInsightsModal
        open={!!modalRoute}
        onClose={() => {
          setModalRoute(null);
          setSelectedRouteId(null);
        }}
        route={modalRoute}
        insights={modalRoute ? insightsByRoute[modalRoute._id] : null}
        loading={modalRoute ? insightsLoadingRouteId === modalRoute._id : false}
        onSendAlert={() => modalRoute && handleSendAlert(modalRoute._id)}
        sendingAlert={
          modalRoute ? sendingAlertRouteId === modalRoute._id : false
        }
        sendAlertResult={
          modalRoute ? alertResultsByRoute[modalRoute._id] || null : null
        }
      />

      <Footer />
    </div>
  );
};

export default AdminDashboard;