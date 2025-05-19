import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { Zap, Shield } from 'lucide-react';
import { useWeb3 } from '../../context/Web3Context';
import { useAuth } from '../../hooks/useAuth';
import PixelButton from '../../components/ui/PixelButton';

interface LocationState {
  from?: {
    pathname: string;
  };
}

const LoginPage: React.FC = () => {
  const { isConnected, connectWallet } = useWeb3();
  const { isAdmin, authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authError, setAuthError] = useState(false);
  
  // Get redirect path if any
  const from = (location.state as LocationState)?.from?.pathname || '/boss/dashboard';
  
  useEffect(() => {
    // Animate elements
    gsap.from('.login-container', {
      opacity: 0,
      y: 20,
      duration: 0.5,
      ease: 'power2.out'
    });
    
    gsap.from('.login-icon', {
      scale: 0.5,
      opacity: 0,
      duration: 0.5,
      delay: 0.2,
      ease: 'back.out(1.7)'
    });
  }, []);
  
  useEffect(() => {
    // Redirect if already authenticated
    if (isAdmin && !authLoading) {
      navigate(from, { replace: true });
    }
  }, [isAdmin, authLoading, navigate, from]);
  
  const handleLogin = async () => {
    if (!isConnected) {
      await connectWallet();
    } else {
      // Already connected but not admin - show error
      if (!isAdmin && !authLoading) {
        setAuthError(true);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="login-container pixel-card max-w-md w-full p-8 text-center">
        <div className="login-icon flex justify-center mb-6">
          <div className="relative">
            <Zap className="text-hyper-cyan w-12 h-12" />
            <Shield className="text-hyper-magenta w-6 h-6 absolute bottom-0 right-0" />
          </div>
        </div>
        
        <h1 className="font-pixel text-xl text-hyper-cyan mb-6">ADMIN ACCESS</h1>
        
        <p className="font-pixel text-xs text-gray-300 mb-8">
          Connect your wallet to access the Hyperians Genesis admin dashboard.
        </p>
        
        {authError && (
          <div className="bg-hyper-red bg-opacity-20 border-2 border-hyper-red p-3 mb-6">
            <p className="font-pixel text-xs text-hyper-red">
              Unauthorized wallet. Please connect with an admin wallet.
            </p>
          </div>
        )}
        
        <PixelButton
          onClick={handleLogin}
          color="cyan"
          fullWidth
          disabled={authLoading}
        >
          {!isConnected 
            ? "CONNECT WALLET" 
            : authLoading 
              ? "CHECKING..." 
              : "ACCESS DASHBOARD"}
        </PixelButton>
      </div>
    </div>
  );
};

export default LoginPage;