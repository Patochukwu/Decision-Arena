import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, BarChart3, Users, TrendingUp,
  Edit2, Trash2, Globe, Archive, Eye,
  CheckCircle, AlertCircle, Zap
} from 'lucide-react';
import { useSurveys } from '../context/SurveyContext';
import Modal from '../components/Modal';
import Toast, { useToast } from '../components/Toast';
import { getTotalVotes, getTimeAgo, getSurveyTimeStatus } from '../utils/helpers';
import './Admin.css';

const TABS = ['all', 'active', 'draft', 'archived'];

const Admin = () => {
  const navigate = useNavigate();
  const { surveys, loading, deleteSurvey, publishSurvey, archiveSurvey } = useSurveys();
  const { toasts, addToast, removeToast } = useToast();

  const [tab, setTab] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = surveys.filter((s) => {
    const matchTab = tab === 'all' || s.status === tab;
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const statsAll = {
    total: surveys.length,
    active: surveys.filter((s) => s.status === 'active').length,
    votes:  surveys.reduce((acc, s) => acc + getTotalVotes(s.options), 0),
    draft:  surveys.filter((s) => s.status === 'draft').length,
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteSurvey(deleteTarget.id);
    addToast(`"${deleteTarget.title}" deleted.`, 'success');
    setDeleteTarget(null);
  };

  const handlePublish = (s) => {
    publishSurvey(s.id);
    addToast(`"${s.title}" is now live!`, 'success');
  };

  const handleArchive = (s) => {
    archiveSurvey(s.id);
    addToast(`"${s.title}" archived.`, 'info');
  };

  return (
    <div className="admin-page">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Delete confirm modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Survey"
      >
        <div className="delete-modal-body">
          <div className="delete-icon">
            <AlertCircle size={24} />
          </div>
          <p>
            Are you sure you want to delete <strong>"{deleteTarget?.title}"</strong>?
            This action cannot be undone and all votes will be lost.
          </p>
          <div className="delete-modal-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              Delete Survey
            </button>
          </div>
        </div>
      </Modal>

      <div className="admin-inner">
        {/* Page header */}
        <div className="admin-page-header">
          <div>
            <h1 className="admin-title">Dashboard</h1>
            <p className="admin-sub">Manage your surveys and track engagement</p>
          </div>
          <Link to="/admin/new" className="btn btn-primary btn-lg">
            <Plus size={18} />
            New Survey
          </Link>
        </div>

        {/* Stats */}
        <div className="admin-stats">
          <motion.div className="stat-card card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--indigo)' }}>
              <BarChart3 size={20} />
            </div>
            <div>
              <div className="stat-card-val">{statsAll.total}</div>
              <div className="stat-card-label">Total Surveys</div>
            </div>
          </motion.div>
          <motion.div className="stat-card card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="stat-card-icon" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--green)' }}>
              <Globe size={20} />
            </div>
            <div>
              <div className="stat-card-val">{statsAll.active}</div>
              <div className="stat-card-label">Active</div>
            </div>
          </motion.div>
          <motion.div className="stat-card card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="stat-card-icon" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--amber)' }}>
              <Users size={20} />
            </div>
            <div>
              <div className="stat-card-val">{statsAll.votes.toLocaleString()}</div>
              <div className="stat-card-label">Total Votes</div>
            </div>
          </motion.div>
          <motion.div className="stat-card card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="stat-card-icon" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--violet)' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="stat-card-val">{statsAll.draft}</div>
              <div className="stat-card-label">Drafts</div>
            </div>
          </motion.div>
        </div>

        {/* Filter bar */}
        <div className="admin-filter-bar">
          <div className="tab-bar">
            {TABS.map((t) => (
              <button
                key={t}
                className={`tab-btn ${tab === t ? 'tab-btn-active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
                <span className="tab-count">
                  {t === 'all' ? surveys.length : surveys.filter(s => s.status === t).length}
                </span>
              </button>
            ))}
          </div>
          <input
            className="input admin-search"
            placeholder="Search surveys…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Survey list */}
        {loading ? (
          <div className="empty-state" style={{ padding: '60px 0' }}>
            <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 12px' }} />
            <p>Loading dashboard data from database...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="admin-survey-list">
            <AnimatePresence>
              {filtered.map((s, i) => {
                const total = getTotalVotes(s.options);
                const leading = [...s.options].sort((a, b) => b.votes - a.votes)[0];
                return (
                  <motion.div
                    key={s.id}
                    className="admin-survey-row card"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <div className="asr-left">
                      <div className="asr-top">
                        <span className={`badge badge-${s.status}`}>
                          {s.status === 'active' && <span className="live-dot" />}
                          {s.status}
                        </span>
                        <span className="asr-time">{getTimeAgo(s.createdAt)}</span>
                      </div>
                      <h3 className="asr-title">{s.title}</h3>
                      {s.description && <p className="asr-desc">{s.description}</p>}

                      <div className="asr-meta">
                        <span>{s.options.length} options</span>
                        <span className="dot" />
                        <span>{total.toLocaleString()} votes</span>
                        {leading && total > 0 && (
                          <>
                            <span className="dot" />
                            <span>🏆 {leading.label} ({Math.round((leading.votes / total) * 100)}%)</span>
                          </>
                        )}
                        {s.endDate && (
                          <>
                            <span className="dot" />
                            <span className={`time-status-indicator indicator-${getSurveyTimeStatus(s)}`}>
                              {getSurveyTimeStatus(s) === 'expired'
                                ? '🔴 Closed'
                                : getSurveyTimeStatus(s) === 'not_started'
                                ? `🟡 Opens ${new Date(s.startDate).toLocaleDateString()}`
                                : `🟢 Closes ${new Date(s.endDate).toLocaleDateString()}`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="asr-actions">
                      <Link
                        to={`/survey/${s.id}`}
                        target="_blank"
                        className="btn btn-ghost btn-sm btn-icon"
                        title="Preview"
                      >
                        <Eye size={15} />
                      </Link>
                      <Link
                        to={`/admin/edit/${s.id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        <Edit2 size={14} /> Edit
                      </Link>
                      {s.status === 'draft' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handlePublish(s)}
                        >
                          <Globe size={14} /> Publish
                        </button>
                      )}
                      {s.status === 'active' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleArchive(s)}
                        >
                          <Archive size={14} /> Archive
                        </button>
                      )}
                      <button
                        className="btn btn-danger btn-sm btn-icon"
                        onClick={() => setDeleteTarget(s)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon"><Zap size={32} /></div>
            <h3>{surveys.length === 0 ? 'No surveys yet' : 'No surveys match your filter'}</h3>
            <p>
              {surveys.length === 0
                ? 'Create your first survey to start collecting votes.'
                : 'Try a different tab or clear your search.'}
            </p>
            {surveys.length === 0 && (
              <Link to="/admin/new" className="btn btn-primary" style={{ marginTop: 8 }}>
                <Plus size={16} /> Create Survey
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
