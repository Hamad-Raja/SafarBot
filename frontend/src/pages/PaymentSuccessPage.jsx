import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, OctagonAlert } from "lucide-react";
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
          setMessage(
            "Seats reserved successfully. A confirmation has been stored in your SafarBot account."
          );
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
      ? "Booking needs attention"
      : status === "review"
      ? "Your booking is under review"
      : "Your booking is confirmed";

  const Icon =
    status === "processing"
      ? Loader2
      : status === "failed"
      ? OctagonAlert
      : CheckCircle2;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <main className="flex min-h-[62vh] items-center justify-center px-4 py-12">
        <section className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-sm shadow-slate-900/5">
          <div
            className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${
              status === "failed"
                ? "bg-red-50 text-red-700"
                : status === "processing"
                ? "bg-blue-50 text-blue-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            <Icon
              size={30}
              className={status === "processing" ? "animate-spin" : ""}
            />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
            {message}
          </p>

          {bookingRef && (
            <p className="mt-4 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
              Booking reference: {bookingRef}
            </p>
          )}

          <button
            type="button"
            onClick={() => navigate("/my-bookings")}
            className="mt-5 h-12 w-full rounded-[18px] bg-blue-700 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition-colors hover:bg-blue-800"
          >
            Go to My Bookings
          </button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccessPage;
