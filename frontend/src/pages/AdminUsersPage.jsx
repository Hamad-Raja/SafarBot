import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const AdminUsersPage = () => {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("safarbot_user") || "{}");

      const res = await axios.get("/api/admin/providers", {
        headers: {
          Authorization: `Bearer ${storedUser.token}`,
        },
      });

      const formattedUsers = Array.isArray(res.data)
        ? res.data.map((u) => ({
          id: u._id,
          name: u.name || "Unknown",
          email: u.email || "No email",
          role: u.role || "provider",
          status:
            u.providerStatus ||
            (u.isActive === false
              ? "suspended"
              : u.isApproved
                ? "active"
                : "pending"),
        }))
        : [];

      setUsers(formattedUsers);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to fetch providers.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return users.filter((u) => {
      const matchesQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);

      const matchesRole = roleFilter === "all" ? true : u.role === roleFilter;

      return matchesQuery && matchesRole;
    });
  }, [query, roleFilter, users]);

  const statusBadge = (status) => {
    if (status === "active")
      return "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30";
    if (status === "pending")
      return "bg-amber-500/15 text-amber-300 border border-amber-400/30";
    return "bg-red-500/15 text-red-300 border border-red-400/30";
  };

  const action = (msg) => toast.success(msg);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-12 text-white">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl font-extrabold">Manage Users</h1>
              <p className="text-xs text-slate-400">
                Search provider accounts, filter roles and review status.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or email..."
                className="w-full sm:w-64 rounded-2xl bg-slate-900/70 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-2xl bg-slate-900/70 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
              >
                <option value="all">All Providers</option>
                <option value="provider">Providers</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900/80 rounded-3xl border border-white/10 shadow-lg shadow-cyan-500/10 p-5 overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-2 text-left">Name</th>
                  <th className="py-2 text-left">Email</th>
                  <th className="py-2 text-left">Role</th>
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-white/5">
                    <td className="py-3 pr-3 text-slate-100 font-semibold">
                      {u.name}
                    </td>
                    <td className="py-3 pr-3 text-slate-300">{u.email}</td>
                    <td className="py-3 pr-3">
                      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-wide">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide ${statusBadge(
                          u.status
                        )}`}
                      >
                        {u.status}
                      </span>
                    </td>

                    <td className="py-3 flex items-center gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => action(`View: ${u.name}`)}
                        className="px-3 py-1 rounded-full bg-slate-800 border border-white/15 text-slate-100 hover:bg-slate-700"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => action(`Edit: ${u.name}`)}
                        className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/25"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => action(`Disable: ${u.name}`)}
                        className="px-3 py-1 rounded-full bg-red-500/15 border border-red-400/30 text-red-200 hover:bg-red-500/25"
                      >
                        Disable
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-400">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminUsersPage;