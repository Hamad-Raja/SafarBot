import React from "react";
import Slider1 from "../assets/Slider1.jpg";

const HeroSlider = () => {
  return (
    <section className="relative -mt-[76px] min-h-[500px] overflow-hidden bg-slate-900 md:min-h-[540px]">
      <img
        src={Slider1}
        alt="Bus travel"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-4 pb-32 pt-28 md:pb-36 md:pt-32">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-[0_3px_14px_rgba(15,23,42,0.75)] md:text-6xl">
            Book your next bus trip
          </h1>

          <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-white drop-shadow-[0_2px_10px_rgba(15,23,42,0.7)] md:text-lg">
            Search routes, choose seats, and keep every trip organized in one
            clean dashboard.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;
