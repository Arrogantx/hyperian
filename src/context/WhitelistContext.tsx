// src/context/WhitelistContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useWeb3 } from './Web3Context';
import Papa from 'papaparse';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);

export interface WhitelistEntry {
  address: string;
  is_whitelisted: boolean;
  has_freemint: boolean;
  dateAdded: string;
  addedBy: string;
  ensName?: string;
}

interface WhitelistContextType {
  whitelist: WhitelistEntry[];
  isWhitelisted: boolean;
  whitelistStatus: 'standard' | 'freemint' | 'both' | null;
  checkWhitelist: (address: string) => Promise<boolean>;
  addToWhitelist: (entry: {
    address: string;
    is_whitelisted?: boolean;
    has_freemint?: boolean;
    addedBy: string;
    ensName?: string;
  }) => Promise<boolean>;
  removeFromWhitelist: (address: string) => Promise<boolean>;
  updateWhitelistEntry: (
    address: string,
    updates: {
      is_whitelisted?: boolean;
      has_freemint?: boolean;
      ensName?: string;
    }
  ) => Promise<boolean>;
  whitelistCount: { total: number; standard: number; freemint: number };
  exportStandardCsv: () => Promise<void>;
  exportFreemintCsv: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const WhitelistContext = createContext<WhitelistContextType>({
  whitelist: [],
  isWhitelisted: false,
  whitelistStatus: null,
  checkWhitelist: async () => false,
  addToWhitelist: async () => false,
  removeFromWhitelist: async () => false,
  updateWhitelistEntry: async () => false,
  whitelistCount: { total: 0, standard: 0, freemint: 0 },
  exportStandardCsv: async () => {},
  exportFreemintCsv: async () => {},
  loading: false,
  error: null,
});

export const useWhitelist = () => useContext(WhitelistContext);

interface WhitelistProviderProps {
  children: ReactNode;
}

export const WhitelistProvider: React.FC<WhitelistProviderProps> = ({ children }) => {
  const { address, ensName } = useWeb3();
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [whitelistStatus, setWhitelistStatus] = useState<'standard' | 'freemint' | 'both' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whitelistCount, setWhitelistCount] = useState({ total: 0, standard: 0, freemint: 0 });

  const fetchCounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const totalRes = await supabase.from('whitelist').select('address', { head: true, count: 'exact' });
      const stdRes = await supabase
        .from('whitelist')
        .select('address', { head: true, count: 'exact' })
        .eq('is_whitelisted', true);
      const fmRes = await supabase
        .from('whitelist')
        .select('address', { head: true, count: 'exact' })
        .eq('has_freemint', true);

      setWhitelistCount({
        total: totalRes.count ?? 0,
        standard: stdRes.count ?? 0,
        freemint: fmRes.count ?? 0,
      });
    } catch (err) {
      console.error('Error fetching counts:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadWhitelist = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('whitelist')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const entries: WhitelistEntry[] = (data || []).map((e: any) => ({
        address: e.address,
        is_whitelisted: e.is_whitelisted,
        has_freemint: e.has_freemint,
        dateAdded: new Date(e.created_at).toISOString().split('T')[0],
        addedBy: e.added_by,
        ensName: e.ens_name || undefined,
      }));
      setWhitelist(entries);
    } catch (err) {
      console.error('Error loading whitelist:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
    loadWhitelist();
  }, []);

  useEffect(() => {
    if (address) checkWhitelist(address);
  }, [address]);

  const checkWhitelist = async (addr: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('whitelist')
        .select('is_whitelisted, has_freemint')
        .eq('address', addr.toLowerCase())
        .maybeSingle();
      if (error) throw error;

      if (!data) {
        setIsWhitelisted(false);
        setWhitelistStatus(null);
        return false;
      }

      const { is_whitelisted, has_freemint } = data;
      const whitelisted = is_whitelisted || has_freemint;
      setIsWhitelisted(whitelisted);

      if (is_whitelisted && has_freemint) setWhitelistStatus('both');
      else if (has_freemint) setWhitelistStatus('freemint');
      else if (is_whitelisted) setWhitelistStatus('standard');
      else setWhitelistStatus(null);

      return whitelisted;
    } catch (err) {
      console.error('Error checking whitelist:', err);
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addToWhitelist = async (entry: {
    address: string;
    is_whitelisted?: boolean;
    has_freemint?: boolean;
    addedBy: string;
    ensName?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const free = entry.has_freemint ?? false;
      const std = free || (entry.is_whitelisted ?? false);
      await supabase
        .from('whitelist')
        .upsert(
          {
            address: entry.address.toLowerCase(),
            is_whitelisted: std,
            has_freemint: free,
            added_by: entry.addedBy,
            ens_name: entry.ensName || ensName,
          },
          { onConflict: ['address'] }
        );

      await fetchCounts();
      await loadWhitelist();
      return await checkWhitelist(entry.address);
    } catch (err) {
      console.error('Error adding to whitelist:', err);
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateWhitelistEntry = async (
    addr: string,
    updates: { is_whitelisted?: boolean; has_freemint?: boolean; ensName?: string }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const free = updates.has_freemint ?? false;
      const std = free || (updates.is_whitelisted ?? false);
      await supabase
        .from('whitelist')
        .update({
          is_whitelisted: std,
          has_freemint: free,
          ens_name: updates.ensName,
        })
        .eq('address', addr.toLowerCase());

      await fetchCounts();
      await loadWhitelist();
      return await checkWhitelist(addr);
    } catch (err) {
      console.error('Error updating whitelist entry:', err);
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFromWhitelist = async (addr: string) => {
    setLoading(true);
    setError(null);
    try {
      await supabase.from('whitelist').delete().eq('address', addr.toLowerCase());
      await fetchCounts();
      await loadWhitelist();
      return true;
    } catch (err) {
      console.error('Error removing from whitelist:', err);
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const exportStandardCsv = async () => {
    const { data, error } = await supabase
      .from('whitelist')
      .select('address,created_at,added_by,ens_name')
      .eq('is_whitelisted', true)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Export whitelist error:', error);
      return;
    }

    const rows = data.map(r => ({
      address: r.address,
      dateAdded: new Date(r.created_at).toISOString(),
      addedBy: r.added_by,
      ensName: r.ens_name,
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whitelist_standard.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportFreemintCsv = async () => {
    const { data, error } = await supabase
      .from('whitelist')
      .select('address,created_at,added_by,ens_name')
      .eq('has_freemint', true)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Export freemint error:', error);
      return;
    }

    const rows = data.map(r => ({
      address: r.address,
      dateAdded: new Date(r.created_at).toISOString(),
      addedBy: r.added_by,
      ensName: r.ens_name,
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whitelist_freemint.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <WhitelistContext.Provider
      value={{
        whitelist,
        isWhitelisted,
        whitelistStatus,
        checkWhitelist,
        addToWhitelist,
        removeFromWhitelist,
        updateWhitelistEntry,
        whitelistCount,
        exportStandardCsv,
        exportFreemintCsv,
        loading,
        error,
      }}
    >
      {children}
    </WhitelistContext.Provider>
  );
};
