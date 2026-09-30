import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVehicle, listMaintenanceEntries, updateMaintenanceEntry, deleteMaintenanceEntry } from '../api';
import ConfirmModal from './ConfirmModal';
import { useToast, ToastContainer } from './Toast';
import { usePageTitle } from '../hooks/usePageTitle';

const JOB_TYPES = [
  'Oil Change', 'Brake Pads', 'Brake Fluid', 'Tire Change', 'Tire Rotation',
  'Air Filter', 'Cabin Filter', 'Battery Replacement', 'Spark Plugs',
  'Coolant Flush', 'Transmission Service', 'Wheel Alignment', 'Suspension',
  'Timing Belt', 'Wiper Blades', 'General Inspection', 'Other',
];

export default function MaintenanceHistory() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterJobType, setFilterJobType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState('date-desc'); // date-desc | date-asc | cost-desc

  // Edit state
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { toasts, showToast } = useToast();

  // Dynamic title: shows vehicle model once loaded
  usePageTitle(vehicle ? `${vehicle.model} – History` : 'Maintenance History');

  // Escape key: cancel inline edit
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && editingEntry) setEditingEntry(null);
  }, [editingEntry]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const today = new Date().toISOString().split('T')[0];

  async function loadData() {
    try {
      const [v, data] = await Promise.all([
        getVehicle(id),
        listMaintenanceEntries(id),
      ]);
      setVehicle(v);
      setEntries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [id]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMaintenanceEntry(deleteTarget.id);
      setDeleteTarget(null);
      showToast('Record deleted.', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to delete record.', 'error');
    }
  }

  // ── Edit ───────────────────────────────────────────────────────────────────
  function startEdit(entry) {
    setEditingEntry(entry.id);
    setEditForm({
      jobType: entry.jobType,
      date: entry.date,
      mileage: String(entry.mileage),
      cost: String(entry.cost),
      notes: entry.notes || '',
    });
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    // Validate
    const mileage = parseInt(editForm.mileage) || 0;
    const cost = parseFloat(editForm.cost) || 0;
    if (mileage < 0) { showToast('Mileage cannot be negative.', 'error'); return; }
    if (editForm.date > today) { showToast('Date cannot be in the future.', 'error'); return; }
    if (cost < 0) { showToast('Cost cannot be negative.', 'error'); return; }

    setSaving(true);
    try {
      await updateMaintenanceEntry(editingEntry, {
        vehicleId: id,
        jobType: editForm.jobType,
        date: editForm.date,
        mileage,
        cost,
        notes: editForm.notes,
      });
      setEditingEntry(null);
      showToast('Record updated!', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to update record.', 'error');
    } finally {
      setSaving(false);
    }
  }

  // ── Filtering & sorting ────────────────────────────────────────────────────
  let filtered = entries.filter(e => {
    const searchLower = search.toLowerCase();
    const matchesSearch = !search ||
      e.jobType.toLowerCase().includes(searchLower) ||
      (e.notes && e.notes.toLowerCase().includes(searchLower));
    const matchesType = !filterJobType || e.jobType === filterJobType;
    const matchesFrom = !filterDateFrom || e.date >= filterDateFrom;
    const matchesTo = !filterDateTo || e.date <= filterDateTo;
    return matchesSearch && matchesType && matchesFrom && matchesTo;
  });

  if (sortOrder === 'date-desc') filtered = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
  else if (sortOrder === 'date-asc') filtered = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));
  else if (sortOrder === 'cost-desc') filtered = [...filtered].sort((a, b) => Number(b.cost) - Number(a.cost));

  const totalCost = entries.reduce((sum, e) => sum + (Number(e.cost) || 0), 0);
  const lastService = entries.length > 0
    ? [...entries].sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
    : 'N/A';

  // Job types present in this vehicle's records for filter dropdown
  const presentJobTypes = [...new Set(entries.map(e => e.jobType))].sort();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p className="text-muted">Loading maintenance history...</p>
      </div>
    );
  }

  if (!vehicle) return <div>Vehicle not found</div>;

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Record"
        message={`Delete the "${deleteTarget?.jobType}" record from ${deleteTarget?.date}? This cannot be undone.`}
        confirmLabel="Delete Record"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>Maintenance History</h1>
          <p className="text-muted">
            <strong style={{ color: 'var(--text-primary)' }}>{vehicle.model}</strong>
            &nbsp;|&nbsp;
            {vehicle.currentMileage.toLocaleString()} km
          </p>
        </div>
        <div className="flex-gap">
          <Link to="/vehicles" className="btn btn-outline">← Back</Link>
          <Link to={`/vehicles/${id}/add-maintenance`} className="btn btn-primary">+ Add Maintenance</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        <div className="card stat-card">
          <p className="text-muted stat-label">Total Jobs</p>
          <p className="stat-value">{entries.length}</p>
        </div>
        <div className="card stat-card">
          <p className="text-muted stat-label">Total Cost</p>
          <p className="stat-value">₱{totalCost.toLocaleString()}</p>
        </div>
        <div className="card stat-card">
          <p className="text-muted stat-label">Last Service</p>
          <p className="stat-value" style={{ fontSize: '1.2rem' }}>{lastService}</p>
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="filter-bar" style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search job or notes..."
          style={{ flex: 1, minWidth: '160px' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-control"
          style={{ maxWidth: '180px' }}
          value={filterJobType}
          onChange={e => setFilterJobType(e.target.value)}
        >
          <option value="">All job types</option>
          {presentJobTypes.map(jt => (
            <option key={jt} value={jt}>{jt}</option>
          ))}
        </select>

        {/* Date range filter — labelled for clarity */}
        <div className="date-range-group">
          <div className="date-range-field">
            <label className="date-range-label">From date</label>
            <input
              type="date"
              className="form-control"
              value={filterDateFrom}
              max={filterDateTo || today}
              onChange={e => setFilterDateFrom(e.target.value)}
            />
          </div>
          <span className="date-range-sep">→</span>
          <div className="date-range-field">
            <label className="date-range-label">To date</label>
            <input
              type="date"
              className="form-control"
              value={filterDateTo}
              min={filterDateFrom || undefined}
              max={today}
              onChange={e => setFilterDateTo(e.target.value)}
            />
          </div>
        </div>

        <select
          className="form-control"
          style={{ maxWidth: '160px' }}
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value)}
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="cost-desc">Highest cost</option>
        </select>
        {(search || filterJobType || filterDateFrom || filterDateTo) && (
          <button
            className="btn btn-outline"
            onClick={() => { setSearch(''); setFilterJobType(''); setFilterDateFrom(''); setFilterDateTo(''); }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Entry list */}
      <div className="list-group">
        {filtered.length === 0 ? (
          <div className="card empty-state">
            <span className="empty-icon">🔍</span>
            <p className="text-muted">{entries.length === 0 ? 'No records yet.' : 'No records match your filters.'}</p>
          </div>
        ) : (
          filtered.map(e => (
            <div key={e.id} className="card">
              {editingEntry === e.id ? (
                /* ── Inline edit form ── */
                <form onSubmit={handleEditSubmit}>
                  <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Job Type</label>
                      <select
                        className="form-control"
                        value={JOB_TYPES.includes(editForm.jobType) ? editForm.jobType : 'Other'}
                        onChange={e => setEditForm(f => ({ ...f, jobType: e.target.value }))}
                      >
                        {JOB_TYPES.map(jt => <option key={jt}>{jt}</option>)}
                      </select>
                      {(!JOB_TYPES.includes(editForm.jobType) || editForm.jobType === 'Other') && (
                        <input
                          type="text"
                          className="form-control"
                          style={{ marginTop: '0.5rem' }}
                          value={editForm.jobType === 'Other' ? '' : editForm.jobType}
                          placeholder="Describe the job..."
                          onChange={e => setEditForm(f => ({ ...f, jobType: e.target.value || 'Other' }))}
                        />
                      )}
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Date</label>
                      <input type="date" className="form-control" max={today} value={editForm.date}
                        onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Mileage (km)</label>
                      <input type="number" className="form-control" min="0" value={editForm.mileage}
                        onChange={e => setEditForm(f => ({ ...f, mileage: e.target.value }))} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Cost (₱)</label>
                      <div className="input-prefix-wrapper">
                        <span className="input-prefix">₱</span>
                        <input type="number" className="form-control input-with-prefix" step="0.01" min="0"
                          value={editForm.cost} onChange={e => setEditForm(f => ({ ...f, cost: e.target.value }))} required />
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea className="form-control" rows="2" value={editForm.notes}
                      onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <div className="flex-gap">
                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                    <button type="button" className="btn btn-outline" onClick={() => setEditingEntry(null)}>Cancel</button>
                  </div>
                </form>
              ) : (
                /* ── Read view ── */
                <div className="maintenance-card">
                  <div className="mc-job">
                    <strong style={{ display: 'block', color: 'var(--accent-color)' }}>{e.jobType}</strong>
                    {e.notes && <span className="text-muted" style={{ fontSize: '0.8rem' }}>{e.notes}</span>}
                  </div>
                  <div className="mc-date">{e.date}</div>
                  <div className="mc-mileage">{Number(e.mileage).toLocaleString()} km</div>
                  <div className="mc-cost" style={{ color: 'var(--success-color)', fontWeight: 600 }}>₱{Number(e.cost).toLocaleString()}</div>
                  <div className="mc-action flex-gap" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.65rem', fontSize: '0.8rem' }}
                      onClick={() => startEdit(e)}>
                      Edit
                    </button>
                    <button className="btn btn-danger" style={{ padding: '0.25rem 0.65rem', fontSize: '0.8rem' }}
                      onClick={() => setDeleteTarget(e)}>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
