import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Api from "../api/api";
import { useAuth } from "../context/AuthContext";
import landing from "../assets/landing.jpg";

const inputClass =
  "mt-1 w-full rounded-2xl border border-slate-950/15 bg-white/75 px-3 py-2.5 text-sm text-slate-950 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950/70";

const labelClass = "text-[11px] font-bold uppercase tracking-wide text-slate-900";

const isValidName = (value) => /^[A-Za-z\s]+$/.test(value.trim());
const isValidPhone = (value) => /^[0-9+\-\s]{8,20}$/.test(value.trim());
const isValidCNIC = (value) => /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(value.trim());
const isValidPassword = (value) =>
  /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);

const getModeFromLocation = (location) => {
  const params = new URLSearchParams(location.search);
  const queryMode = params.get("mode");

  if (location.pathname === "/provider/apply" || queryMode === "provider") {
    return "provider";
  }

  if (location.pathname === "/register" || queryMode === "register") {
    return "register";
  }

  return "login";
};

const shouldOpenAuth = (location) =>
  location.pathname !== "/" || new URLSearchParams(location.search).has("mode");

const Landing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, login, loading } = useAuth();

  const authSectionRef = useRef(null);
  const [authVisible, setAuthVisible] = useState(false);
  const [authMode, setAuthMode] = useState(() => getModeFromLocation(location));
  const [providerLoading, setProviderLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [providerForm, setProviderForm] = useState({
    fullName: "",
    contactNumber: "",
    email: "",
    password: "",
    companyName: "",
    businessAddress: "",
    city: "",
    cnic: "",
    licenseNumber: "",
    fleetSize: "",
  });

  useEffect(() => {
    const target = authSectionRef.current;
    if (!target) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setAuthVisible(entry.isIntersecting),
      { threshold: 0.35 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const nextMode = getModeFromLocation(location);
    setAuthMode(nextMode);

    if (shouldOpenAuth(location)) {
      window.setTimeout(() => {
        authSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 80);
    }
  }, [location]);

  const openAuth = (mode) => {
    if (mode === "provider") {
      navigate("/provider/apply");
      return;
    }

    navigate(`/auth?mode=${mode}`);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await login(loginForm);
    if (!res.success) {
      toast.error(res.message);
      return;
    }

    const user = res.user;
    if (user?.role === "admin") navigate("/admin/dashboard");
    else if (user?.role === "provider") navigate("/provider/dashboard");
    else navigate("/home");
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!isValidName(registerForm.name)) {
      toast.error("Name can only contain alphabetic characters and spaces.");
      return;
    }

    if (!isValidPassword(registerForm.password)) {
      toast.error(
        "Password must be 8+ characters with 1 uppercase, 1 number, and 1 special character."
      );
      return;
    }

    const res = await register(registerForm);
    if (!res.success) {
      toast.error(res.message);
      return;
    }

    toast.success("Account created. Please sign in.");
    setRegisterForm({ name: "", email: "", password: "" });
    openAuth("login");
  };

  const handleProviderSubmit = async (e) => {
    e.preventDefault();

    if (!isValidName(providerForm.fullName)) {
      toast.error("Full name must contain only letters and spaces.");
      return;
    }

    if (!isValidPhone(providerForm.contactNumber)) {
      toast.error("Please enter a valid contact number.");
      return;
    }

    if (!isValidPassword(providerForm.password)) {
      toast.error(
        "Password must be 8+ characters with 1 uppercase, 1 number, and 1 special character."
      );
      return;
    }

    if (!providerForm.companyName.trim() || providerForm.companyName.trim().length < 2) {
      toast.error("Please enter a valid company name.");
      return;
    }

    if (
      !providerForm.businessAddress.trim() ||
      providerForm.businessAddress.trim().length < 5
    ) {
      toast.error("Please enter a valid business address.");
      return;
    }

    if (!providerForm.city.trim()) {
      toast.error("Please enter your city.");
      return;
    }

    if (!isValidCNIC(providerForm.cnic)) {
      toast.error("CNIC format should be 12345-1234567-1");
      return;
    }

    if (!providerForm.licenseNumber.trim() || providerForm.licenseNumber.trim().length < 3) {
      toast.error("Please enter a valid transport license number.");
      return;
    }

    if (
      providerForm.fleetSize &&
      (Number.isNaN(Number(providerForm.fleetSize)) ||
        Number(providerForm.fleetSize) < 1)
    ) {
      toast.error("Fleet size must be a number, 1 or more.");
      return;
    }

    try {
      setProviderLoading(true);

      await Api.post("/api/auth/provider/register", {
        name: providerForm.fullName,
        email: providerForm.email,
        password: providerForm.password,
        contactNumber: providerForm.contactNumber,
        companyName: providerForm.companyName,
        businessAddress: providerForm.businessAddress,
        city: providerForm.city,
        cnic: providerForm.cnic,
        licenseNumber: providerForm.licenseNumber,
        fleetSize: providerForm.fleetSize ? Number(providerForm.fleetSize) : null,
      });

      toast.success("Application submitted! Pending admin approval.");
      setProviderForm({
        fullName: "",
        contactNumber: "",
        email: "",
        password: "",
        companyName: "",
        businessAddress: "",
        city: "",
        cnic: "",
        licenseNumber: "",
        fleetSize: "",
      });
      openAuth("login");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to submit application.");
    } finally {
      setProviderLoading(false);
    }
  };

  const updateLogin = (field) => (e) =>
    setLoginForm((prev) => ({ ...prev, [field]: e.target.value }));

  const updateRegister = (field) => (e) =>
    setRegisterForm((prev) => ({ ...prev, [field]: e.target.value }));

  const updateProvider = (field) => (e) =>
    setProviderForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="relative isolate h-[100dvh] overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth bg-slate-950 text-white">
      <div className="fixed inset-0 -z-10">
        <img
          src={landing}
          alt="SafarBot bus travel"
          className="h-full w-full object-cover object-[center_62%]"
        />
      </div>

      <header
        className={`sticky top-0 z-30 px-4 pt-3 transition-all duration-500 ${
          authVisible
            ? "pointer-events-none -translate-y-6 opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/30 bg-white/20 px-4 py-2.5 shadow-xl shadow-slate-950/15 backdrop-blur-2xl sm:px-5">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 shadow-lg shadow-slate-950/30">
              <img
                src="/images/logo.jpeg"
                alt="SafarBot Logo"
                className="h-8 w-8 rounded-xl object-contain"
              />
            </span>

            <span className="font-bold tracking-tight text-slate-950">
              SafarBot
            </span>
          </button>

          <button
            type="button"
            onClick={() => openAuth("login")}
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-slate-950/20 transition-colors hover:bg-slate-800"
          >
            Login
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <section className="flex min-h-[calc(100dvh-76px)] snap-start items-center py-10 sm:py-14 lg:py-16">
          <div
            className={`mt-16 max-w-2xl text-center transition-all duration-500 sm:mt-20 lg:ml-8 lg:mt-12 lg:text-left ${
              authVisible
                ? "-translate-y-5 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
          >
            <p className="mb-4 inline-flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black sm:text-[11px] lg:justify-start">
              <span className="h-px w-6 bg-black" />
              Travel Booking Made Easy
            </p>

            <h1 className="text-4xl font-extrabold leading-tight text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.65)] sm:text-5xl lg:text-6xl">
              Book bus tickets{" "}
              <span className="text-slate-950 drop-shadow-[0_1px_10px_rgba(255,255,255,0.55)]">
                faster
              </span>{" "}
              in one clean flow.
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-sm font-semibold leading-relaxed text-black sm:text-base lg:mx-0">
              Search routes, choose your seat, and confirm in seconds.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <button
                type="button"
                onClick={() => openAuth("login")}
                className="w-full rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/25 transition-colors hover:bg-slate-800 sm:w-auto"
              >
                Get started
              </button>

              <button
                type="button"
                onClick={() => openAuth("register")}
                className="w-full rounded-full border border-slate-950/30 bg-slate-950/80 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 backdrop-blur transition-colors hover:bg-slate-950 sm:w-auto"
              >
                Create account
              </button>
            </div>
          </div>
        </section>

        <section
          ref={authSectionRef}
          className="flex min-h-[100dvh] snap-start items-center justify-center py-12 sm:py-16"
        >
          <div
            className={`mb-4 mt-4 w-full transition-all duration-700 sm:mt-6 ${
              authVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            <div className="mx-auto mb-4 flex max-w-xl rounded-full border border-white/35 bg-white/25 p-1.5 shadow-lg shadow-slate-950/10 backdrop-blur-2xl">
              {[
                ["login", "Login"],
                ["register", "Register"],
                ["provider", "Provider"],
              ].map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => openAuth(mode)}
                  className={`flex-1 rounded-full px-3 py-2 text-xs font-bold transition-colors ${
                    authMode === mode
                      ? "bg-slate-950 text-white"
                      : "text-slate-950 hover:bg-white/35"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {authMode === "login" && (
              <LoginCard
                form={loginForm}
                loading={loading}
                onSubmit={handleLogin}
                onChange={updateLogin}
                onSwitch={openAuth}
              />
            )}

            {authMode === "register" && (
              <RegisterCard
                form={registerForm}
                loading={loading}
                onSubmit={handleRegister}
                onChange={updateRegister}
                onSwitch={openAuth}
              />
            )}

            {authMode === "provider" && (
              <ProviderCard
                form={providerForm}
                loading={providerLoading}
                onSubmit={handleProviderSubmit}
                onChange={updateProvider}
                onSwitch={openAuth}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

const CardShell = ({ title, subtitle, children, wide = false }) => (
  <div
    className={`mx-auto rounded-3xl border border-white/35 bg-white/25 p-5 text-slate-950 shadow-2xl shadow-slate-950/25 backdrop-blur-2xl sm:p-6 ${
      wide ? "max-w-3xl" : "max-w-md"
    }`}
  >
    <div className="mb-4 text-center">
      <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
      <p className="mt-1 text-xs font-medium text-slate-800">{subtitle}</p>
    </div>

    {children}
  </div>
);

const LoginCard = ({ form, loading, onSubmit, onChange, onSwitch }) => (
  <CardShell title="Welcome back" subtitle="Sign in to continue your booking.">
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField
        label="Email"
        type="email"
        value={form.email}
        onChange={onChange("email")}
        placeholder="you@example.com"
      />
      <FormField
        label="Password"
        type="password"
        value={form.password}
        onChange={onChange("password")}
        placeholder="Minimum 8 characters"
        autoComplete="current-password"
        minLength={8}
      />
      <SubmitButton loading={loading} label="Sign In" loadingLabel="Please wait..." />
    </form>

    <p className="mt-4 text-center text-[11px] font-medium text-slate-800">
      New to SafarBot?{" "}
      <button
        type="button"
        onClick={() => onSwitch("register")}
        className="font-bold text-slate-950 underline-offset-2 hover:underline"
      >
        Create account
      </button>
    </p>
  </CardShell>
);

const RegisterCard = ({ form, loading, onSubmit, onChange, onSwitch }) => (
  <CardShell
    title="Create your account"
    subtitle="Register to book seats faster and manage trips."
  >
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField
        label="Full Name"
        type="text"
        value={form.name}
        onChange={onChange("name")}
        placeholder="Enter your full name"
      />
      <FormField
        label="Email"
        type="email"
        value={form.email}
        onChange={onChange("email")}
        placeholder="you@example.com"
      />
      <FormField
        label="Password"
        type="password"
        value={form.password}
        onChange={onChange("password")}
        placeholder="Strong password"
        autoComplete="new-password"
        minLength={8}
      />
      <SubmitButton
        loading={loading}
        label="Create Account"
        loadingLabel="Creating..."
      />
    </form>

    <p className="mt-4 text-center text-[11px] font-medium text-slate-800">
      Already registered?{" "}
      <button
        type="button"
        onClick={() => onSwitch("login")}
        className="font-bold text-slate-950 underline-offset-2 hover:underline"
      >
        Login
      </button>
    </p>
  </CardShell>
);

const ProviderCard = ({ form, loading, onSubmit, onChange, onSwitch }) => (
  <CardShell
    title="Transport Provider Application"
    subtitle="Submit your details for admin approval."
    wide
  >
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FormField
          label="Full Name"
          type="text"
          value={form.fullName}
          onChange={onChange("fullName")}
          placeholder="Ali Khan"
        />
        <FormField
          label="Contact Number"
          type="text"
          value={form.contactNumber}
          onChange={onChange("contactNumber")}
          placeholder="+92 3xx xxxxxxx"
        />
        <FormField
          label="Email"
          type="email"
          value={form.email}
          onChange={onChange("email")}
          placeholder="provider@example.com"
        />
        <FormField
          label="Password"
          type="password"
          value={form.password}
          onChange={onChange("password")}
          placeholder="Strong password"
          autoComplete="new-password"
          minLength={8}
        />
        <FormField
          label="Company Name"
          type="text"
          value={form.companyName}
          onChange={onChange("companyName")}
          placeholder="Safar Travels"
        />
        <FormField
          label="City"
          type="text"
          value={form.city}
          onChange={onChange("city")}
          placeholder="Islamabad"
        />
        <FormField
          label="CNIC"
          type="text"
          value={form.cnic}
          onChange={onChange("cnic")}
          placeholder="12345-1234567-1"
        />
        <FormField
          label="Transport License No."
          type="text"
          value={form.licenseNumber}
          onChange={onChange("licenseNumber")}
          placeholder="License number"
        />
      </div>

      <FormField
        label="Business Address"
        type="text"
        value={form.businessAddress}
        onChange={onChange("businessAddress")}
        placeholder="Office / terminal address"
      />
      <FormField
        label="Fleet Size"
        type="number"
        value={form.fleetSize}
        onChange={onChange("fleetSize")}
        placeholder="Optional"
        min="1"
        required={false}
      />

      <SubmitButton
        loading={loading}
        label="Submit Application"
        loadingLabel="Submitting..."
      />
    </form>

    <p className="mt-4 text-center text-[11px] font-medium text-slate-800">
      Already approved?{" "}
      <button
        type="button"
        onClick={() => onSwitch("login")}
        className="font-bold text-slate-950 underline-offset-2 hover:underline"
      >
        Login
      </button>
    </p>
  </CardShell>
);

const FormField = ({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
  min,
  required = true,
}) => (
  <div>
    <label className={labelClass}>{label}</label>
    <input
      type={type}
      required={required}
      value={value}
      onChange={onChange}
      className={inputClass}
      placeholder={placeholder}
      autoComplete={autoComplete}
      minLength={minLength}
      min={min}
    />
  </div>
);

const SubmitButton = ({ loading, label, loadingLabel }) => (
  <button
    type="submit"
    disabled={loading}
    className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
  >
    {loading ? loadingLabel : label}
  </button>
);

export default Landing;
