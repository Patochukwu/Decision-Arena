import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Zap, TrendingUp, Users, BarChart3, ArrowRight, RefreshCw } from 'lucide-react';
import { useSurveys } from '../context/SurveyContext';
import SurveyCard from '../components/SurveyCard';
import { getTotalVotes } from '../utils/helpers';
import './Home.css';

const TABS = ['all', 'active', 'archived'];

const Home = () => {
  const { surveys, loading, refreshSurveys } = useSurveys();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshSurveys();
    setRefreshing(false);
  };

  const filtered = surveys.filter((s) => {
    if (!s) return false;
    const matchTab  = tab === 'all' || s.status === tab;
    const matchText = (s.title || '').toLowerCase().includes(search.toLowerCase()) ||
                      (s.description || '').toLowerCase().includes(search.toLowerCase());
    return matchTab && matchText && s.status !== 'draft';
  });

  const totalVotesAll = surveys.reduce((sum, s) => sum + getTotalVotes(s.options), 0);
  const activeSurveys = surveys.filter((s) => s.status === 'active').length;

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg-orb orb-1" />
        <div className="hero-bg-orb orb-2" />
        <div className="hero-content">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="live-dot" />
            <span>{activeSurveys} Active Survey{activeSurveys !== 1 ? 's' : ''} Live</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Your vote shapes
            <br />
            <span className="gradient-text">the decision.</span>
          </motion.h1>

          <motion.p
            className="hero-sub"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Participate in live idea polls. Cast your vote, see instant results,
            and help surface the best ideas.
          </motion.p>

          {/* Global stats */}
          <motion.div
            className="hero-stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="hero-stat">
              <TrendingUp size={16} />
              <span><strong>{surveys.length}</strong> Surveys</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <Users size={16} />
              <span><strong>{totalVotesAll.toLocaleString()}</strong> Total Votes</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <BarChart3 size={16} />
              <span><strong>{activeSurveys}</strong> Active</span>
            </div>
          </motion.div>
        </div>
        {/* Wave cutout — smooth transition to body */}
        <div className="hero-wave" />
      </section>

      {/* Survey list */}
      <section className="surveys-section">
        <div className="surveys-container">
          {/* Filters */}
          <div className="surveys-filters">
            <div className="search-wrapper">
              <Search size={16} className="search-icon" />
              <input
                className="input search-input"
                placeholder="Search surveys…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="tab-bar">
              {TABS.map((t) => (
                <button
                  key={t}
                  className={`tab-btn ${tab === t ? 'tab-btn-active' : ''}`}
                  onClick={() => setTab(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <button 
              className="btn btn-secondary btn-icon"
              onClick={handleRefresh}
              title="Refresh surveys list"
              disabled={refreshing || loading}
              style={{ padding: '10px' }}
            >
              <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="empty-state" style={{ padding: '60px 0' }}>
              <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 12px' }} />
              <p>Connecting to Decision Arena database...</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="surveys-grid">
              {filtered.map((s, i) => (
                <SurveyCard key={s.id} survey={s} index={i} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <Zap size={32} />
              </div>
              <h3>No surveys found</h3>
              <p>
                {search ? 'Try a different search term.' : 'No active surveys yet. Check back soon!'}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
