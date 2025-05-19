import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useWeb3 } from '../context/Web3Context';
import { useStaking } from '../context/StakingContext';
import { Zap, Trophy, Clock, Coins } from 'lucide-react';
import PixelButton from '../components/ui/PixelButton';

const HomePage: React.FC = () => {
  const { isConnected, connectWallet } = useWeb3();
  const { 
    userNFTs,
    totalPoints,
    weeklyPoints,
    nextRewardIn,
    activityMultiplier,
    recentActivity,
    isLoading,
    error
  } = useStaking();

  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { duration: 0.6, ease: 'power2.out' }
      });
      
      gsap.set([titleRef.current, statsRef.current, '.dashboard-card'], {
        opacity: 0,
        y: 20
      });
      
      tl.to(titleRef.current, { opacity: 1, y: 0 })
        .to(statsRef.current, { opacity: 1, y: 0 }, '-=0.3')
        .to('.dashboard-card', { 
          opacity: 1, 
          y: 0,
          stagger: 0.1
        }, '-=0.2');
      
      // Pixel animations
      gsap.to('.pixel-floater', {
        y: -15,
        duration: 2.5,
        ease: 'power1.inOut',
        repeat: -1,
        yoyo: true,
        stagger: 0.2
      });
    });
    
    return () => ctx.revert();
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="pt-20 pb-12">
      <div 
        ref={heroRef}
        className="px-4 py-12 md:py-20 flex flex-col items-center justify-center text-center relative"
      >
        <div className="absolute left-10 top-40 w-4 h-4 bg-hyper-cyan pixel-floater"></div>
        <div className="absolute right-10 top-20 w-6 h-6 bg-hyper-magenta pixel-floater"></div>
        <div className="absolute left-1/4 bottom-10 w-5 h-5 bg-hyper-yellow pixel-floater"></div>
        
        <div className="relative mb-6">
          <Zap size={48} className="text-hyper-cyan animate-pulse" />
        </div>
        
        <h1 
          ref={titleRef}
          className="font-pixel text-2xl md:text-4xl text-white mb-6 max-w-2xl"
        >
          <span className="text-hyper-cyan">HYPERIANS</span> GENESIS
        </h1>

        {!isConnected ? (
          <div className="w-full max-w-md">
            <div className="pixel-card">
              <h2 className="font-pixel text-lg text-hyper-cyan mb-4">CONNECT WALLET</h2>
              <p className="font-pixel text-sm text-gray-300 mb-6">
                Connect your wallet to view your NFTs and start staking
              </p>
              <PixelButton
                color="cyan"
                fullWidth
                onClick={connectWallet}
              >
                CONNECT WALLET
              </PixelButton>
            </div>
          </div>
        ) : (
          <div ref={statsRef} className="w-full max-w-6xl">
            {isLoading ? (
              <div className="pixel-card text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-hyper-cyan border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="font-pixel text-sm text-gray-300">Loading your NFTs...</p>
              </div>
            ) : error ? (
              <div className="pixel-card text-center py-12">
                <p className="font-pixel text-sm text-red-400">{error}</p>
              </div>
            ) : (
              <>
                {/* Global Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="dashboard-card pixel-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-pixel text-xs text-gray-400">Your NFTs</p>
                        <h3 className="font-pixel text-xl text-hyper-cyan mt-2">
                          {userNFTs?.length || 0}
                        </h3>
                      </div>
                      <div className="bg-hyper-cyan bg-opacity-20 p-2 rounded">
                        <Trophy className="text-hyper-cyan w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card pixel-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-pixel text-xs text-gray-400">Total Points</p>
                        <h3 className="font-pixel text-xl text-hyper-magenta mt-2">
                          {totalPoints}
                        </h3>
                      </div>
                      <div className="bg-hyper-magenta bg-opacity-20 p-2 rounded">
                        <Coins className="text-hyper-magenta w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card pixel-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-pixel text-xs text-gray-400">Weekly Points</p>
                        <h3 className="font-pixel text-xl text-hyper-yellow mt-2">
                          {weeklyPoints}
                        </h3>
                      </div>
                      <div className="bg-hyper-yellow bg-opacity-20 p-2 rounded">
                        <Zap className="text-hyper-yellow w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card pixel-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-pixel text-xs text-gray-400">Next Points In</p>
                        <h3 className="font-pixel text-xl text-hyper-green mt-2">
                          {formatTime(nextRewardIn)}
                        </h3>
                      </div>
                      <div className="bg-hyper-green bg-opacity-20 p-2 rounded">
                        <Clock className="text-hyper-green w-5 h-5" />
                      </div>
                    </div>
                    <div className="w-full bg-gray-800 h-2 mt-4">
                      <div 
                        className="bg-hyper-green h-full" 
                        style={{ 
                          width: `${100 - ((nextRewardIn / (5 * 60 * 60)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* NFT Grid */}
                {userNFTs && userNFTs.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {userNFTs.map((tokenId) => (
                      <div key={tokenId} className="pixel-card p-4">
                        <div className="aspect-square bg-gray-800 rounded-lg"></div>
                        <div className="mt-2">
                          <p className="font-pixel text-xs text-gray-400">
                            Hyperian #{tokenId}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pixel-card text-center py-12">
                    <p className="font-pixel text-sm text-gray-400">
                      No NFTs found in your wallet
                    </p>
                  </div>
                )}

                {/* Recent Activity */}
                {recentActivity && recentActivity.length > 0 && (
                  <div className="mt-8">
                    <h2 className="font-pixel text-lg text-hyper-cyan mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="pixel-card p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-pixel text-sm">{activity.type}</p>
                              <p className="font-pixel text-xs text-gray-400">
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <p className="font-pixel text-sm text-hyper-yellow">
                              +{activity.points} pts
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;