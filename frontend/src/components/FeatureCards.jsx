import React from "react";
import { ArrowRight, Star } from "lucide-react";
import Slider1 from "../assets/Slider1.jpg";
import Slider2 from "../assets/Slider2.jpg";
import Slider3 from "../assets/Slider3.jpg";
import landingImage from "../assets/landing.jpg";

const featuredRoutes = [
  {
    title: "Lahore to Islamabad",
    operator: "Premium coach route",
    price: "PKR 2,500",
    image: Slider1,
    tag: "Most booked",
  },
  {
    title: "Karachi to Hyderabad",
    operator: "Fast intercity service",
    price: "PKR 1,200",
    image: Slider2,
    tag: "Quick trip",
  },
  {
    title: "Multan to Lahore",
    operator: "Comfort seating",
    price: "PKR 1,850",
    image: Slider3,
    tag: "Popular",
  },
  {
    title: "Islamabad to Murree",
    operator: "Weekend escape",
    price: "PKR 1,500",
    image: landingImage,
    tag: "Scenic",
  },
];

const FeatureCards = () => {
  return (
    <section className="mt-14">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
            Featured
          </p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">
            Routes worth checking
          </h2>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 self-start rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm transition-colors hover:bg-blue-50"
        >
          View all
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {featuredRoutes.map((route) => (
          <article
            key={route.title}
            className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10"
          >
            <div className="relative h-44 overflow-hidden">
              <img
                src={route.image}
                alt={route.title}
                className="h-full w-full object-cover transition duration-500 hover:scale-105"
                loading="lazy"
              />
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-blue-700 backdrop-blur">
                {route.tag}
              </span>
            </div>

            <div className="p-4">
              <h3 className="text-lg font-extrabold leading-snug text-slate-950">
                {route.title}
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {route.operator}
              </p>

              <div className="mt-3 flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={14} fill="currentColor" />
                ))}
                <span className="ml-1 text-xs font-semibold text-slate-500">
                  4.8
                </span>
              </div>

              <div className="mt-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Starting from
                  </p>
                  <p className="text-lg font-extrabold text-slate-950">
                    {route.price}
                  </p>
                </div>

                <button
                  type="button"
                  className="rounded-full bg-blue-700 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-800"
                >
                  Explore
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default FeatureCards;
