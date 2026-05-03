import React, { useEffect, useMemo, useState } from "react";
import Api from "../api/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const getStatusStyles = (status = "") => {
  const normalized = String(status || "PENDING").toUpperCase();

  if (normalized === "CONFIRMED") {
    return "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30";
  }

  if (normalized === "REVIEW") {
    return "bg-amber-500/15 text-amber-300 border border-amber-400/30";
  }

  if (normalized === "BLOCKED") {
    return "bg-red-500/15 text-red-300 border border-red-400/30";
  }

  if (normalized === "CANCELLED") {
    return "bg-slate-500/15 text-slate-300 border border-slate-400/30";
  }

  return "bg-cyan-500/15 text-cyan-300 border border-cyan-400/30";
};

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | recent

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await Api.get("/api/bookings/my");
        setBookings(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        setBookings([]);
        setError(err?.response?.data?.message || "Unable to load bookings.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const latestBookingDate = useMemo(() => {
    if (!bookings?.length) return null;

    const sorted = [...bookings].filter(Boolean).sort((a, b) => {
      const da = new Date(a?.createdAt || 0).getTime();
      const db = new Date(b?.createdAt || 0).getTime();
      return db - da;
    });

    const dt = sorted[0]?.createdAt ? new Date(sorted[0].createdAt) : null;
    return dt && !isNaN(dt.getTime()) ? dt : null;
  }, [bookings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const byQuery = (b) => {
      const from = String(b?.from || "").toLowerCase();
      const to = String(b?.to || "").toLowerCase();
      const operator = String(b?.operator || "").toLowerCase();
      const status = String(b?.status || "").toLowerCase();

      return (
        !q ||
        from.includes(q) ||
        to.includes(q) ||
        operator.includes(q) ||
        status.includes(q)
      );
    };

    const byRecent = (b) => {
      if (filter !== "recent") return true;
      const created = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return created >= thirtyDaysAgo;
    };

    return (bookings || []).filter((b) => byQuery(b) && byRecent(b));
  }, [bookings, query, filter]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-12 text-white">
          <div className="mb-6">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold text-cyan-300 uppercase tracking-[0.2em]">
              <span className="h-px w-6 bg-cyan-400" />
              Trips
            </p>

            <div className="mt-3 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  My Bookings
                </h1>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  View your confirmed trips, booking details, and history in one place.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] bg-white/5 border border-white/10 text-slate-200">
                  Total:{" "}
                  <span className="text-cyan-300 font-semibold">
                    {loading ? "…" : bookings.length}
                  </span>
                </span>

                <span className="px-3 py-1 rounded-full text-[11px] bg-white/5 border border-white/10 text-slate-200">
                  Latest:{" "}
                  <span className="text-slate-300 font-semibold">
                    {loading
                      ? "…"
                      : latestBookingDate
                      ? latestBookingDate.toLocaleDateString()
                      : "—"}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 rounded-3xl border border-white/10 shadow-lg shadow-emerald-500/20 p-4 sm:p-6">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex-1">
                <label className="text-[11px] font-semibold text-slate-200">
                  Search
                </label>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by route, operator, or status"
                  className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/80 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                    filter === "all"
                      ? "bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 border-transparent"
                      : "border-white/10 text-slate-300 hover:bg-white/5"
                  }`}
                >
                  All
                </button>

                <button
                  type="button"
                  onClick={() => setFilter("recent")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                    filter === "recent"
                      ? "bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 border-transparent"
                      : "border-white/10 text-slate-300 hover:bg-white/5"
                  }`}
                >
                  Recent 30 Days
                </button>
              </div>
            </div>

            <div className="mt-6">
              {loading ? (
                <p className="text-xs text-slate-400">Loading bookings...</p>
              ) : error ? (
                <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-5">
                  <p className="text-sm text-red-200 font-semibold">
                    Unable to load bookings
                  </p>
                  <p className="text-xs text-red-300/80 mt-1">{error}</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl bg-slate-950/60 border border-white/10 p-5">
                  <p className="text-sm text-slate-300 font-semibold">
                    No bookings found
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try adjusting your search or filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {filtered.map((b) => {
                    const from = b?.from || b?.route?.fromCity || "—";
                    const to = b?.to || b?.route?.toCity || "—";
                    const operator = b?.operator || b?.route?.operator || "—";
                    const departure =
                      b?.departureTime || b?.route?.departureTime || "—";
                    const seats =
                      Array.isArray(b?.seats) && b.seats.length
                        ? b.seats.join(", ")
                        : "—";
                    const amount = Number(b?.totalAmount || 0).toLocaleString();
                    const createdAt = b?.createdAt ? new Date(b.createdAt) : null;
                    const status = String(b?.status || "PENDING").toUpperCase();

                    return (
                      <div
                        key={b?._id || `${from}-${to}-${b?.createdAt || "booking"}`}
                        className="rounded-3xl bg-slate-950/60 border border-white/10 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-100">
                              {from} <span className="text-slate-500">→</span> {to}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              {operator} • Departure:{" "}
                              <span className="text-slate-300 font-semibold">
                                {departure}
                              </span>
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-cyan-300 font-extrabold text-sm">
                              PKR {amount}
                            </p>
                            <span
                              className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusStyles(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2 text-[11px] text-slate-400">
                          <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2">
                            <span className="text-slate-500">Seats:</span>{" "}
                            <span className="text-slate-200 font-semibold">
                              {seats}
                            </span>
                          </div>

                          <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2">
                            <span className="text-slate-500">Booked on:</span>{" "}
                            <span className="text-slate-200 font-semibold">
                              {createdAt && !isNaN(createdAt.getTime())
                                ? `${createdAt.toLocaleDateString()} • ${createdAt.toLocaleTimeString()}`
                                : "—"}
                            </span>
                          </div>
                        </div>

                        {status === "REVIEW" && (
                          <p className="mt-3 text-[11px] text-amber-300">
                            This booking is under review by fraud checks.
                          </p>
                        )}

                        {status === "BLOCKED" && (
                          <p className="mt-3 text-[11px] text-red-300">
                            This booking was blocked for safety review.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyBookingsPage;