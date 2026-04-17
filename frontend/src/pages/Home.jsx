import React from 'react';
import Navbar from '../components/Navbar';
import HeroSlider from '../components/HeroSlider';
import SearchForm from '../components/SearchForm';
import FeatureCards from '../components/FeatureCards';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-10">
          <HeroSlider />
          <SearchForm />
          <FeatureCards />

          <section className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="bg-slate-900/70 rounded-3xl border border-white/10 shadow-lg shadow-cyan-500/20 p-5 flex flex-col gap-2 text-white">
              <h3 className="font-semibold text-lg">Why SafarBot?</h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                SafarBot is built specifically for academic and portfolio projects. It shows a
                full, realistic bus booking flow: role-based login, home page with hero slider,
                route search, seat selection, booking creation with MongoDB and a dummy payment
                success screen.
              </p>
            </div>
            <div className="bg-slate-900/70 rounded-3xl border border-white/10 shadow-lg shadow-emerald-500/20 p-5 flex flex-col gap-2 text-white">
              <h3 className="font-semibold text-lg">Operators Included</h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                Dummy routes cover popular Pakistani bus services like Faisal Movers, Daewoo
                Express, Bilal Travels and Skyways. You can extend the JSON on the backend to add
                more cities and timings depending on your university requirements.
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
