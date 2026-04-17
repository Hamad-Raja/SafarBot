import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { user, updateProfileLocally } = useAuth();
  const navigate = useNavigate();

  const [profileName, setProfileName] = useState(user?.name || "");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Optional: show booking count only (lightweight + professional)
  const [bookingCount, setBookingCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);

  useEffect(() => {
    const fetchBookingCount = async () => {
      try {
        const res = await axios.get("/api/bookings/my");
        setBookingCount(Array.isArray(res.data) ? res.data.length : 0);
      } catch (err) {
        console.error(err);
        setBookingCount(0);
      } finally {
        setLoadingCount(false);
      }
    };
    fetchBookingCount();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = { name: profileName };
      if (newPassword) payload.password = newPassword;

      const res = await axios.put("/api/auth/profile", payload);
      updateProfileLocally(res.data);

      setNewPassword("");
      toast.success("Profile updated successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 pt-10 pb-12 text-white">
          <div className="mb-6">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold text-cyan-300 uppercase tracking-[0.2em]">
              <span className="h-px w-6 bg-cyan-400" />
              Account
            </p>
            <h1 className="mt-3 text-2xl md:text-3xl font-extrabold tracking-tight">
              Profile Settings
            </h1>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
              Update your personal details and keep your account secure.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr,0.75fr]">
            {/* Profile form */}
            <div className="bg-slate-900/80 rounded-3xl border border-white/10 shadow-lg shadow-cyan-500/20 p-6">
              <h2 className="text-sm font-semibold text-slate-100">
                Personal Information
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Your email is locked for security. You can update your name and password.
              </p>

              <form onSubmit={handleProfileSave} className="mt-5 space-y-4 text-sm">
                <div>
                  <label className="text-[11px] font-semibold text-slate-200">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 text-white placeholder:text-slate-500"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-200">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="mt-1 w-full rounded-2xl bg-slate-900/60 border border-white/10 px-3 py-2.5 text-slate-300 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-200">
                    New Password (optional)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 w-full rounded-2xl bg-slate-950/60 border border-white/10 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 text-white placeholder:text-slate-500"
                    placeholder="Leave blank to keep current password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 py-2.5 rounded-2xl text-sm font-semibold hover:shadow-lg hover:shadow-cyan-500/40 transition-all disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>

              <div className="mt-6 text-[11px] text-slate-400">
                <p>
                  Account role:{" "}
                  <span className="font-semibold text-cyan-300 uppercase">
                    {user?.role || "USER"}
                  </span>
                </p>
              </div>
            </div>

            {/* Quick access / summary (professional) */}
            <div className="space-y-4">
              <div className="bg-slate-900/80 rounded-3xl border border-white/10 shadow-lg shadow-emerald-500/20 p-6">
                <h3 className="text-sm font-semibold text-slate-100">
                  Your Trips
                </h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  View your booking history, trip details, and confirmations.
                </p>

                <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-950/60 border border-white/10 p-4">
                  <div>
                    <p className="text-[11px] text-slate-400">Total bookings</p>
                    <p className="text-lg font-extrabold text-white">
                      {loadingCount ? "…" : bookingCount}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/my-bookings")}
                    className="px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-md hover:shadow-cyan-500/40 transition-shadow"
                  >
                    View My Bookings
                  </button>
                </div>

                <p className="mt-3 text-[10px] text-slate-500">
                  Tip: Use “My Bookings” to see complete history and details.
                </p>
              </div>

              <div className="bg-slate-900/80 rounded-3xl border border-white/10 p-6">
                <h3 className="text-sm font-semibold text-slate-100">
                  Security
                </h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Use a strong password and update it regularly for better security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
