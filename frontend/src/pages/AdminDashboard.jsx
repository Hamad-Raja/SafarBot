import React, { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {toast } from "react-hot-toast"

const AdminDashboard = () => {
  const [range, setRange] = useState("month"); // today | week | month

  const stats = useMemo(
    () => ({
      totalBookings: 182,
      totalRevenue: 542000,
      activeUsers: 119,
      successRate: 97,
      fraudAlerts: 3,
      pendingProviders: 1,
    }),
    []
  );

  const topRoutes = useMemo(
    () => [
      { route: "Islamabad → Lahore", bookings: 68, revenue: 170000 },
      { route: "Lahore → Karachi", bookings: 41, revenue: 190000 },
      { route: "Rawalpindi → Karachi", bookings: 27, revenue: 120000 },
      { route: "Islamabad → Faisalabad", bookings: 22, revenue: 62000 },
    ],
    []
  );

  const recentBookings = useMemo(
    () => [
      {
        id: 1,
        route: "Islamabad → Faisalabad",
        operator: "Faisal Movers",
        amount: 3200,
        seats: "A-03, A-04",
        time: "Today • 10:45 AM",
        status: "confirmed",
      },
      {
        id: 2,
        route: "Lahore → Multan",
        operator: "Daewoo Express",
        amount: 2800,
        seats: "B-12",
        time: "Yesterday • 06:20 PM",
        status: "confirmed",
      },
      {
        id: 3,
        route: "Rawalpindi → Karachi",
        operator: "Skyways",
        amount: 6800,
        seats: "C-07",
        time: "Yesterday • 03:10 PM",
        status: "pending",
      },
    ],
    []
  );

  const recentUsers = useMemo(
    () => [
      { name: "Ali Khan", email: "ali@example.com", role: "user" },
      { name: "Ayesha Noor", email: "ayesha@example.com", role: "user" },
      { name: "Bus Provider", email: "provider@safarbot.com", role: "provider" },
    ],
    []
  );

  const badge = (status) => {
    if (status === "confirmed")
      return "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30";
    if (status === "pending")
      return "bg-amber-500/15 text-amber-300 border border-amber-400/30";
    return "bg-red-500/15 text-red-300 border border-red-400/30";
  };

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
                  (Demo analytics with dummy data)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-white/10 text-[11px] text-slate-200">
                  Role: ADMIN
                </span>

                {/* Range tabs */}
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
                PKR {stats.totalRevenue.toLocaleString()}
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
                {topRoutes.map((r) => (
                  <div key={r.route}>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-200">{r.route}</span>
                      <span className="text-cyan-300 font-semibold">
                        PKR {r.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                        style={{
                          width: `${Math.min(
                            100,
                            (r.bookings / stats.totalBookings) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>{r.bookings} bookings</span>
                      <span>
                        Share: {Math.round((r.bookings / stats.totalBookings) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent bookings */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Recent Bookings</h3>
                  <span className="text-[11px] text-slate-400">Latest activity</span>
                </div>

                <div className="space-y-2">
                  {recentBookings.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-slate-200 text-[11px] font-semibold">
                          {b.route}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {b.operator} • Seats: {b.seats} • {b.time}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-cyan-300 text-[11px] font-semibold">
                          PKR {b.amount.toLocaleString()}
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
                  ))}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Recent users */}
              <div className="bg-slate-900/80 rounded-3xl border border-white/10 p-5 shadow-lg shadow-emerald-500/10 text-xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm">Recent Users</h2>
                  <span className="text-[11px] text-slate-400">Demo</span>
                </div>

                <div className="space-y-3">
                  {recentUsers.map((u) => (
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
                  ))}
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
                    onClick={() => toast.success("Demo: Export report")}
                    className="w-full px-4 py-2 rounded-2xl bg-slate-950/60 border border-white/10 text-slate-200 hover:bg-slate-950 transition-colors"
                  >
                    Export Summary (Demo)
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.success("Demo: Review pending providers")}
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

      <Footer />
    </div>
  );
};

export default AdminDashboard;
