import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { BusFront, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import Api from "../api/api";
import { FALLBACK_ROUTES } from "../data/dummyRoutes";

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
        const res = await Api.get(`/api/routes/${routeId}`);
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

        seatNumber += 1;
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
      <div className="mx-auto mb-12 mt-10 max-w-4xl px-4">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 md:p-8">
          <h2 className="text-2xl font-extrabold text-slate-950">
            Select Seats
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Loading route...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mb-12 mt-10 max-w-5xl px-4">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              <BusFront size={15} />
              Seat Map
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
              Select Seats
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {safeRoute.operator || "-"} |{" "}
              {safeRoute.from || safeRoute.fromCity || "-"} to{" "}
              {safeRoute.to || safeRoute.toCity || "-"} |{" "}
              {safeRoute.departureTime || "-"}
            </p>
          </div>

          <div className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">
            {selectedSeats.length} selected
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-8 md:flex-row">
          <div className="flex-1">
            <div className="mb-4 flex justify-between text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              <span>Front</span>
              <span>Door</span>
            </div>

            <div className="grid max-w-md grid-cols-4 gap-2">
              {seats.map((seat) => {
                const isSelected = selectedSeats.includes(seat.id);

                return (
                  <button
                    key={seat.id}
                    type="button"
                    onClick={() => toggleSeat(seat)}
                    className={`flex h-10 items-center justify-center rounded-2xl border text-xs font-extrabold transition-colors ${
                      seat.occupied
                        ? "cursor-not-allowed border-slate-300 bg-slate-200 text-slate-400 line-through"
                        : isSelected
                        ? "border-blue-700 bg-blue-700 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-500 hover:bg-blue-50"
                    }`}
                  >
                    {seat.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-5 rounded bg-white ring-1 ring-slate-300" />
                Available
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-5 rounded bg-blue-700" />
                Selected
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-5 rounded bg-slate-200" />
                Booked
              </div>
            </div>
          </div>

          <aside className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 md:w-72">
            <h2 className="text-lg font-extrabold text-slate-950">
              Fare Summary
            </h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Seat price</span>
                <span className="font-bold text-slate-900">
                  PKR {seatPrice.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Selected seats</span>
                <span className="font-bold text-slate-900">
                  {selectedSeats.length || "-"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Already booked</span>
                <span className="font-bold text-slate-900">
                  {bookedSeatLabels.length}
                </span>
              </div>
            </div>

            <div className="my-5 border-t border-dashed border-slate-300" />

            <div className="flex justify-between text-lg font-extrabold text-slate-950">
              <span>Total</span>
              <span>PKR {total.toLocaleString()}</span>
            </div>

            <button
              onClick={handleContinue}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-blue-700 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition-colors hover:bg-blue-800"
            >
              <CheckCircle2 size={18} />
              Continue to Payment
            </button>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default SeatSelector;
