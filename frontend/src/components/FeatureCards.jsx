import React from 'react';

const features = [
  {
    title: "Simple Booking Experience",
    description:
      "Search routes, select seats, and confirm your trip through a clean and intuitive booking flow designed for speed and clarity.",
    icon: "🎫",
  },
  {
    title: "Transparent Pricing",
    description:
      "View available routes and fares upfront with no hidden charges, helping you make informed travel decisions.",
    icon: "💰",
  },
  {
    title: "Secure & Reliable",
    description:
      "Your account and booking data are protected using modern security practices to ensure a safe and reliable experience.",
    icon: "🛡️",
  },
];

const FeatureCards = () => {
  return (
    <section className="mt-12 grid gap-6 md:grid-cols-3">
      {features.map((f) => (
        <div
          key={f.title}
          className="bg-white rounded-3xl shadow-sm border border-slate-100 px-5 py-6 flex flex-col gap-3"
        >
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-xl">
            <span>{f.icon}</span>
          </div>
          <h3 className="font-semibold text-slate-800 text-lg">{f.title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed text-justify">{f.description}</p>
        </div>
      ))}
    </section>
  );
};

export default FeatureCards;
