import React from 'react';

export default function Spinner({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400 mb-3"></div>
      <div className="text-slate-400 italic">{message}</div>
    </div>
  );
}