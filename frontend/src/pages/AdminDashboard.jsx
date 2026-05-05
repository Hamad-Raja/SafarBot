import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RouteInsightsModal from "../components/RouteInsightsModal";
import { toast } from "react-hot-toast";
import Api from '../api/api'

const panelClass =
  "rounded-[2rem] border border-white/55 bg-white/55 p-5 shadow-xl shadow-blue-900/10 ring-1 ring-white/30 backdrop-blur-2xl";

const statClass =
  "rounded-[1.5rem] border border-white/55 bg-white/55 p-4 shadow-lg shadow-blue-900/10 ring-1 ring-white/30 backdrop-blur-2xl";

const insetPanelClass =
  "rounded-2xl border border-white/60 bg-white/60 shadow-sm shadow-blue-900/5 backdrop-blur-xl";

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
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    if (status === "pending")
      return "bg-amber-50 text-amber-700 border border-amber-200";
    return "bg-red-50 text-red-700 border border-red-200";
  };

  const fetchDashboardData = async () => {
    try {
      const res = await Api.get(`/api/admin/dashboard`, {
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
      const res = await Api.get(`/api/routes/provider/my`, {
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

      const res = await Api.get(`/api/insights/route/${routeId}`, {
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

      const res = await Api.post(
        `/api/insights/route/${routeId}/send-alert`,
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-white text-slate-950">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-10">
          {/* Header */}
          <div className="mb-6 overflow-hidden rounded-[2rem] border border-white/55 bg-white/45 px-6 py-5 shadow-2xl shadow-blue-900/10 ring-1 ring-white/35 backdrop-blur-2xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold mb-1">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-slate-600 max-w-lg">
                  Monitor system activity, bookings, revenue and operational signals.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full border border-white/55 bg-white/60 text-[11px] text-slate-700 shadow-sm backdrop-blur-xl">
                  Role: ADMIN
                </span>

                <div className="flex rounded-full border border-white/55 bg-white/60 p-1 shadow-sm backdrop-blur-xl">
                  {["today", "week", "month"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setRange(v)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${range === v
                          ? "bg-slate-950 text-white shadow-md shadow-slate-900/20"
                          : "text-slate-600 hover:text-blue-700"
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
            <div className={statClass}>
              <p className="text-[11px] text-slate-500 mb-1">Bookings</p>
              <p className="text-2xl font-extrabold text-slate-950">{stats.totalBookings}</p>
            </div>

            <div className={statClass}>
              <p className="text-[11px] text-slate-500 mb-1">Revenue</p>
              <p className="text-2xl font-extrabold text-slate-950">
                PKR {(stats.totalRevenue || 0).toLocaleString()}
              </p>
            </div>

            <div className={statClass}>
              <p className="text-[11px] text-slate-500 mb-1">Active Users</p>
              <p className="text-2xl font-extrabold text-slate-950">{stats.activeUsers}</p>
            </div>

            <div className={statClass}>
              <p className="text-[11px] text-slate-500 mb-1">Success Rate</p>
              <p className="text-2xl font-extrabold text-slate-950">{stats.successRate}%</p>
            </div>

            <div className={statClass}>
              <p className="text-[11px] text-slate-500 mb-1">Fraud Alerts</p>
              <p className="text-2xl font-extrabold text-slate-950">{stats.fraudAlerts}</p>
            </div>

            <div className={statClass}>
              <p className="text-[11px] text-slate-500 mb-1">Pending Providers</p>
              <p className="text-2xl font-extrabold text-slate-950">{stats.pendingProviders}</p>
            </div>
          </div>

          {/* Grid */}
          <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            {/* Top routes */}
            <div className={`${panelClass} text-xs`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm">Top Routes</h2>
                <span className="text-[11px] text-slate-500">Performance share</span>
              </div>

              <div className="space-y-3">
                {topRoutes.length === 0 ? (
                  <p className="text-[11px] text-slate-500">No route data available.</p>
                ) : (
                  topRoutes.map((r) => (
                    <div key={r.route}>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-800">{r.route}</span>
                        <span className="text-blue-700 font-semibold">
                          PKR {(r.revenue || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-700"
                          style={{
                            width: `${stats.totalBookings > 0
                                ? Math.min(100, (r.bookings / stats.totalBookings) * 100)
                                : 0
                              }%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
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
                  <span className="text-[11px] text-slate-500">Latest activity</span>
                </div>

                <div className="space-y-2">
                  {recentBookings.length === 0 ? (
                    <p className="text-[11px] text-slate-500">No recent bookings found.</p>
                  ) : (
                    recentBookings.map((b) => (
                      <div
                        key={b.id}
                        className={`${insetPanelClass} px-3 py-2 flex items-center justify-between gap-3`}
                      >
                        <div>
                          <p className="text-slate-800 text-[11px] font-semibold">
                            {b.route}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {b.operator} • Seats: {b.seats || "N/A"} •{" "}
                            {b.time ? new Date(b.time).toLocaleString() : "N/A"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-blue-700 text-[11px] font-semibold">
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
              <div className={`${panelClass} text-xs`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm">Delay Monitoring</h2>
                  <button
                    type="button"
                    onClick={fetchDelayRoutes}
                    disabled={delayLoading}
                    className="px-3 py-1 rounded-full text-[10px] font-semibold border border-blue-200 bg-white/60 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                  >
                    {delayLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                {delayPreviewRoutes.length === 0 ? (
                  <p className="text-[11px] text-slate-500">
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
                          className={`${insetPanelClass} px-3 py-3`}
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-slate-900 font-semibold text-[12px]">
                                  {r.fromCity} → {r.toCity}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1">
                                  {r.operator || "Unknown Operator"} •{" "}
                                  {r.departureTime || "N/A"}
                                  {r.travelDate ? ` • ${r.travelDate}` : ""}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1">
                                  Route ID: {r.routeId || r._id}
                                </p>
                              </div>

                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] border ${r.active
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
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
                                className="px-3 py-1 rounded-full text-[10px] font-semibold border border-blue-200 bg-white/60 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
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
              <div className={`${panelClass} text-xs`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm">Recent Users</h2>
                  <span className="text-[11px] text-slate-500">Latest</span>
                </div>

                <div className="space-y-3">
                  {recentUsers.length === 0 ? (
                    <p className="text-[11px] text-slate-500">No recent users found.</p>
                  ) : (
                    recentUsers.map((u) => (
                      <div
                        key={u.email}
                        className={`${insetPanelClass} flex items-center justify-between px-3 py-2`}
                      >
                        <div>
                          <p className="text-slate-800">{u.name}</p>
                          <p className="text-[10px] text-slate-500">{u.email}</p>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide ${u.role === "provider"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
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
              <div className={`${panelClass} text-xs`}>
                <h2 className="font-semibold text-sm mb-3">System Status</h2>

                <div className="grid gap-2">
                  <div className={`${insetPanelClass} px-3 py-2 flex justify-between`}>
                    <span className="text-slate-500">API</span>
                    <span className="text-emerald-700 font-semibold">Operational</span>
                  </div>
                  <div className={`${insetPanelClass} px-3 py-2 flex justify-between`}>
                    <span className="text-slate-500">Payments</span>
                    <span className="text-blue-700 font-semibold">Sandbox</span>
                  </div>
                  <div className={`${insetPanelClass} px-3 py-2 flex justify-between`}>
                    <span className="text-slate-500">Monitoring</span>
                    <span className="text-amber-700 font-semibold">
                      {stats.fraudAlerts} Alerts
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className={`${panelClass} text-xs`}>
                <h2 className="font-semibold text-sm mb-3">Quick Actions</h2>
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => toast.success("Export report feature not connected yet")}
                    className="w-full px-4 py-2 rounded-2xl border border-white/60 bg-white/65 text-slate-700 shadow-sm transition-colors hover:bg-white"
                  >
                    Export Summary
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.success("Open providers page to review pending providers")}
                    className="w-full px-4 py-2 rounded-2xl bg-slate-950 text-white font-semibold shadow-lg shadow-slate-900/15 transition-colors hover:bg-blue-800"
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
