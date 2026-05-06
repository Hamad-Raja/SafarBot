import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Search, TicketCheck } from "lucide-react";
import Api from "../api/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const getStatusStyles = (status = "") => {
  const normalized = String(status || "PENDING").toUpperCase();

  if (normalized === "CONFIRMED") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }

  if (normalized === "REVIEW") {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }

  if (normalized === "BLOCKED") {
    return "bg-red-50 text-red-700 border border-red-200";
  }

  if (normalized === "CANCELLED") {
    return "bg-slate-100 text-slate-600 border border-slate-200";
  }

  return "bg-blue-50 text-blue-700 border border-blue-200";
};

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

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
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pb-12 pt-10">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                <TicketCheck size={15} />
                Trips
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                My Bookings
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
                Review your confirmed trips, status updates, and fare details.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                Total: {loading ? "..." : bookings.length}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                Latest:{" "}
                {loading
                  ? "..."
                  : latestBookingDate
                  ? latestBookingDate.toLocaleDateString()
                  : "-"}
              </span>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-[1fr,auto] md:items-end">
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Search
              </label>
              <div className="relative mt-2">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-3.5 text-blue-700"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by route, operator, or status"
                  className="h-12 w-full rounded-[18px] border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                  filter === "all"
                    ? "border-blue-700 bg-blue-700 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                All
              </button>

              <button
                type="button"
                onClick={() => setFilter("recent")}
                className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                  filter === "recent"
                    ? "border-blue-700 bg-blue-700 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Recent 30 Days
              </button>
            </div>
          </div>

          <div className="mt-7">
            {loading ? (
              <p className="text-sm font-medium text-slate-500">
                Loading bookings...
              </p>
            ) : error ? (
              <div className="rounded-3xl border border-red-100 bg-red-50 p-5">
                <p className="text-sm font-bold text-red-700">
                  Unable to load bookings
                </p>
                <p className="mt-1 text-xs text-red-600">{error}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="text-sm font-bold text-slate-800">
                  No bookings found
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Try adjusting your search or filters.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((b) => {
                  const from = b?.from || b?.route?.fromCity || "-";
                  const to = b?.to || b?.route?.toCity || "-";
                  const operator = b?.operator || b?.route?.operator || "-";
                  const departure =
                    b?.departureTime || b?.route?.departureTime || "-";
                  const seats =
                    Array.isArray(b?.seats) && b.seats.length
                      ? b.seats.join(", ")
                      : "-";
                  const amount = Number(b?.totalAmount || 0).toLocaleString();
                  const createdAt = b?.createdAt ? new Date(b.createdAt) : null;
                  const status = String(b?.status || "PENDING").toUpperCase();

                  return (
                    <article
                      key={b?._id || `${from}-${to}-${b?.createdAt || "booking"}`}
                      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-base font-extrabold text-slate-950">
                            {from} to {to}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {operator} | Departure:{" "}
                            <span className="text-slate-800">{departure}</span>
                          </p>
                        </div>

                        <div className="sm:text-right">
                          <p className="text-lg font-extrabold text-blue-700">
                            PKR {amount}
                          </p>
                          <span
                            className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold ${getStatusStyles(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                          Seats:{" "}
                          <span className="font-bold text-slate-900">{seats}</span>
                        </div>

                        <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                          <CalendarDays size={14} className="text-blue-700" />
                          <span>
                            {createdAt && !isNaN(createdAt.getTime())
                              ? `${createdAt.toLocaleDateString()} ${createdAt.toLocaleTimeString()}`
                              : "-"}
                          </span>
                        </div>
                      </div>

                      {status === "REVIEW" && (
                        <p className="mt-3 text-xs font-medium text-amber-700">
                          This booking is under review by fraud checks.
                        </p>
                      )}

                      {status === "BLOCKED" && (
                        <p className="mt-3 text-xs font-medium text-red-700">
                          This booking was blocked for safety review.
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MyBookingsPage;
