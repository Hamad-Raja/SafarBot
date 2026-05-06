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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-white text-slate-950">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-10">
          {/* Header */}
          <div className="mb-6 overflow-hidden rounded-[2rem] border border-white/55 bg-white/45 px-6 py-5 shadow-2xl shadow-blue-900/10 ring-1 ring-white/35 backdrop-blur-2xl">
            <div>
              <h1 className="text-2xl font-extrabold mb-1">
                Provider Dashboard
              </h1>
              <p className="text-xs text-slate-600 max-w-lg">
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
          <div className="rounded-[2rem] border border-white/55 bg-white/55 p-5 shadow-xl shadow-blue-900/10 ring-1 ring-white/30 backdrop-blur-2xl">
            <h2 className="text-sm font-semibold mb-3">
              Upcoming Departures
            </h2>

            <div className="space-y-3 text-xs">
              {upcomingDepartures.length === 0 ? (
                <p className="text-[11px] text-slate-500">
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
  <div className="rounded-[1.5rem] border border-white/55 bg-white/55 p-4 shadow-lg shadow-blue-900/10 ring-1 ring-white/30 backdrop-blur-2xl">
    <p className="text-[11px] text-slate-500 mb-1">{label}</p>
    <p className="text-2xl font-extrabold text-slate-950">{value}</p>
  </div>
);

const Departure = ({ route, time, seats }) => (
  <div className="flex justify-between rounded-2xl border border-white/60 bg-white/60 px-4 py-3 shadow-sm shadow-blue-900/5 backdrop-blur-xl">
    <div>
      <p className="text-slate-900 font-semibold">{route}</p>
      <p className="text-[11px] text-slate-500">Departure: {time}</p>
    </div>
    <span className="text-blue-700 font-semibold text-[11px]">{seats}</span>
  </div>
);

export default ProviderDashboard;
