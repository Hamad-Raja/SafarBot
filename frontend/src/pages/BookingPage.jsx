import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SeatSelector from '../components/SeatSelector';

const BookingPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <SeatSelector />
      </main>
      <Footer />
    </div>
  );
};

export default BookingPage;
