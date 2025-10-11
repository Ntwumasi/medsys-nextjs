'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Allergy {
  id: number;
  allergen: string;
  allergen_type: string | null;
  reaction: string | null;
  severity: string | null;
  onset_date: string | null;
  notes: string | null;
  status: string;
  recorded_by_first_name: string;
  recorded_by_last_name: string;
  created_at: string;
}

interface AllergiesTabProps {
  patientId: string;
}

export default function AllergiesTab({ patientId }: AllergiesTabProps) {
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    allergen: '',
    allergenType: '',
    reaction: '',
    severity: '',
    onsetDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchAllergies();
  }, [patientId]);

  const fetchAllergies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/allergies?patientId=${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAllergies(data);
      }
    } catch (error) {
      console.error('Error fetching allergies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/allergies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: parseInt(patientId),
          allergen: formData.allergen,
          allergenType: formData.allergenType || null,
          reaction: formData.reaction || null,
          severity: formData.severity || null,
          onsetDate: formData.onsetDate || null,
          notes: formData.notes || null
        })
      });

      if (response.ok) {
        await fetchAllergies();
        setShowForm(false);
        setFormData({
          allergen: '',
          allergenType: '',
          reaction: '',
          severity: '',
          onsetDate: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error saving allergy:', error);
    }
  };

  const getSeverityColor = (severity: string | null) => {
    switch (severity?.toLowerCase()) {
      case 'severe': return 'bg-red-100 text-red-800 border-red-300';
      case 'moderate': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'mild': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading allergies...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Alert */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Allergies & Adverse Reactions</h2>
          {allergies.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800 font-medium">
                Patient has {allergies.length} documented {allergies.length === 1 ? 'allergy' : 'allergies'}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex-shrink-0"
        >
          {showForm ? <XMarkIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
          {showForm ? 'Cancel' : 'Add Allergy'}
        </button>
      </div>

      {/* Entry Form */}
      {showForm && (
        <div className="bg-white rounded-xl border-2 border-red-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">New Allergy Entry</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergen *
                </label>
                <input
                  type="text"
                  value={formData.allergen}
                  onChange={(e) => setFormData({ ...formData, allergen: e.target.value })}
                  required
                  placeholder="e.g., Penicillin, Peanuts"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergen Type
                </label>
                <select
                  value={formData.allergenType}
                  onChange={(e) => setFormData({ ...formData, allergenType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
                >
                  <option value="">Select type</option>
                  <option value="Medication">Medication</option>
                  <option value="Food">Food</option>
                  <option value="Environmental">Environmental</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reaction
              </label>
              <input
                type="text"
                value={formData.reaction}
                onChange={(e) => setFormData({ ...formData, reaction: e.target.value })}
                placeholder="e.g., Rash, Anaphylaxis, Hives"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
                >
                  <option value="">Select severity</option>
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Onset Date
                </label>
                <input
                  type="date"
                  value={formData.onsetDate}
                  onChange={(e) => setFormData({ ...formData, onsetDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional details about the allergic reaction..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Save Allergy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Allergies List */}
      <div className="space-y-3">
        {allergies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No allergies documented</p>
            <p className="text-sm text-gray-500">Click &quot;Add Allergy&quot; if patient has known allergies</p>
          </div>
        ) : (
          allergies.map((allergy) => (
            <div
              key={allergy.id}
              className={`p-4 rounded-xl border-2 ${getSeverityColor(allergy.severity)}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold">{allergy.allergen}</h3>
                    {allergy.allergen_type && (
                      <span className="px-2 py-1 bg-white/50 rounded text-xs font-semibold">
                        {allergy.allergen_type}
                      </span>
                    )}
                    {allergy.severity && (
                      <span className="px-2 py-1 bg-white/70 rounded text-xs font-bold">
                        {allergy.severity}
                      </span>
                    )}
                  </div>

                  {allergy.reaction && (
                    <p className="text-sm mb-2">
                      <span className="font-semibold">Reaction:</span> {allergy.reaction}
                    </p>
                  )}

                  {allergy.notes && (
                    <p className="text-sm mb-2">
                      <span className="font-semibold">Notes:</span> {allergy.notes}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs mt-3">
                    {allergy.onset_date && (
                      <span>
                        <strong>Onset:</strong> {new Date(allergy.onset_date).toLocaleDateString()}
                      </span>
                    )}
                    <span>
                      <strong>Recorded:</strong> {new Date(allergy.created_at).toLocaleDateString()}
                    </span>
                    <span>
                      <strong>By:</strong> {allergy.recorded_by_first_name} {allergy.recorded_by_last_name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {allergies.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            ✓ No known allergies documented for this patient
          </p>
        </div>
      )}
    </div>
  );
}
