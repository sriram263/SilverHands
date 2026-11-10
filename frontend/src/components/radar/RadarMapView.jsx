import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

export const RadarMapView = ({ opportunities, onSelect }) => {
  return (
    <div className="card-surface p-6 overflow-hidden relative bg-gradient-to-br from-med-bg-light via-white to-med-blue-light/40 border border-warmgray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-heading font-bold text-base text-warmgray-900 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-saffron animate-spin-slow" />
            Live Geographic Radar
          </h4>
          <p className="text-xs text-warmgray-500">Visual map of active elder livelihood requests in Chennai</p>
        </div>
        <span className="badge-tag bg-sage text-white font-bold">
          {opportunities.length} Active Gigs
        </span>
      </div>

      {/* Simulated Interactive Radar Grid */}
      <div className="relative h-64 rounded-2xl bg-white border border-warmgray-200 shadow-inner overflow-hidden flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(#3F9BE8_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
        
        {/* Concentric radar rings */}
        <div className="absolute w-48 h-48 rounded-full border border-saffron/20 animate-ping"></div>
        <div className="absolute w-36 h-36 rounded-full border border-sage/30"></div>
        <div className="absolute w-20 h-20 rounded-full border border-saffron/40"></div>

        {/* Center User Pin */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-saffron text-white flex items-center justify-center font-bold text-xs shadow-warm">
            📍
          </div>
          <span className="text-[10px] font-bold text-warmgray-800 bg-white/90 px-2 py-0.5 rounded-full shadow-sm mt-1">
            You (Adyar)
          </span>
        </div>

        {/* Opportunity Pins */}
        {opportunities.slice(0, 4).map((opp, idx) => {
          const positions = [
            'top-8 left-12',
            'bottom-10 right-14',
            'top-14 right-20',
            'bottom-12 left-24'
          ];
          return (
            <button
              key={opp.id}
              onClick={() => onSelect?.(opp)}
              className={`absolute ${positions[idx % positions.length]} z-20 group flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-warmgray-300 shadow-warm hover:scale-110 hover:border-saffron transition-all`}
            >
              <span className="text-xs">💼</span>
              <div className="text-left">
                <span className="text-[10px] font-bold text-warmgray-900 block max-w-[100px] truncate">{opp.title}</span>
                <span className="text-[9px] font-bold text-sage-dark">₹{Math.round(opp.budget)} • {opp.distance_km || 2.1}km</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
