import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useWeb3 } from './Web3Context';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// Contract addresses
const HYPERIANS_ADDRESS = '0x4414C32982b4CF348d4FDC7b86be2Ef9b1ae1160';
const GENESIS_ADDRESS = '0xB0F82655F249FC6561A94eB370d41bD24A861A9d';

interface UserNFT {
  type: 'hyperian' | 'genesis';
  tokenId: number;
}

type ActivityType = 'claim' | 'purchase' | 'trade';

interface Activity {
  type: ActivityType;
  points: number;
  timestamp: number;
  tokenId?: number;
  collection?: 'hyperian' | 'genesis';
}




interface StakingContextType {
  availablePoints: number;
  totalClaimedPoints: number;
  weeklyPoints: number;
  nextRewardIn: number;
  activityMultiplier: number;
  userNFTs: UserNFT[];
  recentActivity: Activity[];
  isLoading: boolean;
  error: string | null;
  refreshPoints: () => Promise<void>;
}


const StakingContext = createContext<StakingContextType>({
  availablePoints: 0,
  totalClaimedPoints: 0,
  weeklyPoints: 0,
  nextRewardIn: 0,
  activityMultiplier: 1,
  userNFTs: [],
  recentActivity: [],
  isLoading: false,
  error: null,
  refreshPoints: async () => {},
});

export const useStaking = () => useContext(StakingContext);

function encodeBalanceOf(address: string): string {
  return `0x70a08231${address.toLowerCase().replace('0x', '').padStart(64, '0')}`;
}

async function attemptContractRead(contract: string, address: string): Promise<bigint> {
  const payload = {
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [{ to: contract, data: encodeBalanceOf(address) }, 'latest'],
    id: 1,
  };

  const res = await fetch('/api/rpc-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Proxy request failed: ${res.status}`);

  const json = await res.json();
  if (!json.result) throw new Error('No result from RPC');

  return BigInt(json.result);
}

export const StakingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address, isConnected } = useWeb3();
  const [availablePoints, setAvailablePoints] = useState(0);
  const [totalClaimedPoints, setTotalClaimedPoints] = useState(0);
  const [weeklyPoints, setWeeklyPoints] = useState(0);
  const [nextRewardIn, setNextRewardIn] = useState(18000);
  const [activityMultiplier, setActivityMultiplier] = useState(1);
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('✅ totalClaimedPoints updated:', totalClaimedPoints);
  }, [totalClaimedPoints]);

  const loadUserData = async () => {
    if (!address || !isConnected) return;

    setIsLoading(true);
    setError(null);

    try {
      const [hyperianBalance, genesisBalance] = await Promise.all([
        attemptContractRead(HYPERIANS_ADDRESS, address),
        attemptContractRead(GENESIS_ADDRESS, address),
      ]);

      const hyperiansHeld = Number(hyperianBalance);
      const genesisHeld = Number(genesisBalance);
      const totalHeld = hyperiansHeld + genesisHeld;

      const tierMultiplier =
        totalHeld >= 25 ? 3 :
        totalHeld >= 10 ? 2 :
        totalHeld >= 5 ? 1.5 : 1;

        const hyperianNFTs = Array.from({ length: hyperiansHeld }, (_, i) => ({
          type: 'hyperian' as const,
          tokenId: i + 1,
        }));
        
        const genesisNFTs = Array.from({ length: genesisHeld }, (_, i) => ({
          type: 'genesis' as const,
          tokenId: i + 1,
        }));
        
        setUserNFTs([...hyperianNFTs, ...genesisNFTs]);
        
        
      setActivityMultiplier(tierMultiplier);

      const { data: userData, error: dbError } = await supabase
        .from('user_points')
        .select('*')
        .eq('address', address.toLowerCase())
        .maybeSingle()
        .throwOnError();

      if (!userData) {
        const { error: insertError } = await supabase
          .from('user_points')
          .insert([
            {
              address: address.toLowerCase(),
              points: 0,
              weekly_points: 0,
              total_claimed: 0,
              total_nfts_held: totalHeld,
              activity_multiplier: tierMultiplier,
            },
          ]);
        if (insertError) throw insertError;
      }

      setAvailablePoints(parseInt(userData?.points || '0', 10));
      setWeeklyPoints(parseInt(userData?.weekly_points || '0', 10));
      setTotalClaimedPoints(
        typeof userData.total_claimed === 'number'
          ? userData.total_claimed
          : parseFloat(userData.total_claimed || '0')
      );

      const lastClaim = new Date(userData?.last_claim || userData?.last_activity || Date.now());
const cooldownPeriod = 5 * 60 * 60 * 1000; // 5 hours

const nextClaimTimestamp = lastClaim.getTime() + cooldownPeriod;
const secondsRemaining = Math.max(0, Math.floor((nextClaimTimestamp - Date.now()) / 1000));

setNextRewardIn(secondsRemaining);



      const { data: activityData } = await supabase
        .from('user_activity')
        .select('*')
        .eq('address', address.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(5);

      if (activityData) {
        setRecentActivity(
          activityData.map((a) => ({
            type: a.activity_type,
            points: a.points_earned,
            timestamp: new Date(a.created_at).getTime(),
          }))
        );
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Unable to load user data. Please try again.');
      setUserNFTs([]);
      setAvailablePoints(0);
      setWeeklyPoints(0);
      setTotalClaimedPoints(0);
      setActivityMultiplier(1);
      setRecentActivity([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPoints = async () => {
    await loadUserData();
  };

  useEffect(() => {
    loadUserData();
  }, [address, isConnected]);

  useEffect(() => {
    if (nextRewardIn > 0) {
      const timer = setInterval(() => {
        setNextRewardIn((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [nextRewardIn]);

  return (
    <StakingContext.Provider
      value={{
        availablePoints,
        totalClaimedPoints,
        weeklyPoints,
        nextRewardIn,
        activityMultiplier,
        userNFTs,
        recentActivity,
        isLoading,
        error,
        refreshPoints,
      }}
    >
      {children}
    </StakingContext.Provider>
  );
};
