import { useEffect, useState } from 'react';
import { createVehicle, deleteVehicle, listDrivers, listVehicles, updateVehicle } from '../api/admin';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import type { AdminDriver, AdminVehicle, VehicleType } from '../types';

const VEHICLE_LABELS: Record<VehicleType, string> = {
  MOTO: 'Moto',
  RAKCHA: 'Rakcha',
  CAR: 'Voiture',
};

interface VehicleFormState {
  id?: string;
  driverId: string;
  type: VehicleType;
  plate: string;
  brand: string;
  model: string;
  color: string;
  isActive: boolean;
}

const EMPTY_FORM: VehicleFormState = {
  driverId: '',
  type: 'CAR',
  plate: '',
  brand: '',
  model: '',
  color: '',
  isActive: true,
};

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<VehicleFormState | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load(targetPage: number) {
    setLoading(true);
    listVehicles({ page: targetPage })
      .then((data) => {
        setVehicles(data.vehicles);
        setTotal(data.total);
        setPageSize(data.pageSize);
        setPage(targetPage);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(1);
    listDrivers({ page: 1 }).then((data) => setDrivers(data.drivers));
  }, []);

  function openCreate() {
    setError(null);
    setForm({ ...EMPTY_FORM, driverId: drivers[0]?.id ?? '' });
  }

  function openEdit(vehicle: AdminVehicle) {
    setError(null);
    setForm({
      id: vehicle.id,
      driverId: vehicle.driverId,
      type: vehicle.type,
      plate: vehicle.plate ?? '',
      brand: vehicle.brand ?? '',
      model: vehicle.model ?? '',
      color: vehicle.color ?? '',
      isActive: vehicle.isActive,
    });
  }

  async function handleSubmit() {
    if (!form) return;
    setError(null);
    try {
      if (form.id) {
        const updated = await updateVehicle(form.id, {
          type: form.type,
          plate: form.plate || null,
          brand: form.brand || null,
          model: form.model || null,
          color: form.color || null,
          isActive: form.isActive,
        });
        setVehicles((prev) => prev.map((v) => (v.id === updated.id ? { ...updated, driverName: prev.find((p) => p.id === updated.id)!.driverName } : v)));
      } else {
        await createVehicle({
          driverId: form.driverId,
          type: form.type,
          plate: form.plate || undefined,
          brand: form.brand || undefined,
          model: form.model || undefined,
          color: form.color || undefined,
          isActive: form.isActive,
        });
        load(1);
      }
      setForm(null);
    } catch {
      setError("Échec de l'enregistrement du véhicule.");
    }
  }

  async function handleDelete(vehicle: AdminVehicle) {
    if (!confirm(`Supprimer le véhicule ${VEHICLE_LABELS[vehicle.type]} de ${vehicle.driverName} ?`)) return;
    await deleteVehicle(vehicle.id);
    load(page);
  }

  return (
    <div>
      <div className="page-header">
        <h1>Véhicules</h1>
        <button className="btn btn-primary" onClick={openCreate} disabled={drivers.length === 0}>
          + Ajouter un véhicule
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Conducteur</th>
              <th>Type</th>
              <th>Marque / modèle</th>
              <th>Plaque</th>
              <th>Couleur</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id}>
                <td>{vehicle.driverName}</td>
                <td>{VEHICLE_LABELS[vehicle.type]}</td>
                <td>
                  {vehicle.brand ?? '—'} {vehicle.model ?? ''}
                </td>
                <td>{vehicle.plate ?? '—'}</td>
                <td>{vehicle.color ?? '—'}</td>
                <td>
                  <Badge label={vehicle.isActive ? 'Actif' : 'Inactif'} tone={vehicle.isActive ? 'positive' : 'neutral'} />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(vehicle)}>
                      Modifier
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(vehicle)}>
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && vehicles.length === 0 && <div className="empty-state">Aucun véhicule trouvé.</div>}
      </div>

      <Pagination page={page} total={total} pageSize={pageSize} onChange={load} />

      {form && (
        <Modal title={form.id ? 'Modifier le véhicule' : 'Ajouter un véhicule'} onClose={() => setForm(null)}>
          {error && <div className="form-error">{error}</div>}

          {!form.id && (
            <div className="field">
              <label>Conducteur</label>
              <select
                className="input"
                value={form.driverId}
                onChange={(e) => setForm({ ...form, driverId: e.target.value })}
              >
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.firstName} {driver.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label>Type de véhicule</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as VehicleType })}>
              <option value="MOTO">Moto</option>
              <option value="RAKCHA">Rakcha</option>
              <option value="CAR">Voiture</option>
            </select>
          </div>

          <div className="field">
            <label>Marque</label>
            <input className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          </div>

          <div className="field">
            <label>Modèle</label>
            <input className="input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </div>

          <div className="field">
            <label>Plaque d'immatriculation</label>
            <input className="input" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} />
          </div>

          <div className="field">
            <label>Couleur</label>
            <input className="input" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>

          <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="vehicle-active"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            <label htmlFor="vehicle-active" style={{ margin: 0 }}>
              Véhicule actif
            </label>
          </div>

          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setForm(null)}>
              Annuler
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              Enregistrer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
