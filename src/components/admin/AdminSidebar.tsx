import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BarChart2, Settings } from 'lucide-react';

const AdminSidebar: React.FC = () => {
  const navLinkClass = 
    "flex items-center gap-2 font-pixel text-xs py-3 px-4 border-l-4 transition-all";
  
  const activeClass = 
    "border-hyper-magenta bg-hyper-black text-hyper-magenta";
  
  const inactiveClass = 
    "border-transparent text-gray-400 hover:text-white hover:border-gray-500";

  return (
    <div className="admin-sidebar bg-gray-900 w-64 border-r-2 border-gray-800 min-h-[calc(100vh-48px)] hidden md:block">
      <div className="py-6">
        <div className="px-4 mb-6">
          <h2 className="font-pixel text-xs text-gray-400">NAVIGATION</h2>
        </div>
        
        <nav>
          <NavLink
            to="/boss/dashboard"
            className={({ isActive }) => 
              `${navLinkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <LayoutDashboard size={16} />
            Dashboard
          </NavLink>
          
          <NavLink
            to="/boss/whitelist"
            className={({ isActive }) => 
              `${navLinkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <Users size={16} />
            Whitelist
          </NavLink>
          
          <NavLink
            to="/boss/stats"
            className={({ isActive }) => 
              `${navLinkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <BarChart2 size={16} />
            Stats
          </NavLink>
          
          <NavLink
            to="/boss/settings"
            className={({ isActive }) => 
              `${navLinkClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <Settings size={16} />
            Settings
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

export default AdminSidebar;