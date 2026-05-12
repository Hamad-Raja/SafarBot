import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Api from '../api/api';
import { toast } from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const AdminReportsPage = () => {
  const [range, setRange] = useState("6m");
  const [revenueData, setRevenueData] = useState([]);
  const [bookingsData, setBookingsData] = useState([]);

  const fetchReports = async () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem("safarbot_user") || "{}");
    const token = storedUser.token;

    const res = await Api.get(`/api/admin/reports?range=${range}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setRevenueData(Array.isArray(res.data?.revenue) ? res.data.revenue : []);
    setBookingsData(Array.isArray(res.data?.routes) ? res.data.routes : []);
  } catch (e) {
    toast.error(e?.response?.data?.message || "Failed to load reports");
  }
};

  useEffect(() => {
    fetchReports();
  }, [range]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-500 via-blue-50 to-white text-slate-950">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl font-extrabold">Reports &amp; Analytics</h1>
              <p className="text-xs text-slate-600">
                Revenue trends and route performance.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-slate-950 shadow-sm shadow-blue-900/5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="6m">Last 6 months</option>
                <option value="12m">Last 12 months</option>
              </select>

              <button
                type="button"
                onClick={() => toast.success("Export feature not connected")}
                className="px-4 py-2 rounded-2xl border border-white/60 bg-white/70 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-white"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[2rem] border border-white/55 bg-white/55 p-4 shadow-xl shadow-blue-900/10 ring-1 ring-white/30 backdrop-blur-2xl">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Revenue Trend (PKR)</h2>
                <span className="text-[11px] text-slate-500">Range: {range}</span>
              </div>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={revenueData}
                    margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #bfdbfe",
                        fontSize: 10,
                      }}
                      labelStyle={{ color: "#0f172a" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#1d4ed8"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/55 bg-white/55 p-4 shadow-xl shadow-blue-900/10 ring-1 ring-white/30 backdrop-blur-2xl">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Bookings by Route</h2>
                <span className="text-[11px] text-slate-500">Range: {range}</span>
              </div>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={bookingsData}
                    margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="route" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #bbf7d0",
                        fontSize: 10,
                      }}
                      labelStyle={{ color: "#0f172a" }}
                    />
                    <Bar dataKey="bookings" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[2rem] border border-white/55 bg-white/55 p-5 shadow-xl shadow-blue-900/10 ring-1 ring-white/30 backdrop-blur-2xl text-xs text-slate-700">
            <p className="font-semibold text-slate-900 mb-1">Notes</p>
            <p className="text-slate-600">
              Charts are generated from real booking and revenue data.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminReportsPage;
