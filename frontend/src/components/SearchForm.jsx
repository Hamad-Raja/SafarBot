import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Api from '../api/api';
import axios from "axios";
import Select from "react-select";
import { toast } from "react-hot-toast";
import VoiceBookingButton from "./VoiceBookingButton";
import PAK_CITIES from "../data/pakistanCities";
import { normalizeCity } from "../utils/cityNormalize";
import VoiceChatModal from "./VoiceChatModal";

const cityOptions = PAK_CITIES.map((c) => ({ value: c, label: c }));

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

  const handleVoiceClick = () => {
    setOpenVoiceChat(true);
  };

  return (
    <>
      <form
        onSubmit={handleSearch}
        className="w-full bg-white rounded-3xl shadow-xl -mt-12 relative z-10 max-w-5xl mx-auto px-6 py-6 flex flex-col md:flex-row gap-4 items-end"
      >
        <div className="flex-1">
          <label className="text-xs font-semibold text-slate-500">From</label>
          <div className="mt-1">
            <Select
              options={cityOptions}
              value={from}
              onChange={setFrom}
              placeholder="Select departure city"
              isSearchable
            />
          </div>
        </div>

        <div className="flex-1">
          <label className="text-xs font-semibold text-slate-500">To</label>
          <div className="mt-1">
            <Select
              options={cityOptions}
              value={to}
              onChange={setTo}
              placeholder="Select destination city"
              isSearchable
            />
          </div>
        </div>

        <div className="md:w-44 w-full">
          <label className="text-xs font-semibold text-slate-500">Date</label>
          <div className="mt-1 relative">
            <span className="absolute left-3 top-2.5 text-slate-400">📅</span>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/70 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 md:w-48 w-full">
          <button
            type="submit"
            disabled={loading || !from || !to || !date}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary-dark text-white font-semibold shadow-sm hover:bg-primary transition-colors disabled:opacity-70 text-sm"
          >
            <span>🔍</span>
            <span>{loading ? "Searching..." : "Search Routes"}</span>
          </button>

          <VoiceBookingButton onClick={handleVoiceClick} />
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