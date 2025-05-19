import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useWeb3 } from '../../context/Web3Context';

const AdminNavbar: React.FC = () => {
  const { disconnect } = useWeb3();
  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    disconnect();
  };

  return (
    <div className="admin-navbar bg-hyper-black border-b-2 border-hyper-magenta py-3">
      <div className="container mx-auto flex justify-between items-center px-4">
        <Link to="/boss/dashboard" className="flex items-center gap-2">
          <Zap className="text-hyper-magenta w-5 h-5" />
          <span className="font-pixel text-hyper-magenta text-sm">HYPERIANS ADMIN</span>
        </Link>
        
        <button
          onClick={handleLogout}
          className="font-pixel text-xs text-white hover:text-hyper-red flex items-center gap-1 transition-colors"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminNavbar;