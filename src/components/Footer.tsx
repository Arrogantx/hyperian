import React from 'react';
import { Zap, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t-2 border-hyper-cyan py-8 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Zap className="text-hyper-cyan w-5 h-5" />
            <span className="font-pixel text-hyper-cyan text-sm">HYPERIANS GENESIS</span>
          </div>
          
          <div className="flex items-center gap-6">
            <a 
              href="https://twitter.com/Hyperian_HL" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-hyper-cyan transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a 
              href="http://discord.gg/pGuKFHK2mw" 
              target="_blank"
              rel="noopener noreferrer"
              className="font-pixel text-white hover:text-hyper-cyan transition-colors text-xs"
            >
              DISCORD
            </a>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="font-pixel text-xs text-gray-400">© 2025 HYPERIANS GENESIS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;