import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useWeb3 } from './Web3Context';

// Initialize Supabase
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// Contract constants
const CONTRACT_ADDRESS = '0xB0F82655F249FC6561A94eB370d41bD24A861A9d';

interface Activity {
  type: string;
  points: number;
  timestamp: number;
}

interface StakingContextType {
  userPoints: number;
  totalPoints: number;
  weeklyPoints: number;
  nextRewardIn: number;
  activityMultiplier: number;
  userNFTs: string[];
  recentActivity: Activity[];
  isLoading: boolean;
  error: string | null;
}

const StakingContext = createContext<StakingContextType>({
  userPoints: 0,
  totalPoints: 0,
  weeklyPoints: 0,
  nextRewardIn: 0,
  activityMultiplier: 1,
  userNFTs: [],
  recentActivity: [],
  isLoading: false,
  error: null,
});

export const useStaking = () => useContext(StakingContext);

// Helper: balanceOf(address) = 0x70a08231 + padded address
function encodeBalanceOf(address: string): string {
  return `0x70a08231${address.toLowerCase().replace('0x', '').padStart(64, '0')}`;
}

// ✅ Updated to use Netlify proxy
async function attemptContractRead(address: string): Promise<bigint> {
  const payload = {
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [
      {
        to: CONTRACT_ADDRESS,
        data: encodeBalanceOf(address),
      },
      'latest',
    ],
    id: 1,
  };

  const res = await fetch('/.netlify/functions/rpc-proxy', {
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
  const [userPoints, setUserPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [weeklyPoints, setWeeklyPoints] = useState(0);
  const [nextRewardIn, setNextRewardIn] = useState(18000);
  const [activityMultiplier, setActivityMultiplier] = useState(1);
  const [userNFTs, setUserNFTs] = useState<string[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserData = async () => {
    if (!address || !isConnected) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const balance = await attemptContractRead(address);
      const nftIds = Array.from({ length: Number(balance) }, (_, i) => String(i + 1));
      setUserNFTs(nftIds);

      const { data: userData, error: dbError } = await supabase
        .from('user_points')
        .select('*')
        .eq('address', address.toLowerCase())
        .maybeSingle();

      if (dbError) throw dbError;

      if (!userData) {
        const { error: insertError } = await supabase
          .from('user_points')
          .insert([
            {
              address: address.toLowerCase(),
              points: 0,
              weekly_points: 0,
              total_nfts_held: Number(balance),
              activity_multiplier: 1,
            },
          ]);

        if (insertError) throw insertError;

        setUserPoints(0);
        setWeeklyPoints(0);
        setTotalPoints(0);
      } else {
        setUserPoints(userData.points || 0);
        setWeeklyPoints(userData.weekly_points || 0);
        setTotalPoints(userData.total_claimed || 0);
        setActivityMultiplier(userData.activity_multiplier || 1);

        const lastActivity = new Date(userData.last_activity);
        const timeSince = Math.floor((Date.now() - lastActivity.getTime()) / 1000);
        setNextRewardIn(Math.max(0, 18000 - timeSince));
      }

      const { data: activityData } = await supabase
        .from('user_activity')
        .select('*')
        .eq('address', address.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(5);

      if (activityData) {
        setRecentActivity(
          activityData.map((activity) => ({
            type: activity.activity_type,
            points: activity.points_earned,
            timestamp: new Date(activity.created_at).getTime(),
          }))
        );
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Unable to connect to RPC. Please try again.');
      setUserNFTs([]);
      setUserPoints(0);
      setWeeklyPoints(0);
      setTotalPoints(0);
      setActivityMultiplier(1);
      setRecentActivity([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [address, isConnected]);

  return (
    <StakingContext.Provider
      value={{
        userPoints,
        totalPoints,
        weeklyPoints,
        nextRewardIn,
        activityMultiplier,
        userNFTs,
        recentActivity,
        isLoading,
        error,
      }}
    >
      {children}
    </StakingContext.Provider>
  );
};
