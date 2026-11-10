import React, { useState, useEffect } from 'react';
import { getProviderMe } from '../../api/client';
import { SkillPassportCard } from '../../components/provider/SkillPassportCard';
import { useAuth } from '../../context/AuthContext';
import { Award, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SkillPassportPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getProviderMe();
        setProfile(res.data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/provider/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-warmgray-600 hover:text-saffron">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <span className="badge-tag bg-sage-50 text-sage-dark font-bold border border-sage-200">
          <ShieldCheck className="w-3.5 h-3.5" /> Official Verified Certificate
        </span>
      </div>

      {loading ? (
        <div className="text-center py-16 font-bold text-saffron">Generating your verified Skill Passport...</div>
      ) : (
        <SkillPassportCard profile={profile} />
      )}
    </div>
  );
};
