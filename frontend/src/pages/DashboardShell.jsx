import React from 'react';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

export default function DashboardShell({ children }) { /* anything inside DashboardShell will be passed as children */
  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      {/* Top Navigation */}
      <Header />

      {/* Page Content */}
      <main className="flex-grow px-4 py-8 pt-24">
        <div className="w-full max-w-6xl mx-auto">
          {children} {/* This is where the child components will be rendered */}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
