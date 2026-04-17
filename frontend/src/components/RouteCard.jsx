import React from "react";
import { useNavigate } from "react-router-dom";

const RouteCard = ({ route }) => {
  const navigate = useNavigate();

  const routeId = route?._id || route?.id || "";
  const fromLabel = route?.from || route?.fromCity || "-";
  const toLabel = route?.to || route?.toCity || "-";
  const operatorLabel = route?.operator || "-";
  const ratingLabel = route?.rating ?? 0;
  const priceValue = Number(route?.price || 0);

  const handleBook = () => {
    if (!routeId) return;
    navigate(`/booking/${routeId}`, { state: { route, routeId } });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary-dark font-semibold uppercase tracking-wide">
            {operatorLabel}
          </span>
          <span className="text-xs text-amber-500 font-medium">
            ★ {ratingLabel}
          </span>
        </div>

        <p className="font-semibold text-slate-800 text-sm md:text-base">
          {fromLabel} → {toLabel}
        </p>

        <p className="text-xs text-slate-500">
          {route?.departureTime || "-"} • {route?.arrivalTime || "-"} •{" "}
          {route?.duration || "-"}
        </p>

        <p className="text-xs text-slate-400">
          Bus type: {route?.busType || "-"}
        </p>
      </div>

      <div className="flex items-end md:items-center justify-between md:flex-col gap-3 mt-3 md:mt-0">
        <div className="text-right md:text-center">
          <p className="text-[11px] text-slate-400">Starting from</p>
          <p className="text-lg font-bold text-slate-800">
            PKR {priceValue.toLocaleString()}
          </p>
        </div>

        <button
          onClick={handleBook}
          disabled={!routeId}
          className="px-5 py-2 rounded-2xl bg-primary-dark text-white text-sm font-semibold hover:bg-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          View Seats
        </button>
      </div>
    </div>
  );
};

export default RouteCard;