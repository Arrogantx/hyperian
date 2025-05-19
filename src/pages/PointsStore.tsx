import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Store, HelpCircle, Zap } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { useStaking } from '../context/StakingContext';
import PixelButton from '../components/ui/PixelButton';

const MYSTERY_BOXES = [
  {
    id: 1,
    name: 'Mystery Box #1',
    description: 'A mysterious reward awaits...',
    price: '???',
    color: 'cyan',
    icon: HelpCircle
  },
  {
    id: 2,
    name: 'Mystery Box #2',
    description: 'Something special inside...',
    price: '???',
    color: 'magenta',
    icon: HelpCircle
  },
  {
    id: 3,
    name: 'Mystery Box #3',
    description: 'A rare surprise perhaps?',
    price: '???',
    color: 'yellow',
    icon: HelpCircle
  },
  {
    id: 4,
    name: 'Mystery Box #4',
    description: 'Contents unknown...',
    price: '???',
    color: 'green',
    icon: HelpCircle
  }
];

const PointsStore: React.FC = () => {
  const { isConnected, connectWallet } = useWeb3();
  const { userPoints } = useStaking();
  const storeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.store-header', {
        opacity: 0,
        y: -20,
        duration: 0.5,
        ease: 'power2.out'
      });

      gsap.from('.store-card', {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out'
      });

      document.querySelectorAll('.store-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            scale: 1.02,
            duration: 0.2,
            ease: 'power2.out'
          });
          gsap.to(card.querySelector('.card-icon'), {
            rotate: 15,
            duration: 0.3,
            ease: 'power2.out'
          });
        });

        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            scale: 1,
            duration: 0.2,
            ease: 'power2.out'
          });
          gsap.to(card.querySelector('.card-icon'), {
            rotate: 0,
            duration: 0.3,
            ease: 'power2.out'
          });
        });
      });
    }, storeRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={storeRef} className="min-h-screen bg-hyper-black pt-20">
      {/* Store Header */}
      <div className="bg-hyper-black border-b-2 border-hyper-yellow py-6 mb-8">
        <div className="container mx-auto px-4">
          <div className="store-header flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-3">
              <Store className="text-hyper-yellow w-8 h-8" />
              <h1 className="font-pixel text-2xl text-hyper-yellow">POINTS STORE</h1>
            </div>
            
            <div className="pixel-card py-3 px-6 flex items-center gap-4">
              <Zap className="text-hyper-yellow w-6 h-6" />
              <div>
                <p className="font-pixel text-xs text-gray-400">Your Balance</p>
                <p className="font-pixel text-xl text-hyper-yellow">{userPoints} pts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12">
        {!isConnected ? (
          <div className="pixel-card text-center py-12 max-w-md mx-auto">
            <HelpCircle className="w-12 h-12 text-hyper-cyan mx-auto mb-4" />
            <h2 className="font-pixel text-lg text-hyper-cyan mb-4">Connect Wallet</h2>
            <p className="font-pixel text-sm text-gray-300 mb-6">
              Connect your wallet to view available items and your points balance
            </p>
            <PixelButton
              color="cyan"
              onClick={connectWallet}
            >
              Connect Wallet
            </PixelButton>
          </div>
        ) : (
          <>
            {/* Mystery Boxes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {MYSTERY_BOXES.map((box) => (
                <div 
                  key={box.id}
                  className={`store-card pixel-card border-2 border-hyper-${box.color} transition-all cursor-pointer focus-within:ring-2 focus-within:ring-hyper-${box.color} hover:border-opacity-80`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${box.name} - ${box.description}`}
                >
                  <div className={`aspect-square bg-hyper-${box.color} bg-opacity-10 rounded-lg flex items-center justify-center mb-4 overflow-hidden`}>
                    <box.icon className={`card-icon w-20 h-20 text-hyper-${box.color} transition-transform`} />
                  </div>
                  
                  <h3 className={`font-pixel text-sm text-hyper-${box.color} mb-2`}>
                    {box.name}
                  </h3>
                  
                  <p className="font-pixel text-xs text-gray-400 mb-4 min-h-[32px]">
                    {box.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-pixel text-lg text-hyper-yellow">
                      {box.price}
                    </span>
                    <PixelButton
                      color={box.color as any}
                      size="sm"
                      disabled
                    >
                      Coming Soon
                    </PixelButton>
                  </div>
                </div>
              ))}
            </div>

            {/* How It Works Section */}
            <div className="pixel-card max-w-4xl mx-auto">
              <h2 className="font-pixel text-lg text-hyper-magenta mb-6">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-pixel text-sm text-hyper-cyan mb-2">Earning Points</h3>
                  <ul className="space-y-3">
                    <li className="font-pixel text-xs text-gray-300 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-hyper-cyan flex-shrink-0" />
                      <span>Stake your Hyperian NFTs to earn points</span>
                    </li>
                    <li className="font-pixel text-xs text-gray-300 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-hyper-magenta flex-shrink-0" />
                      <span>Points accumulate every 5 hours while staked</span>
                    </li>
                    <li className="font-pixel text-xs text-gray-300 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-hyper-yellow flex-shrink-0" />
                      <span>The more NFTs staked, the more points earned</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-pixel text-sm text-hyper-yellow mb-2">Redeeming Points</h3>
                  <ul className="space-y-3">
                    <li className="font-pixel text-xs text-gray-300 flex items-center gap-2">
                      <Store className="w-4 h-4 text-hyper-cyan flex-shrink-0" />
                      <span>Mystery boxes contain exclusive rewards</span>
                    </li>
                    <li className="font-pixel text-xs text-gray-300 flex items-center gap-2">
                      <Store className="w-4 h-4 text-hyper-magenta flex-shrink-0" />
                      <span>New items added regularly</span>
                    </li>
                    <li className="font-pixel text-xs text-gray-300 flex items-center gap-2">
                      <Store className="w-4 h-4 text-hyper-yellow flex-shrink-0" />
                      <span>Special limited-time offers coming soon</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PointsStore;