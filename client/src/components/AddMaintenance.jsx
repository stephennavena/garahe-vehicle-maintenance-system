import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createMaintenanceEntry, getVehicle } from '../api';
import { useToast, ToastContainer } from './Toast';
import { usePageTitle } from '../hooks/usePageTitle';

const JOB_TYPES = [
  'Oil Change', 'Brake Pads', 'Brake Fluid', 'Tire Change', 'Tire Rotation',
  'Air Filter', 'Cabin Filter', 'Battery Replacement', 'Spark Plugs',
  'Coolant Flush', 'Transmission Service', 'Wheel Alignment', 'Suspension',
  'Timing Belt', 'Wiper Blades', 'General Inspection', 'Other',
];

export default function AddMaintenance() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [saving, setSaving] = useState(false);   // must be declared before useCallback below
  const { toasts, showToast } = useToast();

  // Dynamic title
  usePageTitle(vehicle ? `Add Maintenance – ${vehicle.model}` : 'Add Maintenance');

  // Escape key: go back (only while not mid-save)
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && !saving) navigate(`/vehicles/${id}/history`);
  }, [saving, id, navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const today = new Date().toISOString().split('T')[0];

  const [jobType, setJobType] = useState('Oil Change');
  const [customJobType, setCustomJobType] = useState('');
  const [date, setDate] = useState(today);
  const [mileage, setMileage] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function loadVehicle() {
      try {
        const v = await getVehicle(id);
        setVehicle(v);
        setMileage(String(v.currentMileage));
      } catch (err) {
        console.error(err);
      }
    }
    loadVehicle();
  }, [id]);

  function validate() {
    const errs = {};
    const mileageVal = parseInt(mileage) || 0;
    const costVal = parseFloat(cost) || 0;
    const resolvedJobType = jobType === 'Other' ? customJobType.trim() : jobType;

    if (!resolvedJobType) errs.jobType = 'Job type is required.';
    if (!date) errs.date = 'Date is required.';
    else if (date > today) errs.date = 'Date cannot be in the future.';
    if (mileageVal < 0) errs.mileage = 'Mileage cannot be negative.';
    if (vehicle && mileageVal < vehicle.currentMileage) {
      errs.mileage = `Mileage should be greater than or equal to the current vehicle mileage (${vehicle.currentMileage.toLocaleString()} km).`;
    }
    if (costVal < 0) errs.cost = 'Cost cannot be negative.';

    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const resolvedJobType = jobType === 'Other' ? customJobType.trim() : jobType;

    setSaving(true);
    try {
      await createMaintenanceEntry({
        vehicleId: id,
        jobType: resolvedJobType,
        date,
        mileage: parseInt(mileage) || 0,
        cost: parseFloat(cost) || 0,
        notes,
      });
      navigate(`/vehicles/${id}/history`);
    } catch (err) {
      showToast('Failed to save record. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!vehicle) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p className="text-muted">Loading vehicle...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <ToastContainer toasts={toasts} />

      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <h1>Add Maintenance</h1>
        <Link to={`/vehicles/${id}/history`} className="btn btn-outline">← Back</Link>
      </div>

      <div className="card">
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
          Recording for <strong style={{ color: 'var(--text-primary)' }}>{vehicle.model}</strong>
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Job Type */}
          <div className="form-group">
            <label className="form-label">Job Type</label>
            <select
              className={`form-control${errors.jobType ? ' form-control-error' : ''}`}
              value={jobType}
              onChange={(e) => { setJobType(e.target.value); setErrors(err => ({ ...err, jobType: undefined })); }}
            >
              {JOB_TYPES.map(jt => <option key={jt}>{jt}</option>)}
            </select>
            {jobType === 'Other' && (
              <input
                type="text"
                className={`form-control${errors.jobType ? ' form-control-error' : ''}`}
                style={{ marginTop: '0.5rem' }}
                value={customJobType}
                onChange={(e) => { setCustomJobType(e.target.value); setErrors(err => ({ ...err, jobType: undefined })); }}
                placeholder="Describe the job..."
                autoFocus
              />
            )}
            {errors.jobType && <p className="form-error">{errors.jobType}</p>}
          </div>

          <div className="grid-2">
            {/* Date */}
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className={`form-control${errors.date ? ' form-control-error' : ''}`}
                value={date}
                max={today}
                onChange={(e) => { setDate(e.target.value); setErrors(err => ({ ...err, date: undefined })); }}
                required
              />
              {errors.date && <p className="form-error">{errors.date}</p>}
            </div>

            {/* Mileage */}
            <div className="form-group">
              <label className="form-label">Mileage (km)</label>
              <input
                type="number"
                className={`form-control${errors.mileage ? ' form-control-error' : ''}`}
                value={mileage}
                min="0"
                onChange={(e) => { setMileage(e.target.value); setErrors(err => ({ ...err, mileage: undefined })); }}
                required
              />
              {errors.mileage && <p className="form-error">{errors.mileage}</p>}
              {vehicle && !errors.mileage && (
                <p className="form-hint">Vehicle is currently at {vehicle.currentMileage.toLocaleString()} km</p>
              )}
            </div>
          </div>

          {/* Cost */}
          <div className="form-group">
            <label className="form-label">Cost (₱)</label>
            <div className="input-prefix-wrapper">
              <span className="input-prefix">₱</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`form-control input-with-prefix${errors.cost ? ' form-control-error' : ''}`}
                value={cost}
                onChange={(e) => { setCost(e.target.value); setErrors(err => ({ ...err, cost: undefined })); }}
                placeholder="0.00"
                required
              />
            </div>
            {errors.cost && <p className="form-error">{errors.cost}</p>}
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes <span className="text-muted">(optional)</span></label>
            <textarea
              className="form-control"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details about the job..."
              rows="3"
            />
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={saving}>
              {saving ? 'Saving...' : 'Save Maintenance Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
