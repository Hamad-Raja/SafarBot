import React from "react";
import { Mic2 } from "lucide-react";

const VoiceBookingButton = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 items-center justify-center gap-2 rounded-[18px] border border-white/55 bg-white/60 px-5 text-sm font-bold text-blue-700 shadow-sm backdrop-blur-xl transition-colors hover:bg-white/80"
    >
      <Mic2 size={18} />
      <span>Voice Booking</span>
    </button>
  );
};

export default VoiceBookingButton;
