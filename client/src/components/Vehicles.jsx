import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { listVehicles, createVehicle, updateVehicle, deleteVehicle, listMaintenanceEntries } from '../api';
import ConfirmModal from './ConfirmModal';
import { useToast, ToastContainer } from './Toast';
import { usePageTitle } from '../hooks/usePageTitle';
import { computeReminders } from '../utils/serviceReminders';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleStats, setVehicleStats] = useState({});
  const [vehicleReminders, setVehicleReminders] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModel, setNewModel] = useState('');
  const [newMileage, setNewMileage] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editModel, setEditModel] = useState('');
  const [editMileage, setEditMileage] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { toasts, showToast } = useToast();
  const photoInputRef = useRef(null);
  const editPhotoInputRef = useRef(null);

  usePageTitle('Vehicles');

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      if (editingId) setEditingId(null);
      else if (showAddForm) setShowAddForm(false);
    }
  }, [editingId, showAddForm]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  async function loadData() {
    try {
      const [vs, allEntries] = await Promise.all([
        listVehicles(),
        listMaintenanceEntries(),
      ]);
      setVehicles(vs);

      const stats = {};
      const reminders = {};
      vs.forEach(v => {
        const vEntries = allEntries
          .filter(e => String(e.vehicleId) === String(v.id))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        const totalCost = vEntries.reduce((s, e) => s + (Number(e.cost) || 0), 0);
        stats[v.id] = {
          count: vEntries.length,
          lastDate: vEntries.length > 0 ? vEntries[0].date : null,
          totalCost,
        };
        reminders[v.id] = computeReminders(vEntries, v.currentMileage);
      });
      setVehicleStats(stats);
      setVehicleReminders(reminders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  // ── Photo handling (base64 for mock mode; URL for real mode) ────────────────
  function handlePhotoFile(file, setter) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Photo must be under 2 MB.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setter(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newModel.trim()) return;
    const mileage = parseInt(newMileage) || 0;
    if (mileage < 0) { showToast('Mileage cannot be negative.', 'error'); return; }
    setSaving(true);
    try {
      await createVehicle({ model: newModel.trim(), currentMileage: mileage, photoUrl: newPhotoUrl });
      setNewModel(''); setNewMileage(''); setNewPhotoUrl('');
      setShowAddForm(false);
      showToast('Vehicle added successfully!', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to add vehicle.', 'error');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(v) {
    setEditingId(v.id);
    setEditModel(v.model);
    setEditMileage(String(v.currentMileage));
    setEditPhotoUrl(v.photoUrl || '');
  }

  async function handleEdit(e, id) {
    e.preventDefault();
    if (!editModel.trim()) return;
    const mileage = parseInt(editMileage) || 0;
    if (mileage < 0) { showToast('Mileage cannot be negative.', 'error'); return; }
    setSaving(true);
    try {
      await updateVehicle(id, { model: editModel.trim(), currentMileage: mileage, photoUrl: editPhotoUrl });
      setEditingId(null);
      showToast('Vehicle updated successfully!', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to update vehicle.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteVehicle(deleteTarget.id);
      setDeleteTarget(null);
      showToast('Vehicle deleted.', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to delete vehicle.', 'error');
    }
  }

  const filteredVehicles = vehicles.filter(v =>
    !search || v.model.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p className="text-muted">Loading vehicles...</p>
      </div>
    );
  }

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Vehicle"
        message={`Delete "${deleteTarget?.model}" and all its maintenance records? This cannot be undone.`}
        confirmLabel="Delete Vehicle"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <h1>Vehicles</h1>
        <button className="btn btn-primary" onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); }}>
          {showAddForm ? 'Cancel' : '+ Add Vehicle'}
        </button>
      </div>

      {/* Search */}
      {vehicles.length > 1 && (
        <div className="form-group" style={{ maxWidth: '320px', marginBottom: '1.5rem' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search vehicles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2>Add New Vehicle</h2>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label className="form-label">Vehicle Model</label>
              <input
                type="text"
                className="form-control"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="e.g. BMW E90 318i"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Current Mileage (km)</label>
              <input
                type="number"
                className="form-control"
                value={newMileage}
                onChange={(e) => setNewMileage(e.target.value)}
                placeholder="e.g. 85000"
                min="0"
              />
            </div>
            {/* Photo upload */}
            <div className="form-group">
              <label className="form-label">Vehicle Photo <span className="text-muted">(optional)</span></label>
              {newPhotoUrl && (
                <div className="vehicle-photo-preview" style={{ marginBottom: '0.75rem' }}>
                  <img src={newPhotoUrl} alt="Preview" />
                  <button type="button" className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', marginTop: '0.5rem' }} onClick={() => setNewPhotoUrl('')}>Remove</button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => handlePhotoFile(e.target.files[0], setNewPhotoUrl)}
                />
                <button type="button" className="btn btn-outline" onClick={() => photoInputRef.current?.click()}>
                  📷 Upload Photo
                </button>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>or</span>
                <input
                  type="url"
                  className="form-control"
                  value={newPhotoUrl}
                  onChange={e => setNewPhotoUrl(e.target.value)}
                  placeholder="Paste image URL..."
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            <div className="flex-gap">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Vehicle'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid-2">
        {filteredVehicles.length === 0 && !showAddForm ? (
          <div className="card empty-state">
            <span className="empty-icon">🚗</span>
            <p className="text-muted">{vehicles.length === 0 ? 'No vehicles yet. Add your first one above.' : 'No vehicles match your search.'}</p>
          </div>
        ) : (
          filteredVehicles.map(v => {
            const stats = vehicleStats[v.id] || { count: 0, lastDate: null, totalCost: 0 };
            const reminders = vehicleReminders[v.id] || [];
            const overdue = reminders.filter(r => r.status === 'overdue');
            const dueSoon = reminders.filter(r => r.status === 'due-soon');
            const isEditing = editingId === v.id;

            return (
              <div key={v.id} className="card vehicle-card">
                {isEditing ? (
                  <form onSubmit={(e) => handleEdit(e, v.id)}>
                    <div className="form-group">
                      <label className="form-label">Vehicle Model</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editModel}
                        onChange={e => setEditModel(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Current Mileage (km)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editMileage}
                        onChange={e => setEditMileage(e.target.value)}
                        min="0"
                      />
                    </div>
                    {/* Photo edit */}
                    <div className="form-group">
                      <label className="form-label">Vehicle Photo</label>
                      {editPhotoUrl && (
                        <div className="vehicle-photo-preview" style={{ marginBottom: '0.75rem' }}>
                          <img src={editPhotoUrl} alt="Preview" />
                          <button type="button" className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', marginTop: '0.5rem' }} onClick={() => setEditPhotoUrl('')}>Remove</button>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          ref={editPhotoInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={e => handlePhotoFile(e.target.files[0], setEditPhotoUrl)}
                        />
                        <button type="button" className="btn btn-outline" onClick={() => editPhotoInputRef.current?.click()}>
                          📷 Change Photo
                        </button>
                        <input
                          type="url"
                          className="form-control"
                          value={editPhotoUrl}
                          onChange={e => setEditPhotoUrl(e.target.value)}
                          placeholder="Or paste URL..."
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>
                    <div className="flex-gap">
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    {/* Photo */}
                    {v.photoUrl && (
                      <div className="vehicle-photo-preview" style={{ marginBottom: '1rem' }}>
                        <img src={v.photoUrl} alt={v.model} />
                      </div>
                    )}

                    {/* Header + reminder badge */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <h2 style={{ marginBottom: 0 }}>{v.model}</h2>
                      {overdue.length > 0 && (
                        <span className="reminder-badge badge-overdue" title={overdue.map(r => r.detail).join('\n')}>
                          🔴 {overdue.length} overdue
                        </span>
                      )}
                      {overdue.length === 0 && dueSoon.length > 0 && (
                        <span className="reminder-badge badge-due-soon" title={dueSoon.map(r => r.detail).join('\n')}>
                          🟡 {dueSoon.length} due soon
                        </span>
                      )}
                    </div>

                    <div className="vehicle-meta" style={{ marginBottom: '0.75rem' }}>
                      <span className="text-muted">🛣 {v.currentMileage.toLocaleString()} km</span>
                      <span className="text-muted">🔧 {stats.count} job{stats.count !== 1 ? 's' : ''}</span>
                      <span className="text-muted">💰 ₱{stats.totalCost.toLocaleString()}</span>
                      {stats.lastDate && <span className="text-muted">📅 {stats.lastDate}</span>}
                    </div>
                    <div className="flex-gap">
                      <Link to={`/vehicles/${v.id}/history`} className="btn btn-outline">View</Link>
                      <Link to={`/vehicles/${v.id}/fuel`} className="btn btn-outline">⛽ Fuel</Link>
                      <button className="btn btn-outline" onClick={() => startEdit(v)}>Edit</button>
                      <button className="btn btn-danger" onClick={() => setDeleteTarget(v)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
