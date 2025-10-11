'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, BeakerIcon, CameraIcon } from '@heroicons/react/24/outline';

interface LabOrder {
  id: number;
  order_number: string;
  test_name: string;
  status: string;
  ordered_at: string;
  priority: string;
}

interface ImagingOrder {
  id: number;
  order_number: string;
  study_name: string;
  modality: string;
  status: string;
  ordered_at: string;
  priority: string;
}

interface LabTest {
  id: number;
  test_code: string;
  test_name: string;
  specimen_type: string;
}

interface ImagingStudy {
  id: number;
  study_code: string;
  study_name: string;
  modality: string;
}

export default function LabsImagingTab({ patientId }: { patientId: string }) {
  const [activeSection, setActiveSection] = useState<'labs' | 'imaging'>('labs');
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [imagingOrders, setImagingOrders] = useState<ImagingOrder[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [imagingStudies, setImagingStudies] = useState<ImagingStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLabForm, setShowLabForm] = useState(false);
  const [showImagingForm, setShowImagingForm] = useState(false);

  const [labFormData, setLabFormData] = useState({
    testId: '',
    priority: 'routine',
    clinicalIndication: ''
  });

  const [imagingFormData, setImagingFormData] = useState({
    studyId: '',
    priority: 'routine',
    clinicalIndication: ''
  });

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch lab orders
      const labRes = await fetch(`/api/lab-orders?patientId=${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (labRes.ok) setLabOrders(await labRes.json());

      // Fetch imaging orders
      const imgRes = await fetch(`/api/imaging-orders?patientId=${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (imgRes.ok) setImagingOrders(await imgRes.json());

      // Fetch lab catalog
      const labCatRes = await fetch('/api/lab-imaging-catalog?type=lab', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (labCatRes.ok) setLabTests(await labCatRes.json());

      // Fetch imaging catalog
      const imgCatRes = await fetch('/api/lab-imaging-catalog?type=imaging', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (imgCatRes.ok) setImagingStudies(await imgCatRes.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/lab-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: parseInt(patientId),
          testId: parseInt(labFormData.testId),
          priority: labFormData.priority,
          clinicalIndication: labFormData.clinicalIndication
        })
      });

      if (response.ok) {
        await fetchData();
        setShowLabForm(false);
        setLabFormData({ testId: '', priority: 'routine', clinicalIndication: '' });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleImagingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/imaging-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: parseInt(patientId),
          studyId: parseInt(imagingFormData.studyId),
          priority: imagingFormData.priority,
          clinicalIndication: imagingFormData.clinicalIndication
        })
      });

      if (response.ok) {
        await fetchData();
        setShowImagingForm(false);
        setImagingFormData({ studyId: '', priority: 'routine', clinicalIndication: '' });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'ordered': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'stat': return 'bg-red-100 text-red-800';
      case 'urgent': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveSection('labs')}
          className={`px-4 py-2 font-medium border-b-2 ${
            activeSection === 'labs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600'
          }`}
        >
          Laboratory ({labOrders.length})
        </button>
        <button
          onClick={() => setActiveSection('imaging')}
          className={`px-4 py-2 font-medium border-b-2 ${
            activeSection === 'imaging'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600'
          }`}
        >
          Imaging ({imagingOrders.length})
        </button>
      </div>

      {/* Laboratory Section */}
      {activeSection === 'labs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Laboratory Orders</h3>
            <button
              onClick={() => setShowLabForm(!showLabForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5" />
              Order Lab
            </button>
          </div>

          {showLabForm && (
            <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
              <form onSubmit={handleLabSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lab Test *</label>
                    <select
                      value={labFormData.testId}
                      onChange={(e) => setLabFormData({ ...labFormData, testId: e.target.value })}
                      required
                      className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                    >
                      <option value="">Select test</option>
                      {labTests.map((test) => (
                        <option key={test.id} value={test.id}>
                          {test.test_name} ({test.test_code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={labFormData.priority}
                      onChange={(e) => setLabFormData({ ...labFormData, priority: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                    >
                      <option value="routine">Routine</option>
                      <option value="urgent">Urgent</option>
                      <option value="stat">STAT</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Indication</label>
                  <textarea
                    value={labFormData.clinicalIndication}
                    onChange={(e) => setLabFormData({ ...labFormData, clinicalIndication: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Order Lab
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLabForm(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-3">
            {labOrders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border">
                <BeakerIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No lab orders</p>
              </div>
            ) : (
              labOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl p-6 border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900">{order.test_name}</h4>
                      <p className="text-sm text-gray-600">{order.order_number}</p>
                      <p className="text-sm text-gray-600">
                        Ordered: {new Date(order.ordered_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      {order.priority !== 'routine' && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(order.priority)}`}>
                          {order.priority}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Imaging Section */}
      {activeSection === 'imaging' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Imaging Orders</h3>
            <button
              onClick={() => setShowImagingForm(!showImagingForm)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <PlusIcon className="w-5 h-5" />
              Order Imaging
            </button>
          </div>

          {showImagingForm && (
            <div className="bg-white rounded-xl border-2 border-purple-200 p-6">
              <form onSubmit={handleImagingSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imaging Study *</label>
                    <select
                      value={imagingFormData.studyId}
                      onChange={(e) => setImagingFormData({ ...imagingFormData, studyId: e.target.value })}
                      required
                      className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                    >
                      <option value="">Select study</option>
                      {imagingStudies.map((study) => (
                        <option key={study.id} value={study.id}>
                          {study.study_name} ({study.modality})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={imagingFormData.priority}
                      onChange={(e) => setImagingFormData({ ...imagingFormData, priority: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                    >
                      <option value="routine">Routine</option>
                      <option value="urgent">Urgent</option>
                      <option value="stat">STAT</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Indication *</label>
                  <textarea
                    value={imagingFormData.clinicalIndication}
                    onChange={(e) => setImagingFormData({ ...imagingFormData, clinicalIndication: e.target.value })}
                    required
                    rows={2}
                    placeholder="Required for imaging orders"
                    className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    Order Imaging
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImagingForm(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-3">
            {imagingOrders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border">
                <CameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No imaging orders</p>
              </div>
            ) : (
              imagingOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl p-6 border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900">{order.study_name}</h4>
                      <p className="text-sm text-gray-600">{order.order_number} • {order.modality}</p>
                      <p className="text-sm text-gray-600">
                        Ordered: {new Date(order.ordered_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      {order.priority !== 'routine' && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(order.priority)}`}>
                          {order.priority}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
