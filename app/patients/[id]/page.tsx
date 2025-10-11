'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Patient {
  id: number;
  patient_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  blood_type: string;
  allergies: string;
  chronic_conditions: string;
  current_medications: string;
  insurance_provider: string;
  insurance_policy_number: string;
  occupation: string;
  marital_status: string;
  created_at: string;
  updated_at: string;
}

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchPatient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPatient = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/patients/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch patient');
      }

      const data = await response.json();
      setPatient(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading patient details...</p>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
            {error || 'Patient not found'}
          </div>
          <Link href="/patients" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
            ← Back to Patients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="text-gray-600">Patient #{patient.patient_number}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/patients/${patient.id}/chart`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              📋 Medical Chart
            </Link>
            <Link
              href="/patients"
              className="px-4 py-2 text-blue-600 hover:text-blue-800"
            >
              ← Back to Patients
            </Link>
          </div>
        </div>

        {/* Patient Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Age</p>
            <p className="text-2xl font-bold">{calculateAge(patient.date_of_birth)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Gender</p>
            <p className="text-2xl font-bold capitalize">{patient.gender}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Blood Type</p>
            <p className="text-2xl font-bold">{patient.blood_type || 'N/A'}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Marital Status</p>
            <p className="text-2xl font-bold capitalize">{patient.marital_status || 'N/A'}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Personal Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Date of Birth</p>
                <p className="font-medium">{formatDate(patient.date_of_birth)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{patient.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{patient.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Occupation</p>
                <p className="font-medium">{patient.occupation || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Address</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Street Address</p>
                <p className="font-medium">{patient.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">City</p>
                <p className="font-medium">{patient.city || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">State / Postal Code</p>
                <p className="font-medium">
                  {patient.state || 'N/A'} {patient.postal_code || ''}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Country</p>
                <p className="font-medium">{patient.country || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Emergency Contact</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{patient.emergency_contact_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{patient.emergency_contact_phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Relationship</p>
                <p className="font-medium">{patient.emergency_contact_relationship || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Insurance Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Provider</p>
                <p className="font-medium">{patient.insurance_provider || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Policy Number</p>
                <p className="font-medium">{patient.insurance_policy_number || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">Medical Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1">Allergies</p>
                <p className="text-gray-800">
                  {patient.allergies || 'No known allergies'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1">Chronic Conditions</p>
                <p className="text-gray-800">
                  {patient.chronic_conditions || 'No chronic conditions recorded'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1">Current Medications</p>
                <p className="text-gray-800">
                  {patient.current_medications || 'No current medications'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Medical History Section */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Medical History</h2>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              + Add Visit
            </button>
          </div>
          <div className="text-center py-8 text-gray-500">
            <p>No medical visits recorded yet</p>
            <p className="text-sm mt-2">Click &quot;Add Visit&quot; to record the first visit</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={() => router.push(`/patients/${patient.id}/edit`)}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit Patient
          </button>
        </div>
      </div>
    </div>
  );
}
