import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import toast from "react-hot-toast";

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    toast.success("Thanks! Your message has been submitted. (You can connect this form to your backend later.)");
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-14 text-white">
          {/* Header */}
          <div className="mb-8">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold text-cyan-300 uppercase tracking-[0.2em]">
              <span className="h-px w-6 bg-cyan-400" />
              Contact
            </p>

            <h1 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
              Contact <span className="text-cyan-300">SafarBot</span>
            </h1>

            <p className="mt-3 text-sm md:text-base text-slate-300 leading-relaxed max-w-3xl">
              Need help with bookings, routes, or account access? Reach out to our support team and
              we’ll respond as soon as possible.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Left: contact info */}
            <div className="rounded-3xl bg-slate-900/70 border border-white/10 shadow-xl shadow-cyan-500/20 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-white">Support Information</h2>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                For quick assistance, use the contact details below or submit the form. Please
                include your email and a clear message so we can help faster.
              </p>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <span className="h-9 w-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    ✉️
                  </span>
                  <div>
                    <p className="text-slate-400 text-xs">Email</p>
                    <a
                      href="mailto:support@safarbot.com"
                      className="text-white font-semibold hover:text-cyan-300 transition-colors"
                    >
                      support@safarbot.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="h-9 w-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    ☎️
                  </span>
                  <div>
                    <p className="text-slate-400 text-xs">Phone</p>
                    <a
                      href="tel:+923090000000"
                      className="text-white font-semibold hover:text-cyan-300 transition-colors"
                    >
                      +92 309 0000000
                    </a>
                    <p className="text-xs text-slate-500 mt-1">Support hours: 9:00 AM – 9:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="h-9 w-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    📍
                  </span>
                  <div>
                    <p className="text-slate-400 text-xs">Location</p>
                    <p className="text-white font-semibold">Pakistan</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Intercity travel support and platform assistance
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-3xl bg-slate-950/60 border border-white/10 p-5">
                <p className="text-sm text-slate-300 leading-relaxed">
                  Tip: If you’re contacting about a booking, include route, date, and your account
                  email so we can resolve it faster.
                </p>
              </div>
            </div>

            {/* Right: form */}
            <div className="rounded-3xl bg-slate-900/70 border border-white/10 shadow-xl shadow-cyan-500/20 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-white">Send us a message</h2>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Fill out the form below and our team will get back to you.
              </p>

              <form onSubmit={onSubmit} className="mt-6 space-y-4 text-sm">
                <div>
                  <label className="text-[11px] font-semibold text-slate-200">Full Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    type="text"
                    required
                    className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 text-white placeholder:text-slate-500"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-200">Email</label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    type="email"
                    required
                    className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 text-white placeholder:text-slate-500"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-200">Subject</label>
                  <input
                    name="subject"
                    value={form.subject}
                    onChange={onChange}
                    type="text"
                    required
                    className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 text-white placeholder:text-slate-500"
                    placeholder="e.g., Booking issue / Account help"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-200">Message</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={onChange}
                    rows={5}
                    required
                    className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 text-white placeholder:text-slate-500 resize-none"
                    placeholder="Write your message here..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 py-2.5 rounded-2xl text-sm font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-shadow"
                >
                  Send Message
                </button>

                <p className="text-[11px] text-slate-500 text-center">
                  We typically respond within 24 hours during business days.
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
