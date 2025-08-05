import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-slate-700 py-6 text-center text-sm text-slate-400">
      &copy; {new Date().getFullYear()}{" "}
      <span className="font-medium text-slate-200">
        Nathan Liu's Crypto Trading AI Assistant
      </span>. All rights reserved.
    </footer>
  );
}
