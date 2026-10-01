import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVehicle, listFuelLogs, createFuelLog, updateFuelLog, deleteFuelLog } from '../api';
import ConfirmModal from './ConfirmModal';
import { useToast, ToastContainer } from './Toast';
import { usePageTitle } from '../hooks/usePageTitle';

export default function FuelLog() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date: '', mileage: '', liters: '', pricePerLiter: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { toasts, showToast } = useToast();

  usePageTitle(vehicle ? `${vehicle.model} – Fuel Log` : 'Fuel Log');

  const today = new Date().toISOString().split('T')[0];

  async function loadData() {
    try {
      const [v, data] = await Promise.all([
        getVehicle(id),
        listFuelLogs(id),
      ]);
      setVehicle(v);
      setLogs(data);
      setForm(f => ({ ...f, date: today, mileage: String(v.currentMileage) }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [id]);

  function validateForm(f) {
    const errs = {};
    if (!f.date) errs.date = 'Date is required.';
    else if (f.date > today) errs.date = 'Date cannot be in the future.';
    const km = parseInt(f.mileage);
    if (!km && km !== 0) errs.mileage = 'Mileage is required.';
    const liters = parseFloat(f.liters);
    if (!liters || liters <= 0) errs.liters = 'Liters must be greater than 0.';
    const price = parseFloat(f.pricePerLiter);
    if (!price || price <= 0) errs.pricePerLiter = 'Price per liter must be greater than 0.';
    return errs;
  }

  async function handleAdd(e) {
    e.preventDefault();
    const errs = validateForm(form);
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      await createFuelLog({
        vehicleId: id,
        date: form.date,
        mileage: parseInt(form.mileage),
        liters: parseFloat(form.liters),
        pricePerLiter: parseFloat(form.pricePerLiter),
        notes: form.notes,
      });
      setShowAdd(false);
      setForm({ date: today, mileage: '', liters: '', pricePerLiter: '', notes: '' });
      showToast('Fuel log added!', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to save fuel log.', 'error');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(log) {
    setEditingId(log.id);
    setEditForm({
      date: log.date,
      mileage: String(log.mileage),
      liters: String(log.liters),
      pricePerLiter: String(log.pricePerLiter),
      notes: log.notes || '',
    });
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    const errs = validateForm(editForm);
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      await updateFuelLog(editingId, {
        vehicleId: id,
        date: editForm.date,
        mileage: parseInt(editForm.mileage),
        liters: parseFloat(editForm.liters),
        pricePerLiter: parseFloat(editForm.pricePerLiter),
        notes: editForm.notes,
      });
      setEditingId(null);
      showToast('Fuel log updated!', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to update fuel log.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteFuelLog(deleteTarget.id);
      setDeleteTarget(null);
      showToast('Fuel log deleted.', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to delete.', 'error');
    }
  }

  function exportCSV() {
    const headers = ['Date', 'Mileage (km)', 'Liters (L)', 'Price/L (₱)', 'Total Cost (₱)', 'Notes'];
    const rows = logs.map(l => [
      l.date, l.mileage, l.liters, l.pricePerLiter, l.totalCost,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${vehicle.model.replace(/\s+/g, '-')}-fuel-log.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Stats
  const totalLiters = logs.reduce((s, l) => s + Number(l.liters), 0);
  const totalFuelCost = logs.reduce((s, l) => s + Number(l.totalCost), 0);

  // Fuel efficiency: km since first log / total liters
  let avgKmPerL = null;
  if (logs.length >= 2) {
    const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const kmSpan = sorted[sorted.length - 1].mileage - sorted[0].mileage;
    const litersUsed = sorted.slice(1).reduce((s, l) => s + Number(l.liters), 0); // exclude first fill
    if (kmSpan > 0 && litersUsed > 0) {
      avgKmPerL = (kmSpan / litersUsed).toFixed(2);
    }
  }

  function FuelForm({ values, onChange, errors, onSubmit, onCancel, submitLabel }) {
    return (
      <form onSubmit={onSubmit} noValidate>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className={`form-control${errors.date ? ' form-control-error' : ''}`}
              value={values.date} max={today}
              onChange={e => onChange({ ...values, date: e.target.value })} required />
            {errors.date && <p className="form-error">{errors.date}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Odometer (km)</label>
            <input type="number" className={`form-control${errors.mileage ? ' form-control-error' : ''}`}
              value={values.mileage} min="0"
              onChange={e => onChange({ ...values, mileage: e.target.value })} required />
            {errors.mileage && <p className="form-error">{errors.mileage}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Liters Filled (L)</label>
            <input type="number" step="0.01" className={`form-control${errors.liters ? ' form-control-error' : ''}`}
              value={values.liters} min="0.01"
              onChange={e => onChange({ ...values, liters: e.target.value })} required />
            {errors.liters && <p className="form-error">{errors.liters}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Price per Liter (₱)</label>
            <div className="input-prefix-wrapper">
              <span className="input-prefix">₱</span>
              <input type="number" step="0.01" className={`form-control input-with-prefix${errors.pricePerLiter ? ' form-control-error' : ''}`}
                value={values.pricePerLiter} min="0.01"
                onChange={e => onChange({ ...values, pricePerLiter: e.target.value })} required />
            </div>
            {errors.pricePerLiter && <p className="form-error">{errors.pricePerLiter}</p>}
          </div>
        </div>
        {/* Live total cost preview */}
        {values.liters && values.pricePerLiter && (
          <p className="form-hint" style={{ marginBottom: '1rem' }}>
            Total cost: <strong style={{ color: 'var(--success-color)' }}>
              ₱{(parseFloat(values.liters) * parseFloat(values.pricePerLiter)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </strong>
          </p>
        )}
        <div className="form-group">
          <label className="form-label">Notes <span className="text-muted">(optional)</span></label>
          <input type="text" className="form-control"
            value={values.notes}
            onChange={e => onChange({ ...values, notes: e.target.value })}
            placeholder="e.g. Shell V-Power, full tank" />
        </div>
        <div className="flex-gap">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : submitLabel}
          </button>
          <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p className="text-muted">Loading fuel log...</p>
      </div>
    );
  }

  if (!vehicle) return <div>Vehicle not found</div>;

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Fuel Log"
        message={`Delete the fuel log from ${deleteTarget?.date}? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>Fuel Log</h1>
          <p className="text-muted">
            <strong style={{ color: 'var(--text-primary)' }}>{vehicle.model}</strong>
            &nbsp;|&nbsp;
            {vehicle.currentMileage.toLocaleString()} km
          </p>
        </div>
        <div className="flex-gap">
          <button className="btn btn-outline" onClick={exportCSV} disabled={logs.length === 0} title="Export to CSV">
            ↓ CSV
          </button>
          <Link to={`/vehicles/${id}/history`} className="btn btn-outline">← Maintenance</Link>
          <button className="btn btn-primary" onClick={() => { setShowAdd(!showAdd); setEditingId(null); setFormErrors({}); }}>
            {showAdd ? 'Cancel' : '+ Log Fuel'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        <div className="card stat-card">
          <p className="text-muted stat-label">Fill-ups</p>
          <p className="stat-value">{logs.length}</p>
        </div>
        <div className="card stat-card">
          <p className="text-muted stat-label">Total Liters</p>
          <p className="stat-value" style={{ fontSize: '1.5rem' }}>{totalLiters.toLocaleString('en-PH', { maximumFractionDigits: 1 })} L</p>
        </div>
        <div className="card stat-card">
          <p className="text-muted stat-label">Total Spent</p>
          <p className="stat-value">₱{totalFuelCost.toLocaleString()}</p>
        </div>
        {avgKmPerL && (
          <div className="card stat-card">
            <p className="text-muted stat-label">Avg Efficiency</p>
            <p className="stat-value" style={{ fontSize: '1.5rem' }}>{avgKmPerL} <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>km/L</span></p>
          </div>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.25rem' }}>Log Fill-up</h2>
          <FuelForm
            values={form}
            onChange={setForm}
            errors={formErrors}
            onSubmit={handleAdd}
            onCancel={() => { setShowAdd(false); setFormErrors({}); }}
            submitLabel="Save Fuel Log"
          />
        </div>
      )}

      {/* Log list */}
      <div className="list-group">
        {logs.length === 0 ? (
          <div className="card empty-state">
            <span className="empty-icon">⛽</span>
            <p className="text-muted">No fuel logs yet. Add your first fill-up above.</p>
          </div>
        ) : (
          logs.map(l => (
            <div key={l.id} className="card">
              {editingId === l.id ? (
                <FuelForm
                  values={editForm}
                  onChange={setEditForm}
                  errors={formErrors}
                  onSubmit={handleEditSubmit}
                  onCancel={() => { setEditingId(null); setFormErrors({}); }}
                  submitLabel="Save Changes"
                />
              ) : (
                <div className="fuel-log-card">
                  <div className="mc-job">
                    <strong style={{ color: 'var(--accent-color)' }}>⛽ {Number(l.liters).toLocaleString('en-PH', { minimumFractionDigits: 1 })} L</strong>
                    <span className="text-muted" style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>@ ₱{Number(l.pricePerLiter).toLocaleString('en-PH', { minimumFractionDigits: 2 })}/L</span>
                    {l.notes && <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginTop: '0.15rem' }}>{l.notes}</span>}
                  </div>
                  <div className="mc-date">{l.date}</div>
                  <div className="mc-mileage">{Number(l.mileage).toLocaleString()} km</div>
                  <div className="mc-cost" style={{ color: 'var(--success-color)', fontWeight: 600 }}>₱{Number(l.totalCost).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                  <div className="mc-action flex-gap" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.65rem', fontSize: '0.8rem' }} onClick={() => startEdit(l)}>Edit</button>
                    <button className="btn btn-danger" style={{ padding: '0.25rem 0.65rem', fontSize: '0.8rem' }} onClick={() => setDeleteTarget(l)}>Delete</button>
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
