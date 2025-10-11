'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface Encounter {
  id: number;
  encounter_date: string;
  encounter_type: string | null;
  chief_complaint: string | null;
  assessment: string | null;
  status: string;
  provider_first_name: string;
  provider_last_name: string;
}

interface EncountersTabProps {
  patientId: string;
}

export default function EncountersTab({ patientId }: EncountersTabProps) {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEncounters();
  }, [patientId]);

  const fetchEncounters = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/encounters?patientId=${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setEncounters(data);
      }
    } catch (error) {
      console.error('Error fetching encounters:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewEncounter = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/encounters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: parseInt(patientId),
          encounterType: 'Office Visit'
        })
      });

      if (response.ok) {
        await fetchEncounters();
      }
    } catch (error) {
      console.error('Error creating encounter:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading encounters...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Clinical Encounters</h2>
        <button
          onClick={createNewEncounter}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <PlusIcon className="w-5 h-5" />
          New Encounter
        </button>
      </div>

      {/* Encounters List */}
      <div className="space-y-4">
        {encounters.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No clinical encounters documented</p>
            <p className="text-sm text-gray-500">Click &quot;New Encounter&quot; to document a patient visit</p>
          </div>
        ) : (
          encounters.map((encounter) => (
            <div
              key={encounter.id}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {encounter.encounter_type || 'Clinical Visit'}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      encounter.status === 'signed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {encounter.status}
                    </span>
                  </div>

                  {encounter.chief_complaint && (
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-semibold">Chief Complaint:</span> {encounter.chief_complaint}
                    </p>
                  )}

                  {encounter.assessment && (
                    <p className="text-sm text-gray-700 mb-3">
                      <span className="font-semibold">Assessment:</span> {encounter.assessment}
                    </p>
                  )}

                  <div className="text-xs text-gray-600">
                    <p>
                      {new Date(encounter.encounter_date).toLocaleString()} •{' '}
                      Provider: {encounter.provider_first_name} {encounter.provider_last_name}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
