import React from 'react';

const VoiceBookingButton = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 text-white font-semibold shadow-sm hover:bg-emerald-600 transition-colors"
    >
      <span>🎙️</span>
      <span>Voice Booking</span>
    </button>
  );
};

export default VoiceBookingButton;
