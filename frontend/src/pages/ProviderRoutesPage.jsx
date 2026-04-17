import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/**
 * ProviderRoutesPage (DB Connected)
 * ✅ Fetch routes from MongoDB (Node API)
 * ✅ Add route -> POST /api/routes
 * ✅ Pause/Activate -> PATCH /api/routes/:id
 * ✅ Remove -> DELETE /api/routes/:id
 *
 * Mapping:
 * UI from -> fromCity
 * UI to -> toCity
 * UI departure -> departureTime
 * UI fare -> price
 * UI seats -> availableSeats
 * UI active -> active
 */
const ProviderRoutesPage = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    from: "",
    to: "",
    departure: "",
    fare: "",
    seats: "",
    travelDate: "", // optional (YYYY-MM-DD)
    operator: "",   // optional
    busName: "",    // optional
  });

  const [query, setQuery] = useState("");

  // ✅ IMPORTANT: set your backend base url
  // If you have proxy in frontend package.json then keep empty string.
  // If not, set to "http://localhost:5001"
  const API_BASE = ""; // or "http://localhost:5001"

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/routes`, { timeout: 20000 });
      setRoutes(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to fetch routes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
    // eslint-disable-next-line
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return routes;

    return routes.filter((r) => {
      const from = (r.fromCity || "").toLowerCase();
      const to = (r.toCity || "").toLowerCase();
      const dep = (r.departureTime || "").toLowerCase();
      const date = (r.travelDate || "").toLowerCase();
      const op = (r.operator || "").toLowerCase();
      return `${from} ${to} ${dep} ${date} ${op}`.includes(q);
    });
  }, [routes, query]);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const addRoute = async (e) => {
    e.preventDefault();

    const fromCity = form.from.trim();
    const toCity = form.to.trim();
    const departureTime = form.departure.trim();
    const price = Number(form.fare);
    const availableSeats = Number(form.seats);

    if (!fromCity || !toCity || !departureTime || !price || !availableSeats) {
      toast.error("Please fill From, To, Departure, Fare and Seats.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        fromCity,
        toCity,
        departureTime,
        price,
        availableSeats,
        active: true,

        // optional
        travelDate: form.travelDate?.trim() || "",
        operator: form.operator?.trim() || "",
        busName: form.busName?.trim() || "",
      };

      const res = await axios.post(`${API_BASE}/api/routes`, payload, {
        timeout: 20000,
      });

      toast.success("Route added!");
      setRoutes((prev) => [res.data, ...prev]);

      setForm({
        from: "",
        to: "",
        departure: "",
        fare: "",
        seats: "",
        travelDate: "",
        operator: "",
        busName: "",
      });
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Failed to add route.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = async (id, currentActive) => {
    try {
      setLoading(true);
      const res = await axios.patch(
        `${API_BASE}/api/routes/${id}`,
        { active: !currentActive },
        { timeout: 20000 }
      );

      setRoutes((prev) =>
        prev.map((r) => (r._id === id ? res.data : r))
      );

      toast.success(!currentActive ? "Route activated!" : "Route paused!");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update route.");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/api/routes/${id}`, { timeout: 20000 });
      setRoutes((prev) => prev.filter((r) => r._id !== id));
      toast.success("Route removed!");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to remove route.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-12 text-white">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
            <div>
              <h1 className="text-xl font-extrabold">Routes Management</h1>
              <p className="text-xs text-slate-400">
                Add routes, control availability, and manage pricing & capacity.
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {loading ? "Loading..." : `${routes.length} total route(s)`}
              </p>
            </div>

            <div className="w-full sm:w-72">
              <label className="text-[11px] font-semibold text-slate-300">
                Search routes
              </label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., islamabad lahore 09:00"
                className="mt-1 w-full rounded-2xl bg-slate-900/70 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.25fr,0.75fr]">
            {/* LIST */}
            <div className="bg-slate-900/80 rounded-3xl border border-white/10 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Your Routes</h2>
                <span className="text-[11px] text-slate-400">
                  {filtered.length} route(s)
                </span>
              </div>

              {filtered.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No routes found. Try a different search.
                </p>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {filtered.map((r) => (
                    <div
                      key={r._id}
                      className="bg-slate-950/60 rounded-2xl border border-white/10 px-4 py-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="text-slate-100 font-semibold">
                            {r.fromCity} → {r.toCity}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Departure: {r.departureTime} • Seats: {r.availableSeats} • Fare:
                            <span className="text-cyan-300 font-semibold">
                              {" "}
                              PKR {Number(r.price).toLocaleString()}
                            </span>
                            {r.travelDate ? (
                              <span className="ml-2 text-slate-500">
                                • Date: {r.travelDate}
                              </span>
                            ) : null}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Route ID: {r.routeId || r._id}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 justify-between sm:justify-end">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] border ${
                              r.active
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                                : "bg-slate-800 text-slate-300 border-slate-600/60"
                            }`}
                          >
                            {r.active ? "Active" : "Paused"}
                          </span>

                          <button
                            type="button"
                            onClick={() => toggle(r._id, r.active)}
                            disabled={loading}
                            className="px-3 py-1 rounded-full text-[10px] font-semibold border border-cyan-400/50 text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50"
                          >
                            {r.active ? "Pause" : "Activate"}
                          </button>

                          <button
                            type="button"
                            onClick={() => remove(r._id)}
                            disabled={loading}
                            className="px-3 py-1 rounded-full text-[10px] font-semibold border border-red-400/60 text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={fetchRoutes}
                  disabled={loading}
                  className="px-4 py-2 rounded-2xl bg-slate-950/70 border border-white/10 text-xs text-slate-200 hover:bg-slate-950 disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* ADD ROUTE */}
            <div className="bg-slate-900/80 rounded-3xl border border-white/10 p-5">
              <h2 className="text-sm font-semibold mb-1">Add New Route</h2>
              <p className="text-[11px] text-slate-400 mb-4">
                Create a route with one departure.
              </p>

              <form onSubmit={addRoute} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-200">
                      From
                    </label>
                    <input
                      name="from"
                      value={form.from}
                      onChange={handleChange}
                      placeholder="Islamabad"
                      className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-200">
                      To
                    </label>
                    <input
                      name="to"
                      value={form.to}
                      onChange={handleChange}
                      placeholder="Lahore"
                      className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-200">
                    Departure Time
                  </label>
                  <input
                    name="departure"
                    value={form.departure}
                    onChange={handleChange}
                    placeholder="09:00 AM"
                    className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-200">
                      Fare (PKR)
                    </label>
                    <input
                      name="fare"
                      value={form.fare}
                      onChange={handleChange}
                      type="number"
                      min="1"
                      placeholder="2500"
                      className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-200">
                      Seats
                    </label>
                    <input
                      name="seats"
                      value={form.seats}
                      onChange={handleChange}
                      type="number"
                      min="1"
                      placeholder="40"
                      className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
                    />
                  </div>
                </div>

                {/* Optional fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-200">
                      Travel Date (optional)
                    </label>
                    <input
                      name="travelDate"
                      value={form.travelDate}
                      onChange={handleChange}
                      type="date"
                      className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-200">
                      Operator (optional)
                    </label>
                    <input
                      name="operator"
                      value={form.operator}
                      onChange={handleChange}
                      placeholder="Faisal Movers"
                      className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-200">
                    Bus Name (optional)
                  </label>
                  <input
                    name="busName"
                    value={form.busName}
                    onChange={handleChange}
                    placeholder="FM Luxury"
                    className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-semibold rounded-2xl py-2.5 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-shadow disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Add Route"}
                </button>
              </form>

              <p className="mt-3 text-[10px] text-slate-500">
                Tip: In production, protect these endpoints with Provider auth.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProviderRoutesPage;