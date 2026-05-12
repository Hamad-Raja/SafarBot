import React, { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const ContactPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    toast.success("Thanks! Your message has been submitted.");
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-500 via-blue-50 to-white text-slate-950">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pb-14 pt-10">
        <section className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
            Contact
          </p>

          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
            Contact SafarBot
          </h1>

          <p className="mt-3 max-w-3xl text-base font-medium leading-relaxed text-slate-600">
            Need help with bookings, routes, or account access? Send a message
            and the support team can follow up.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 md:p-8">
            <h2 className="text-xl font-extrabold text-slate-950">
              Support Information
            </h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
              Use the contact details below or submit the form. Include your
              account email if the message is about a booking.
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <Mail size={20} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    Email
                  </p>
                  <a
                    href="mailto:support@safarbot.com"
                    className="text-sm font-extrabold text-slate-950 transition-colors hover:text-blue-700"
                  >
                    support@safarbot.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <Phone size={20} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    Phone
                  </p>
                  <a
                    href="tel:+923090000000"
                    className="text-sm font-extrabold text-slate-950 transition-colors hover:text-blue-700"
                  >
                    +92 309 0000000
                  </a>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Support hours: 9:00 AM to 9:00 PM
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <MapPin size={20} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    Location
                  </p>
                  <p className="text-sm font-extrabold text-slate-950">
                    Pakistan
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Intercity travel support and platform assistance
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-medium leading-relaxed text-blue-800">
                For booking questions, include route, date, and account email so
                support can resolve it faster.
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 md:p-8">
            <h2 className="text-xl font-extrabold text-slate-950">
              Send us a message
            </h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
              Fill out the form and the team will get back to you.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Full Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  type="text"
                  required
                  className="mt-2 h-12 w-full rounded-[18px] border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Email
                </label>
                <input
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  type="email"
                  required
                  className="mt-2 h-12 w-full rounded-[18px] border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Subject
                </label>
                <input
                  name="subject"
                  value={form.subject}
                  onChange={onChange}
                  type="text"
                  required
                  className="mt-2 h-12 w-full rounded-[18px] border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15"
                  placeholder="Booking issue / Account help"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Message
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={onChange}
                  rows={5}
                  required
                  className="mt-2 w-full resize-none rounded-[18px] border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15"
                  placeholder="Write your message here..."
                />
              </div>

              <button
                type="submit"
                className="h-12 w-full rounded-[18px] bg-blue-700 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition-colors hover:bg-blue-800"
              >
                Send Message
              </button>

              <p className="text-center text-xs font-medium text-slate-500">
                We typically respond within 24 hours during business days.
              </p>
            </form>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
