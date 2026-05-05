import React from "react";
import { Bell, CalendarCheck, ShieldCheck } from "lucide-react";
import Navbar from "../components/Navbar";
import HeroSlider from "../components/HeroSlider";
import SearchForm from "../components/SearchForm";
import FeatureCards from "../components/FeatureCards";
import Footer from "../components/Footer";

const dashboardHighlights = [
  {
    title: "Trip reminders",
    text: "Keep upcoming departures visible before you travel.",
    icon: Bell,
  },
  {
    title: "Seat-first booking",
    text: "Pick seats clearly before moving to payment.",
    icon: CalendarCheck,
  },
  {
    title: "Clean confirmations",
    text: "Every booking stays easy to review later.",
    icon: ShieldCheck,
  },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <main>
        <HeroSlider />
        <SearchForm />

        <div className="mx-auto max-w-6xl px-4 pb-14">
          <FeatureCards />

          <section className="mt-14 overflow-hidden rounded-[2rem] bg-blue-700 text-white shadow-2xl shadow-blue-900/20">
            <div className="grid gap-6 p-6 md:grid-cols-[0.95fr,1.05fr] md:p-10">
              <div className="flex flex-col justify-center">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
                  SafarBot dashboard
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
                  Your bus travel, sorted.
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-blue-50 md:text-base">
                  Plan the route, confirm the seats, and return anytime to see
                  your booking history without digging through old screens.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {dashboardHighlights.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-3xl border border-white/20 bg-white/12 p-4 backdrop-blur-xl"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-700">
                        <Icon size={19} />
                      </div>
                      <h3 className="mt-4 text-sm font-extrabold">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-blue-50">
                        {item.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
