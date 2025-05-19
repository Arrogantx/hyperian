import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  ensName: string | null;
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  address: null,
  chainId: null,
  isConnected: false,
  connectWallet: async () => {},
  disconnect: () => {},
  ensName: null
});

export const useWeb3 = () => useContext(Web3Context);

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [ensName, setEnsName] = useState<string | null>(null);

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const ethProvider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await ethProvider.listAccounts();
          
          if (accounts.length > 0) {
            const network = await ethProvider.getNetwork();
            const account = accounts[0];
            
            setProvider(ethProvider);
            setAddress(account.address);
            setChainId(Number(network.chainId));
            setIsConnected(true);
            
            try {
              const ensName = await ethProvider.lookupAddress(account.address);
              if (ensName) setEnsName(ensName);
            } catch (error) {
              console.log("No ENS name found or error looking up ENS");
            }
          }
        } catch (error) {
          console.error("Error checking existing connection:", error);
        }
      }
    };

    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (accounts[0] !== address) {
          setAddress(accounts[0]);
          
          if (provider) {
            try {
              const ensName = await provider.lookupAddress(accounts[0]);
              setEnsName(ensName);
            } catch (error) {
              setEnsName(null);
            }
          }
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        setChainId(parseInt(chainIdHex, 16));
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [address, provider]);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert("Please install MetaMask or another Web3 wallet to connect");
      return;
    }

    try {
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      await ethProvider.send("eth_requestAccounts", []);
      
      const accounts = await ethProvider.listAccounts();
      const network = await ethProvider.getNetwork();
      const account = accounts[0];
      
      setProvider(ethProvider);
      setAddress(account.address);
      setChainId(Number(network.chainId));
      setIsConnected(true);
      
      try {
        const ensName = await ethProvider.lookupAddress(account.address);
        if (ensName) setEnsName(ensName);
      } catch (error) {
        setEnsName(null);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const disconnect = () => {
    setProvider(null);
    setAddress(null);
    setChainId(null);
    setIsConnected(false);
    setEnsName(null);
  };

  return (
    <Web3Context.Provider
      value={{
        provider,
        address,
        chainId,
        isConnected,
        connectWallet,
        disconnect,
        ensName
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};