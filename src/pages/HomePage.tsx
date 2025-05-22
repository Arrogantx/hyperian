import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useWeb3 } from '../context/Web3Context';
import { useStaking } from '../context/StakingContext';
import { Zap } from 'lucide-react';
import PixelButton from '../components/ui/PixelButton';
import { supabase } from '../utils/supabase'; // ✅ correct relative path from src/pages or src root



const METADATA_BASE_URL =
  'https://harlequin-worried-bat-19.mypinata.cloud/ipfs/bafybeibzzw2zhpi4vcba5jjowrb6x6ltjgukpi5k54546xcshpoqdvbi4q';

const HomePage: React.FC = () => {
  const { isConnected, connectWallet } = useWeb3();
  const {
    userNFTs,
    availablePoints,
    totalClaimedPoints,
    weeklyPoints,
    nextRewardIn,
    activityMultiplier,
    recentActivity,
    isLoading,
    error,
    refreshPoints
  } = useStaking();

  const [collecting, setCollecting] = useState(false);
  const [nextClaimAt, setNextClaimAt] = useState<string | null>(null);
  const [nftImageMap, setNftImageMap] = useState<Record<string, string>>({});

  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { duration: 0.6, ease: 'power2.out' } });

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

  useEffect(() => {
    const loadImages = async () => {
      const map: Record<string, string> = {};
      for (const nft of userNFTs) {
        if (nft.type === 'hyperian') {
          const metadataUrl = `${METADATA_BASE_URL}/${nft.tokenId}.json`;
          try {
            const res = await fetch(metadataUrl);
            const json = await res.json();
            map[`hyperian-${nft.tokenId}`] = json.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
          } catch (err) {
            console.error(`Failed to load metadata for token ${nft.tokenId}:`, err);
          }
        }
      }
      setNftImageMap(map);
    };

    if (userNFTs.length > 0) {
      loadImages();
    }
  }, [userNFTs]);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'Now';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatCountdown = (iso: string) => {
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return 'Now';
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const min = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hrs}h ${min}m`;
  };

  const collectPoints = async () => {
    try {
      setCollecting(true);
      let address: string | undefined;
  
      try {
        const accounts = await (window as any).ethereum?.request({ method: 'eth_accounts' });
        address = accounts?.[0];
      } catch (err) {
        console.error("Failed to get accounts:", err);
      }
  
      if (!address) {
        alert('Wallet not connected');
        return;
      }
  
      const res = await fetch('https://pdjvxaehqhjvkbzbihvr.functions.supabase.co/claim-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ wallet: address })
      });
  
      const result = await res.json();
  
      if (result.success) {
        alert(`You earned ${result.points} points!`);
  
        if (result.next_claim_at) {
          setNextClaimAt(result.next_claim_at);
          localStorage.setItem('nextClaimAt', result.next_claim_at);
        }
  
        await refreshPoints();
      } else {
        if (result.error === 'Cooldown active' && result.next_claim_at) {
          setNextClaimAt(result.next_claim_at);
          localStorage.setItem('nextClaimAt', result.next_claim_at);
          alert(`Cooldown active. Try again after: ${formatCountdown(result.next_claim_at)}`);
        } else {
          alert(`Failed to collect points: ${result.error}`);
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error collecting points.');
    } finally {
      setCollecting(false);
    }
  };
  

  return (
    <div className="pt-20 pb-12">
      <div ref={heroRef} className="px-4 py-12 md:py-20 flex flex-col items-center justify-center text-center relative">
        <div className="absolute left-10 top-40 w-4 h-4 bg-hyper-cyan pixel-floater"></div>
        <div className="absolute right-10 top-20 w-6 h-6 bg-hyper-magenta pixel-floater"></div>
        <div className="absolute left-1/4 bottom-10 w-5 h-5 bg-hyper-yellow pixel-floater"></div>

        <div className="relative mb-6">
          <Zap size={48} className="text-hyper-cyan animate-pulse" />
        </div>

        <h1 ref={titleRef} className="font-pixel text-2xl md:text-4xl text-white mb-6 max-w-2xl">
          <span className="text-hyper-cyan">HYPERIAN</span> GENESIS
        </h1>

        {!isConnected ? (
          <div className="w-full max-w-md">
            <div className="pixel-card">
              <h2 className="font-pixel text-lg text-hyper-cyan mb-4">CONNECT WALLET</h2>
              <p className="font-pixel text-sm text-gray-300 mb-6">
                Connect your wallet to view your NFTs and start staking
              </p>
              <PixelButton color="cyan" fullWidth onClick={connectWallet}>
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                  <div className="dashboard-card pixel-card">
                    <p className="font-pixel text-xs text-gray-400">Your NFTs</p>
                    <h3 className="font-pixel text-xl text-hyper-cyan mt-2">{userNFTs.length}</h3>
                  </div>
                  <div className="dashboard-card pixel-card">
                    <p className="font-pixel text-xs text-gray-400">Available Points</p>
                    <h3
                      className={`font-pixel text-xl mt-2 ${
                        nextRewardIn === 0 ? 'text-hyper-green' : 'text-hyper-magenta'
                      }`}
                    >
                      {availablePoints}
                    </h3>
                  </div>
                  <div className="dashboard-card pixel-card">
                    <p className="font-pixel text-xs text-gray-400">Weekly Points</p>
                    <h3 className="font-pixel text-xl text-hyper-yellow mt-2">{weeklyPoints}</h3>
                  </div>
                  <div className="dashboard-card pixel-card">
                    <p className="font-pixel text-xs text-gray-400">Next Claim In</p>
                    <h3 className="font-pixel text-xl text-hyper-green mt-2">
  {nextClaimAt ? formatCountdown(nextClaimAt) : 'Now'}
</h3>

                    <div className="w-full bg-gray-800 h-2 mt-4">
                      <div
                        className="bg-hyper-green h-full"
                        style={{ width: `${100 - ((nextRewardIn / (5 * 60 * 60)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="dashboard-card pixel-card">
                    <p className="font-pixel text-xs text-gray-400">Total Claimed</p>
                    <h3 className="font-pixel text-xl text-hyper-blue mt-2">{totalClaimedPoints}</h3>
                  </div>
                </div>

                {userNFTs.length > 0 && (
                  <div className="my-6 text-center">
                    <PixelButton color="green" onClick={collectPoints} disabled={collecting}>
                      {collecting ? 'Collecting...' : 'Collect Points'}
                    </PixelButton>
                  </div>
                )}

                <div className="space-y-12 mt-12">
  {['hyperian', 'genesis'].map((collection) => {
    const nfts = userNFTs.filter((nft) => nft.type === collection);
    if (nfts.length === 0) return null;

    return (
      <div key={collection}>
        <h2 className="font-pixel text-xl text-white mb-4 text-left">
          {collection === 'hyperian' ? 'OG Hyperians' : 'Genesis'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {nfts.map(({ tokenId }) => {
            const key = `${collection}-${tokenId}`;
            const imageUrl =
              collection === 'hyperian'
                ? '/nfts/og.png'
                : '/nfts/unrevealed.gif';

            return (
              <div key={key} className="pixel-card p-3 bg-gray-900 border border-hyper-cyan rounded-md shadow-md">
                <div className="aspect-square bg-gray-800 rounded-md overflow-hidden flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt={`${collection === 'hyperian' ? 'Hyperian' : 'Genesis'} #${tokenId}`}
                    className="object-contain max-w-full max-h-full"
                    loading="lazy"
                  />
                </div>
                <div className="mt-2 text-center">
                  <p className="font-pixel text-xs text-gray-300">
                    {collection === 'hyperian' ? 'Hyperian' : 'Genesis'} #{tokenId}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  })}
</div>

              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
