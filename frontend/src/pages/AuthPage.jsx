import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpeg";
import toast from "react-hot-toast";

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { register, login, loading } = useAuth();

  // Default = login. Switch using /auth?mode=register
  const modeFromUrl = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("mode") === "register" ? "register" : "login";
  }, [location.search]);

  const [mode, setMode] = useState(modeFromUrl); // 'login' | 'register'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    setMode(modeFromUrl);
    setPassword(""); // clear password on mode switch
  }, [modeFromUrl]);

  const goMode = (nextMode) => {
    if (nextMode === "login") setName("");
    setMode(nextMode);
    navigate(`/auth?mode=${nextMode}`, { replace: true });
  };

  const isValidName = (name) => {
    return /^[A-Za-z\s]+$/.test(name);
  };

  const isValidPassword = (password) => {
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      password
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "register") {
      if (!isValidName(name)) {
        toast.error("Name can only contain alphabetic characters and spaces.");
        return;
      }
      if (!isValidPassword(password)) {
        toast.error(
          "Password must be at least 8 characters long and include at least one uppercase letter, one number, and one special character."
        );
        return;
      }
    }

    if (mode === "register") {
      const res = await register({ name, email, password });
      if (res.success) {
        toast.success("Account created. Please sign in.");
        goMode("login");
      } else {
        toast.error(res.message);
      }
      return;
    }

    const res = await login({ email, password });
    if (!res.success) {
      toast.error(res.message);
      return;
    }

    const user = res.user;
    if (user?.role === "admin") navigate("/admin/dashboard");
    else if (user?.role === "provider") navigate("/provider/dashboard");
    else navigate("/home");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md bg-slate-900/70 border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-500/30 p-6 md:p-8 text-white">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-emerald-400 to-cyan-600 flex items-center justify-center mb-2 shadow-lg shadow-cyan-500/50">
            <img
              src={logo}
              alt="SafarBot Logo"
              className="object-contain rounded-xl h-10 w-10"
            />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-center">
            {mode === "login"
              ? "Welcome back to SafarBot"
              : "Create your SafarBot account"}
          </h1>

          <p className="mt-1 text-xs text-slate-400 text-center max-w-sm">
            {mode === "login"
              ? "Sign in to continue your booking experience."
              : "Create an account to book seats faster and manage your trips."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {mode === "register" && (
            <div>
              <label className="text-[11px] font-semibold text-slate-200">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 text-white placeholder:text-slate-500"
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-slate-200">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 text-white placeholder:text-slate-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-200">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 text-white placeholder:text-slate-500"
              placeholder="Minimum 8 characters"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </div>

          {/* Optional: Forgot password placeholder */}
          {mode === "login" && (
            <div className="flex justify-end">
              <button
                type="button"
                className="text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
                onClick={() =>
                  toast.success("Forgot password flow can be added later.")
                }
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-semibold rounded-2xl py-2.5 shadow-lg shadow-cyan-500/40 hover:shadow-cyan-400/60 transition-all disabled:opacity-70 text-sm"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        {/* Bottom switch (ONLY) */}
        <p className="mt-4 text-[11px] text-slate-400 text-center">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => goMode("register")}
                className="text-cyan-300 font-semibold hover:underline"
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already registered?{" "}
              <button
                type="button"
                onClick={() => goMode("login")}
                className="text-cyan-300 font-semibold hover:underline"
              >
                Login
              </button>
            </>
          )}
        </p>

        {/* Provider entry point */}
        <div className="mt-3 text-center text-[11px] text-slate-400">
          Are you a transport provider?{" "}
          <Link
            to="/provider/apply"
            className="text-cyan-300 font-semibold hover:underline"
          >
            Apply here
          </Link>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;
