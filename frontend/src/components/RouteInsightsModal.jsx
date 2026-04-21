import React, { useEffect } from "react";
import RouteInsightsPanel from "./RouteInsightsPanel";

const RouteInsightsModal = ({
  open,
  onClose,
  route,
  insights,
  loading = false,
  onSendAlert,
  sendingAlert = false,
  sendAlertResult = null,
}) => {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close insights modal"
      />

      {/* Modal */}
      <div className="relative z-[1001] w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-cyan-500/20">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-white">
              Route Delay Insights
            </h2>
            {route ? (
              <p className="mt-1 text-xs text-slate-400">
                {route.fromCity} → {route.toCity}
                {route.travelDate ? ` • ${route.travelDate}` : ""}
                {route.departureTime ? ` • ${route.departureTime}` : ""}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <div className="max-h-[calc(90vh-80px)] overflow-y-auto px-5 py-5">
          <RouteInsightsPanel
            insights={insights}
            loading={loading}
            onSendAlert={onSendAlert}
            sendingAlert={sendingAlert}
            sendAlertResult={sendAlertResult}
          />
        </div>
      </div>
    </div>
  );
};

export default RouteInsightsModal;