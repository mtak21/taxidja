import { useEffect, useState } from 'react';
import { createCity, createZone, listCities, updateCity, updateZone } from '../api/admin';
import { Badge } from '../components/Badge';
import type { City } from '../types';

export function CitiesZonesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [newCityName, setNewCityName] = useState('');
  const [zoneDrafts, setZoneDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  function load() {
    listCities().then(setCities);
  }

  useEffect(load, []);

  async function handleCreateCity() {
    if (!newCityName.trim()) return;
    setError(null);
    try {
      await createCity(newCityName.trim());
      setNewCityName('');
      load();
    } catch {
      setError('Impossible de créer la ville (nom déjà utilisé ?).');
    }
  }

  async function handleToggleCity(city: City) {
    await updateCity(city.id, { isActive: !city.isActive });
    load();
  }

  async function handleCreateZone(cityId: string) {
    const name = zoneDrafts[cityId]?.trim();
    if (!name) return;
    setError(null);
    try {
      await createZone({ cityId, name });
      setZoneDrafts((prev) => ({ ...prev, [cityId]: '' }));
      load();
    } catch {
      setError('Impossible de créer la zone.');
    }
  }

  async function handleToggleZone(zoneId: string, isActive: boolean) {
    await updateZone(zoneId, { isActive: !isActive });
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h1>Villes & Zones</h1>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Ajouter une ville</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            placeholder="Nom de la ville"
            value={newCityName}
            onChange={(e) => setNewCityName(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={handleCreateCity}>
            Ajouter
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {cities.map((city) => (
          <div className="card" key={city.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h3 style={{ margin: 0 }}>{city.name}</h3>
                <Badge label={city.isActive ? 'Active' : 'Inactive'} tone={city.isActive ? 'positive' : 'neutral'} />
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => handleToggleCity(city)}>
                {city.isActive ? 'Désactiver' : 'Activer'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {city.zones.length === 0 && (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Aucune zone pour cette ville.</p>
              )}
              {city.zones.map((zone) => (
                <div key={zone.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{zone.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge label={zone.isActive ? 'Active' : 'Inactive'} tone={zone.isActive ? 'positive' : 'neutral'} />
                    <button className="btn btn-ghost btn-sm" onClick={() => handleToggleZone(zone.id, zone.isActive)}>
                      {zone.isActive ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                placeholder="Nom de la zone"
                value={zoneDrafts[city.id] ?? ''}
                onChange={(e) => setZoneDrafts((prev) => ({ ...prev, [city.id]: e.target.value }))}
                style={{ flex: 1 }}
              />
              <button className="btn btn-secondary btn-sm" onClick={() => handleCreateZone(city.id)}>
                + Zone
              </button>
            </div>
          </div>
        ))}
        {cities.length === 0 && <div className="empty-state">Aucune ville enregistrée.</div>}
      </div>
    </div>
  );
}
