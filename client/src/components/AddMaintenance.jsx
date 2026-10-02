import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createMaintenanceEntry, listMaintenanceEntries, getVehicle } from '../api';
import { useToast, ToastContainer } from './Toast';
import { usePageTitle } from '../hooks/usePageTitle';

const JOB_TYPES = [
  'PMS', 'Oil Change', 'Brake Pads', 'Brake Fluid', 'Tire Change', 'Tire Rotation',
  'Air Filter', 'Cabin Filter', 'Battery Replacement', 'Spark Plugs',
  'Coolant Flush', 'Transmission Service', 'Wheel Alignment', 'Suspension',
  'Timing Belt', 'Wiper Blades', 'General Inspection', 'Other',
];

function emptyLine() {
  return { jobType: 'Oil Change', customJobType: '', cost: '', notes: '', shopName: '' };
}

export default function AddMaintenance() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [saving, setSaving] = useState(false);
  const { toasts, showToast } = useToast();

  usePageTitle(vehicle ? `Add Maintenance – ${vehicle.model}` : 'Add Maintenance');

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && !saving) navigate(`/vehicles/${id}/history`);
  }, [saving, id, navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const today = new Date().toISOString().split('T')[0];

  // Shared fields for the visit
  const [date, setDate] = useState(today);
  const [mileage, setMileage] = useState('');
  const [nextDueKm, setNextDueKm] = useState('');
  const [errors, setErrors] = useState({});

  // Multiple job line items
  const [lines, setLines] = useState([emptyLine()]);

  useEffect(() => {
    async function loadData() {
      try {
        const [v, existingEntries] = await Promise.all([
          getVehicle(id),
          listMaintenanceEntries(id),
        ]);
        setVehicle(v);
        setMileage(String(v.currentMileage));

        if (existingEntries.length > 0) {
          const last = existingEntries[0]; // already sorted newest first
          setLines([{
            jobType: last.jobType,
            customJobType: '',
            cost: String(last.cost),
            notes: last.notes || '',
            shopName: last.shopName || '',
          }]);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, [id]);

  function updateLine(index, field, value) {
    setLines(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function addLine() {
    setLines(prev => [...prev, emptyLine()]);
  }

  function removeLine(index) {
    setLines(prev => prev.filter((_, i) => i !== index));
  }

  function validate() {
    const errs = {};
    const mileageVal = parseInt(mileage) || 0;
    const nextDueKmVal = nextDueKm ? parseInt(nextDueKm) : null;

    if (!date) errs.date = 'Date is required.';
    else if (date > today) errs.date = 'Date cannot be in the future.';
    if (mileageVal < 0) errs.mileage = 'Mileage cannot be negative.';
    if (vehicle && mileageVal < vehicle.currentMileage) {
      errs.mileage = `Mileage should be greater than or equal to the current vehicle mileage (${vehicle.currentMileage.toLocaleString()} km).`;
    }
    if (nextDueKmVal !== null && nextDueKmVal < mileageVal) {
      errs.nextDueKm = 'Next service mileage must be greater than the current mileage entry.';
    }

    lines.forEach((line, i) => {
      const resolved = line.jobType === 'Other' ? line.customJobType.trim() : line.jobType;
      if (!resolved) errs[`line_${i}_jobType`] = 'Job type is required.';
      const costVal = parseFloat(line.cost) || 0;
      if (costVal < 0) errs[`line_${i}_cost`] = 'Cost cannot be negative.';
    });

    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const mileageVal = parseInt(mileage) || 0;
    const nextDueKmVal = nextDueKm ? parseInt(nextDueKm) : null;

    setSaving(true);
    try {
      // Create one entry per line item (same date + mileage, different job/cost)
      // Only the last line item gets nextDueKm since they share the same visit
      await Promise.all(lines.map((line, i) => {
        const resolvedJobType = line.jobType === 'Other' ? line.customJobType.trim() : line.jobType;
        return createMaintenanceEntry({
          vehicleId: id,
          jobType: resolvedJobType,
          date,
          mileage: mileageVal,
          cost: parseFloat(line.cost) || 0,
          notes: line.notes,
          nextDueKm: i === lines.length - 1 ? nextDueKmVal : null,
          shopName: line.shopName || '',
        });
      }));
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
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
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

          <div className="grid-2">

            <div className="form-group">
              <label className="form-label">Service Date</label>
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


            <div className="form-group">
              <label className="form-label">Mileage at Service (km)</label>
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


          <div className="form-group">
            <label className="form-label">Next Service Due at (km) <span className="text-muted">(optional)</span></label>
            <input
              type="number"
              className={`form-control${errors.nextDueKm ? ' form-control-error' : ''}`}
              value={nextDueKm}
              min={mileage || 0}
              placeholder={mileage ? `e.g. ${(parseInt(mileage) || 0) + 5000}` : 'e.g. 90000'}
              onChange={(e) => { setNextDueKm(e.target.value); setErrors(err => ({ ...err, nextDueKm: undefined })); }}
            />
            {errors.nextDueKm && <p className="form-error">{errors.nextDueKm}</p>}
            <p className="form-hint">Set this to get a reminder when the vehicle approaches this mileage.</p>
          </div>


          <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ marginBottom: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Jobs Done This Visit
              </label>
              <button type="button" className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={addLine}>
                + Add Job
              </button>
            </div>

            {lines.map((line, i) => (
              <div key={i} className="job-line-card" style={{ marginBottom: '1rem' }}>
                <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Job {lines.length > 1 ? `#${i + 1}` : ''}
                  </span>
                  {lines.length > 1 && (
                    <button type="button" className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => removeLine(i)}>
                      Remove
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Job Type</label>
                  <select
                    className={`form-control${errors[`line_${i}_jobType`] ? ' form-control-error' : ''}`}
                    value={line.jobType}
                    onChange={(e) => { updateLine(i, 'jobType', e.target.value); setErrors(err => ({ ...err, [`line_${i}_jobType`]: undefined })); }}
                  >
                    {JOB_TYPES.map(jt => <option key={jt}>{jt}</option>)}
                  </select>
                  {line.jobType === 'Other' && (
                    <input
                      type="text"
                      className={`form-control${errors[`line_${i}_jobType`] ? ' form-control-error' : ''}`}
                      style={{ marginTop: '0.5rem' }}
                      value={line.customJobType}
                      onChange={(e) => { updateLine(i, 'customJobType', e.target.value); setErrors(err => ({ ...err, [`line_${i}_jobType`]: undefined })); }}
                      placeholder="Describe the job..."
                      autoFocus
                    />
                  )}
                  {errors[`line_${i}_jobType`] && <p className="form-error">{errors[`line_${i}_jobType`]}</p>}
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Cost (₱)</label>
                    <div className="input-prefix-wrapper">
                      <span className="input-prefix">₱</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={`form-control input-with-prefix${errors[`line_${i}_cost`] ? ' form-control-error' : ''}`}
                        value={line.cost}
                        onChange={(e) => { updateLine(i, 'cost', e.target.value); setErrors(err => ({ ...err, [`line_${i}_cost`]: undefined })); }}
                        placeholder="0.00"
                      />
                    </div>
                    {errors[`line_${i}_cost`] && <p className="form-error">{errors[`line_${i}_cost`]}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Workshop / Shop <span className="text-muted">(optional)</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={line.shopName}
                      onChange={(e) => updateLine(i, 'shopName', e.target.value)}
                      placeholder="e.g. Midas BGC"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Notes <span className="text-muted">(optional)</span></label>
                  <textarea
                    className="form-control"
                    value={line.notes}
                    onChange={(e) => updateLine(i, 'notes', e.target.value)}
                    placeholder="Parts used, observations..."
                    rows="2"
                  />
                </div>
              </div>
            ))}


            {lines.length > 1 && (
              <div className="cost-summary">
                <span className="text-muted">Total for this visit:</span>
                <span style={{ color: 'var(--success-color)', fontWeight: 700 }}>
                  ₱{lines.reduce((s, l) => s + (parseFloat(l.cost) || 0), 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={saving}>
              {saving ? 'Saving...' : `Save ${lines.length > 1 ? `${lines.length} Records` : 'Maintenance Record'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
