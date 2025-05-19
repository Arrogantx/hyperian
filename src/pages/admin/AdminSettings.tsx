import React, { useState } from 'react';
import { Save, RotateCcw, AlertCircle, Info } from 'lucide-react';
import PixelButton from '../../components/ui/PixelButton';
import { useWhitelist } from '../../context/WhitelistContext';
import { createClient } from '@supabase/supabase-js';
import { createPublicClient, http, parseAbi, defineChain } from 'viem';

// ── Supabase client ───────────────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// ── Hyperliquid chain config ──────────────────────────────────────────────────
const hyperliquid = defineChain({
  id: 424242,
  name: 'Hyperliquid',
  network: 'hyperliquid',
  nativeCurrency: { decimals: 18, name: 'ETH', symbol: 'ETH' },
  rpcUrls: {
    default:  { http: ['https://rpc.hyperliquid.xyz/evm'] },
    public:   { http: ['https://rpc.hyperliquid.xyz/evm'] },
  },
});

// ── Minimal ERC‑721 ABI ───────────────────────────────────────────────────────
const ERC721_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function totalSupply() view returns (uint256)'
]);

const AdminSettings: React.FC = () => {
  const { addToWhitelist } = useWhitelist();

  // ── NFT Import state ────────────────────────────────────────────────────────
  const [contractAddress, setContractAddress] = useState('');
  const [minHolding, setMinHolding]             = useState(1);
  const [importing, setImporting]               = useState(false);
  const [importError, setImportError]           = useState<string|null>(null);
  const [importProgress, setImportProgress]     = useState(0);

  // ── Bulk add state ──────────────────────────────────────────────────────────
  const [addressesText, setAddressesText] = useState('');
  const [bulkError, setBulkError]         = useState<string|null>(null);
  const [bulkAdding, setBulkAdding]       = useState(false);

  // ── Site settings state ────────────────────────────────────────────────────
  const [themeMode, setThemeMode]             = useState('dark');
  const [confettiDuration, setConfettiDuration] = useState(5);
  const [soundEnabled, setSoundEnabled]       = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleResetSettings = () => {
    setContractAddress('');
    setMinHolding(1);
    setAddressesText('');
    setThemeMode('dark');
    setConfettiDuration(5);
    setSoundEnabled(false);
    setImportError(null);
    setBulkError(null);
  };

  const handleSaveSettings = () => {
    // persist themeMode, confettiDuration, soundEnabled...
    alert('Settings saved successfully!');
  };

  const resetWhitelist = async () => {
    if (!confirm('This will delete ALL whitelist entries. Continue?')) return;
    const { error } = await supabase.from('whitelist').delete().neq('address', '');
    if (error) alert('Reset failed: ' + error.message);
    else {
      alert('Whitelist reset.');
      window.location.reload();
    }
  };

  const importHolders = async () => {
    if (!contractAddress) {
      setImportError('Please enter a contract address');
      return;
    }
    setImporting(true);
    setImportError(null);
    setImportProgress(0);
    try {
      const client = createPublicClient({
        chain: hyperliquid,
        transport: http(hyperliquid.rpcUrls.default.http[0]!),
        ccipRead: false
      });
      const contract = { address: contractAddress as `0x${string}`, abi: ERC721_ABI };
      const totalSupply = await client.readContract({ ...contract, functionName: 'totalSupply' });
      const holders = new Set<string>();
      const batchSize = 50;
      for (let i = 0; i < Number(totalSupply); i += batchSize) {
        const batch = Array.from(
          { length: Math.min(batchSize, Number(totalSupply) - i) },
          (_, j) => i + j
        );
        const owners = await Promise.all(
          batch.map(id =>
            client
              .readContract({ ...contract, functionName: 'ownerOf', args: [BigInt(id)] })
              .catch(() => null)
          )
        );
        owners.forEach(o => o && holders.add((o as string).toLowerCase()));
        setImportProgress((i / Number(totalSupply)) * 100);
      }
      for (const holder of holders) {
        const balance = await client.readContract({
          ...contract,
          functionName: 'balanceOf',
          args: [holder as `0x${string}`]
        });
        if (Number(balance) >= minHolding) {
          await addToWhitelist({
            address: holder,
            is_whitelisted: true,
            has_freemint: false,
            addedBy: 'NFT Import',
            ensName: undefined
          });
        }
      }
      setImportProgress(100);
      alert('Import complete!');
    } catch (err) {
      console.error(err);
      setImportError('Import failed: check contract or RPC');
    } finally {
      setImporting(false);
    }
  };

  const bulkAddAddresses = async (freeMint: boolean) => {
    const raw = addressesText.split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean);
    const invalid = raw.filter(addr => !/^0x[0-9a-fA-F]{40}$/.test(addr));
    if (invalid.length) {
      setBulkError('Invalid: ' + invalid.join(', '));
      return;
    }
    setBulkAdding(true);
    setBulkError(null);
    try {
      for (const addr of raw) {
        await addToWhitelist({
          address: addr,
          is_whitelisted: true,
          has_freemint: freeMint,
          addedBy: 'Admin Bulk',
          ensName: undefined
        });
      }
      alert(`Bulk ${freeMint ? 'free‑mint' : 'standard'} add complete`);
      setAddressesText('');
    } catch (err) {
      console.error(err);
      setBulkError('Bulk add failed');
    } finally {
      setBulkAdding(false);
    }
  };

  return (
    <div>
      <h1 className="font-pixel text-xl text-hyper-magenta mb-8">Admin Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Import NFT Holders */}
        <div className="pixel-card">
          <h2 className="font-pixel text-sm text-hyper-cyan mb-4">
            Import NFT Holders
          </h2>
          {importError && (
            <div className="mb-4 p-3 border-2 border-hyper-red flex items-center gap-2">
              <AlertCircle className="text-hyper-red" />
              <span className="font-pixel text-xs text-hyper-red">
                {importError}
              </span>
            </div>
          )}
          <label className="font-pixel text-xs text-gray-300 block mb-2">
            Contract Address:
          </label>
          <input
            type="text"
            value={contractAddress}
            onChange={e => setContractAddress(e.target.value)}
            placeholder="0x..."
            className="pixel-input w-full mb-4"
          />
          <label className="font-pixel text-xs text-gray-300 block mb-2">
            Min Holding:
          </label>
          <input
            type="number"
            min="1"
            value={minHolding}
            onChange={e => setMinHolding(parseInt(e.target.value))}
            className="pixel-input w-full mb-4"
          />
          {importing && (
            <div className="mb-4">
              <div className="w-full bg-gray-800 h-2 mb-2">
                <div
                  className="bg-hyper-cyan h-full transition-all"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="font-pixel text-xs text-gray-400">
                Importing… {importProgress.toFixed(0)}%
              </p>
            </div>
          )}
          <PixelButton
            color="yellow"
            size="sm"
            onClick={importHolders}
            disabled={importing || !contractAddress}
          >
            {importing ? 'Importing…' : 'Import Holders'}
          </PixelButton>
        </div>

        {/* Bulk Add Addresses */}
        <div className="pixel-card">
          <h2 className="font-pixel text-sm text-hyper-yellow mb-4">
            Bulk Add Addresses{' '}
            <Info
              className="inline cursor-help"
              title="One address per line or comma‑separated; must be 0x + 40 hex chars"
            />
          </h2>
          {bulkError && (
            <div className="mb-4 p-3 border-2 border-hyper-red flex items-center gap-2">
              <AlertCircle className="text-hyper-red" />
              <span className="font-pixel text-xs text-hyper-red">
                {bulkError}
              </span>
            </div>
          )}
          <textarea
            value={addressesText}
            onChange={e => setAddressesText(e.target.value)}
            rows={5}
            placeholder="0x123…&#10;0xabc…"
            className="pixel-input w-full mb-4"
          />
          <div className="flex gap-2 mb-4">
            <PixelButton
              color="yellow"
              size="sm"
              onClick={() => bulkAddAddresses(false)}
              disabled={bulkAdding || !addressesText.trim()}
            >
              {bulkAdding ? 'Adding…' : 'Add Standard'}
            </PixelButton>
            <PixelButton
              color="green"
              size="sm"
              onClick={() => bulkAddAddresses(true)}
              disabled={bulkAdding || !addressesText.trim()}
            >
              {bulkAdding ? 'Adding…' : 'Add Free‑Mint'}
            </PixelButton>
          </div>
          <PixelButton color="red" size="sm" onClick={resetWhitelist}>
            Reset Whitelist
          </PixelButton>
        </div>

        {/* Site Settings */}
        <div className="pixel-card">
          <h2 className="font-pixel text-sm text-hyper-cyan mb-4">
            Site Settings
          </h2>
          <label className="font-pixel text-xs text-gray-300 block mb-2">
            Theme Mode:
          </label>
          <select
            value={themeMode}
            onChange={e => setThemeMode(e.target.value)}
            className="pixel-input w-full bg-hyper-black mb-4"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="hyper">Hyper</option>
          </select>

          <label className="font-pixel text-xs text-gray-300 block mb-2">
            Confetti Duration:
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={confettiDuration}
            onChange={e => setConfettiDuration(parseInt(e.target.value))}
            className="w-full mb-2"
          />
          <div className="text-right font-pixel text-xs text-gray-400 mb-4">
            {confettiDuration} seconds
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={() => setSoundEnabled(!soundEnabled)}
              className="sr-only"
            />
            <div
              className={`w-10 h-6 relative border-2 ${
                soundEnabled
                  ? 'bg-hyper-cyan border-hyper-cyan'
                  : 'bg-gray-700 border-gray-600'
              }`}
            >
              <div
                className={`absolute w-4 h-4 bg-white top-0.5 transition-all ${
                  soundEnabled ? 'right-0.5' : 'left-0.5'
                }`}
              ></div>
            </div>
            <span className="font-pixel text-xs text-gray-300">
              Enable Sound Effects
            </span>
          </label>
        </div>
      </div>

      {/* Save & Reset Buttons */}
      <div className="flex justify-end mt-6 gap-4">
        <PixelButton
          onClick={handleResetSettings}
          color="red"
          size="sm"
          className="flex items-center gap-1"
        >
          <RotateCcw size={14} /> Reset Inputs
        </PixelButton>
        <PixelButton
          onClick={handleSaveSettings}
          color="green"
          size="sm"
          className="flex items-center gap-1"
        >
          <Save size={14} /> Save Settings
        </PixelButton>
      </div>
    </div>
  );
};

export default AdminSettings;
