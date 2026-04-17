import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RouteCard from "../components/RouteCard";

const RoutesPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const routes = Array.isArray(state?.routes) ? state.routes : [];
  const criteria = state?.criteria || null;

  const fromLabel = criteria?.from || "-";
  const toLabel = criteria?.to || "-";
  const dateLabel = criteria?.date || "-";

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 pt-6 pb-10">
          <button
            onClick={() => navigate(-1)}
            className="text-xs text-slate-400 hover:text-cyan-300 mb-3"
          >
            ← Back
          </button>

          <h1 className="text-2xl font-bold text-white mb-1">
            Available Routes
          </h1>

          {criteria && (
            <p className="text-xs text-slate-400 mb-4">
              {fromLabel} → {toLabel} • {dateLabel}
            </p>
          )}

          {routes.length === 0 ? (
            <div className="mt-6 bg-slate-900/70 rounded-3xl p-6 border border-dashed border-white/10 text-center text-sm text-slate-300">
              {criteria ? (
                <>
                  No routes found for your search. Try different cities or another
                  travel date.
                </>
              ) : (
                <>
                  No route data found. Please go back and search again.
                </>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {routes.map((r) => (
                <RouteCard key={r?._id || r?.id} route={r} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RoutesPage;