import React, { useEffect, useMemo, useState } from "react";
import Api from '../api/api';
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RouteInsightsModal from "../components/RouteInsightsModal";

/**
 * ProviderRoutesPage (DB Connected)
 * ✅ Fetch routes from MongoDB (Node API)
 * ✅ Add route -> POST /api/routes
 * ✅ Pause/Activate -> PATCH /api/routes/:id
 * ✅ Remove -> DELETE /api/routes/:id
 * ✅ Check delay insights -> GET /api/insights/route/:id
 * ✅ Send manual delay alert -> POST /api/insights/route/:id/send-alert
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
    travelDate: "",
    operator: "",
    busName: "",
  });

  const [query, setQuery] = useState("");

  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [modalRoute, setModalRoute] = useState(null);
  const [insightsByRoute, setInsightsByRoute] = useState({});
  const [insightsLoadingRouteId, setInsightsLoadingRouteId] = useState(null);
  const [sendingAlertRouteId, setSendingAlertRouteId] = useState(null);
  const [alertResultsByRoute, setAlertResultsByRoute] = useState({});

  

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const res = await Api.get(`/api/routes/provider/my`, {
        timeout: 20000,
      });
      setRoutes(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to fetch routes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
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
        travelDate: form.travelDate?.trim() || "",
        operator: form.operator?.trim() || "",
        busName: form.busName?.trim() || "",
      };

      const res = await Api.post(`/api/routes`, payload, {
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
      const res = await Api.patch(
        `/api/routes/${id}`,
        { active: !currentActive },
        { timeout: 20000 }
      );

      setRoutes((prev) => prev.map((r) => (r._id === id ? res.data : r)));
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
      await Api.delete(`/api/routes/${id}`, { timeout: 20000 });
      setRoutes((prev) => prev.filter((r) => r._id !== id));

      setInsightsByRoute((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      setAlertResultsByRoute((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      if (selectedRouteId === id) {
        setSelectedRouteId(null);
      }

      if (modalRoute?._id === id) {
        setModalRoute(null);
      }

      toast.success("Route removed!");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to remove route.");
    } finally {
      setLoading(false);
    }
  };

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
        { timeout: 30000 }
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-500 via-blue-50 to-white text-slate-950">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
            <div>
              <h1 className="text-xl font-extrabold">Routes Management</h1>
              <p className="text-xs text-slate-600">
                Add routes, control availability, manage pricing & capacity, and
                review delay insights.
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {loading ? "Loading..." : `${routes.length} total route(s)`}
              </p>
            </div>

            <div className="w-full sm:w-72">
              <label className="text-[11px] font-semibold text-slate-700">
                Search routes
              </label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., islamabad lahore 09:00"
                className="mt-1 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 shadow-sm shadow-blue-900/5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.25fr,0.75fr]">
            <div className="rounded-[2rem] border border-white/55 bg-white/55 p-5 shadow-xl shadow-blue-900/10 ring-1 ring-white/30 backdrop-blur-2xl">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Your Routes</h2>
                <span className="text-[11px] text-slate-500">
                  {filtered.length} route(s)
                </span>
              </div>

              {filtered.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No routes found. Try a different search.
                </p>
              ) : (
                <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                  {filtered.map((r) => {
                    const insightsLoading = insightsLoadingRouteId === r._id;
                    const isModalOpen = modalRoute?._id === r._id;

                    return (
                      <div
                        key={r._id}
                        className="rounded-2xl border border-white/60 bg-white/65 px-4 py-3 shadow-sm shadow-blue-900/5 backdrop-blur-xl"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="text-slate-900 font-semibold">
                              {r.fromCity} → {r.toCity}
                            </p>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              Departure: {r.departureTime} • Seats:{" "}
                              {r.availableSeats} • Fare:
                              <span className="text-blue-700 font-semibold">
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

                          <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] border ${
                                r.active
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              {r.active ? "Active" : "Paused"}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleCheckInsights(r)}
                              disabled={loading || insightsLoading}
                              className="px-3 py-1 rounded-full text-[10px] font-semibold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                            >
                              {insightsLoading
                                ? "Loading..."
                                : isModalOpen
                                ? "Close Insights"
                                : "Check Insights"}
                            </button>

                            <button
                              type="button"
                              onClick={() => toggle(r._id, r.active)}
                              disabled={loading}
                              className="px-3 py-1 rounded-full text-[10px] font-semibold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                            >
                              {r.active ? "Pause" : "Activate"}
                            </button>

                            <button
                              type="button"
                              onClick={() => remove(r._id)}
                              disabled={loading}
                              className="px-3 py-1 rounded-full text-[10px] font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={fetchRoutes}
                  disabled={loading}
                  className="px-4 py-2 rounded-2xl border border-white/60 bg-white/65 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-white disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/55 bg-white/55 p-5 shadow-xl shadow-blue-900/10 ring-1 ring-white/30 backdrop-blur-2xl">
              <h2 className="text-sm font-semibold mb-1">Add New Route</h2>
              <p className="text-[11px] text-slate-500 mb-4">
                Create a route with one departure.
              </p>

              <form onSubmit={addRoute} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">
                      From
                    </label>
                    <input
                      name="from"
                      value={form.from}
                      onChange={handleChange}
                      placeholder="Islamabad"
                      className="mt-1 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 shadow-sm shadow-blue-900/5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">
                      To
                    </label>
                    <input
                      name="to"
                      value={form.to}
                      onChange={handleChange}
                      placeholder="Lahore"
                      className="mt-1 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 shadow-sm shadow-blue-900/5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700">
                    Departure Time
                  </label>
                  <input
                    name="departure"
                    value={form.departure}
                    onChange={handleChange}
                    placeholder="09:00 AM"
                    className="mt-1 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 shadow-sm shadow-blue-900/5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">
                      Fare (PKR)
                    </label>
                    <input
                      name="fare"
                      value={form.fare}
                      onChange={handleChange}
                      type="number"
                      min="1"
                      placeholder="2500"
                      className="mt-1 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 shadow-sm shadow-blue-900/5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">
                      Seats
                    </label>
                    <input
                      name="seats"
                      value={form.seats}
                      onChange={handleChange}
                      type="number"
                      min="1"
                      placeholder="40"
                      className="mt-1 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 shadow-sm shadow-blue-900/5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">
                      Travel Date (optional)
                    </label>
                    <input
                      name="travelDate"
                      value={form.travelDate}
                      onChange={handleChange}
                      type="date"
                      className="mt-1 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 shadow-sm shadow-blue-900/5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">
                      Operator (optional)
                    </label>
                    <input
                      name="operator"
                      value={form.operator}
                      onChange={handleChange}
                      placeholder="Faisal Movers"
                      className="mt-1 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 shadow-sm shadow-blue-900/5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700">
                    Bus Name (optional)
                  </label>
                  <input
                    name="busName"
                    value={form.busName}
                    onChange={handleChange}
                    placeholder="FM Luxury"
                    className="mt-1 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 shadow-sm shadow-blue-900/5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 rounded-2xl bg-slate-950 py-2.5 font-semibold text-white shadow-lg shadow-slate-900/15 transition-colors hover:bg-blue-800 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Add Route"}
                </button>
              </form>

              <p className="mt-3 text-[10px] text-slate-500">
                Tip: Delay alerts will be sent manually after checking AI
                insights.
              </p>
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

export default ProviderRoutesPage;
