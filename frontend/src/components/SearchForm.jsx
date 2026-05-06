import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, MapPin, Search } from "lucide-react";
import Select from "react-select";
import { toast } from "react-hot-toast";
import Api from "../api/api";
import VoiceBookingButton from "./VoiceBookingButton";
import PAK_CITIES from "../data/pakistanCities";
import { normalizeCity } from "../utils/cityNormalize";
import VoiceChatModal from "./VoiceChatModal";

const cityOptions = PAK_CITIES.map((c) => ({ value: c, label: c }));

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 48,
    borderRadius: 18,
    borderColor: state.isFocused ? "#2563eb" : "rgba(148, 163, 184, 0.45)",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(37, 99, 235, 0.14)" : "none",
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    ":hover": {
      borderColor: "#2563eb",
    },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: 18,
    overflow: "hidden",
    zIndex: 40,
  }),
  placeholder: (base) => ({
    ...base,
    color: "#64748b",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#1d4ed8"
      : state.isFocused
      ? "#eff6ff"
      : "#ffffff",
    color: state.isSelected ? "#ffffff" : "#0f172a",
  }),
};

const normalizeRoute = (route = {}) => ({
  ...route,
  id: route._id || route.id || "",
  from: route.from || route.fromCity || "",
  to: route.to || route.toCity || "",
});

const SearchForm = () => {
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [openVoiceChat, setOpenVoiceChat] = useState(false);

  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();

    const fromCity = normalizeCity(from?.value || "");
    const toCity = normalizeCity(to?.value || "");

    if (!fromCity || !toCity) {
      toast.error("Please select both departure and destination cities.");
      return;
    }

    if (!date) {
      toast.error("Please select a travel date.");
      return;
    }

    if (fromCity.toLowerCase() === toCity.toLowerCase()) {
      toast.error("Departure and destination cities cannot be the same.");
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append("from", fromCity);
      params.append("to", toCity);
      params.append("date", date);
      params.append("active", "true");

      const res = await Api.get(`/api/routes?${params.toString()}`);

      const routes = Array.isArray(res.data)
        ? res.data.map((route) => normalizeRoute(route))
        : [];

      navigate("/routes", {
        state: {
          routes,
          criteria: { from: fromCity, to: toCity, date },
        },
      });
    } catch (err) {
      console.error(err);
      toast.error("Unable to search routes right now.");

      navigate("/routes", {
        state: {
          routes: [],
          criteria: { from: fromCity, to: toCity, date },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSearch}
        className="relative z-20 mx-auto -mt-40 w-[calc(100%-2rem)] max-w-6xl rounded-[2rem] border border-white/45 bg-white/30 p-4 shadow-2xl shadow-blue-900/15 ring-1 ring-white/25 backdrop-blur-2xl sm:p-6 md:-mt-44"
      >
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Bus Search
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">
              Find your route
            </h2>
            <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-slate-950">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/65 px-4 py-2 shadow-sm backdrop-blur-xl">
                <MapPin size={16} className="text-blue-700" />
                Intercity routes
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/65 px-4 py-2 shadow-sm backdrop-blur-xl">
                <CalendarDays size={16} className="text-blue-700" />
                Simple schedules
              </span>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600">
            Select cities and date to see available buses.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr,1fr,0.72fr,0.78fr] lg:items-end">
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              From
            </label>
            <div className="mt-2">
              <Select
                options={cityOptions}
                value={from}
                onChange={setFrom}
                placeholder="Departure city"
                isSearchable
                styles={selectStyles}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              To
            </label>
            <div className="mt-2">
              <Select
                options={cityOptions}
                value={to}
                onChange={setTo}
                placeholder="Destination city"
                isSearchable
                styles={selectStyles}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Date
            </label>
            <div className="relative mt-2">
              <CalendarDays
                size={18}
                className="pointer-events-none absolute left-3 top-3.5 text-blue-700"
              />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-12 w-full rounded-[18px] border border-slate-300/60 bg-white/80 pl-10 pr-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <button
              type="submit"
              disabled={loading || !from || !to || !date}
              className="flex h-12 items-center justify-center gap-2 rounded-[18px] bg-slate-950 px-5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search size={18} />
              <span>{loading ? "Searching..." : "Search Routes"}</span>
            </button>

            <VoiceBookingButton onClick={() => setOpenVoiceChat(true)} />
          </div>
        </div>
      </form>

      <VoiceChatModal
        open={openVoiceChat}
        onClose={() => setOpenVoiceChat(false)}
        onCriteria={(c) => {
          if (c?.from) setFrom({ value: c.from, label: c.from });
          if (c?.to) setTo({ value: c.to, label: c.to });
          if (c?.date) setDate(c.date);
        }}
      />
    </>
  );
};

export default SearchForm;
