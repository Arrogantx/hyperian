import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

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
  ensName: null,
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

  useEffect(() => {
    const initConnection = async () => {
      if (window.ethereum) {
        try {
          const ethProvider = new ethers.BrowserProvider(window.ethereum);
          const signer = await ethProvider.getSigner();
          const account = await signer.getAddress();
          const network = await ethProvider.getNetwork();

          setProvider(ethProvider);
          setAddress(account);
          setChainId(Number(network.chainId));
          setIsConnected(true);

          try {
            const name = await ethProvider.lookupAddress(account);
            setEnsName(name || null);
          } catch {
            setEnsName(null);
          }
        } catch (err) {
          console.error("Auto-connect failed:", err);
        }
      }
    };

    initConnection();
  }, []);

  useEffect(() => {
    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        const newAddress = accounts[0];
        setAddress(newAddress);

        if (provider) {
          try {
            const name = await provider.lookupAddress(newAddress);
            setEnsName(name || null);
          } catch {
            setEnsName(null);
          }
        }
      }
    };

    const handleChainChanged = (hexChainId: string) => {
      setChainId(parseInt(hexChainId, 16));
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [provider]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to use this feature.");
      return;
    }
  
    try {
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      await ethProvider.send("eth_requestAccounts", []);
      const signer = await ethProvider.getSigner();
      const account = await signer.getAddress();
      const network = await ethProvider.getNetwork();
  
      setProvider(ethProvider);
      setAddress(account);
      setChainId(Number(network.chainId));
      setIsConnected(true);
  
      try {
        const name = await ethProvider.lookupAddress(account);
        setEnsName(name || null);
      } catch {
        setEnsName(null);
      }
    } catch (err: any) {
      if (err.code === 4001) {
        console.warn("User rejected the wallet connection request.");
        // Optional: display UI feedback here
      } else {
        console.error("Wallet connection error:", err);
        alert("Failed to connect wallet. Check console for details.");
      }
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
        ensName,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};
