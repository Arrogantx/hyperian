import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Eye, Share2, Calendar } from 'lucide-react';
import { useWhitelist } from '../../context/WhitelistContext';

const AdminStats: React.FC = () => {
  const { whitelistCount } = useWhitelist();
  const chartRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (chartRef.current) {
      // Animate chart bars on load
      gsap.from('.stat-bar', {
        height: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power2.out'
      });
    }
  }, []);

  return (
    <div>
      <h1 className="font-pixel text-xl text-hyper-magenta mb-8">Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="pixel-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-pixel text-xs text-gray-400">Whitelist Checks</p>
              <h3 className="font-pixel text-xl text-hyper-cyan mt-2">143</h3>
            </div>
            <div className="bg-hyper-cyan bg-opacity-20 p-2 rounded">
              <Eye className="text-hyper-cyan w-5 h-5" />
            </div>
          </div>
          <p className="font-pixel text-xs text-green-400 mt-4">+12% from last week</p>
        </div>
        
        <div className="pixel-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-pixel text-xs text-gray-400">Twitter Shares</p>
              <h3 className="font-pixel text-xl text-hyper-magenta mt-2">36</h3>
            </div>
            <div className="bg-hyper-magenta bg-opacity-20 p-2 rounded">
              <Share2 className="text-hyper-magenta w-5 h-5" />
            </div>
          </div>
          <p className="font-pixel text-xs text-green-400 mt-4">+8% from last week</p>
        </div>
        
        <div className="pixel-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-pixel text-xs text-gray-400">Whitelist Growth</p>
              <h3 className="font-pixel text-xl text-hyper-yellow mt-2">
                {whitelistCount.total} / 5000
              </h3>
            </div>
            <div className="bg-hyper-yellow bg-opacity-20 p-2 rounded">
              <Calendar className="text-hyper-yellow w-5 h-5" />
            </div>
          </div>
          <div className="w-full bg-gray-800 h-2 mt-4">
            <div 
              className="bg-hyper-yellow h-full" 
              style={{ width: `${(whitelistCount.total / 5000) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="pixel-card">
          <h2 className="font-pixel text-sm text-hyper-cyan mb-6">Weekly Activity</h2>
          
          <div ref={chartRef} className="h-48 flex items-end justify-between gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
              // Generate random bar heights for demo
              const height = Math.floor(Math.random() * 80) + 10;
              
              return (
                <div key={day} className="flex flex-col items-center flex-1">
                  <div 
                    className={`stat-bar w-full bg-hyper-cyan`}
                    style={{ 
                      height: `${height}%`,
                      backgroundColor: index % 2 === 0 ? '#00FFFF' : '#FF00FF'
                    }}
                  ></div>
                  <div className="font-pixel text-xs text-gray-400 mt-2">{day}</div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="pixel-card">
          <h2 className="font-pixel text-sm text-hyper-cyan mb-6">Recent Activity Log</h2>
          
          <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="border-b border-gray-800 pb-3 last:border-b-0">
                <div className="flex items-start gap-2">
                  {index % 3 === 0 ? (
                    <Eye className="text-hyper-cyan w-4 h-4 mt-0.5 flex-shrink-0" />
                  ) : index % 3 === 1 ? (
                    <Share2 className="text-hyper-magenta w-4 h-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Calendar className="text-hyper-yellow w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-pixel text-xs">
                      {index % 3 === 0 
                        ? 'Address checked whitelist status'
                        : index % 3 === 1
                          ? 'User shared on Twitter'
                          : 'New address added to whitelist'
                      }
                    </p>
                    <p className="font-pixel text-xs text-gray-400 mt-1">
                      {index} hour{index !== 1 ? 's' : ''} ago
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;