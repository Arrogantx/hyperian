import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Plus, Download, Search, Edit, Trash2 } from 'lucide-react';
import { useWhitelist, WhitelistEntry } from '../../context/WhitelistContext';
import PixelButton from '../../components/ui/PixelButton';

const AdminWhitelist: React.FC = () => {
  const {
    whitelist,
    addToWhitelist,
    removeFromWhitelist,
    updateWhitelistEntry
  } = useWhitelist();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newStatus, setNewStatus] = useState<'standard' | 'freemint'>('standard');
  const [editingEntry, setEditingEntry] = useState<WhitelistEntry | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Animate form open/close
  useEffect(() => {
    if (showAddForm && formRef.current) {
      gsap.fromTo(
        formRef.current,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [showAddForm]);

  // Filtered list
  const filtered = whitelist.filter(e =>
    e.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.ensName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  // === ADD NEW ===
  const handleAddAddress = async () => {
    if (!newAddress) return;
    const isWL = newStatus === 'standard' || newStatus === 'freemint';
    const hasFM = newStatus === 'freemint';

    const success = await addToWhitelist({
      address: newAddress,
      is_whitelisted: isWL,
      has_freemint: hasFM,
      addedBy: 'admin',
      ensName: undefined
    });

    if (success) {
      setNewAddress('');
      setNewStatus('standard');
      setShowAddForm(false);
    }
  };

  // === EDIT EXISTING ===
  const handleEditStart = (entry: WhitelistEntry) => {
    setEditingEntry(entry);
  };
  const handleEditSave = async () => {
    if (!editingEntry) return;
    // infer values:
    const isWL = editingEntry.has_freemint || editingEntry.is_whitelisted;
    await updateWhitelistEntry(editingEntry.address, {
      is_whitelisted: isWL,
      has_freemint: editingEntry.has_freemint,
      ensName: editingEntry.ensName
    });
    setEditingEntry(null);
  };
  const handleEditCancel = () => setEditingEntry(null);

  // === REMOVE ===
  const handleRemove = async (addr: string) => {
    if (confirm('Remove this address?')) {
      await removeFromWhitelist(addr);
    }
  };

  // === EXPORT CSV ===
  const exportCsv = () => {
    const rows = whitelist.map(e => [
      e.address,
      e.is_whitelisted && e.has_freemint ? 'both'
        : e.has_freemint ? 'freemint'
        : e.is_whitelisted ? 'standard'
        : 'none',
      e.dateAdded,
      e.addedBy,
      e.ensName || ''
    ]);
    const csv = [
      ['address','status','dateAdded','addedBy','ensName'].join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'whitelist.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <h1 className="font-pixel text-xl text-hyper-magenta mb-4 md:mb-0">
          Whitelist Management
        </h1>
        <div className="flex gap-3">
          <PixelButton
            color="cyan"
            size="sm"
            onClick={() => setShowAddForm(open => !open)}
            className="flex items-center gap-1"
          >
            <Plus size={14} /> {showAddForm ? 'Cancel' : 'Add Address'}
          </PixelButton>
          <PixelButton
            color="yellow"
            size="sm"
            onClick={exportCsv}
            className="flex items-center gap-1"
          >
            <Download size={14} /> Export CSV
          </PixelButton>
        </div>
      </div>

      {showAddForm && (
        <div ref={formRef} className="pixel-card mb-6 overflow-hidden">
          <h2 className="font-pixel text-sm text-hyper-cyan mb-4">Add New Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="font-pixel text-xs text-gray-300 block mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                value={newAddress}
                onChange={e => setNewAddress(e.target.value)}
                placeholder="0x..."
                className="pixel-input w-full"
              />
            </div>
            <div>
              <label className="font-pixel text-xs text-gray-300 block mb-2">
                Whitelist Type
              </label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as any)}
                className="pixel-input w-full bg-hyper-black"
              >
                <option value="standard">Standard</option>
                <option value="freemint">Free Mint</option>
              </select>
            </div>
          </div>
          <div className="mt-4 text-right">
            <PixelButton color="green" size="sm" onClick={handleAddAddress}>
              Add to Whitelist
            </PixelButton>
          </div>
        </div>
      )}

      <div className="pixel-card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search addresses..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pixel-input w-full pl-10"
          />
        </div>
      </div>

      <div className="pixel-card overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-hyper-cyan">
              <th className="font-pixel text-xs p-3 text-hyper-cyan text-left">Address</th>
              <th className="font-pixel text-xs p-3 text-hyper-cyan text-left">Status</th>
              <th className="font-pixel text-xs p-3 text-hyper-cyan text-left">Date Added</th>
              <th className="font-pixel text-xs p-3 text-hyper-cyan text-left">Added By</th>
              <th className="font-pixel text-xs p-3 text-hyper-cyan text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6">
                  <p className="font-pixel text-sm text-gray-400">No addresses found</p>
                </td>
              </tr>
            ) : (
              filtered.map(entry => {
                const statusLabel = entry.has_freemint
                  ? 'Free Mint'
                  : entry.is_whitelisted
                  ? 'Standard'
                  : 'None';

                return editingEntry?.address === entry.address ? (
                  <tr key={entry.address} className="bg-gray-900">
                    <td className="p-3 font-pixel text-xs break-all">{entry.address}</td>
                    <td className="p-3">
                      <select
                        value={entry.has_freemint ? 'freemint' : 'standard'}
                        onChange={e =>
                          setEditingEntry({
                            ...entry,
                            has_freemint: e.target.value === 'freemint',
                            is_whitelisted: true
                          })
                        }
                        className="pixel-input py-1 px-2 text-xs w-full"
                      >
                        <option value="standard">Standard</option>
                        <option value="freemint">Free Mint</option>
                      </select>
                    </td>
                    <td className="p-3 font-pixel text-xs text-gray-400">{entry.dateAdded}</td>
                    <td className="p-3 font-pixel text-xs text-gray-400">{entry.addedBy}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={handleEditSave} className="bg-hyper-green px-2 py-1 text-xs font-pixel">Save</button>
                      <button onClick={handleEditCancel} className="bg-hyper-red px-2 py-1 text-xs font-pixel">Cancel</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={entry.address} className="border-b border-gray-800">
                    <td className="p-3 font-pixel text-xs break-all">
                      {entry.address}
                      {entry.ensName && <div className="text-hyper-cyan text-xs">{entry.ensName}</div>}
                    </td>
                    <td className="p-3">
                      <span
                        className={`font-pixel text-xs px-2 py-1 inline-block ${
                          entry.has_freemint
                            ? 'bg-hyper-green bg-opacity-20 text-hyper-green'
                            : 'bg-hyper-yellow bg-opacity-20 text-hyper-yellow'
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="p-3 font-pixel text-xs text-gray-400">{entry.dateAdded}</td>
                    <td className="p-3 font-pixel text-xs text-gray-400">{entry.addedBy}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => handleEditStart(entry)} className="text-hyper-cyan hover:text-white">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleRemove(entry.address)} className="text-hyper-red hover:text-white">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminWhitelist;
