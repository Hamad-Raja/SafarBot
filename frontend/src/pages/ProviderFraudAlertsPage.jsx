import React, { useEffect, useMemo, useState } from "react";
import API from "../api/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


const defaultStats = {
  totalAlerts: 0,
  pendingReviews: 0,
  fraudMarked: 0,
  legitMarked: 0,
  blockedAlerts: 0,
  reviewAlerts: 0,
  highRiskAlerts: 0,
  mediumRiskAlerts: 0,
  lowRiskAlerts: 0,
  topReasons: [],
};

const ProviderFraudAlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewingId, setReviewingId] = useState("");
  const [reviewForms, setReviewForms] = useState({});

  const token = useMemo(() => {
    const directToken = localStorage.getItem("token");
    if (directToken) return directToken;

    try {
      const rawUser = localStorage.getItem("safarbot_user");
      if (!rawUser) return "";

      const parsedUser = JSON.parse(rawUser);
      return parsedUser?.token || "";
    } catch (err) {
      console.error("Unable to parse stored user:", err);
      return "";
    }
  }, []);

  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const fetchAlerts = async () => {
    const [alertsRes, statsRes] = await Promise.all([
      API.get(`/api/fraud-alerts/provider`, {
        headers: authHeaders,
      }),
      API.get(`/api/fraud-alerts/provider/stats`, {
        headers: authHeaders,
      }),
    ]);

    const alertData = Array.isArray(alertsRes.data) ? alertsRes.data : [];
    setAlerts(alertData);
    setStats(statsRes?.data || defaultStats);

    const initialForms = {};
    alertData.forEach((a) => {
      initialForms[a._id] = {
        reviewOutcome: a?.reviewOutcome || "PENDING",
        reviewNotes: a?.reviewNotes || "",
      };
    });
    setReviewForms(initialForms);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        if (!token) {
          setAlerts([]);
          setStats(defaultStats);
          setError("You are not logged in.");
          return;
        }

        await fetchAlerts();
      } catch (e) {
        console.error("Failed to fetch fraud alerts:", e);
        setAlerts([]);
        setStats(defaultStats);
        setError(e?.response?.data?.message || "Unable to load fraud alerts.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const updateReviewForm = (id, field, value) => {
    setReviewForms((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { reviewOutcome: "PENDING", reviewNotes: "" }),
        [field]: value,
      },
    }));
  };

  const submitReview = async (id) => {
    try {
      setReviewingId(id);
      setError("");

      const form = reviewForms[id] || {
        reviewOutcome: "PENDING",
        reviewNotes: "",
      };

      const res = await API.patch(
        `/api/fraud-alerts/${id}/review`,
        {
          reviewOutcome: form.reviewOutcome,
          reviewNotes: form.reviewNotes,
        },
        {
          headers: authHeaders,
        }
      );

      const updatedAlert = res.data;

      setAlerts((prev) => prev.map((a) => (a._id === id ? updatedAlert : a)));

      setReviewForms((prev) => ({
        ...prev,
        [id]: {
          reviewOutcome: updatedAlert?.reviewOutcome || "PENDING",
          reviewNotes: updatedAlert?.reviewNotes || "",
        },
      }));

      try {
        const statsRes = await API.get(
          `/api/fraud-alerts/provider/stats`,
          {
            headers: authHeaders,
          }
        );
        setStats(statsRes?.data || defaultStats);
      } catch (statsError) {
        console.error("Failed to refresh stats:", statsError);
      }
    } catch (e) {
      console.error("Failed to submit review:", e);
      setError(e?.response?.data?.message || "Unable to update fraud alert.");
    } finally {
      setReviewingId("");
    }
  };

  const severityFromScore = (score) => {
    const numericScore = Number(score || 0);

    if (numericScore >= 70) return "high";
    if (numericScore >= 40) return "medium";
    return "low";
  };

  const outcomeBadgeClass = (outcome = "PENDING") => {
    const normalized = String(outcome).toUpperCase();

    if (normalized === "FRAUD") {
      return "bg-red-50 text-red-700 border border-red-200";
    }

    if (normalized === "LEGIT") {
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    }

    return "bg-amber-50 text-amber-700 border border-amber-200";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-500 via-blue-50 to-white text-slate-950">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 pt-8 pb-12">
          <h1 className="text-xl font-extrabold mb-1">Risk & Alerts</h1>
          <p className="text-xs text-slate-600 mb-4">
            Automated alerts generated from booking behavior.
          </p>

          {!loading && !error && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="rounded-2xl border border-white/55 bg-white/60 p-4 shadow-lg shadow-blue-900/10 ring-1 ring-white/30 backdrop-blur-2xl">
                  <p className="text-[11px] text-slate-500">Total Alerts</p>
                  <p className="mt-1 text-xl font-extrabold text-slate-950">
                    {stats.totalAlerts}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/55 bg-white/60 p-4 shadow-lg shadow-blue-900/10 ring-1 ring-white/30 backdrop-blur-2xl">
                  <p className="text-[11px] text-slate-500">Pending Reviews</p>
                  <p className="mt-1 text-xl font-extrabold text-amber-700">
                    {stats.pendingReviews}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/55 bg-white/60 p-4 shadow-lg shadow-blue-900/10 ring-1 ring-white/30 backdrop-blur-2xl">
                  <p className="text-[11px] text-slate-500">Fraud Marked</p>
                  <p className="mt-1 text-xl font-extrabold text-red-700">
                    {stats.fraudMarked}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/55 bg-white/60 p-4 shadow-lg shadow-blue-900/10 ring-1 ring-white/30 backdrop-blur-2xl">
                  <p className="text-[11px] text-slate-500">Legit Marked</p>
                  <p className="mt-1 text-xl font-extrabold text-emerald-700">
                    {stats.legitMarked}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="rounded-2xl border border-white/55 bg-white/60 p-4 shadow-lg shadow-blue-900/10 ring-1 ring-white/30 backdrop-blur-2xl">
                  <p className="text-[11px] text-slate-500 mb-3">Risk Breakdown</p>
                  <div className="space-y-2 text-[12px]">
                    <div className="flex justify-between text-red-700">
                      <span>High Risk</span>
                      <span>{stats.highRiskAlerts}</span>
                    </div>
                    <div className="flex justify-between text-amber-700">
                      <span>Medium Risk</span>
                      <span>{stats.mediumRiskAlerts}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>Low Risk</span>
                      <span>{stats.lowRiskAlerts}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/55 bg-white/60 p-4 shadow-lg shadow-blue-900/10 ring-1 ring-white/30 backdrop-blur-2xl">
                  <p className="text-[11px] text-slate-500 mb-3">Top Reasons</p>
                  {stats.topReasons?.length ? (
                    <div className="space-y-2 text-[12px]">
                      {stats.topReasons.map((item, index) => (
                        <div
                          key={`${item.reason}-${index}`}
                          className="flex justify-between text-slate-700"
                        >
                          <span className="truncate pr-3">{item.reason}</span>
                          <span className="text-blue-700 font-semibold">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-slate-500">No reason data yet.</p>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="rounded-[2rem] border border-white/55 bg-white/55 p-6 space-y-3 shadow-xl shadow-blue-900/10 ring-1 ring-white/30 backdrop-blur-2xl">
            {loading && <p className="text-xs text-slate-600">Loading...</p>}

            {!loading && error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {!loading && !error && alerts.length === 0 && (
              <p className="text-xs text-slate-600">No fraud alerts.</p>
            )}

            {!loading &&
              alerts.map((a) => {
                const score = Number(a?.score ?? 0);
                const severity = severityFromScore(score);
                const title =
                  a?.decision === "BLOCK"
                    ? "Blocked booking detected"
                    : "Suspicious booking requires review";

                const booking = a?.booking || {};
                const seatsCount = Array.isArray(booking.seats)
                  ? booking.seats.length
                  : 0;

                const detail = `Booking: ${booking.from || "-"} → ${booking.to || "-"
                  } | Seats: ${seatsCount} | Date: ${booking.travelDate || "-"
                  } | Score: ${score}`;

                const form = reviewForms[a._id] || {
                  reviewOutcome: a?.reviewOutcome || "PENDING",
                  reviewNotes: a?.reviewNotes || "",
                };

                const reviewedByName =
                  a?.reviewedBy?.name || a?.reviewedBy?.email || "";

                return (
                  <div
                    key={a._id}
                    className="rounded-2xl border border-white/60 bg-white/65 px-4 py-3 text-xs shadow-sm shadow-blue-900/5 backdrop-blur-xl"
                  >
                    <div className="flex flex-wrap justify-between items-center gap-3 mb-1">
                      <p className="font-semibold text-slate-900">{title}</p>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${severity === "high"
                            ? "bg-red-50 text-red-700"
                            : severity === "medium"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                            }`}
                        >
                          {severity.toUpperCase()}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${outcomeBadgeClass(
                            a?.reviewOutcome || "PENDING"
                          )}`}
                        >
                          {(a?.reviewOutcome || "PENDING").toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 mb-2">{detail}</p>

                    {!!a?.reasons?.length && (
                      <p className="text-[11px] text-slate-500 mb-3">
                        Reasons: {a.reasons.join(", ")}
                      </p>
                    )}

                    <div className="grid gap-3 md:grid-cols-[180px,1fr,auto] items-start">
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-1">
                          Review outcome
                        </label>
                        <select
                          value={form.reviewOutcome}
                          onChange={(e) =>
                            updateReviewForm(a._id, "reviewOutcome", e.target.value)
                          }
                          className="w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-[12px] text-slate-950 outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="FRAUD">Fraud</option>
                          <option value="LEGIT">Legit</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-600 mb-1">
                          Notes
                        </label>
                        <textarea
                          rows={2}
                          value={form.reviewNotes}
                          onChange={(e) =>
                            updateReviewForm(a._id, "reviewNotes", e.target.value)
                          }
                          placeholder="Add optional review notes..."
                          className="w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-[12px] text-slate-950 placeholder:text-slate-400 outline-none resize-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>

                      <div className="pt-5">
                        <button
                          onClick={() => submitReview(a._id)}
                          disabled={reviewingId === a._id}
                          className="text-[10px] px-3 py-2 rounded-full border border-blue-200 bg-blue-50 font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {reviewingId === a._id ? "Saving..." : "Save Review"}
                        </button>
                      </div>
                    </div>

                    {(a?.reviewed ||
                      a?.reviewOutcome === "FRAUD" ||
                      a?.reviewOutcome === "LEGIT") && (
                        <div className="mt-3 text-[11px] text-slate-500">
                          <p>
                            Reviewed:{" "}
                            <span className="text-slate-800 font-medium">
                              {a?.reviewedAt
                                ? new Date(a.reviewedAt).toLocaleString()
                                : "Yes"}
                            </span>
                          </p>

                          {reviewedByName && (
                            <p className="mt-1">
                              Reviewed by:{" "}
                              <span className="text-slate-800 font-medium">
                                {reviewedByName}
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                  </div>
                );
              })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProviderFraudAlertsPage;
