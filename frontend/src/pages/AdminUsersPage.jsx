import React, { useEffect, useMemo, useState } from "react";
import Api from '../api/api';
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

      const res = await Api.get("/api/admin/providers", {
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
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    if (status === "pending")
      return "bg-amber-50 text-amber-700 border border-amber-200";
    return "bg-red-50 text-red-700 border border-red-200";
  };

  const action = (msg) => toast.success(msg);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-500 via-blue-50 to-white text-slate-950">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl font-extrabold">Manage Users</h1>
              <p className="text-xs text-slate-600">
                Search provider accounts, filter roles and review status.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or email..."
                className="w-full sm:w-64 rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 shadow-sm shadow-blue-900/5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-slate-950 shadow-sm shadow-blue-900/5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="all">All Providers</option>
                <option value="provider">Providers</option>
              </select>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/55 bg-white/55 p-5 shadow-xl shadow-blue-900/10 ring-1 ring-white/30 backdrop-blur-2xl overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="text-slate-500 border-b border-slate-200/70">
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
                  <tr key={u.id} className="border-b border-slate-200/60">
                    <td className="py-3 pr-3 text-slate-900 font-semibold">
                      {u.name}
                    </td>
                    <td className="py-3 pr-3 text-slate-700">{u.email}</td>
                    <td className="py-3 pr-3">
                      <span className="px-2 py-0.5 rounded-full bg-white/70 border border-slate-200 text-[10px] uppercase tracking-wide text-slate-700">
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
                        className="px-3 py-1 rounded-full border border-slate-200 bg-white/70 text-slate-700 hover:bg-white"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => action(`Edit: ${u.name}`)}
                        className="px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => action(`Disable: ${u.name}`)}
                        className="px-3 py-1 rounded-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
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
