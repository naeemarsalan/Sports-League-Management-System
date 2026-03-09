import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="bg-[#0a0e14] text-white min-h-screen flex flex-col">
      <Outlet />

      <footer className="bg-[#141922] border-t border-[#34d9c3]/10 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <Link to="/">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-[#34d9c3] to-[#2ab3a0] bg-clip-text text-transparent mb-2">
                  Snooker Pool League
                </h3>
              </Link>
              <p className="text-gray-400 text-sm">Professional league management in your pocket</p>
            </div>
            <div className="flex gap-8 text-sm">
              <Link to="/privacy" className="text-gray-400 hover:text-[#34d9c3] transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-[#34d9c3] transition-colors">
                Terms of Service
              </Link>
              <Link to="/support" className="text-gray-400 hover:text-[#34d9c3] transition-colors">
                Support
              </Link>
            </div>
          </div>
          <div className="text-center mt-8 pt-8 border-t border-[#34d9c3]/10">
            <p className="text-gray-500 text-sm">&copy; 2026 Snooker Pool League. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
