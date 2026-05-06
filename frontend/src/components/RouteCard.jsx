import React from "react";
import { ArrowRight, Clock3, Star } from "lucide-react";
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
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-900/10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-blue-700">
              {operatorLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-extrabold text-amber-600">
              <Star size={12} fill="currentColor" />
              {ratingLabel}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-lg font-extrabold text-slate-950">
            <span>{fromLabel}</span>
            <ArrowRight size={18} className="text-blue-700" />
            <span>{toLabel}</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Clock3 size={14} className="text-blue-700" />
              {route?.departureTime || "-"} to {route?.arrivalTime || "-"}
            </span>
            <span>|</span>
            <span>{route?.duration || "-"}</span>
            <span>|</span>
            <span>{route?.busType || "-"}</span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 md:min-w-52 md:flex-col md:items-end">
          <div className="md:text-right">
            <p className="text-xs font-semibold text-slate-500">Starting from</p>
            <p className="text-2xl font-extrabold text-slate-950">
              PKR {priceValue.toLocaleString()}
            </p>
          </div>

          <button
            onClick={handleBook}
            disabled={!routeId}
            className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            View Seats
          </button>
        </div>
      </div>
    </article>
  );
};

export default RouteCard;
