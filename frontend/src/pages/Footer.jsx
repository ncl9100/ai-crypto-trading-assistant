export default function Footer() {
  return (
    <footer className="mt-8 border-t py-6 text-center text-sm text-gray-500">
      &copy; {new Date().getFullYear()} <span className="font-medium text-gray-700">Nathan Liu's Crypto AI Assistant</span>. All rights reserved.
    </footer>
  );
}
