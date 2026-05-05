import React from "react";
import { ArrowLeft, BusFront } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 pb-12 pt-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <ArrowLeft size={15} />
          Back
        </button>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                <BusFront size={15} />
                Search Results
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                Available Routes
              </h1>
              {criteria && (
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  {fromLabel} to {toLabel} | {dateLabel}
                </p>
              )}
            </div>

            <span className="self-start rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 sm:self-auto">
              {routes.length} found
            </span>
          </div>

          {routes.length === 0 ? (
            <div className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center">
              <p className="text-sm font-bold text-slate-800">
                {criteria
                  ? "No routes found for this search."
                  : "No route data found."}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Try different cities or another travel date.
              </p>
            </div>
          ) : (
            <div className="mt-7 space-y-4">
              {routes.map((r) => (
                <RouteCard key={r?._id || r?.id} route={r} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default RoutesPage;
