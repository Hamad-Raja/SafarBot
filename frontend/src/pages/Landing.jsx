import React from "react";
import { useNavigate } from "react-router-dom";
import landing from "../assets/landing.jpg";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-white overflow-x-hidden relative isolate">
      {/* Background glow (contained, no extra scroll) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-[520px] w-[520px] rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="w-full bg-white/90 backdrop-blur border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          {/* Brand */}
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-emerald-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/40">
              <img
                src="/images/logo.jpeg"
                alt="SafarBot Logo"
                className="h-8 w-8 object-contain rounded-xl"
              />
            </div>

            <div className="flex flex-col leading-tight">
              <span className="font-bold text-lg tracking-tight text-slate-900">
                SafarBot
              </span>
            </div>
          </div>

          {/* Right actions */}
          {/* <div className="flex items-center gap-3"> */}

          <button
            onClick={() => navigate("/auth?mode=login")}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 text-white font-semibold text-sm shadow-md hover:shadow-cyan-500/30 transition-shadow"
          >
            login
          </button>
          {/* </div> */}
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 sm:py-10 lg:py-14 grid gap-10 lg:gap-12 lg:grid-cols-[1.15fr,0.85fr] items-center">
          {/* Left */}
          <div className="text-center lg:text-left">
            <p className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold text-cyan-300 uppercase tracking-[0.2em] mb-3 justify-center lg:justify-start">
              <span className="h-px w-6 bg-cyan-400" />
              Travel Booking Made Easy
            </p>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
              Book bus tickets{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                faster
              </span>{" "}
              — in one clean flow.
            </h1>

            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Search routes, choose your seat, and confirm in seconds.
            </p>

            {/* Features */}
            <div className="mt-6 grid gap-3 max-w-xl mx-auto lg:mx-0">
              {[
                {
                  icon: "🎙️",
                  title: "Voice-first booking",
                  desc: "Search routes and confirm trips using simple voice commands.",
                },
                {
                  icon: "⚡",
                  title: "Fast booking",
                  desc: "Find a route, pick seats, and confirm — without extra steps.",
                },
                {
                  icon: "🪑",
                  title: "Seat clarity",
                  desc: "Simple, readable seat layout so users choose confidently.",
                },
                {
                  icon: "🔒",
                  title: "Secure & reliable",
                  desc: "Authentication and clean confirmations for peace of mind.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 p-3"
                >
                  <span className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                    {f.icon}
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-100">
                      {f.title}
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <button
                onClick={() => navigate("/auth")}
                className="w-full sm:w-auto px-6 py-3 rounded-full text-sm font-semibold bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/60 transition-shadow"
              >
                Get started
              </button>

              <button
                onClick={() => navigate("/auth")}
                className="w-full sm:w-auto px-6 py-3 rounded-full text-sm font-semibold bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/60 transition-shadow"
              >
                login now
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="w-full sm:w-auto px-6 py-3 rounded-full text-sm font-semibold bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-cyan-500/30 hover:shadow-red-600 transition-shadow"
              >
                Register
              </button>
            </div>
          </div>

          {/* Right */}
          <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-none mx-auto">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 via-emerald-400/20 to-transparent blur-3xl rounded-[2.5rem] pointer-events-none -z-10" />

            <div className="relative rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border border-white/10 bg-slate-900/60 shadow-2xl shadow-cyan-500/20 backdrop-blur">
              <img
                src={landing}
                alt="Bus Preview"
                className="w-full h-52 sm:h-60 lg:h-64 object-cover object-center"
                loading="lazy"
              />

              <div className="p-4 sm:p-5 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between gap-3 text-[10px] sm:text-[11px] text-slate-300">
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-200 border border-cyan-400/30">
                    Booking Preview
                  </span>
                  <span className="text-slate-400 truncate">
                    Quick • Simple • Clear
                  </span>
                </div>

                <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-3 space-y-2 text-[10px] sm:text-[11px]">
                  <Row label="Trip Route" value="Not selected" />
                  <Row label="Departure Time" value="Multiple options" />
                  <Row label="Seat" value="To be selected" />
                  <Row
                    label="Fare (Starting from)"
                    value={
                      <span className="font-semibold text-cyan-300">
                        PKR 2,500
                      </span>
                    }
                  />
                </div>

                <button
                  onClick={() => navigate("/auth")}
                  className="w-full px-4 py-2.5 rounded-full text-[12px] font-semibold bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-md hover:shadow-cyan-500/40 transition-shadow"
                >
                  Start Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4">
    <span className="text-slate-400">{label}</span>
    <span className="text-slate-100 truncate">{value}</span>
  </div>
);

export default Landing;
