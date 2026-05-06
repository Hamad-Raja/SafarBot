import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.jpeg";

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md shadow-blue-900/10 ring-1 ring-slate-200">
              <img
                src={logo}
                alt="SafarBot Logo"
                className="h-8 w-8 rounded-full object-contain"
              />
            </div>

            <h3 className="text-lg font-extrabold tracking-tight text-slate-950">
              SafarBot
            </h3>
          </div>

          <p className="mt-3 max-w-md text-sm font-medium leading-relaxed">
            A clean bus booking dashboard for route search, seat selection, and
            trip management.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-extrabold text-slate-950">Platform</h4>
          <ul className="space-y-2 text-sm font-medium">
            <li>
              <Link to="/about" className="transition-colors hover:text-blue-700">
                About SafarBot
              </Link>
            </li>
            <li>
              <Link to="/auth" className="transition-colors hover:text-blue-700">
                Sign In / Register
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="transition-colors hover:text-blue-700"
              >
                Contact Support
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-extrabold text-slate-950">Support</h4>
          <ul className="space-y-2 text-sm font-medium">
            <li>
              <a
                href="mailto:support@safarbot.com"
                className="transition-colors hover:text-blue-700"
              >
                support@safarbot.com
              </a>
            </li>
            <li>
              <a
                href="tel:+923090000000"
                className="transition-colors hover:text-blue-700"
              >
                +92 309 0000000
              </a>
            </li>
            <li className="text-slate-500">24/7 customer support</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs font-medium text-slate-500 sm:flex-row">
          <span>
            Copyright {new Date().getFullYear()} SafarBot. All rights reserved.
          </span>

          <div className="flex gap-4">
            <Link to="/terms" className="transition-colors hover:text-blue-700">
              Terms
            </Link>
            <Link
              to="/privacy"
              className="transition-colors hover:text-blue-700"
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
