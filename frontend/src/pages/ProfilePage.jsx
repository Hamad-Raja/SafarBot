import React, { useEffect, useState } from "react";
import { LockKeyhole, TicketCheck, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Api from "../api/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

const ProfilePage = () => {
  const { user, updateProfileLocally } = useAuth();
  const navigate = useNavigate();

  const [profileName, setProfileName] = useState(user?.name || "");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [bookingCount, setBookingCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);

  useEffect(() => {
    const fetchBookingCount = async () => {
      try {
        const res = await Api.get("/api/bookings/my");
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

      const res = await Api.put("/api/auth/profile", payload);
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
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 pb-12 pt-10">
        <div className="mb-7">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
            <UserRound size={15} />
            Account
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            Profile Settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
            Keep your account details tidy and your trip dashboard ready.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,0.75fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
            <h2 className="text-lg font-extrabold text-slate-950">
              Personal Information
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Your email is locked for security. You can update your name and
              password.
            </p>

            <form onSubmit={handleProfileSave} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="mt-2 h-12 w-full rounded-[18px] border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="mt-2 h-12 w-full cursor-not-allowed rounded-[18px] border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-2 h-12 w-full rounded-[18px] border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15"
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="h-12 w-full rounded-[18px] bg-blue-700 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition-colors hover:bg-blue-800 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>

            <p className="mt-5 text-xs font-medium text-slate-500">
              Account role:{" "}
              <span className="font-extrabold uppercase text-blue-700">
                {user?.role || "USER"}
              </span>
            </p>
          </section>

          <aside className="space-y-4">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <TicketCheck size={22} />
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-slate-950">
                Your Trips
              </h3>
              <p className="mt-1 text-sm font-medium leading-relaxed text-slate-600">
                Jump back to booking history, trip details, and confirmations.
              </p>

              <div className="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Total bookings
                </p>
                <p className="mt-1 text-3xl font-extrabold text-slate-950">
                  {loadingCount ? "..." : bookingCount}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/my-bookings")}
                className="mt-4 h-11 w-full rounded-full bg-slate-950 text-sm font-bold text-white transition-colors hover:bg-blue-800"
              >
                View My Bookings
              </button>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <LockKeyhole size={22} />
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-slate-950">
                Security
              </h3>
              <p className="mt-1 text-sm font-medium leading-relaxed text-slate-600">
                Use a strong password and update it regularly for better
                account protection.
              </p>
            </section>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
