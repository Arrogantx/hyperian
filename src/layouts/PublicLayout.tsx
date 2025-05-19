import React, { useEffect, useLayoutEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { gsap } from 'gsap';

const PublicLayout: React.FC = () => {
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(['.page-wrapper', '.navbar', '.content-container'], { 
        opacity: 0 
      });
      
      const tl = gsap.timeline({
        defaults: { duration: 0.5, ease: 'power2.out' }
      });
      
      tl.to('.page-wrapper', { opacity: 1 })
        .to('.navbar', { 
          y: 0, 
          opacity: 1,
        }, '-=0.3')
        .to('.content-container', { 
          opacity: 1,
          scale: 1,
        }, '-=0.2');
    });
    
    return () => ctx.revert();
  }, []);

  return (
    <div className="page-wrapper min-h-screen flex flex-col bg-hyper-black text-white">
      <Navbar />
      <main className="content-container flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;