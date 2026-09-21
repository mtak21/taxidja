import { useEffect, useState } from 'react';
import { listPricing, updatePricing } from '../api/admin';
import type { PricingConfig, VehicleType } from '../types';

const VEHICLE_LABELS: Record<VehicleType, string> = {
  MOTO: 'Moto',
  RAKCHA: 'Rakcha',
  CAR: 'Voiture',
};

export function PricingPage() {
  const [pricing, setPricing] = useState<PricingConfig[]>([]);
  const [drafts, setDrafts] = useState<Record<VehicleType, { baseFare: string; pricePerKm: string }>>(
    {} as Record<VehicleType, { baseFare: string; pricePerKm: string }>,
  );
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    listPricing().then((data) => {
      setPricing(data);
      const nextDrafts: Record<string, { baseFare: string; pricePerKm: string }> = {};
      for (const config of data) {
        nextDrafts[config.vehicleType] = {
          baseFare: String(config.baseFare),
          pricePerKm: String(config.pricePerKm),
        };
      }
      setDrafts(nextDrafts as Record<VehicleType, { baseFare: string; pricePerKm: string }>);
    });
  }

  useEffect(load, []);

  async function handleSave(vehicleType: VehicleType) {
    setError(null);
    setSavedMessage(null);
    const draft = drafts[vehicleType];
    const baseFare = Number(draft.baseFare);
    const pricePerKm = Number(draft.pricePerKm);
    if (!Number.isFinite(baseFare) || baseFare <= 0 || !Number.isFinite(pricePerKm) || pricePerKm <= 0) {
      setError('Les tarifs doivent être des nombres positifs.');
      return;
    }
    try {
      await updatePricing(vehicleType, { baseFare, pricePerKm });
      setSavedMessage(`Tarifs ${VEHICLE_LABELS[vehicleType]} enregistrés.`);
      load();
    } catch {
      setError("Échec de l'enregistrement des tarifs.");
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Tarifs</h1>
      </div>

      {error && <div className="form-error">{error}</div>}
      {savedMessage && <div style={{ color: 'var(--color-secondary-dark)', marginBottom: 16 }}>{savedMessage}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {pricing.map((config) => {
          const draft = drafts[config.vehicleType];
          if (!draft) return null;
          return (
            <div className="card" key={config.vehicleType}>
              <h3>{VEHICLE_LABELS[config.vehicleType]}</h3>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Prix de base (FCFA)</label>
                  <input
                    className="input"
                    type="number"
                    value={draft.baseFare}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [config.vehicleType]: { ...prev[config.vehicleType], baseFare: e.target.value } }))
                    }
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Prix par km (FCFA)</label>
                  <input
                    className="input"
                    type="number"
                    value={draft.pricePerKm}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [config.vehicleType]: { ...prev[config.vehicleType], pricePerKm: e.target.value } }))
                    }
                  />
                </div>
                <button className="btn btn-primary" onClick={() => handleSave(config.vehicleType)}>
                  Enregistrer
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
