import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.jpeg";

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-white/10 text-slate-400">
      <div className="max-w-6xl mx-auto px-4 py-12 grid gap-10 md:grid-cols-4">
        {/* Brand */}
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-emerald-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
              <img
                src={logo}
                alt="SafarBot Logo"
                className="h-8 w-8 object-contain rounded-xl"
              />
            </div>

            <h3 className="text-white text-lg font-semibold tracking-tight">
              SafarBot
            </h3>
          </div>

          <p className="mt-3 text-sm leading-relaxed max-w-md">
            SafarBot is a smart bus booking platform designed to simplify
            intercity travel through voice and text-based search, clear seat
            selection, and reliable booking flows.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white text-sm font-semibold mb-3">Platform</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                to="/about"
                className="hover:text-cyan-300 transition-colors"
              >
                About SafarBot
              </Link>
            </li>
            <li>
              <Link
                to="/auth"
                className="hover:text-cyan-300 transition-colors"
              >
                Sign In / Register
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="hover:text-cyan-300 transition-colors"
              >
                Contact Support
              </Link>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-white text-sm font-semibold mb-3">Support</h4>
          <ul className="space-y-2 text-sm">
            <li>
              Email:{" "}
              <a
                href="mailto:support@safarbot.com"
                className="hover:text-cyan-300 transition-colors"
              >
                support@safarbot.com
              </a>
            </li>
            <li>
              Phone:{" "}
              <a
                href="+92 309 0000000"
                className="hover:text-cyan-300 transition-colors"
              >
                +92 309 0000000
              </a>
            </li>
            <li className="text-slate-500">24/7 Customer Support</li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            © {new Date().getFullYear()} SafarBot. All rights reserved.
          </span>

          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-cyan-300 transition-colors">
              Terms
            </Link>
            <Link
              to="/privacy"
              className="hover:text-cyan-300 transition-colors"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
