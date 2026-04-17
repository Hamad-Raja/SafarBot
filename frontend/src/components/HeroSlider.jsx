import React, { useEffect, useState } from "react";

import Slider1 from '../assets/Slider1.jpg';
import Slider2 from '../assets/Slider2.jpg';
import Slider3 from '../assets/Slider3.jpg';

const slides = [
  {
    title: "Book Faster with Voice or Text",
    subtitle:
      "Search routess, check schedules, and start booking — hands-free when you need it.",
    image: Slider1
  },
  {
    title: "Seats, Schedules, and Clear Pricing",
    subtitle:
      "Select your preferred seat, review trip details, and confirm with confidence.",
    image: Slider2,
  },
  {
    title: "Built for Intercity Travel ",
    subtitle:
      "Designed for real workflows used by passengers and bus operators.",
    image: Slider3,
  },
];

const HeroSlider = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const current = slides[index];

  return (
    <section className="w-full rounded-[2rem] overflow-hidden bg-slate-900/80 border border-white/10 shadow-2xl shadow-cyan-500/30 flex flex-col md:flex-row mb-8">
      <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold text-cyan-300 uppercase tracking-[0.2em] mb-3">
          <span className="h-px w-6 bg-cyan-400" />
          SafarBot Booking Platform
        </p>

        <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-2">
          {current.title}
        </h2>

        <p className="text-sm md:text-base text-slate-300 max-w-md mb-4">
          {current.subtitle}
        </p>

        {/* Professional feature list (short + real-world) */}
        <ul className="text-[11px] text-slate-400 space-y-1.5">
          <li>•Voice and text-based route search</li>
          <li>• Pick seats visually, not blindly</li>
          
        </ul>
      </div>

      <div className="relative flex-1 min-h-[220px] md:min-h-[280px]">
        <img
          src={current.image}
          alt={current.title}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-900/10 to-transparent" />

        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 w-2 rounded-full border border-white/70 transition-all ${
                index === i ? "bg-white scale-110" : "bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;
