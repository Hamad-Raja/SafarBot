import React from "react";
import { OctagonAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PaymentFailedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <main className="flex min-h-[62vh] items-center justify-center px-4 py-12">
        <section className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-sm shadow-slate-900/5">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-700">
            <OctagonAlert size={30} />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight">
            Payment was not completed
          </h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
            Your seats were not booked. You can return home and try again.
          </p>

          <button
            type="button"
            onClick={() => navigate("/home")}
            className="mt-5 h-12 w-full rounded-[18px] bg-blue-700 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition-colors hover:bg-blue-800"
          >
            Back to Home
          </button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentFailedPage;
