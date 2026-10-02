import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVehicle, listMaintenanceEntries, updateMaintenanceEntry, deleteMaintenanceEntry, updateVehicle } from '../api';
import ConfirmModal from './ConfirmModal';
import { useToast, ToastContainer } from './Toast';
import { usePageTitle } from '../hooks/usePageTitle';
import { computeReminders } from '../utils/serviceReminders';

const JOB_TYPES = [
  'PMS', 'Oil Change', 'Brake Pads', 'Brake Fluid', 'Tire Change', 'Tire Rotation',
  'Air Filter', 'Cabin Filter', 'Battery Replacement', 'Spark Plugs',
  'Coolant Flush', 'Transmission Service', 'Wheel Alignment', 'Suspension',
  'Timing Belt', 'Wiper Blades', 'General Inspection', 'Other',
];

function exportCSV(vehicle, entries) {
  const headers = ['Service Date', 'Job / Service Type', 'Odometer (km)', 'Cost (₱)', 'Next Due (km)', 'Service Shop', 'Notes'];
  const rows = entries.map(e => {
    const cleanDate = e.date ? String(e.date).split('T')[0] : '';
    const cleanJob = String(e.jobType || '').replace(/"/g, '""');
    const cleanShop = String(e.shopName || '').replace(/"/g, '""');
    const cleanNotes = String(e.notes || '').replace(/"/g, '""');
    const cleanCost = e.cost != null && e.cost !== '' ? Number(e.cost) : 0;
    const cleanNextDue = e.nextDueKm != null && e.nextDueKm !== '' ? e.nextDueKm : '';
    return [
      cleanDate,
      `"${cleanJob}"`,
      e.mileage ?? '',
      cleanCost,
      cleanNextDue,
      `"${cleanShop}"`,
      `"${cleanNotes}"`,
    ];
  });

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  // Prepend \uFEFF (UTF-8 BOM) so Excel on Windows properly recognises UTF-8 (Philippine Peso ₱ symbol)
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(vehicle.model || 'vehicle').replace(/\s+/g, '-')}-maintenance-log.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MaintenanceHistory() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterJobType, setFilterJobType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState('date-desc');

  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [showMileageUpdate, setShowMileageUpdate] = useState(false);
  const [newMileage, setNewMileage] = useState('');
  const [mileageSaving, setMileageSaving] = useState(false);

  const { toasts, showToast } = useToast();

  usePageTitle(vehicle ? `${vehicle.model} – History` : 'Maintenance History');

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

  function startEdit(entry) {
    setEditingEntry(entry.id);
    setEditForm({
      jobType: entry.jobType,
      date: entry.date,
      mileage: String(entry.mileage),
      cost: String(entry.cost),
      notes: entry.notes || '',
      nextDueKm: entry.nextDueKm != null ? String(entry.nextDueKm) : '',
      shopName: entry.shopName || '',
    });
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    const mileage = parseInt(editForm.mileage) || 0;
    const cost = parseFloat(editForm.cost) || 0;
    const nextDueKm = editForm.nextDueKm ? parseInt(editForm.nextDueKm) : null;
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
        nextDueKm,
        shopName: editForm.shopName || '',
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

  // ── Mileage update without maintenance ────────────────────────────────────
  async function handleMileageUpdate(e) {
    e.preventDefault();
    const km = parseInt(newMileage);
    if (!km || km < 0) { showToast('Enter a valid mileage.', 'error'); return; }
    if (vehicle && km < vehicle.currentMileage) {
      showToast(`Mileage must be greater than current (${vehicle.currentMileage.toLocaleString()} km).`, 'error');
      return;
    }
    setMileageSaving(true);
    try {
      await updateVehicle(id, { model: vehicle.model, currentMileage: km, photoUrl: vehicle.photoUrl || '' });
      setShowMileageUpdate(false);
      setNewMileage('');
      showToast('Odometer updated!', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to update mileage.', 'error');
    } finally {
      setMileageSaving(false);
    }
  }

  // ── Filtering & sorting ────────────────────────────────────────────────────
  let filtered = entries.filter(e => {
    const searchLower = search.toLowerCase();
    const matchesSearch = !search ||
      e.jobType.toLowerCase().includes(searchLower) ||
      (e.notes && e.notes.toLowerCase().includes(searchLower)) ||
      (e.shopName && e.shopName.toLowerCase().includes(searchLower));
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


  const firstEntry = entries.length > 0
    ? [...entries].sort((a, b) => new Date(a.date) - new Date(b.date))[0]
    : null;
  const kmDriven = firstEntry && vehicle
    ? Math.max(0, vehicle.currentMileage - firstEntry.mileage)
    : 0;
  const costPerKm = kmDriven > 0 ? (totalCost / kmDriven).toFixed(2) : null;

  const reminders = vehicle ? computeReminders(entries, vehicle.currentMileage) : [];
  const overdueReminders = reminders.filter(r => r.status === 'overdue');
  const dueSoonReminders = reminders.filter(r => r.status === 'due-soon');

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


      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>Maintenance History</h1>
          <p className="text-muted">
            <strong style={{ color: 'var(--text-primary)' }}>{vehicle.model}</strong>
            &nbsp;|&nbsp;
            {vehicle.currentMileage.toLocaleString()} km
            &nbsp;
            <button
              className="btn btn-outline"
              style={{ padding: '0.15rem 0.55rem', fontSize: '0.75rem', marginLeft: '0.5rem' }}
              onClick={() => { setShowMileageUpdate(!showMileageUpdate); setNewMileage(''); }}
              title="Update odometer reading without adding maintenance"
            >
              Update km
            </button>
          </p>
          {showMileageUpdate && (
            <form onSubmit={handleMileageUpdate} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center' }}>
              <input
                type="number"
                className="form-control"
                style={{ width: '160px' }}
                value={newMileage}
                min={vehicle.currentMileage}
                placeholder={`> ${vehicle.currentMileage.toLocaleString()} km`}
                onChange={e => setNewMileage(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} disabled={mileageSaving}>
                {mileageSaving ? '...' : 'Save'}
              </button>
              <button type="button" className="btn btn-outline" style={{ padding: '0.5rem 0.75rem' }} onClick={() => setShowMileageUpdate(false)}>
                Cancel
              </button>
            </form>
          )}
        </div>
        <div className="flex-gap">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => exportCSV(vehicle, entries)}
            disabled={entries.length === 0}
            title="Export maintenance log to CSV (ready to open in Excel or print)"
          >
            ⬇ Export / Print CSV
          </button>
          <Link to="/vehicles" className="btn btn-outline">← Back</Link>
          <Link to={`/vehicles/${id}/add-maintenance`} className="btn btn-primary">+ Add Maintenance</Link>
        </div>
      </div>


      {(overdueReminders.length > 0 || dueSoonReminders.length > 0) && (
        <div style={{ marginBottom: '1.5rem' }}>
          {overdueReminders.map((r, i) => (
            <div key={i} className="alert-banner alert-overdue" style={{ marginBottom: '0.5rem' }}>
              🔴 <strong>{r.jobType}</strong> — {r.detail}
            </div>
          ))}
          {dueSoonReminders.map((r, i) => (
            <div key={i} className="alert-banner alert-due-soon" style={{ marginBottom: '0.5rem' }}>
              🟡 <strong>{r.jobType}</strong> — {r.detail}
            </div>
          ))}
        </div>
      )}


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
        {costPerKm && (
          <div className="card stat-card">
            <p className="text-muted stat-label">Cost per km</p>
            <p className="stat-value" style={{ fontSize: '1.25rem' }}>₱{costPerKm}</p>
          </div>
        )}
      </div>


      <div className="filter-bar" style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search job, shop, or notes..."
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
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Next Due (km) <span className="text-muted">(optional)</span></label>
                      <input type="number" className="form-control" min="0" value={editForm.nextDueKm}
                        placeholder="e.g. 90000"
                        onChange={e => setEditForm(f => ({ ...f, nextDueKm: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Shop <span className="text-muted">(optional)</span></label>
                      <input type="text" className="form-control" value={editForm.shopName}
                        placeholder="e.g. Midas BGC"
                        onChange={e => setEditForm(f => ({ ...f, shopName: e.target.value }))} />
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
                <div className="maintenance-card">
                  <div className="mc-job">
                    <strong style={{ display: 'block', color: 'var(--accent-color)' }}>{e.jobType}</strong>
                    {e.shopName && <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>📍 {e.shopName}</span>}
                    {e.notes && <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginTop: '0.15rem' }}>{e.notes}</span>}
                    {e.nextDueKm != null && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--warning-color)', marginTop: '0.15rem', display: 'block' }}>
                        🔔 Next due: {Number(e.nextDueKm).toLocaleString()} km
                      </span>
                    )}
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
