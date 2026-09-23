import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createMaintenanceEntry, getVehicle } from '../api';

export default function AddMaintenance() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  
  const [jobType, setJobType] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mileage, setMileage] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function loadVehicle() {
      try {
        const v = await getVehicle(id);
        setVehicle(v);
        setMileage(v.currentMileage);
      } catch (err) {
        console.error(err);
      }
    }
    loadVehicle();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    await createMaintenanceEntry({
      vehicleId: id,
      jobType,
      date,
      mileage: parseInt(mileage) || 0,
      cost: parseFloat(cost) || 0,
      notes
    });
    navigate(`/vehicles/${id}/history`);
  }

  if (!vehicle) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <h1>Add Maintenance</h1>
        <Link to={`/vehicles/${id}/history`} className="btn btn-outline">Back</Link>
      </div>

      <div className="card">
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
          Recording for <strong>{vehicle.model}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Job Type</label>
            <input 
              type="text" 
              className="form-control" 
              value={jobType} 
              onChange={(e) => setJobType(e.target.value)} 
              placeholder="e.g. Oil Change, Brake Pads, Tire Rotation" 
              required 
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mileage (km)</label>
              <input 
                type="number" 
                className="form-control" 
                value={mileage} 
                onChange={(e) => setMileage(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Cost (₱)</label>
            <input 
              type="number" 
              step="0.01"
              className="form-control" 
              value={cost} 
              onChange={(e) => setCost(e.target.value)} 
              placeholder="0.00" 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea 
              className="form-control" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Additional details about the job..." 
              rows="3"
            ></textarea>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              Save Maintenance Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
