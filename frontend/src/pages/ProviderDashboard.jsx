import React, { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const ProviderDashboard = () => {
  const [routes] = useState([
    { id: "FM-ISB-LHR", active: true, seats: 40, fare: 2500 },
    { id: "FM-LHR-KHI", active: true, seats: 40, fare: 6500 },
    { id: "FM-LHR-MLT", active: false, seats: 40, fare: 2200 },
  ]);

  const stats = useMemo(() => {
    const activeRoutes = routes.filter((r) => r.active).length;
    return {
      activeRoutes,
      totalRoutes: routes.length,
      todaySeats: activeRoutes * 40,
      estimatedRevenue: activeRoutes * 40 * 2500,
    };
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
              <Departure
                route="Islamabad → Lahore"
                time="09:00 AM"
                seats="12 seats remaining"
              />
              <Departure
                route="Lahore → Karachi"
                time="07:30 PM"
                seats="5 seats remaining"
              />
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
    <span className="text-cyan-300 font-semibold text-[11px]">
      {seats}
    </span>
  </div>
);

export default ProviderDashboard;
