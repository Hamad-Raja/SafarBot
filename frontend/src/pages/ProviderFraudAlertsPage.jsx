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
      return "bg-red-500/20 text-red-300 border border-red-400/30";
    }

    if (normalized === "LEGIT") {
      return "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30";
    }

    return "bg-amber-500/20 text-amber-300 border border-amber-400/30";
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 pt-8 pb-12 text-white">
          <h1 className="text-xl font-extrabold mb-1">Risk & Alerts</h1>
          <p className="text-xs text-slate-400 mb-4">
            Automated alerts generated from booking behavior.
          </p>

          {!loading && !error && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <p className="text-[11px] text-slate-400">Total Alerts</p>
                  <p className="mt-1 text-xl font-extrabold text-white">
                    {stats.totalAlerts}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <p className="text-[11px] text-slate-400">Pending Reviews</p>
                  <p className="mt-1 text-xl font-extrabold text-amber-300">
                    {stats.pendingReviews}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <p className="text-[11px] text-slate-400">Fraud Marked</p>
                  <p className="mt-1 text-xl font-extrabold text-red-300">
                    {stats.fraudMarked}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <p className="text-[11px] text-slate-400">Legit Marked</p>
                  <p className="mt-1 text-xl font-extrabold text-emerald-300">
                    {stats.legitMarked}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <p className="text-[11px] text-slate-400 mb-3">Risk Breakdown</p>
                  <div className="space-y-2 text-[12px]">
                    <div className="flex justify-between text-red-300">
                      <span>High Risk</span>
                      <span>{stats.highRiskAlerts}</span>
                    </div>
                    <div className="flex justify-between text-amber-300">
                      <span>Medium Risk</span>
                      <span>{stats.mediumRiskAlerts}</span>
                    </div>
                    <div className="flex justify-between text-emerald-300">
                      <span>Low Risk</span>
                      <span>{stats.lowRiskAlerts}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <p className="text-[11px] text-slate-400 mb-3">Top Reasons</p>
                  {stats.topReasons?.length ? (
                    <div className="space-y-2 text-[12px]">
                      {stats.topReasons.map((item, index) => (
                        <div
                          key={`${item.reason}-${index}`}
                          className="flex justify-between text-slate-200"
                        >
                          <span className="truncate pr-3">{item.reason}</span>
                          <span className="text-cyan-300 font-semibold">
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

          <div className="bg-slate-900/80 rounded-3xl border border-white/10 p-6 space-y-3">
            {loading && <p className="text-xs text-slate-300">Loading...</p>}

            {!loading && error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                <p className="text-xs text-red-200">{error}</p>
              </div>
            )}

            {!loading && !error && alerts.length === 0 && (
              <p className="text-xs text-slate-300">No fraud alerts.</p>
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
                    className="bg-slate-950/60 rounded-2xl border border-white/10 px-4 py-3 text-xs"
                  >
                    <div className="flex flex-wrap justify-between items-center gap-3 mb-1">
                      <p className="font-semibold text-slate-200">{title}</p>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${severity === "high"
                            ? "bg-red-500/20 text-red-300"
                            : severity === "medium"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-emerald-500/20 text-emerald-300"
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

                    <p className="text-[11px] text-slate-300 mb-2">{detail}</p>

                    {!!a?.reasons?.length && (
                      <p className="text-[11px] text-slate-400 mb-3">
                        Reasons: {a.reasons.join(", ")}
                      </p>
                    )}

                    <div className="grid gap-3 md:grid-cols-[180px,1fr,auto] items-start">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Review outcome
                        </label>
                        <select
                          value={form.reviewOutcome}
                          onChange={(e) =>
                            updateReviewForm(a._id, "reviewOutcome", e.target.value)
                          }
                          className="w-full rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-[12px] text-white outline-none"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="FRAUD">Fraud</option>
                          <option value="LEGIT">Legit</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Notes
                        </label>
                        <textarea
                          rows={2}
                          value={form.reviewNotes}
                          onChange={(e) =>
                            updateReviewForm(a._id, "reviewNotes", e.target.value)
                          }
                          placeholder="Add optional review notes..."
                          className="w-full rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-[12px] text-white outline-none resize-none"
                        />
                      </div>

                      <div className="pt-5">
                        <button
                          onClick={() => submitReview(a._id)}
                          disabled={reviewingId === a._id}
                          className="text-[10px] px-3 py-2 rounded-full border border-cyan-400/60 text-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {reviewingId === a._id ? "Saving..." : "Save Review"}
                        </button>
                      </div>
                    </div>

                    {(a?.reviewed ||
                      a?.reviewOutcome === "FRAUD" ||
                      a?.reviewOutcome === "LEGIT") && (
                        <div className="mt-3 text-[11px] text-slate-400">
                          <p>
                            Reviewed:{" "}
                            <span className="text-slate-200 font-medium">
                              {a?.reviewedAt
                                ? new Date(a.reviewedAt).toLocaleString()
                                : "Yes"}
                            </span>
                          </p>

                          {reviewedByName && (
                            <p className="mt-1">
                              Reviewed by:{" "}
                              <span className="text-slate-200 font-medium">
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