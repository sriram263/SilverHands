import React, { useState, useEffect } from 'react';
import { getRadarOpportunities } from '../../api/client';
import { OpportunityRadarCard } from '../../components/radar/OpportunityRadarCard';
import { RadarMapView } from '../../components/radar/RadarMapView';
import { Compass, Sparkles, Navigation, Filter } from 'lucide-react';

export const OpportunityRadarPage = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpp, setSelectedOpp] = useState(null);

  const loadRadar = async () => {
    setLoading(true);
    try {
      const res = await getRadarOpportunities();
      setOpportunities(res.data.opportunities || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRadar();
  }, []);

  return (
    <div className="space-y-8">
      
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sage-50 text-sage-dark text-xs font-bold border border-sage-200 mb-2">
          <Navigation className="w-3.5 h-3.5 text-sage" />
          <span>Haversine GPS Geospatial Radar</span>
        </div>
        <h1 className="page-title text-3xl sm:text-4xl">Opportunity Radar</h1>
        <p className="text-xs sm:text-sm text-warmgray-500 mt-1">
          Real-time neighborhood gig postings matched with elder skills in Chennai
        </p>
      </div>

      {/* Interactive Map Grid */}
      <RadarMapView
        opportunities={opportunities}
        onSelect={(opp) => setSelectedOpp(opp)}
      />

      {/* Opportunities List */}
      <div className="space-y-4">
        <h2 className="font-heading text-2xl font-bold text-warmgray-900 flex items-center justify-between">
          <span>Active Gigs Nearby ({opportunities.length})</span>
          <button onClick={loadRadar} className="text-xs font-bold text-saffron hover:underline">
            ↻ Refresh Radar
          </button>
        </h2>

        {loading ? (
          <div className="text-center py-12 font-bold text-sage">Scanning local opportunities...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {opportunities.map((opp) => (
              <OpportunityRadarCard
                key={opp.id}
                opportunity={opp}
                onResponded={loadRadar}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
