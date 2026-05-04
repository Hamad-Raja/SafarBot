import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PaymentFailedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-slate-900/80 rounded-3xl border border-red-400/40 shadow-2xl shadow-red-500/20 p-6 text-center text-white">
            <h1 className="text-xl font-bold mb-1">Payment was not completed</h1>
            <p className="text-xs text-slate-300 mb-4">
              Your seats were not booked. You can return home and try again.
            </p>
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="w-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-semibold rounded-2xl py-2.5 mt-2 text-sm shadow-lg shadow-emerald-500/40 hover:shadow-emerald-400/60 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentFailedPage;
