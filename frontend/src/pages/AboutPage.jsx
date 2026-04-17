import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const AboutPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 pt-10 pb-14 text-white">
          {/* Header */}
          <div className="mb-8">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold text-cyan-300 uppercase tracking-[0.2em]">
              <span className="h-px w-6 bg-cyan-400" />
              About
            </p>

            <h1 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
              About <span className="text-cyan-300">SafarBot</span>
            </h1>

            <p className="mt-3 text-sm md:text-base text-slate-300 leading-relaxed max-w-3xl">
              SafarBot is a modern bus booking platform built to simplify intercity
              travel. It focuses on a clean user experience, fast route discovery,
              and a consistent booking flow — powered by voice and text input.
            </p>
          </div>

          {/* Main content card */}
          <div className="bg-slate-900/70 rounded-3xl border border-white/10 shadow-xl shadow-cyan-500/20 p-6 md:p-8">
            <div className="grid gap-8 md:grid-cols-3">
              {/* What it is */}
              <div className="md:col-span-2 space-y-4 text-sm text-slate-200 leading-relaxed">
                <h2 className="text-lg font-semibold text-white">
                  What SafarBot delivers
                </h2>

                <p>
                  SafarBot provides a structured booking journey that feels familiar to
                  real-world travel platforms. Users can search routes, review available
                  schedules, select seats, and confirm a booking with a clear trip summary.
                </p>

                <p>
                  The platform is designed with clarity and reliability in mind — responsive
                  layouts, consistent screens, and an interface that supports quick actions,
                  even on smaller devices.
                </p>

                <p>
                  SafarBot also supports role-based access so different users can experience
                  the product from different perspectives (passengers and operators), while
                  keeping the interface clean and professional.
                </p>
              </div>

              {/* Key highlights */}
              <div className="rounded-3xl bg-slate-950/60 border border-white/10 p-5">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Key highlights
                </h3>

                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex gap-3">
                    <span className="h-7 w-7 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      🎙️
                    </span>
                    <span>Voice &amp; text route search</span>
                  </li>

                  <li className="flex gap-3">
                    <span className="h-7 w-7 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      💺
                    </span>
                    <span>Seat selection with a clear layout</span>
                  </li>

                  <li className="flex gap-3">
                    <span className="h-7 w-7 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      🧾
                    </span>
                    <span>Trip summary &amp; booking history</span>
                  </li>

                  <li className="flex gap-3">
                    <span className="h-7 w-7 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      🛡️
                    </span>
                    <span>Secure authentication &amp; protected access</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* How it works */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4">
                How the booking flow works
              </h2>

              <div className="grid gap-4 md:grid-cols-4">
                {[
                  { title: "Search", desc: "Find routes using voice or text." },
                  { title: "Select", desc: "Choose schedule and seat." },
                  { title: "Review", desc: "Confirm details in a summary." },
                  { title: "Book", desc: "Complete booking and save history." },
                ].map((step) => (
                  <div
                    key={step.title}
                    className="rounded-3xl bg-slate-950/60 border border-white/10 p-4"
                  >
                    <p className="text-sm font-semibold text-white">
                      {step.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Closing line */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-sm text-slate-300 leading-relaxed">
                SafarBot is built with a focus on a strong interface, realistic user journeys,
                and a product-first design approach — ideal for showcasing a complete travel
                booking experience.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
