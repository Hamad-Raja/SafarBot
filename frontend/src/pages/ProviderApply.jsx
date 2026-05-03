import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import logo from "../assets/logo.jpeg";

const ProviderApply = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Personal
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  // Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Business
  const [companyName, setCompanyName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [city, setCity] = useState("");

  // Verification
  const [cnic, setCnic] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [fleetSize, setFleetSize] = useState("");

  const isValidName = (value) => /^[A-Za-z\s]+$/.test(value.trim());
  const isValidPhone = (value) => /^[0-9+\-\s]{8,20}$/.test(value.trim());
  const isValidCNIC = (value) => /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(value.trim());
  const isValidPassword = (value) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validations (real-world style)
    if (!isValidName(fullName)) {
      toast.error("Full name must contain only letters and spaces.");
      return;
    }
    if (!isValidPhone(contactNumber)) {
      toast.error("Please enter a valid contact number.");
      return;
    }
    if (!isValidPassword(password)) {
      toast.error(
        "Password must be 8+ chars with 1 uppercase, 1 number, 1 special character."
      );
      return;
    }
    if (!companyName.trim() || companyName.trim().length < 2) {
      toast.error("Please enter a valid company name.");
      return;
    }
    if (!businessAddress.trim() || businessAddress.trim().length < 5) {
      toast.error("Please enter a valid business address.");
      return;
    }
    if (!city.trim()) {
      toast.error("Please enter your city.");
      return;
    }
    if (!isValidCNIC(cnic)) {
      toast.error("CNIC format should be 12345-1234567-1");
      return;
    }
    if (!licenseNumber.trim() || licenseNumber.trim().length < 3) {
      toast.error("Please enter a valid transport license number.");
      return;
    }
    if (fleetSize && (Number.isNaN(Number(fleetSize)) || Number(fleetSize) < 1)) {
      toast.error("Fleet size must be a number (1 or more).");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("https://safarbot-91nr.onrender.com/api/auth/provider/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email,
          password,

          // extra provider fields
          contactNumber,
          companyName,
          businessAddress,
          city,
          cnic,
          licenseNumber,
          fleetSize: fleetSize ? Number(fleetSize) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.message || "Unable to submit application.");
        return;
      }

      toast.success("Application submitted! Pending admin approval.");
      navigate("/auth?mode=login");
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-xl bg-slate-900/70 border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-500/30 p-6 md:p-8 text-white">
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
            Transport Provider Application
          </h1>

          <p className="mt-1 text-xs text-slate-400 text-center max-w-md">
            Submit your details to become a verified provider. Your account will be
            activated after admin approval.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
          {/* Section: Personal */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-[12px] font-semibold text-slate-200 mb-3">
              Personal Details
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-200">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 text-white placeholder:text-slate-500"
                  placeholder="e.g., Ali Khan"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-200">
                  Contact Number
                </label>
                <input
                  type="text"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 text-white placeholder:text-slate-500"
                  placeholder="e.g., +92 3xx xxxxxxx"
                />
              </div>
            </div>
          </div>

          {/* Section: Account */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-[12px] font-semibold text-slate-200 mb-3">
              Account Credentials
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  placeholder="Strong password"
                  autoComplete="new-password"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Must include 1 uppercase, 1 number, 1 special character.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Business */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-[12px] font-semibold text-slate-200 mb-3">
              Company Details
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-200">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 text-white placeholder:text-slate-500"
                  placeholder="e.g., Safar Travels"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-200">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 text-white placeholder:text-slate-500"
                  placeholder="e.g., Islamabad"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-[11px] font-semibold text-slate-200">
                Business Address
              </label>
              <input
                type="text"
                required
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 text-white placeholder:text-slate-500"
                placeholder="Office / terminal address"
              />
            </div>
          </div>

          {/* Section: Verification */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-[12px] font-semibold text-slate-200 mb-3">
              Verification Details
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-200">
                  CNIC (Owner/Manager)
                </label>
                <input
                  type="text"
                  required
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 text-white placeholder:text-slate-500"
                  placeholder="12345-1234567-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-200">
                  Transport License No.
                </label>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 text-white placeholder:text-slate-500"
                  placeholder="Enter license number"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-[11px] font-semibold text-slate-200">
                Fleet Size (optional)
              </label>
              <input
                type="number"
                min="1"
                value={fleetSize}
                onChange={(e) => setFleetSize(e.target.value)}
                className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 text-white placeholder:text-slate-500"
                placeholder="e.g., 10"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                This helps admin understand provider capacity.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-semibold rounded-2xl py-2.5 shadow-lg shadow-cyan-500/40 hover:shadow-cyan-400/60 transition-all disabled:opacity-70 text-sm"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-4 text-center text-[11px] text-slate-400">
          Back to{" "}
          <Link
            to="/auth?mode=login"
            className="text-cyan-300 font-semibold hover:underline"
          >
            Login
          </Link>
        </div>

        <div className="mt-2 text-center text-[11px] text-slate-500">
          Note: Provider accounts remain <span className="text-slate-300">Pending</span>{" "}
          until admin approves.
        </div>
      </div>
    </div>
  );
};

export default ProviderApply;
