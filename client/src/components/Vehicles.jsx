import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listVehicles, createVehicle, updateVehicle, deleteVehicle, listMaintenanceEntries } from '../api';
import ConfirmModal from './ConfirmModal';
import { useToast, ToastContainer } from './Toast';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleStats, setVehicleStats] = useState({}); // vehicleId -> { count, lastDate }
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModel, setNewModel] = useState('');
  const [newMileage, setNewMileage] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editModel, setEditModel] = useState('');
  const [editMileage, setEditMileage] = useState('');

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState(null); // vehicle object

  const { toasts, showToast } = useToast();

  usePageTitle('Vehicles');

  // Escape key: close add form or cancel edit
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
      // Build per-vehicle stats
      const stats = {};
      vs.forEach(v => {
        const vEntries = allEntries
          .filter(e => String(e.vehicleId) === String(v.id))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        stats[v.id] = {
          count: vEntries.length,
          lastDate: vEntries.length > 0 ? vEntries[0].date : null,
        };
      });
      setVehicleStats(stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newModel.trim()) return;
    const mileage = parseInt(newMileage) || 0;
    if (mileage < 0) { showToast('Mileage cannot be negative.', 'error'); return; }
    setSaving(true);
    try {
      await createVehicle({ model: newModel.trim(), currentMileage: mileage });
      setNewModel('');
      setNewMileage('');
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
  }

  async function handleEdit(e, id) {
    e.preventDefault();
    if (!editModel.trim()) return;
    const mileage = parseInt(editMileage) || 0;
    if (mileage < 0) { showToast('Mileage cannot be negative.', 'error'); return; }
    setSaving(true);
    try {
      await updateVehicle(id, { model: editModel.trim(), currentMileage: mileage });
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
        {vehicles.length === 0 && !showAddForm ? (
          <div className="card empty-state">
            <span className="empty-icon">🚗</span>
            <p className="text-muted">No vehicles yet. Add your first one above.</p>
          </div>
        ) : (
          vehicles.map(v => {
            const stats = vehicleStats[v.id] || { count: 0, lastDate: null };
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
                    <div className="flex-gap">
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h2>{v.model}</h2>
                    <div className="vehicle-meta" style={{ marginBottom: '0.75rem' }}>
                      <span className="text-muted">🛣 {v.currentMileage.toLocaleString()} km</span>
                      <span className="text-muted">🔧 {stats.count} job{stats.count !== 1 ? 's' : ''}</span>
                      {stats.lastDate && <span className="text-muted">📅 {stats.lastDate}</span>}
                    </div>
                    <div className="flex-gap">
                      <Link to={`/vehicles/${v.id}/history`} className="btn btn-outline">View</Link>
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
