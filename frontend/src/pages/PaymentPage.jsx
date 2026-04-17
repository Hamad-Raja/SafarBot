import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
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
  const navigate = useNavigate();

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
      const res = await axios.post(
        "/api/bookings",
        {
          routeId,
          seats: selectedSeatLabels,
          travelDate,
        },
        {
          headers: {
            "x-device-id": getDeviceId(),
          },
        }
      );

      const booking = res.data || {};
      const bookingId = booking?._id || null;
      const bookingStatus = String(booking?.status || "").toUpperCase();

      if (bookingStatus === "CONFIRMED") {
        setSuccess(true);
        toast.success("Booking confirmed successfully.");

        setTimeout(() => {
          navigate("/payment-success", { state: { bookingId } });
        }, 1200);

        return;
      }

      if (bookingStatus === "REVIEW") {
        toast("Your booking is under review.");
        navigate("/my-bookings");
        return;
      }

      if (bookingStatus === "BLOCKED") {
        toast.error("This booking was blocked by fraud checks.");
        return;
      }

      toast("Booking created with status: " + (bookingStatus || "PENDING"));
      navigate("/my-bookings");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Unable to create booking.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-lg mx-auto mt-10 mb-12 bg-slate-900/80 rounded-3xl shadow-lg shadow-cyan-500/30 border border-white/10 px-6 py-6 md:px-8 md:py-8 text-white">
          <h2 className="text-xl font-bold mb-2">Payment</h2>

          {!route ? (
            <p className="text-sm text-slate-300">
              No booking data found. Start from Home page.
            </p>
          ) : (
            <>
              <p className="text-xs text-slate-400 mb-4">
                {operatorLabel} • {fromLabel} → {toLabel} • {departureLabel}
              </p>

              <div className="space-y-2 text-sm text-slate-100">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Seats</span>
                  <span className="text-right">
                    {seats.map((s) => s?.label).filter(Boolean).join(", ")}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Fare</span>
                  <span>PKR {total.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-xs text-slate-400">
                  <span>Payment method</span>
                  <span>JazzCash / Easypaisa (demo)</span>
                </div>
              </div>

              <div className="border-t border-dashed border-white/10 my-4" />

              {success ? (
                <div className="text-center text-xs text-emerald-300">
                  Booking confirmed. Redirecting to confirmation...
                </div>
              ) : (
                <button
                  onClick={handlePay}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-semibold rounded-2xl py-2.5 mt-2 shadow-lg shadow-emerald-500/40 hover:shadow-emerald-400/60 transition-all disabled:opacity-60 text-sm"
                >
                  {processing ? "Processing..." : "Pay & Confirm Booking"}
                </button>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentPage;