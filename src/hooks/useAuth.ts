import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';

// Admin wallet addresses (lowercase)
const ADMIN_ADDRESSES = [
  '0xd8E00074E43A343bfEdf5981ac00dC038A8520f0',
  '0xE6a531199EC3d0C984CBcffa44f2Dd0E685CC71e',
  '0x85E6cC88F3055b589eb1d4030863be2CFcc0763E'
].map(addr => addr.toLowerCase());

export function useAuth() {
  const { address, isConnected } = useWeb3();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAdmin = async () => {
      setAuthLoading(true);
      
      if (!isConnected || !address) {
        setIsAdmin(false);
        setAuthLoading(false);
        return;
      }
      
      // Check if connected wallet is in admin list
      const isAdminWallet = ADMIN_ADDRESSES.includes(address.toLowerCase());
      setIsAdmin(isAdminWallet);
      
      setAuthLoading(false);
    };
    
    checkAdmin();
  }, [address, isConnected]);
  
  const logout = () => {
    setIsAdmin(false);
    // Any additional logout logic
  };

  return {
    isAdmin,
    authLoading,
    logout
  };
}