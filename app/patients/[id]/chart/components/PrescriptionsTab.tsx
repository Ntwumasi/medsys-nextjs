'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Prescription {
  id: number;
  medication_name: string;
  generic_name: string | null;
  dosage: string;
  form: string | null;
  route: string | null;
  frequency: string;
  duration: string | null;
  quantity: string | null;
  refills: number;
  indication: string | null;
  instructions: string | null;
  status: string;
  prescription_date: string;
  prescriber_first_name: string;
  prescriber_last_name: string;
}

interface PrescriptionsTabProps {
  patientId: string;
}

export default function PrescriptionsTab({ patientId }: PrescriptionsTabProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    medicationName: '',
    genericName: '',
    dosage: '',
    form: '',
    route: '',
    frequency: '',
    duration: '',
    quantity: '',
    refills: '0',
    indication: '',
    instructions: ''
  });

  useEffect(() => {
    fetchPrescriptions();
  }, [patientId]);

  const fetchPrescriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/prescriptions?patientId=${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: parseInt(patientId),
          medicationName: formData.medicationName,
          genericName: formData.genericName || null,
          dosage: formData.dosage,
          form: formData.form || null,
          route: formData.route || null,
          frequency: formData.frequency,
          duration: formData.duration || null,
          quantity: formData.quantity || null,
          refills: parseInt(formData.refills),
          indication: formData.indication || null,
          instructions: formData.instructions || null
        })
      });

      if (response.ok) {
        await fetchPrescriptions();
        setShowForm(false);
        setFormData({
          medicationName: '',
          genericName: '',
          dosage: '',
          form: '',
          route: '',
          frequency: '',
          duration: '',
          quantity: '',
          refills: '0',
          indication: '',
          instructions: ''
        });
      }
    } catch (error) {
      console.error('Error saving prescription:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading prescriptions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Prescriptions</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          {showForm ? <XMarkIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
          {showForm ? 'Cancel' : 'New Prescription'}
        </button>
      </div>

      {/* Entry Form */}
      {showForm && (
        <div className="bg-white rounded-xl border-2 border-purple-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Write Prescription</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medication Name *
                </label>
                <input
                  type="text"
                  value={formData.medicationName}
                  onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
                  required
                  placeholder="e.g., Amoxicillin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Generic Name
                </label>
                <input
                  type="text"
                  value={formData.genericName}
                  onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                  placeholder="e.g., Amoxicillin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosage *
                </label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  required
                  placeholder="e.g., 500 mg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Form
                </label>
                <select
                  value={formData.form}
                  onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white"
                >
                  <option value="">Select form</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Cream">Cream</option>
                  <option value="Drops">Drops</option>
                  <option value="Inhaler">Inhaler</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Route
                </label>
                <select
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white"
                >
                  <option value="">Select route</option>
                  <option value="Oral">Oral</option>
                  <option value="IV">IV</option>
                  <option value="IM">IM</option>
                  <option value="Topical">Topical</option>
                  <option value="Sublingual">Sublingual</option>
                  <option value="Rectal">Rectal</option>
                  <option value="Inhalation">Inhalation</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white"
                >
                  <option value="">Select frequency</option>
                  <option value="Once daily">Once daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Three times daily">Three times daily</option>
                  <option value="Four times daily">Four times daily</option>
                  <option value="Every 4 hours">Every 4 hours</option>
                  <option value="Every 6 hours">Every 6 hours</option>
                  <option value="Every 8 hours">Every 8 hours</option>
                  <option value="Every 12 hours">Every 12 hours</option>
                  <option value="As needed">As needed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 7 days, 2 weeks"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="text"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="e.g., 30 tablets"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Refills
              </label>
              <input
                type="number"
                min="0"
                max="12"
                value={formData.refills}
                onChange={(e) => setFormData({ ...formData, refills: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Indication
              </label>
              <input
                type="text"
                value={formData.indication}
                onChange={(e) => setFormData({ ...formData, indication: e.target.value })}
                placeholder="e.g., Upper respiratory infection"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructions
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                rows={2}
                placeholder="e.g., Take with food"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Submit Prescription
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Prescriptions List */}
      <div className="space-y-4">
        {prescriptions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-600 mb-2">No prescriptions on file</p>
            <p className="text-sm text-gray-500">Click "New Prescription" to write the first prescription</p>
          </div>
        ) : (
          prescriptions.map((rx) => (
            <div key={rx.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{rx.medication_name}</h3>
                  {rx.generic_name && (
                    <p className="text-sm text-gray-600">Generic: {rx.generic_name}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  rx.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {rx.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600">Dosage</p>
                  <p className="font-semibold text-gray-900">{rx.dosage}</p>
                </div>
                {rx.form && (
                  <div>
                    <p className="text-xs text-gray-600">Form</p>
                    <p className="font-semibold text-gray-900">{rx.form}</p>
                  </div>
                )}
                {rx.route && (
                  <div>
                    <p className="text-xs text-gray-600">Route</p>
                    <p className="font-semibold text-gray-900">{rx.route}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-600">Frequency</p>
                  <p className="font-semibold text-gray-900">{rx.frequency}</p>
                </div>
                {rx.duration && (
                  <div>
                    <p className="text-xs text-gray-600">Duration</p>
                    <p className="font-semibold text-gray-900">{rx.duration}</p>
                  </div>
                )}
                {rx.quantity && (
                  <div>
                    <p className="text-xs text-gray-600">Quantity</p>
                    <p className="font-semibold text-gray-900">{rx.quantity}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-600">Refills</p>
                  <p className="font-semibold text-gray-900">{rx.refills}</p>
                </div>
              </div>

              {(rx.indication || rx.instructions) && (
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  {rx.indication && (
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700">Indication:</span> {rx.indication}
                    </p>
                  )}
                  {rx.instructions && (
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700">Instructions:</span> {rx.instructions}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600">
                <p>
                  Prescribed: {new Date(rx.prescription_date).toLocaleDateString()} by{' '}
                  {rx.prescriber_first_name} {rx.prescriber_last_name}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
