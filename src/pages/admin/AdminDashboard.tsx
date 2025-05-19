// src/components/AdminDashboard.tsx
import React, { useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { Users, Database, Eye, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWhitelist } from '../../context/WhitelistContext';

const AdminDashboard: React.FC = () => {
  const {
    whitelist,
    whitelistCount,
    exportStandardCsv,
    exportFreemintCsv
  } = useWhitelist();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(['.dashboard-card', '.dashboard-title'], { opacity: 0, y: 20 });
      gsap.to('.dashboard-title', {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out'
      });
      gsap.to('.dashboard-card', {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: 'power2.out'
      });
    });
    return () => ctx.revert();
  }, []);

  const recentActivity = whitelist.slice(0, 3).map(entry => ({
    type: 'whitelist',
    address: entry.address,
    date: new Date(entry.dateAdded),
    action: entry.has_freemint
      ? 'Added to free-mint list'
      : 'Added to whitelist'
  }));

  return (
    <div>
      <h1 className="dashboard-title font-pixel text-xl text-hyper-magenta mb-8">
        Admin Dashboard
      </h1>

      {/* Top stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Whitelisted */}
        <div className="dashboard-card pixel-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-pixel text-xs text-gray-400">Total Whitelisted</p>
              <h3 className="font-pixel text-xl text-hyper-cyan mt-2">
                {whitelistCount.total}
              </h3>
            </div>
            <div className="bg-hyper-cyan bg-opacity-20 p-2 rounded">
              <Users className="text-hyper-cyan w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/boss/whitelist" className="font-pixel text-xs text-hyper-cyan hover:underline">
              View Details
            </Link>
          </div>
        </div>

        {/* Standard Whitelist */}
        <div className="dashboard-card pixel-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-pixel text-xs text-gray-400">Standard Whitelist</p>
              <h3 className="font-pixel text-xl text-hyper-yellow mt-2">
                {whitelistCount.standard}
              </h3>
            </div>
            <div className="bg-hyper-yellow bg-opacity-20 p-2 rounded">
              <Database className="text-hyper-yellow w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/boss/whitelist" className="font-pixel text-xs text-hyper-yellow hover:underline">
              Manage
            </Link>
          </div>
        </div>

        {/* Free Mint Spots */}
        <div className="dashboard-card pixel-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-pixel text-xs text-gray-400">Free Mint Spots</p>
              <h3 className="font-pixel text-xl text-hyper-green mt-2">
                {whitelistCount.freemint}
              </h3>
            </div>
            <div className="bg-hyper-green bg-opacity-20 p-2 rounded">
              <Database className="text-hyper-green w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/boss/whitelist" className="font-pixel text-xs text-hyper-green hover:underline">
              Manage
            </Link>
          </div>
        </div>

        {/* Remaining Spots */}
        <div className="dashboard-card pixel-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-pixel text-xs text-gray-400">Remaining Spots</p>
              <h3 className="font-pixel text-xl text-hyper-magenta mt-2">
                {2222 - whitelistCount.total}
              </h3>
            </div>
            <div className="bg-hyper-magenta bg-opacity-20 p-2 rounded">
              <Eye className="text-hyper-magenta w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/boss/stats" className="font-pixel text-xs text-hyper-magenta hover:underline">
              View Stats
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Recent Activity */}
        <div className="dashboard-card pixel-card">
          <h2 className="font-pixel text-sm text-hyper-cyan mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="font-pixel text-xs text-gray-400">No recent activity</p>
            ) : (
              recentActivity.map((act, idx) => (
                <div key={idx} className="border-b border-gray-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="text-hyper-cyan w-4 h-4" />
                    <p className="font-pixel text-xs">
                      {act.address.slice(0, 6)}…{act.address.slice(-4)} {act.action}
                    </p>
                  </div>
                  <p className="font-pixel text-xs text-gray-400 mt-1">
                    {act.date.toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 text-right">
            <Link to="/boss/whitelist" className="font-pixel text-xs text-hyper-cyan hover:underline">
              View All Activity
            </Link>
          </div>
        </div>

        {/* Quick Actions + CSV Exports */}
        <div className="dashboard-card pixel-card">
          <h2 className="font-pixel text-sm text-hyper-yellow mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4">
            <Link
              to="/boss/whitelist"
              className="border-2 border-hyper-cyan p-3 hover:bg-hyper-cyan hover:bg-opacity-10 transition-colors flex items-center gap-2"
            >
              <Users className="text-hyper-cyan w-4 h-4" />
              <span className="font-pixel text-xs">Manage Whitelist</span>
            </Link>

            <Link
              to="/boss/settings"
              className="border-2 border-hyper-magenta p-3 hover:bg-hyper-magenta hover:bg-opacity-10 transition-colors flex items-center gap-2"
            >
              <Database className="text-hyper-magenta w-4 h-4" />
              <span className="font-pixel text-xs">Import NFT Holders</span>
            </Link>

            <Link
              to="/boss/stats"
              className="border-2 border-hyper-yellow p-3 hover:bg-hyper-yellow hover:bg-opacity-10 transition-colors flex items-center gap-2"
            >
              <Eye className="text-hyper-yellow w-4 h-4" />
              <span className="font-pixel text-xs">View Statistics</span>
            </Link>

            {/* Download Standard Whitelist CSV */}
            <button
              type="button"
              onClick={() => exportStandardCsv()}
              className="border-2 border-hyper-cyan p-3 hover:bg-hyper-cyan hover:bg-opacity-10 transition-colors flex items-center gap-2"
            >
              <Share2 className="text-hyper-cyan w-4 h-4" />
              <span className="font-pixel text-xs">Download Whitelist CSV</span>
            </button>

            {/* Download Freemint CSV */}
            <button
              type="button"
              onClick={() => exportFreemintCsv()}
              className="border-2 border-hyper-green p-3 hover:bg-hyper-green hover:bg-opacity-10 transition-colors flex items-center gap-2"
            >
              <Share2 className="text-hyper-green w-4 h-4" />
              <span className="font-pixel text-xs">Download Freemint CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
