import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Link, useLocation } from 'react-router-dom';
import { Zap, Shield, Store } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { useAuth } from '../hooks/useAuth';
import { useStaking } from '../context/StakingContext';
import PixelButton from './ui/PixelButton';

const Navbar: React.FC = () => {
  const { address, connectWallet, disconnect, isConnected } = useWeb3();
  const { isAdmin } = useAuth();
  const { userPoints } = useStaking();
  const navbarRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (navbarRef.current) {
        if (window.scrollY > 50) {
          gsap.to(navbarRef.current, {
            backgroundColor: 'rgba(18, 18, 18, 0.95)',
            boxShadow: '0 4px 12px rgba(0, 255, 255, 0.15)',
            duration: 0.3,
            ease: 'power1.out'
          });
        } else {
          gsap.to(navbarRef.current, {
            backgroundColor: 'rgba(18, 18, 18, 1)',
            boxShadow: 'none',
            duration: 0.3,
            ease: 'power1.out'
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      ref={navbarRef}
      className="navbar fixed w-full z-50 py-3 border-b-2 border-hyper-cyan"
    >
      <div className="container mx-auto flex justify-between items-center px-4">
        <Link to="/" className="flex items-center gap-2">
          <Zap className="text-hyper-cyan w-6 h-6" />
          <span className="font-pixel text-hyper-cyan text-lg">HYPERIANS</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          <Link 
            to="/store"
            className={`font-pixel text-sm flex items-center gap-2 transition-colors ${
              location.pathname === '/store' 
                ? 'text-hyper-yellow' 
                : 'text-white hover:text-hyper-yellow'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>STORE</span>
            {isConnected && (
              <span className="text-hyper-yellow">({userPoints} pts)</span>
            )}
          </Link>
          <a 
            href="https://twitter.com/Hyperian_HL" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-pixel text-white hover:text-hyper-magenta text-xs transition-colors"
          >
            TWITTER
          </a>
          <a 
            href="http://discord.gg/pGuKFHK2mw" 
            target="_blank"
            rel="noopener noreferrer"
            className="font-pixel text-white hover:text-hyper-yellow text-xs transition-colors"
          >
            DISCORD
          </a>
          {isAdmin && (
            <Link 
              to="/boss/dashboard"
              className="font-pixel text-hyper-magenta hover:text-hyper-cyan text-xs transition-colors flex items-center gap-1"
            >
              <Shield className="w-4 h-4" />
              ADMIN
            </Link>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <span className="hidden md:inline font-pixel text-xs text-hyper-green">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <PixelButton 
                onClick={disconnect}
                color="magenta"
                size="sm"
              >
                Disconnect
              </PixelButton>
            </>
          ) : (
            <PixelButton 
              onClick={connectWallet}
              color="cyan"
              size="sm"
            >
              Connect Wallet
            </PixelButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;