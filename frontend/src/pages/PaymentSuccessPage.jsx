import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const { search, state } = useLocation();
  const hasConfirmedRef = useRef(false);

  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Confirming your booking...");
  const [bookingRef, setBookingRef] = useState(state?.bookingId || null);

  useEffect(() => {
    const sessionId = new URLSearchParams(search).get("session_id");

    if (!sessionId) {
      setStatus("failed");
      setMessage("Payment session was not found.");
      return;
    }

    if (hasConfirmedRef.current) return;
    hasConfirmedRef.current = true;

    const confirmBooking = async () => {
      try {
        const res = await Api.post(
          "/api/bookings",
          { sessionId },
          {
            headers: {
              "x-device-id": getDeviceId(),
            },
          }
        );

        const booking = res.data || {};
        const bookingStatus = String(booking?.status || "").toUpperCase();

        setBookingRef(booking?._id || null);

        if (bookingStatus === "CONFIRMED") {
          setStatus("confirmed");
          setMessage("Seats reserved successfully. A confirmation has been stored in your SafarBot account.");
          toast.success("Booking confirmed successfully.");
          return;
        }

        if (bookingStatus === "REVIEW") {
          setStatus("review");
          setMessage("Your booking is under review.");
          toast("Your booking is under review.");
          return;
        }

        if (bookingStatus === "BLOCKED") {
          setStatus("failed");
          setMessage("This booking was blocked by fraud checks.");
          toast.error("This booking was blocked by fraud checks.");
          return;
        }

        setStatus("confirmed");
        setMessage("Booking created with status: " + (bookingStatus || "PENDING"));
      } catch (err) {
        console.error(err);
        setStatus("failed");
        setMessage(err?.response?.data?.message || "Unable to confirm booking.");
        toast.error(err?.response?.data?.message || "Unable to confirm booking.");
      }
    };

    confirmBooking();
  }, [search]);

  const title =
    status === "processing"
      ? "Confirming your booking..."
      : status === "failed"
      ? "Payment received, booking needs attention"
      : status === "review"
      ? "Your booking is under review"
      : "Your booking is confirmed!";

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-slate-900/80 rounded-3xl border border-emerald-400/40 shadow-2xl shadow-emerald-500/30 p-6 text-center text-white">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center text-3xl">
              {status === "failed" ? "!" : status === "processing" ? "..." : "OK"}
            </div>

            <h1 className="text-xl font-bold mb-1">{title}</h1>

            <p className="text-xs text-slate-300 mb-3">{message}</p>

            {bookingRef && (
              <p className="text-[11px] text-emerald-300 mb-3">
                Booking reference: <span className="font-semibold">{bookingRef}</span>
              </p>
            )}

            <button
              type="button"
              onClick={() => navigate("/my-bookings")}
              className="w-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-semibold rounded-2xl py-2.5 mt-2 text-sm shadow-lg shadow-emerald-500/40 hover:shadow-emerald-400/60 transition-all"
            >
              Go to My Bookings
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccessPage;
