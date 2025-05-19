import React, { useEffect, useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminNavbar from '../components/admin/AdminNavbar';
import AdminSidebar from '../components/admin/AdminSidebar';
import { gsap } from 'gsap';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/boss';
  
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(['.admin-page-wrapper', '.admin-navbar', '.admin-sidebar', '.admin-content'], {
        opacity: 0
      });
      
      const tl = gsap.timeline({
        defaults: { duration: 0.3, ease: 'power2.out' }
      });
      
      tl.to('.admin-page-wrapper', { opacity: 1 });
      
      if (!isLoginPage) {
        tl.to('.admin-navbar', { 
          y: 0, 
          opacity: 1,
        }, '-=0.1')
        .to('.admin-sidebar', { 
          x: 0, 
          opacity: 1,
        }, '-=0.1')
        .to('.admin-content', { 
          opacity: 1,
        }, '-=0.1');
      }
    });
    
    return () => ctx.revert();
  }, [isLoginPage]);

  return (
    <div className="admin-page-wrapper min-h-screen flex flex-col bg-hyper-black text-white">
      {!isLoginPage && (
        <>
          <AdminNavbar />
          <div className="flex flex-1">
            <AdminSidebar />
            <main className="admin-content flex-grow p-4">
              <Outlet />
            </main>
          </div>
        </>
      )}
      
      {isLoginPage && (
        <main className="flex-grow">
          <Outlet />
        </main>
      )}
    </div>
  );
};

export default AdminLayout;