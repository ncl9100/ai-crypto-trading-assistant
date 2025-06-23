import Header from './Header.jsx';
import Footer from './Footer.jsx';

export default function DashboardShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Header />

      <main className="flex-grow flex justify-center items-center px-4">
        {children}
      </main>

      <Footer />
    </div>
  );
}
