'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  HeartIcon,
  DocumentTextIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  ArrowLeftIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import VitalSignsTab from './components/VitalSignsTab';
import AllergiesTab from './components/AllergiesTab';
import PrescriptionsTab from './components/PrescriptionsTab';
import EncountersTab from './components/EncountersTab';
import BillingTab from './components/BillingTab';

interface Patient {
  id: number;
  patient_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string;
}

type Tab = 'overview' | 'vitals' | 'encounters' | 'allergies' | 'medications' | 'billing' | 'history' | 'diagnoses';

export default function PatientChartPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchPatient();
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/patients/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPatient(data);
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <p className="text-gray-600">Loading patient chart...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Patient not found</p>
          <Link href="/patients" className="text-blue-600 hover:text-blue-800">
            Back to Patients
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ClipboardDocumentListIcon },
    { id: 'vitals', name: 'Vital Signs', icon: HeartIcon },
    { id: 'encounters', name: 'Encounters', icon: DocumentTextIcon },
    { id: 'allergies', name: 'Allergies', icon: BeakerIcon },
    { id: 'medications', name: 'Medications', icon: BeakerIcon },
    { id: 'billing', name: 'Billing', icon: CurrencyDollarIcon },
    { id: 'history', name: 'History', icon: ClipboardDocumentListIcon },
    { id: 'diagnoses', name: 'Diagnoses', icon: ClipboardDocumentListIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/patients')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {patient.first_name} {patient.last_name}
                </h1>
                <p className="text-sm text-gray-600">
                  #{patient.patient_number} • {getAge(patient.date_of_birth)}y • {patient.gender}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/patients/${patientId}/chart/encounter/new`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="hidden sm:inline">New Encounter</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Demographics */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Demographics</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="font-medium text-gray-900">
                    {new Date(patient.date_of_birth).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gender</p>
                  <p className="font-medium text-gray-900">{patient.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{patient.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{patient.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab('vitals')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition text-left"
                >
                  <HeartIcon className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Record Vitals</p>
                </button>
                <button
                  onClick={() => setActiveTab('encounters')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition text-left"
                >
                  <DocumentTextIcon className="w-6 h-6 text-green-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">New Note</p>
                </button>
                <button
                  onClick={() => setActiveTab('allergies')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition text-left"
                >
                  <BeakerIcon className="w-6 h-6 text-red-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Add Allergy</p>
                </button>
                <button
                  onClick={() => setActiveTab('medications')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition text-left"
                >
                  <BeakerIcon className="w-6 h-6 text-purple-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Prescribe</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vitals' && <VitalSignsTab patientId={patientId} />}

        {activeTab === 'encounters' && <EncountersTab patientId={patientId} />}

        {activeTab === 'allergies' && <AllergiesTab patientId={patientId} />}

        {activeTab === 'medications' && <PrescriptionsTab patientId={patientId} />}

        {activeTab === 'billing' && <BillingTab patientId={patientId} />}

        {(activeTab === 'history' || activeTab === 'diagnoses') && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} module coming soon...
              </p>
              <p className="text-sm text-gray-500">
                This section will display and manage {activeTab} data
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
