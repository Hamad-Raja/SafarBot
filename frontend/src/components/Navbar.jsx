import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpeg";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [openProfile, setOpenProfile] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);

  const role = user?.role || "guest";

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
      isActive ? "text-blue-700" : "text-slate-700 hover:text-blue-700"
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
      { to: "/my-bookings", label: "My Bookings" },
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

  const brandTarget =
    role === "admin"
      ? "/admin/dashboard"
      : role === "provider"
      ? "/provider/dashboard"
      : role === "user"
      ? "/home"
      : "/";

  return (
    <nav className="sticky top-0 z-40 w-full px-4 pt-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/45 bg-white/25 px-4 py-2.5 shadow-xl shadow-slate-900/10 ring-1 ring-white/20 backdrop-blur-2xl">
        <Link to={brandTarget} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md shadow-blue-900/10 ring-1 ring-slate-200">
            <img
              src={logo}
              alt="SafarBot Logo"
              className="h-8 w-8 rounded-full object-contain"
            />
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-lg font-extrabold tracking-tight text-slate-950">
              SafarBot
            </span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-700 sm:block">
              Travel Desk
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={navLinkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpenMobile((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-slate-800 transition-colors hover:bg-white md:hidden"
            aria-label="Toggle menu"
          >
            {openMobile ? <X size={18} /> : <Menu size={18} />}
          </button>

          {!user && (
            <>
              <button
                onClick={() => navigate("/auth?mode=login")}
                className="hidden rounded-full border border-blue-200 bg-white/70 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 sm:inline-flex"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/auth?mode=register")}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-colors hover:bg-blue-800"
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
                className="flex items-center gap-2 rounded-full bg-slate-950 px-2.5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-colors hover:bg-blue-800"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-extrabold text-blue-700">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
                <span className="hidden max-w-28 truncate sm:inline">
                  {user.name || "Profile"}
                </span>
              </button>

              {openProfile && (
                <div className="absolute right-0 z-50 mt-3 w-48 overflow-hidden rounded-3xl border border-slate-100 bg-white p-2 text-sm shadow-2xl shadow-slate-900/15">
                  <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="block w-full rounded-2xl px-3 py-2 text-left text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Profile Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/my-bookings")}
                    className="block w-full rounded-2xl px-3 py-2 text-left text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    My Bookings
                  </button>
                  <div className="my-1 h-px bg-slate-100" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full rounded-2xl px-3 py-2 text-left text-red-600 transition-colors hover:bg-red-50"
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
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {openMobile && (
        <div className="mx-auto mt-3 max-w-6xl rounded-3xl border border-white/45 bg-white/35 p-3 shadow-xl shadow-slate-900/10 ring-1 ring-white/20 backdrop-blur-2xl md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-2xl px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}

            {!user && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate("/auth?mode=login")}
                  className="rounded-2xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/auth?mode=register")}
                  className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                >
                  Get Started
                </button>
              </div>
            )}

            {user && (
              <button
                onClick={handleLogout}
                className="mt-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
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
