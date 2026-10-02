import { useState } from 'react';
import { useGarage, generateGarageCode } from '../context/GarageContext';
import { useToast, ToastContainer } from './Toast';

export default function GarageModal() {
  const { garage, isDemo, switchGarage, createGarage, switchToDemo, getShareLink, modalOpen, closeModal } = useGarage();
  const { toasts, showToast } = useToast();

  const [tab, setTab] = useState('current'); // 'current' | 'create' | 'join'
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState(() => generateGarageCode());
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  if (!modalOpen) return null;

  function handleCopyCode() {
    navigator.clipboard.writeText(garage.id.toUpperCase());
    showToast(`Garage code ${garage.id.toUpperCase()} copied!`, 'success');
  }

  function handleCopyLink() {
    const link = getShareLink();
    navigator.clipboard.writeText(link);
    showToast('Direct link copied to clipboard! Open on your phone.', 'success');
  }

  function handleCreate(e) {
    e.preventDefault();
    const code = (newCode || generateGarageCode()).trim().toLowerCase();
    if (!code) {
      setError('Please provide a garage code.');
      return;
    }
    const name = newName.trim() || `Garage ${code.toUpperCase()}`;
    createGarage(name, code);
    showToast(`Created and switched to ${name}!`, 'success');
    closeModal();
  }

  function handleJoin(e) {
    e.preventDefault();
    const code = joinCode.trim().toLowerCase();
    if (!code) {
      setError('Please enter a garage code.');
      return;
    }
    switchGarage(code);
    showToast(`Switched to Garage ${code.toUpperCase()}!`, 'success');
    closeModal();
  }

  function handleDemo() {
    switchToDemo();
    showToast('Switched to Demo Showcase garage!', 'info');
    closeModal();
  }

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <ToastContainer toasts={toasts} />
      <div className="modal-card garage-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="garage-modal-title">
            <span className="garage-icon-lg">🏷️</span>
            <div>
              <h3>Garage Workspace</h3>
              <p className="text-secondary text-sm">Private cloud workspace without accounts or passwords</p>
            </div>
          </div>
          <button type="button" className="btn-close" onClick={closeModal} aria-label="Close">✕</button>
        </div>

        {/* Tab Navigation */}
        <div className="garage-tabs">
          <button
            type="button"
            className={`garage-tab-btn ${tab === 'current' ? 'active' : ''}`}
            onClick={() => { setTab('current'); setError(''); }}
          >
            Active Garage
          </button>
          <button
            type="button"
            className={`garage-tab-btn ${tab === 'create' ? 'active' : ''}`}
            onClick={() => { setTab('create'); setNewCode(generateGarageCode()); setError(''); }}
          >
            + New Garage
          </button>
          <button
            type="button"
            className={`garage-tab-btn ${tab === 'join' ? 'active' : ''}`}
            onClick={() => { setTab('join'); setError(''); }}
          >
            Open by Code
          </button>
        </div>

        {error && <div className="error-banner" style={{ margin: '0.75rem 0' }}>{error}</div>}

        <div className="garage-modal-body">
          {tab === 'current' && (
            <div className="garage-current-view">
              <div className="garage-active-card">
                <div className="garage-active-meta">
                  <span className="garage-pill">{isDemo ? '⭐ Public Demo' : '🔒 Private Workspace'}</span>
                  <h4>{garage.name}</h4>
                  <div className="garage-code-row">
                    <span className="text-secondary text-sm">Garage Code:</span>
                    <span className="garage-code-display">{garage.id.toUpperCase()}</span>
                    <button type="button" className="btn btn-secondary btn-xs" onClick={handleCopyCode}>
                      📋 Copy Code
                    </button>
                  </div>
                </div>
              </div>

              <div className="garage-sync-box">
                <p className="text-sm text-secondary">
                  📱 <strong>Sync across devices:</strong> Want to access these exact cars on your phone or tablet? Use this quick link or type your garage code.
                </p>
                <button type="button" className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: '0.5rem' }} onClick={handleCopyLink}>
                  🔗 Copy Sync Link for Mobile
                </button>
              </div>

              {!isDemo && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={handleDemo}>
                    Switch back to Demo Showcase
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'create' && (
            <form onSubmit={handleCreate} className="garage-form">
              <div className="form-group">
                <label htmlFor="garage-new-name">Garage Name / Nickname</label>
                <input
                  id="garage-new-name"
                  type="text"
                  placeholder="e.g. Stephenn's Garage, Family Fleet"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  maxLength={60}
                />
              </div>

              <div className="form-group">
                <label htmlFor="garage-new-code">
                  Generated Workspace Code <span className="text-secondary">(or pick your own)</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    id="garage-new-code"
                    type="text"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value.toUpperCase())}
                    maxLength={24}
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 600 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setNewCode(generateGarageCode())}
                    title="Generate new random code"
                  >
                    🎲 Refresh
                  </button>
                </div>
                <small className="form-help">Keep this code so you can access your cars from any browser.</small>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setTab('current')}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create & Open Garage
                </button>
              </div>
            </form>
          )}

          {tab === 'join' && (
            <form onSubmit={handleJoin} className="garage-form">
              <div className="form-group">
                <label htmlFor="garage-join-code">Enter Existing Garage Code</label>
                <input
                  id="garage-join-code"
                  type="text"
                  placeholder="e.g. GRH-8821"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={24}
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 600 }}
                  autoFocus
                />
                <small className="form-help">Type or paste the code from your other device.</small>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setTab('current')}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!joinCode.trim()}>
                  Open Garage
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
