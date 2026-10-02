import { useState } from 'react';
import { useGarage, generateGarageCode } from '../context/GarageContext';
import { useToast, ToastContainer } from './Toast';

export default function GarageModal() {
  const { garage, isDemo, switchGarage, createGarage, switchToDemo, getShareLink, modalOpen, closeModal } = useGarage();
  const [tab, setTab] = useState('current'); // 'current' | 'create' | 'join'
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState(() => generateGarageCode());
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const { toasts, showToast } = useToast();

  if (!modalOpen) return null;

  function handleCopyCode() {
    navigator.clipboard.writeText(garage.id.toUpperCase());
    showToast(`Account code ${garage.id.toUpperCase()} copied!`, 'success');
  }

  function handleCopyLink() {
    const link = getShareLink();
    navigator.clipboard.writeText(link);
    showToast('Direct account link copied! Send it to your phone or paste in any browser.', 'success');
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
    showToast(`Created account "${name}"!`, 'success');
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
    showToast(`Logged into Garage ${code.toUpperCase()}!`, 'success');
    closeModal();
  }

  function handleDemo() {
    switchToDemo();
    showToast('Switched to Demo Showcase!', 'info');
    closeModal();
  }

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <ToastContainer toasts={toasts} />
      <div className="modal-card garage-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="garage-modal-title">
            <span className="garage-icon-lg" aria-hidden="true">🛡️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Garage Account</h3>
              <p className="text-secondary text-sm" style={{ margin: 0 }}>
                Private cloud workspaces without emails or passwords
              </p>
            </div>
          </div>
          <button type="button" className="btn-close" onClick={closeModal} aria-label="Close">✕</button>
        </div>

        {/* Account Explainer Callout */}
        <div className="account-explainer-box">
          <div className="account-explainer-header">
            <span>🔑</span>
            <strong>How Your Account Works</strong>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.5' }}>
            In Garahe, you don't need to remember an email or password. Your <strong>Garage Code</strong> serves as your private account key. 
            All vehicles and service history you add belong to your code.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="garage-tabs">
          <button
            type="button"
            className={`garage-tab-btn ${tab === 'current' ? 'active' : ''}`}
            onClick={() => { setTab('current'); setError(''); }}
          >
            👤 Current Account
          </button>
          <button
            type="button"
            className={`garage-tab-btn ${tab === 'create' ? 'active' : ''}`}
            onClick={() => { setTab('create'); setNewCode(generateGarageCode()); setError(''); }}
          >
            ➕ New Account
          </button>
          <button
            type="button"
            className={`garage-tab-btn ${tab === 'join' ? 'active' : ''}`}
            onClick={() => { setTab('join'); setError(''); }}
          >
            🔑 Log In by Code
          </button>
        </div>

        {error && <div className="error-banner" style={{ margin: '0.75rem 0' }}>{error}</div>}

        <div className="garage-modal-body">
          {tab === 'current' && (
            <div className="garage-current-view">
              <div className="garage-active-card">
                <div className="garage-active-meta">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="garage-pill">{isDemo ? '⭐ Public Demo Showcase' : '🔒 Private Account'}</span>
                    <span className="text-secondary text-xs">{isDemo ? 'Shared public preview' : 'Isolated workspace'}</span>
                  </div>
                  <h4 style={{ fontSize: '1.15rem', color: '#f8fafc', marginBottom: '0.5rem' }}>{garage.name}</h4>
                  
                  <div className="garage-code-row">
                    <div>
                      <span className="text-secondary text-xs" style={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Your Account Code
                      </span>
                      <span className="garage-code-display">{garage.id.toUpperCase()}</span>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopyCode}>
                      📋 Copy Code
                    </button>
                  </div>
                </div>
              </div>

              <div className="garage-sync-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>📱</span>
                  <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>Access On Your Phone / Other Devices</strong>
                </div>
                <p className="text-sm text-secondary" style={{ marginBottom: '0.75rem', lineHeight: '1.45' }}>
                  Want to view or log maintenance on your smartphone? Copy this direct link and send it to yourself, or simply type your code <strong>{garage.id.toUpperCase()}</strong> on your phone.
                </p>
                <button type="button" className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={handleCopyLink}>
                  🔗 Copy Direct Account Link
                </button>
              </div>

              {!isDemo && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', textAlign: 'center' }}>
                  <button type="button" className="btn btn-secondary btn-xs" style={{ width: '100%' }} onClick={handleDemo}>
                    Switch back to Demo Showcase
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'create' && (
            <form onSubmit={handleCreate} className="garage-form">
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.25rem 0', color: '#f8fafc', fontSize: '1rem' }}>Create a New Private Garage</h4>
                <p className="text-secondary text-sm" style={{ margin: 0 }}>
                  Start fresh with your own personal cloud account for your vehicles.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="garage-new-name">Garage / Account Name</label>
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
                  Generated Account Code <span className="text-secondary">(your login key)</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    id="garage-new-code"
                    type="text"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value.toUpperCase())}
                    maxLength={24}
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}
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
                <small className="form-help">Save this code. You will use it to access your garage from any device.</small>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setTab('current')}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  ➕ Create & Open Garage
                </button>
              </div>
            </form>
          )}

          {tab === 'join' && (
            <form onSubmit={handleJoin} className="garage-form">
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.25rem 0', color: '#f8fafc', fontSize: '1rem' }}>Log In to Existing Garage</h4>
                <p className="text-secondary text-sm" style={{ margin: 0 }}>
                  Enter your Garage Code from another browser or device to load your records.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="garage-join-code">Enter Your Garage Code</label>
                <input
                  id="garage-join-code"
                  type="text"
                  placeholder="e.g. GRH-8821"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={24}
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.05em' }}
                  autoFocus
                />
                <small className="form-help">Type or paste the code you saved from your other device.</small>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setTab('current')}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!joinCode.trim()}>
                  🔑 Log In to Garage
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
