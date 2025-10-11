'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface VitalSign {
  id: number;
  recorded_at: string;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  temperature: number | null;
  temperature_unit: string;
  oxygen_saturation: number | null;
  weight: number | null;
  weight_unit: string;
  height: number | null;
  height_unit: string;
  bmi: number | null;
  pain_scale: number | null;
  notes: string | null;
  recorded_by_first_name: string;
  recorded_by_last_name: string;
}

interface VitalSignsTabProps {
  patientId: string;
}

export default function VitalSignsTab({ patientId }: VitalSignsTabProps) {
  const [vitals, setVitals] = useState<VitalSign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    respiratoryRate: '',
    temperature: '',
    temperatureUnit: 'C',
    oxygenSaturation: '',
    weight: '',
    weightUnit: 'kg',
    height: '',
    heightUnit: 'cm',
    painScale: '',
    notes: ''
  });

  useEffect(() => {
    fetchVitals();
  }, [patientId]);

  const fetchVitals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/vital-signs?patientId=${patientId}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setVitals(data);
      }
    } catch (error) {
      console.error('Error fetching vitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/vital-signs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: parseInt(patientId),
          bloodPressureSystolic: formData.bloodPressureSystolic ? parseInt(formData.bloodPressureSystolic) : null,
          bloodPressureDiastolic: formData.bloodPressureDiastolic ? parseInt(formData.bloodPressureDiastolic) : null,
          heartRate: formData.heartRate ? parseInt(formData.heartRate) : null,
          respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : null,
          temperature: formData.temperature ? parseFloat(formData.temperature) : null,
          temperatureUnit: formData.temperatureUnit,
          oxygenSaturation: formData.oxygenSaturation ? parseInt(formData.oxygenSaturation) : null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          weightUnit: formData.weightUnit,
          height: formData.height ? parseFloat(formData.height) : null,
          heightUnit: formData.heightUnit,
          painScale: formData.painScale ? parseInt(formData.painScale) : null,
          notes: formData.notes || null
        })
      });

      if (response.ok) {
        await fetchVitals();
        setShowForm(false);
        setFormData({
          bloodPressureSystolic: '',
          bloodPressureDiastolic: '',
          heartRate: '',
          respiratoryRate: '',
          temperature: '',
          temperatureUnit: 'C',
          oxygenSaturation: '',
          weight: '',
          weightUnit: 'kg',
          height: '',
          heightUnit: 'cm',
          painScale: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error saving vitals:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading vital signs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Vital Signs</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? <XMarkIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
          {showForm ? 'Cancel' : 'Record Vitals'}
        </button>
      </div>

      {/* Entry Form */}
      {showForm && (
        <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">New Vital Signs Entry</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Blood Pressure & Heart Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  BP Systolic (mmHg)
                </label>
                <input
                  type="number"
                  value={formData.bloodPressureSystolic}
                  onChange={(e) => setFormData({ ...formData, bloodPressureSystolic: e.target.value })}
                  placeholder="120"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  BP Diastolic (mmHg)
                </label>
                <input
                  type="number"
                  value={formData.bloodPressureDiastolic}
                  onChange={(e) => setFormData({ ...formData, bloodPressureDiastolic: e.target.value })}
                  placeholder="80"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  value={formData.heartRate}
                  onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                  placeholder="72"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            </div>

            {/* Temperature, RR, O2 Sat */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperature
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    placeholder="37.0"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  />
                  <select
                    value={formData.temperatureUnit}
                    onChange={(e) => setFormData({ ...formData, temperatureUnit: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="C">°C</option>
                    <option value="F">°F</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Respiratory Rate
                </label>
                <input
                  type="number"
                  value={formData.respiratoryRate}
                  onChange={(e) => setFormData({ ...formData, respiratoryRate: e.target.value })}
                  placeholder="16"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  O₂ Saturation (%)
                </label>
                <input
                  type="number"
                  value={formData.oxygenSaturation}
                  onChange={(e) => setFormData({ ...formData, oxygenSaturation: e.target.value })}
                  placeholder="98"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            </div>

            {/* Weight, Height, Pain */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="70"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  />
                  <select
                    value={formData.weightUnit}
                    onChange={(e) => setFormData({ ...formData, weightUnit: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    placeholder="170"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  />
                  <select
                    value={formData.heightUnit}
                    onChange={(e) => setFormData({ ...formData, heightUnit: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="cm">cm</option>
                    <option value="in">in</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pain Scale (0-10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.painScale}
                  onChange={(e) => setFormData({ ...formData, painScale: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Additional observations..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Save Vital Signs
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vital Signs History */}
      <div className="space-y-4">
        {vitals.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-600 mb-2">No vital signs recorded yet</p>
            <p className="text-sm text-gray-500">Click &quot;Record Vitals&quot; to add the first entry</p>
          </div>
        ) : (
          vitals.map((vital) => (
            <div key={vital.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-600">
                    {new Date(vital.recorded_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Recorded by: {vital.recorded_by_first_name} {vital.recorded_by_last_name}
                  </p>
                </div>
                {vital.bmi && (
                  <div className="text-right">
                    <p className="text-xs text-gray-600">BMI</p>
                    <p className="text-lg font-bold text-gray-900">{vital.bmi}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                {vital.blood_pressure_systolic && vital.blood_pressure_diastolic && (
                  <div>
                    <p className="text-xs text-gray-600">Blood Pressure</p>
                    <p className="font-semibold text-gray-900">
                      {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}
                    </p>
                    <p className="text-xs text-gray-500">mmHg</p>
                  </div>
                )}
                {vital.heart_rate && (
                  <div>
                    <p className="text-xs text-gray-600">Heart Rate</p>
                    <p className="font-semibold text-gray-900">{vital.heart_rate}</p>
                    <p className="text-xs text-gray-500">bpm</p>
                  </div>
                )}
                {vital.respiratory_rate && (
                  <div>
                    <p className="text-xs text-gray-600">Resp. Rate</p>
                    <p className="font-semibold text-gray-900">{vital.respiratory_rate}</p>
                    <p className="text-xs text-gray-500">breaths/min</p>
                  </div>
                )}
                {vital.temperature && (
                  <div>
                    <p className="text-xs text-gray-600">Temperature</p>
                    <p className="font-semibold text-gray-900">
                      {vital.temperature}°{vital.temperature_unit}
                    </p>
                  </div>
                )}
                {vital.oxygen_saturation && (
                  <div>
                    <p className="text-xs text-gray-600">O₂ Saturation</p>
                    <p className="font-semibold text-gray-900">{vital.oxygen_saturation}%</p>
                  </div>
                )}
                {vital.weight && (
                  <div>
                    <p className="text-xs text-gray-600">Weight</p>
                    <p className="font-semibold text-gray-900">
                      {vital.weight} {vital.weight_unit}
                    </p>
                  </div>
                )}
                {vital.height && (
                  <div>
                    <p className="text-xs text-gray-600">Height</p>
                    <p className="font-semibold text-gray-900">
                      {vital.height} {vital.height_unit}
                    </p>
                  </div>
                )}
                {vital.pain_scale !== null && (
                  <div>
                    <p className="text-xs text-gray-600">Pain Scale</p>
                    <p className="font-semibold text-gray-900">{vital.pain_scale}/10</p>
                  </div>
                )}
              </div>

              {vital.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Notes:</p>
                  <p className="text-sm text-gray-800">{vital.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
