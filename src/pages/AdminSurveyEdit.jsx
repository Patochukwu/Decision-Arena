import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, GripVertical, Save, Send } from 'lucide-react';
import { useSurveys } from '../context/SurveyContext';
import Toast, { useToast } from '../components/Toast';
import { generateId } from '../utils/helpers';
import './AdminSurveyEdit.css';

const AdminSurveyEdit = () => {
  const { id } = useParams(); // undefined = create mode
  const navigate = useNavigate();
  const { surveys, createSurvey, updateSurvey, getSurveyById } = useSurveys();
  const { toasts, addToast, removeToast } = useToast();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState([
    { id: generateId(), label: '' },
    { id: generateId(), label: '' },
  ]);
  const [publishNow, setPublishNow] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing survey for edit mode
  useEffect(() => {
    if (isEdit) {
      const s = getSurveyById(id);
      if (!s) { navigate('/admin'); return; }
      setTitle(s.title);
      setDescription(s.description || '');
      setOptions(s.options.map((o) => ({ id: o.id, label: o.label })));
    }
  }, [id]);

  const addOption = () => {
    setOptions((prev) => [...prev, { id: generateId(), label: '' }]);
  };

  const removeOption = (optId) => {
    if (options.length <= 2) {
      addToast('A survey must have at least 2 options.', 'error');
      return;
    }
    setOptions((prev) => prev.filter((o) => o.id !== optId));
  };

  const updateOptionLabel = (optId, label) => {
    setOptions((prev) => prev.map((o) => (o.id === optId ? { ...o, label } : o)));
  };

  const validate = () => {
    if (!title.trim()) { addToast('Please enter a survey title.', 'error'); return false; }
    const filled = options.filter((o) => o.label.trim());
    if (filled.length < 2) { addToast('Please fill in at least 2 options.', 'error'); return false; }
    return true;
  };

  const handleSave = (publish = false) => {
    if (!validate()) return;
    setSaving(true);

    const filledOptions = options.filter((o) => o.label.trim());
    const status = publish ? 'active' : (isEdit ? getSurveyById(id)?.status : 'draft');

    setTimeout(() => {
      if (isEdit) {
        updateSurvey(id, {
          title: title.trim(),
          description: description.trim(),
          options: filledOptions,
          status,
        });
        addToast('Survey updated successfully!', 'success');
      } else {
        createSurvey({
          title: title.trim(),
          description: description.trim(),
          options: filledOptions.map((o) => o.label),
          status,
        });
        addToast(publish ? 'Survey created and published!' : 'Survey saved as draft!', 'success');
      }
      setSaving(false);
      setTimeout(() => navigate('/admin'), 800);
    }, 350);
  };

  return (
    <div className="edit-page">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="edit-inner">
        {/* Header */}
        <div className="edit-page-header">
          <Link to="/admin" className="back-link">
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
          <h1 className="edit-page-title">
            {isEdit ? 'Edit Survey' : 'Create New Survey'}
          </h1>
          <p className="edit-page-sub">
            {isEdit ? 'Update your survey details and options.' : 'Set up your survey title, description, and ideas for people to vote on.'}
          </p>
        </div>

        <div className="edit-layout">
          {/* Main form */}
          <div className="edit-main">
            {/* Survey info */}
            <div className="edit-section card">
              <div className="edit-section-header">
                <h2 className="edit-section-title">Survey Details</h2>
              </div>
              <div className="edit-section-body">
                <div className="input-group">
                  <label className="input-label" htmlFor="survey-title">
                    Survey Title <span className="required">*</span>
                  </label>
                  <input
                    id="survey-title"
                    className="input"
                    placeholder="e.g. Which project idea should we build next?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                  />
                  <span className="char-count">{title.length}/120</span>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="survey-desc">
                    Description <span className="optional">(optional)</span>
                  </label>
                  <textarea
                    id="survey-desc"
                    className="input"
                    placeholder="Provide context to help voters make an informed decision…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    maxLength={400}
                  />
                  <span className="char-count">{description.length}/400</span>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="edit-section card">
              <div className="edit-section-header">
                <h2 className="edit-section-title">Ideas / Options</h2>
                <span className="option-count">{options.filter(o => o.label.trim()).length} filled</span>
              </div>
              <div className="edit-section-body">
                <p className="edit-section-hint">
                  Add the ideas people will vote on. Drag to reorder. Minimum 2 options.
                </p>

                <Reorder.Group
                  axis="y"
                  values={options}
                  onReorder={setOptions}
                  className="options-reorder-list"
                >
                  <AnimatePresence>
                    {options.map((opt, i) => (
                      <Reorder.Item
                        key={opt.id}
                        value={opt}
                        className="option-row"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="option-drag-handle">
                          <GripVertical size={16} />
                        </div>
                        <span className="option-index">{i + 1}</span>
                        <input
                          className="input option-input"
                          placeholder={`Option ${i + 1} — e.g. AI-powered dashboard`}
                          value={opt.label}
                          onChange={(e) => updateOptionLabel(opt.id, e.target.value)}
                          maxLength={120}
                        />
                        <button
                          className="btn btn-ghost btn-icon option-remove"
                          onClick={() => removeOption(opt.id)}
                          title="Remove option"
                        >
                          <Trash2 size={15} />
                        </button>
                      </Reorder.Item>
                    ))}
                  </AnimatePresence>
                </Reorder.Group>

                <button className="btn btn-secondary add-option-btn" onClick={addOption}>
                  <Plus size={16} />
                  Add Option
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="edit-sidebar">
            <div className="edit-section card">
              <div className="edit-section-header">
                <h2 className="edit-section-title">Publish</h2>
              </div>
              <div className="edit-section-body sidebar-actions">
                <p className="sidebar-hint">
                  Save as draft to come back later, or publish immediately to let people vote.
                </p>

                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => handleSave(true)}
                  disabled={saving}
                >
                  {saving ? <span className="spinner" /> : <Send size={16} />}
                  {isEdit ? 'Save & Publish' : 'Publish Now'}
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => handleSave(false)}
                  disabled={saving}
                >
                  {saving ? <span className="spinner" /> : <Save size={16} />}
                  Save as Draft
                </button>

                <Link to="/admin" className="btn btn-ghost" style={{ justifyContent: 'center' }}>
                  Cancel
                </Link>
              </div>
            </div>

            {/* Tips */}
            <div className="tips-card card">
              <h3 className="tips-title">💡 Tips</h3>
              <ul className="tips-list">
                <li>Keep options concise and distinct</li>
                <li>Add context in the description</li>
                <li>You can edit options even after publishing</li>
                <li>Votes are preserved when you edit labels</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSurveyEdit;
