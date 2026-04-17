import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpeg";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [openProfile, setOpenProfile] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);

  const role = user?.role || "guest";

  // close dropdowns on route change (professional UX)
  useEffect(() => {
    setOpenProfile(false);
    setOpenMobile(false);
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-semibold transition-colors ${
      isActive ? "text-cyan-600" : "text-slate-600 hover:text-cyan-600"
    }`;

  const guestLinks = useMemo(
    () => [
      { to: "/", label: "Home" },
      { to: "/about", label: "About" },
      { to: "/contact", label: "Contact" },
    ],
    []
  );

  const userLinks = useMemo(
    () => [
      { to: "/home", label: "Home" },
      { to: "/about", label: "About" },
      { to: "/contact", label: "Contact" },
    ],
    []
  );

  const providerLinks = useMemo(
    () => [
      { to: "/provider/dashboard", label: "Dashboard" },
      { to: "/provider/routes", label: "Routes" },
      { to: "/provider/fraud-alerts", label: "Fraud Alerts" },
    ],
    []
  );

  const adminLinks = useMemo(
    () => [
      { to: "/admin/dashboard", label: "Dashboard" },
      { to: "/admin/users", label: "Users" },
      { to: "/admin/providers", label: "Providers" },
      { to: "/admin/reports", label: "Reports" },
    ],
    []
  );

  const links =
    role === "admin"
      ? adminLinks
      : role === "provider"
      ? providerLinks
      : role === "user"
      ? userLinks
      : guestLinks;

  return (
    <nav className="w-full bg-white/90 backdrop-blur border-b border-slate-100 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-emerald-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/40">
            <img
              src={logo}
              alt="SafarBot Logo"
              className="h-8 w-8 object-contain rounded-xl"
            />
          </div>

          <div className="flex flex-col leading-tight">
            <span className="font-bold text-lg tracking-tight text-slate-900">
              SafarBot
            </span>
            {/* <span className="text-xs text-slate-500 -mt-1">
              Voice &amp; Text Booking
            </span> */}
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={navLinkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setOpenMobile((v) => !v)}
            className="md:hidden h-10 w-10 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
            aria-label="Toggle menu"
          >
            {openMobile ? "✕" : "☰"}
          </button>

          {!user && (
            <>
              <button
                onClick={() => navigate("/auth?mode=login")}
                className="hidden sm:inline-flex px-4 py-2 rounded-full border border-cyan-500/40 text-cyan-700 font-semibold text-sm hover:bg-cyan-50 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/auth?mode=register")}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 text-white font-semibold text-sm shadow-md hover:shadow-cyan-500/30 transition-shadow"
              >
                Get Started
              </button>
            </>
          )}

          {user && role === "user" && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenProfile((v) => !v)}
                className="px-3 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold flex items-center gap-2 border border-slate-200/40"
              >
                <span className="h-6 w-6 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 text-white flex items-center justify-center text-xs">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
                <span className="hidden sm:inline">
                  {user.name || "Profile"}
                </span>
              </button>

              {openProfile && (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white shadow-lg shadow-slate-400/20 border border-slate-100 text-xs py-2 z-40 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Profile Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/my-bookings")}
                    className="block w-full text-left px-3 py-2 hover:bg-slate-50"
                  >
                    My Bookings
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          {user && (role === "provider" || role === "admin") && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {openMobile && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-2xl text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-cyan-50 text-cyan-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}

            {!user && (
              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => navigate("/auth?mode=login")}
                  className="flex-1 px-4 py-2 rounded-2xl border border-cyan-500/40 text-cyan-700 font-semibold text-sm hover:bg-cyan-50 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/auth?mode=register")}
                  className="flex-1 px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-white font-semibold text-sm"
                >
                  Get Started
                </button>
              </div>
            )}

            {user && (
              <button
                onClick={handleLogout}
                className="mt-2 px-4 py-2 rounded-2xl bg-slate-900 text-white font-semibold text-sm"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
