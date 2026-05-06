import React, { useState } from "react";
import { CreditCard, ShieldCheck } from "lucide-react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import Api from "../api/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const getDeviceId = () => {
  let id = localStorage.getItem("device_id");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("device_id", id);
  }

  return id;
};

const PaymentPage = () => {
  const { state } = useLocation();

  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const route = state?.route;
  const seats = state?.seats || [];
  const total = Number(state?.total || 0);
  const travelDate = state?.date || "";

  const routeId = route?._id || route?.id || "";

  const fromLabel = route?.from || route?.fromCity || "-";
  const toLabel = route?.to || route?.toCity || "-";
  const operatorLabel = route?.operator || "-";
  const departureLabel = route?.departureTime || "-";

  const handlePay = async () => {
    if (!route || !routeId) {
      toast.error("No booking data found. Please search and select a route again.");
      return;
    }

    const selectedSeatLabels = seats.map((s) => s?.label).filter(Boolean);

    if (selectedSeatLabels.length === 0) {
      toast.error("No seats selected.");
      return;
    }

    setProcessing(true);

    try {
      const res = await Api.post(
        "/api/payments/create-checkout-session",
        {
          routeId,
          seats: selectedSeatLabels,
          amount: Number(route?.price || 0) * selectedSeatLabels.length,
          travelDate,
        },
        {
          headers: {
            "x-device-id": getDeviceId(),
          },
        }
      );

      if (!res.data?.url) {
        throw new Error("Stripe checkout URL missing.");
      }

      setSuccess(true);
      window.location.href = res.data.url;
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Unable to start Stripe checkout.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />

      <main className="mx-auto max-w-lg px-4 pb-12 pt-10">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 md:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <CreditCard size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                Payment
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Confirm your fare before secure checkout.
              </p>
            </div>
          </div>

          {!route ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-800">
                No booking data found.
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Start from the home page and select a route again.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-extrabold text-slate-950">
                  {fromLabel} to {toLabel}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {operatorLabel} | Departure: {departureLabel}
                </p>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="font-medium text-slate-500">Seats</span>
                  <span className="text-right font-bold text-slate-900">
                    {seats.map((s) => s?.label).filter(Boolean).join(", ")}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium text-slate-500">Fare</span>
                  <span className="font-bold text-slate-900">
                    PKR {total.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-500">
                    Payment method
                  </span>
                  <span className="font-bold text-slate-700">
                    Stripe card checkout
                  </span>
                </div>
              </div>

              <div className="my-5 border-t border-dashed border-slate-200" />

              <div className="mb-4 flex items-center gap-2 rounded-2xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                <ShieldCheck size={16} />
                Secure checkout will open after confirmation.
              </div>

              {success ? (
                <div className="text-center text-sm font-bold text-emerald-700">
                  Redirecting to secure checkout...
                </div>
              ) : (
                <button
                  onClick={handlePay}
                  disabled={processing}
                  className="h-12 w-full rounded-[18px] bg-blue-700 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition-colors hover:bg-blue-800 disabled:opacity-60"
                >
                  {processing ? "Processing..." : "Continue to Secure Payment"}
                </button>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentPage;
