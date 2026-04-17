import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4 text-white">
      <p className="text-6xl mb-2">🚌</p>
      <h1 className="text-2xl font-bold mb-1">Page not found</h1>
      <p className="text-sm text-slate-400 mb-4">
        The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="px-5 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 text-sm font-semibold hover:shadow-lg hover:shadow-cyan-500/40 transition-all"
      >
        Back to start
      </Link>
    </div>
  );
};

export default NotFound;
