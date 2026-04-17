import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { FALLBACK_ROUTES } from "../data/dummyRoutes";
import { toast } from "react-hot-toast";
import axios from "axios";

const SeatSelector = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { routeId: routeIdFromParams } = useParams();

  const routeId =
    state?.routeId ||
    state?.selectedRouteId ||
    state?.route?._id ||
    state?.route?.id ||
    routeIdFromParams;

  const [route, setRoute] = useState(state?.route || null);
  const [loading, setLoading] = useState(!state?.route);
  const [selectedSeats, setSelectedSeats] = useState([]);

  useEffect(() => {
    const loadRoute = async () => {
      try {
        if (route) {
          setLoading(false);
          return;
        }

        if (!routeId) {
          setRoute(FALLBACK_ROUTES[0]);
          setLoading(false);
          return;
        }

        setLoading(true);
        const res = await axios.get(`/api/routes/${routeId}`);
        setRoute(res.data || null);
      } catch (e) {
        console.error("Failed to load route:", e);
        setRoute(FALLBACK_ROUTES[0]);
      } finally {
        setLoading(false);
      }
    };

    loadRoute();
  }, [routeId, route]);

  const safeRoute = route || FALLBACK_ROUTES[0];
  const seatPrice = Number(safeRoute?.price || 0);
  const bookedSeatLabels = Array.isArray(safeRoute?.bookedSeats)
    ? safeRoute.bookedSeats
    : [];

  const seats = useMemo(() => {
    const list = [];
    const rows = 10;
    const cols = 4;
    let seatNumber = 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const label = `S${seatNumber}`;

        list.push({
          id: seatNumber,
          label,
          occupied: bookedSeatLabels.includes(label),
        });

        seatNumber++;
      }
    }

    return list;
  }, [bookedSeatLabels]);

  useEffect(() => {
    setSelectedSeats((prev) =>
      prev.filter((seatId) => {
        const seat = seats.find((s) => s.id === seatId);
        return seat && !seat.occupied;
      })
    );
  }, [seats]);

  const toggleSeat = (seat) => {
    if (seat.occupied) return;

    setSelectedSeats((prev) =>
      prev.includes(seat.id)
        ? prev.filter((s) => s !== seat.id)
        : [...prev, seat.id]
    );
  };

  const total = selectedSeats.length * seatPrice;

  const handleContinue = () => {
    if (!selectedSeats.length) {
      toast.error("Please select at least one seat.");
      return;
    }

    const selectedSeatObjects = seats.filter((s) => selectedSeats.includes(s.id));

    if (selectedSeatObjects.some((s) => s.occupied)) {
      toast.error("Some selected seats are no longer available. Please reselect.");
      return;
    }

    const confirmBooking = window.confirm(
      `You selected ${selectedSeats.length} seat(s) for PKR ${total}. Continue to payment?`
    );

    if (!confirmBooking) return;

    navigate("/payment", {
      state: {
        route: safeRoute,
        seats: selectedSeatObjects,
        total,
        date: safeRoute.travelDate || state?.date || "",
      },
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-8 mb-12 bg-white rounded-3xl shadow-sm border border-slate-100 px-6 py-6 md:px-8 md:py-8">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Select Seats</h2>
        <p className="text-xs text-slate-500 mb-4">Loading route...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 mb-12 bg-white rounded-3xl shadow-sm border border-slate-100 px-6 py-6 md:px-8 md:py-8">
      <h2 className="text-xl font-bold text-slate-800 mb-2">Select Seats</h2>

      <p className="text-xs text-slate-500 mb-4">
        {safeRoute.operator || "-"} • {safeRoute.from || safeRoute.fromCity || "-"} →{" "}
        {safeRoute.to || safeRoute.toCity || "-"} • {safeRoute.departureTime || "-"}
      </p>

      <div className="flex flex-col md:flex-row gap-8 mt-4">
        <div className="flex-1">
          <div className="flex justify-between mb-3 text-xs text-slate-500">
            <span>Front</span>
            <span>Door →</span>
          </div>

          <div className="grid grid-cols-4 gap-2 max-w-md">
            {seats.map((seat) => {
              const isSelected = selectedSeats.includes(seat.id);

              return (
                <button
                  key={seat.id}
                  type="button"
                  onClick={() => toggleSeat(seat)}
                  className={`h-9 rounded-xl text-[11px] font-semibold border text-center flex items-center justify-center
                    ${
                      seat.occupied
                        ? "bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed line-through"
                        : isSelected
                        ? "bg-primary-dark border-primary-dark text-white"
                        : "bg-white border-slate-200 text-slate-700 hover:border-primary"
                    }`}
                >
                  {seat.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex gap-4 text-[11px] text-slate-500">
            <div className="flex items-center gap-1">
              <span className="h-3 w-4 rounded-sm bg-white border border-slate-300 inline-block" />{" "}
              Available
            </div>
            <div className="flex items-center gap-1">
              <span className="h-3 w-4 rounded-sm bg-primary-dark inline-block" />{" "}
              Selected
            </div>
            <div className="flex items-center gap-1">
              <span className="h-3 w-4 rounded-sm bg-slate-200 inline-block" />{" "}
              Booked
            </div>
          </div>
        </div>

        <div className="w-full md:w-64 bg-slate-50 rounded-2xl p-4 flex flex-col gap-3">
          <h3 className="font-semibold text-slate-800 text-sm">Fare Summary</h3>

          <div className="flex justify-between text-xs text-slate-600">
            <span>Seat price</span>
            <span>PKR {seatPrice.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-xs text-slate-600">
            <span>Selected seats</span>
            <span>{selectedSeats.length || "-"}</span>
          </div>

          <div className="flex justify-between text-xs text-slate-600">
            <span>Already booked</span>
            <span>{bookedSeatLabels.length}</span>
          </div>

          <div className="border-t border-dashed border-slate-200 my-2" />

          <div className="flex justify-between text-sm font-bold text-slate-800">
            <span>Total</span>
            <span>PKR {total.toLocaleString()}</span>
          </div>

          <button
            onClick={handleContinue}
            className="mt-3 w-full px-4 py-2.5 rounded-2xl bg-primary-dark text-white text-sm font-semibold hover:bg-primary transition-colors"
          >
            Continue to Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatSelector;