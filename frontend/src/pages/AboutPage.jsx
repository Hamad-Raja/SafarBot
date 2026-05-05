import React from "react";
import { Mic2, Route, ShieldCheck, TicketCheck } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const highlights = [
  {
    title: "Voice and text search",
    icon: Mic2,
  },
  {
    title: "Clear seat selection",
    icon: TicketCheck,
  },
  {
    title: "Trip history",
    icon: Route,
  },
  {
    title: "Protected access",
    icon: ShieldCheck,
  },
];

const steps = [
  { title: "Search", desc: "Find routes using voice or text." },
  { title: "Select", desc: "Choose schedule and seat." },
  { title: "Review", desc: "Confirm details in a summary." },
  { title: "Book", desc: "Complete booking and save history." },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 pb-14 pt-10">
        <section className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
            About
          </p>

          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
            About SafarBot
          </h1>

          <p className="mt-3 max-w-3xl text-base font-medium leading-relaxed text-slate-600">
            SafarBot is a modern bus booking platform built for fast route
            discovery, clear seat selection, and a consistent travel dashboard.
          </p>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 md:p-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-4 text-sm font-medium leading-relaxed text-slate-600 md:col-span-2">
              <h2 className="text-xl font-extrabold text-slate-950">
                What SafarBot delivers
              </h2>

              <p>
                The app guides passengers through a structured booking journey:
                search a route, review available schedules, choose seats, and
                complete checkout with a clear trip summary.
              </p>

              <p>
                It is designed to feel calm and practical on both mobile and
                desktop, with booking details kept readable instead of buried in
                heavy screens.
              </p>

              <p>
                Role-based access lets passengers and operators work from the
                same product while keeping each workflow focused.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-extrabold text-slate-950">
                Key highlights
              </h3>

              <ul className="mt-4 space-y-3">
                {highlights.map((item) => {
                  const Icon = item.icon;

                  return (
                    <li
                      key={item.title}
                      className="flex items-center gap-3 text-sm font-semibold text-slate-700"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <Icon size={18} />
                      </span>
                      <span>{item.title}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="mb-4 text-xl font-extrabold text-slate-950">
              How the booking flow works
            </h2>

            <div className="grid gap-4 md:grid-cols-4">
              {steps.map((step) => (
                <div
                  key={step.title}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm font-extrabold text-slate-950">
                    {step.title}
                  </p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
