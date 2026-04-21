import React from "react";

const badgeClassByType = {
  success:
    "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40",
  danger: "bg-red-500/15 text-red-300 border border-red-500/40",
  warning:
    "bg-amber-500/15 text-amber-300 border border-amber-500/40",
  neutral: "bg-slate-800 text-slate-300 border border-slate-600/60",
};

function getStatusMeta(insights) {
  if (!insights) {
    return { label: "No Data", className: badgeClassByType.neutral };
  }

  if (!insights.prediction) {
    return {
      label: "Prediction Unavailable",
      className: badgeClassByType.warning,
    };
  }

  if (insights.prediction.will_delay) {
    return {
      label: "High Delay Risk",
      className: badgeClassByType.danger,
    };
  }

  return {
    label: "Low Risk",
    className: badgeClassByType.success,
  };
}

const Row = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 text-[12px]">
    <span className="text-slate-400">{label}</span>
    <span className="text-slate-200 font-medium text-right">{value}</span>
  </div>
);

const RouteInsightsPanel = ({
  insights,
  loading = false,
  onSendAlert,
  sendingAlert = false,
  sendAlertResult = null,
}) => {
  if (loading) {
    return (
      <div className="mt-3 rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-4">
        <p className="text-xs text-slate-300">Loading route insights...</p>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  const statusMeta = getStatusMeta(insights);
  const prediction = insights.prediction || null;
  const weather = insights.weather || {};
  const maps = insights.maps || {};
  const bookingStats = insights.bookingStats || {};
  const warnings = Array.isArray(insights.warnings) ? insights.warnings : [];

  const delayMinutes = Number(
    prediction?.delay_minutes ?? prediction?.predicted_delay_minutes ?? 0
  );

  const threshold = Number(prediction?.threshold_minutes ?? 0);

  const canSendAlert =
    !!prediction &&
    !!prediction.will_delay &&
    Number(bookingStats.confirmedBookings || 0) > 0 &&
    !sendingAlert;

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Delay Insights</h3>
          <p className="text-[11px] text-slate-400 mt-1">
            AI prediction, route conditions, and manual alert control.
          </p>
        </div>

        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusMeta.className}`}
        >
          {statusMeta.label}
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 space-y-2">
          <p className="text-[11px] font-semibold text-slate-300">
            Prediction
          </p>
          <Row
            label="Predicted Delay"
            value={
              prediction ? `${delayMinutes.toFixed(2)} min` : "Unavailable"
            }
          />
          <Row
            label="Threshold"
            value={prediction ? `${threshold} min` : "N/A"}
          />
          <Row
            label="Will Delay"
            value={
              prediction
                ? prediction.will_delay
                  ? "Yes"
                  : "No"
                : "Unknown"
            }
          />
          <Row
            label="Model Status"
            value={insights.status || "unknown"}
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 space-y-2">
          <p className="text-[11px] font-semibold text-slate-300">
            Weather & Route
          </p>
          <Row label="Condition" value={weather.condition || "Unknown"} />
          <Row
            label="Temperature"
            value={`${Number(weather.tempC || 0).toFixed(2)} °C`}
          />
          <Row
            label="Humidity"
            value={`${Number(weather.humidity || 0)}%`}
          />
          <Row
            label="Wind"
            value={`${Number(weather.windMs || 0).toFixed(2)} m/s`}
          />
          <Row
            label="Distance"
            value={`${Number(maps.distanceKm || 0).toFixed(2)} km`}
          />
          <Row
            label="Duration"
            value={`${Number(maps.durationMin || 0).toFixed(0)} min`}
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 space-y-2">
          <p className="text-[11px] font-semibold text-slate-300">
            Booking Stats
          </p>
          <Row
            label="Total Bookings"
            value={Number(bookingStats.totalBookings || 0)}
          />
          <Row
            label="Confirmed"
            value={Number(bookingStats.confirmedBookings || 0)}
          />
          <Row
            label="Pending"
            value={Number(bookingStats.pendingBookings || 0)}
          />

          <div className="pt-2">
            <button
              type="button"
              onClick={onSendAlert}
              disabled={!canSendAlert}
              className={`w-full rounded-2xl px-4 py-2 text-xs font-semibold transition ${
                canSendAlert
                  ? "bg-gradient-to-r from-amber-400 to-red-400 text-slate-950 hover:opacity-90"
                  : "bg-slate-800 text-slate-400 cursor-not-allowed"
              }`}
            >
              {sendingAlert ? "Sending Alert..." : "Send Delay Alert"}
            </button>

            {!prediction ? (
              <p className="mt-2 text-[10px] text-slate-500">
                Alert disabled because prediction is unavailable.
              </p>
            ) : !prediction.will_delay ? (
              <p className="mt-2 text-[10px] text-slate-500">
                Alert disabled because delay is below threshold.
              </p>
            ) : Number(bookingStats.confirmedBookings || 0) === 0 ? (
              <p className="mt-2 text-[10px] text-slate-500">
                Alert disabled because there are no confirmed bookings.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {warnings.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-[11px] font-semibold text-amber-300 mb-2">
            Warnings
          </p>
          <ul className="space-y-1 text-[11px] text-amber-100/90 list-disc pl-4">
            {warnings.map((warning, idx) => (
              <li key={`${warning}-${idx}`}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {sendAlertResult ? (
        <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-[11px] font-semibold text-emerald-300 mb-2">
            Alert Result
          </p>
          <div className="grid gap-2 sm:grid-cols-4 text-[11px]">
            <div className="rounded-xl bg-slate-950/60 border border-white/10 p-2">
              <p className="text-slate-400">Predicted Delay</p>
              <p className="text-slate-100 font-semibold">
                {Number(sendAlertResult.predictedDelay || 0).toFixed(2)} min
              </p>
            </div>
            <div className="rounded-xl bg-slate-950/60 border border-white/10 p-2">
              <p className="text-slate-400">Total Bookings</p>
              <p className="text-slate-100 font-semibold">
                {Number(sendAlertResult.totalBookings || 0)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-950/60 border border-white/10 p-2">
              <p className="text-slate-400">Sent</p>
              <p className="text-emerald-300 font-semibold">
                {Number(sendAlertResult.sent || 0)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-950/60 border border-white/10 p-2">
              <p className="text-slate-400">Failed</p>
              <p className="text-red-300 font-semibold">
                {Number(sendAlertResult.failed || 0)}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default RouteInsightsPanel;