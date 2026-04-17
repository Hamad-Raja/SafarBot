import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const bookingRef = state?.bookingId || null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-slate-900/80 rounded-3xl border border-emerald-400/40 shadow-2xl shadow-emerald-500/30 p-6 text-center text-white">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center text-3xl">
              ✅
            </div>
            <h1 className="text-xl font-bold mb-1">Your booking is confirmed!</h1>
            <p className="text-xs text-slate-300 mb-3">
              Seats reserved successfully. A confirmation has been stored in your SafarBot account.
            </p>
            {bookingRef && (
              <p className="text-[11px] text-emerald-300 mb-3">
                Booking reference: <span className="font-semibold">{bookingRef}</span>
              </p>
            )}
            <button
              type="button"
              onClick={() => navigate('/my-bookings')}
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
