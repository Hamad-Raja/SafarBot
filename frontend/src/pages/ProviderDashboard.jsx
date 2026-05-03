import React, { useEffect, useMemo, useState } from "react";
import Api from '../api/api';
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const ProviderDashboard = () => {
  const [routes, setRoutes] = useState([]);

 const fetchRoutes = async () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem("safarbot_user") || "{}");
    const token = storedUser.token;

    const res = await Api.get("/api/routes/provider/my", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setRoutes(Array.isArray(res.data) ? res.data : []);
  } catch (err) {
    toast.error(err?.response?.data?.message || "Failed to load provider routes.");
  }
};
  useEffect(() => {
    fetchRoutes();
  }, []);

  const stats = useMemo(() => {
    const activeRoutes = routes.filter((r) => r.active).length;

    const todaySeats = routes
      .filter((r) => r.active)
      .reduce((sum, r) => sum + Number(r.totalSeats || r.seats || 0), 0);

    const estimatedRevenue = routes
      .filter((r) => r.active)
      .reduce((sum, r) => {
        const seats = Number(r.totalSeats || r.seats || 0);
        const fare = Number(r.fare || r.price || 0);
        return sum + seats * fare;
      }, 0);

    return {
      activeRoutes,
      totalRoutes: routes.length,
      todaySeats,
      estimatedRevenue,
    };
  }, [routes]);

  const upcomingDepartures = useMemo(() => {
    return routes
      .filter((r) => r.active)
      .slice(0, 5)
      .map((r) => ({
        id: r._id,
        route: `${r.fromCity || "Unknown"} → ${r.toCity || "Unknown"}`,
        time: r.departureTime || "N/A",
        seats: `${Number(r.availableSeats ?? r.totalSeats ?? r.seats ?? 0)} seats remaining`,
      }));
  }, [routes]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-10 text-white">
          {/* Header */}
          <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-cyan-500 p-[1px] shadow-xl mb-6">
            <div className="rounded-[1.4rem] bg-slate-950/90 px-6 py-5">
              <h1 className="text-2xl font-extrabold mb-1">
                Provider Dashboard
              </h1>
              <p className="text-xs text-slate-300 max-w-lg">
                Monitor routes, seat availability and daily operational performance.
              </p>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <StatCard label="Active Routes" value={stats.activeRoutes} />
            <StatCard label="Total Routes" value={stats.totalRoutes} />
            <StatCard label="Seats Available Today" value={stats.todaySeats} />
            <StatCard
              label="Est. Daily Revenue"
              value={`PKR ${stats.estimatedRevenue.toLocaleString()}`}
            />
          </div>

          {/* Upcoming departures */}
          <div className="bg-slate-900/80 rounded-3xl border border-white/10 p-5">
            <h2 className="text-sm font-semibold mb-3">
              Upcoming Departures
            </h2>

            <div className="space-y-3 text-xs">
              {upcomingDepartures.length === 0 ? (
                <p className="text-[11px] text-slate-400">
                  No upcoming departures found.
                </p>
              ) : (
                upcomingDepartures.map((d) => (
                  <Departure
                    key={d.id}
                    route={d.route}
                    time={d.time}
                    seats={d.seats}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div className="bg-slate-900/80 rounded-3xl border border-white/10 p-4">
    <p className="text-[11px] text-slate-400 mb-1">{label}</p>
    <p className="text-2xl font-extrabold">{value}</p>
  </div>
);

const Departure = ({ route, time, seats }) => (
  <div className="flex justify-between bg-slate-950/60 border border-white/10 rounded-2xl px-4 py-3">
    <div>
      <p className="text-slate-200 font-semibold">{route}</p>
      <p className="text-[11px] text-slate-400">Departure: {time}</p>
    </div>
    <span className="text-cyan-300 font-semibold text-[11px]">{seats}</span>
  </div>
);

export default ProviderDashboard;