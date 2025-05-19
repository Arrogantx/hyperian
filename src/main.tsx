import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { Web3Provider } from './context/Web3Context';
import { WhitelistProvider } from './context/WhitelistContext';
import { StakingProvider } from './context/StakingContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Web3Provider>
        <StakingProvider>
          <WhitelistProvider>
            <App />
          </WhitelistProvider>
        </StakingProvider>
      </Web3Provider>
    </BrowserRouter>
  </StrictMode>
);