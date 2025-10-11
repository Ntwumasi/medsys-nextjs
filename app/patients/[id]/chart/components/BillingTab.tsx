'use client';

import { useState, useEffect } from 'react';
import {
  PlusIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

interface Invoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  total_amount: number;
  amount_paid: number;
  balance: number;
  status: string;
}

interface Payment {
  id: number;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  invoice_number: string;
}

interface Claim {
  id: number;
  claim_number: string;
  insurance_company: string;
  claim_date: string;
  total_charged: number;
  amount_approved: number | null;
  amount_paid: number | null;
  status: string;
}

interface CPTCode {
  id: number;
  code: string;
  description: string;
  base_price: number;
}

interface BillingTabProps {
  patientId: string;
}

export default function BillingTab({ patientId }: BillingTabProps) {
  const [activeSection, setActiveSection] = useState<'invoices' | 'payments' | 'claims'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [cptCodes, setCptCodes] = useState<CPTCode[]>([]);
  const [loading, setLoading] = useState(true);

  // Invoice form state
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState([
    { cptCodeId: null, description: '', quantity: 1, unitPrice: 0 }
  ]);
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    invoiceId: '',
    amount: '',
    paymentMethod: 'Cash',
    referenceNumber: '',
    notes: ''
  });

  // Claim form state
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimData, setClaimData] = useState({
    insuranceCompany: '',
    policyNumber: '',
    groupNumber: '',
    serviceDate: '',
    diagnosisCodes: [''],
    procedureCodes: [''],
    totalCharged: '',
    notes: ''
  });

  useEffect(() => {
    fetchBillingData();
    fetchCPTCodes();
  }, [patientId]);

  const fetchBillingData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch invoices
      const invoicesRes = await fetch(`/api/invoices?patientId=${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        setInvoices(data);
      }

      // Fetch payments
      const paymentsRes = await fetch(`/api/payments?patientId=${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        setPayments(data);
      }

      // Fetch claims
      const claimsRes = await fetch(`/api/claims?patientId=${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (claimsRes.ok) {
        const data = await claimsRes.json();
        setClaims(data);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCPTCodes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/billing-codes?type=cpt', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCptCodes(data);
      }
    } catch (error) {
      console.error('Error fetching CPT codes:', error);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: parseInt(patientId),
          items: invoiceItems,
          notes: invoiceNotes
        })
      });

      if (response.ok) {
        await fetchBillingData();
        setShowInvoiceForm(false);
        setInvoiceItems([{ cptCodeId: null, description: '', quantity: 1, unitPrice: 0 }]);
        setInvoiceNotes('');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...paymentData,
          patientId: parseInt(patientId),
          amount: parseFloat(paymentData.amount)
        })
      });

      if (response.ok) {
        await fetchBillingData();
        setShowPaymentForm(false);
        setPaymentData({
          invoiceId: '',
          amount: '',
          paymentMethod: 'Cash',
          referenceNumber: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: parseInt(patientId),
          ...claimData,
          totalCharged: parseFloat(claimData.totalCharged)
        })
      });

      if (response.ok) {
        await fetchBillingData();
        setShowClaimForm(false);
        setClaimData({
          insuranceCompany: '',
          policyNumber: '',
          groupNumber: '',
          serviceDate: '',
          diagnosisCodes: [''],
          procedureCodes: [''],
          totalCharged: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
    }
  };

  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { cptCodeId: null, description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const updateInvoiceItem = (index: number, field: string, value: string | number | null) => {
    const newItems = [...invoiceItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setInvoiceItems(newItems);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'denied': return 'bg-red-100 text-red-800';
      case 'submitted': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading billing information...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveSection('invoices')}
          className={`px-4 py-2 font-medium transition border-b-2 ${
            activeSection === 'invoices'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveSection('payments')}
          className={`px-4 py-2 font-medium transition border-b-2 ${
            activeSection === 'payments'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Payments ({payments.length})
        </button>
        <button
          onClick={() => setActiveSection('claims')}
          className={`px-4 py-2 font-medium transition border-b-2 ${
            activeSection === 'claims'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Insurance Claims ({claims.length})
        </button>
      </div>

      {/* Invoices Section */}
      {activeSection === 'invoices' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Patient Invoices</h3>
            <button
              onClick={() => setShowInvoiceForm(!showInvoiceForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <PlusIcon className="w-5 h-5" />
              New Invoice
            </button>
          </div>

          {showInvoiceForm && (
            <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Create Invoice</h4>
              <form onSubmit={handleCreateInvoice} className="space-y-4">
                {invoiceItems.map((item, index) => (
                  <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CPT Code</label>
                        <select
                          value={item.cptCodeId || ''}
                          onChange={(e) => {
                            const code = cptCodes.find(c => c.id === parseInt(e.target.value));
                            updateInvoiceItem(index, 'cptCodeId', e.target.value ? parseInt(e.target.value) : null);
                            if (code) {
                              updateInvoiceItem(index, 'description', code.description);
                              updateInvoiceItem(index, 'unitPrice', code.base_price);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                        >
                          <option value="">Select code</option>
                          {cptCodes.map((code) => (
                            <option key={code.id} value={code.id}>
                              {code.code} - ${code.base_price}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value))}
                          min="1"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateInvoiceItem(index, 'unitPrice', parseFloat(e.target.value))}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                        />
                      </div>
                    </div>
                    {invoiceItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInvoiceItem(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addInvoiceItem}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add Line Item
                </button>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={invoiceNotes}
                    onChange={(e) => setInvoiceNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Create Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInvoiceForm(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-3">
            {invoices.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No invoices found</p>
              </div>
            ) : (
              invoices.map((invoice) => (
                <div key={invoice.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{invoice.invoice_number}</h4>
                      <p className="text-sm text-gray-600">
                        Date: {new Date(invoice.invoice_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Total Amount</p>
                      <p className="text-lg font-bold text-gray-900">${invoice.total_amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Amount Paid</p>
                      <p className="text-lg font-bold text-green-600">${invoice.amount_paid.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Balance Due</p>
                      <p className="text-lg font-bold text-red-600">${invoice.balance.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Payments Section */}
      {activeSection === 'payments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Payment History</h3>
            <button
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <CreditCardIcon className="w-5 h-5" />
              Record Payment
            </button>
          </div>

          {showPaymentForm && (
            <div className="bg-white rounded-xl border-2 border-green-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Record Payment</h4>
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice</label>
                    <select
                      value={paymentData.invoiceId}
                      onChange={(e) => setPaymentData({ ...paymentData, invoiceId: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                    >
                      <option value="">Select invoice</option>
                      {invoices.filter(inv => inv.balance > 0).map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoice_number} - Balance: ${inv.balance.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                      value={paymentData.paymentMethod}
                      onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Check">Check</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Insurance">Insurance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                    <input
                      type="text"
                      value={paymentData.referenceNumber}
                      onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
                      placeholder="Check #, Transaction ID, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Record Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-3">
            {payments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No payments recorded</p>
              </div>
            ) : (
              payments.map((payment) => (
                <div key={payment.id} className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900">{payment.payment_number}</h4>
                      <p className="text-sm text-gray-600">Invoice: {payment.invoice_number}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.payment_date).toLocaleDateString()} • {payment.payment_method}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">${payment.amount.toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Claims Section */}
      {activeSection === 'claims' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Insurance Claims</h3>
            <button
              onClick={() => setShowClaimForm(!showClaimForm)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <ClipboardDocumentCheckIcon className="w-5 h-5" />
              New Claim
            </button>
          </div>

          {showClaimForm && (
            <div className="bg-white rounded-xl border-2 border-purple-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Submit Insurance Claim</h4>
              <form onSubmit={handleSubmitClaim} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Company *</label>
                    <input
                      type="text"
                      value={claimData.insuranceCompany}
                      onChange={(e) => setClaimData({ ...claimData, insuranceCompany: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number *</label>
                    <input
                      type="text"
                      value={claimData.policyNumber}
                      onChange={(e) => setClaimData({ ...claimData, policyNumber: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Group Number</label>
                    <input
                      type="text"
                      value={claimData.groupNumber}
                      onChange={(e) => setClaimData({ ...claimData, groupNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Date *</label>
                    <input
                      type="date"
                      value={claimData.serviceDate}
                      onChange={(e) => setClaimData({ ...claimData, serviceDate: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Charged ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={claimData.totalCharged}
                      onChange={(e) => setClaimData({ ...claimData, totalCharged: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={claimData.notes}
                    onChange={(e) => setClaimData({ ...claimData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    Submit Claim
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClaimForm(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-3">
            {claims.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <ClipboardDocumentCheckIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No insurance claims submitted</p>
              </div>
            ) : (
              claims.map((claim) => (
                <div key={claim.id} className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{claim.claim_number}</h4>
                      <p className="text-sm text-gray-600">{claim.insurance_company}</p>
                      <p className="text-sm text-gray-600">
                        Filed: {new Date(claim.claim_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(claim.status)}`}>
                      {claim.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Charged</p>
                      <p className="font-bold text-gray-900">${claim.total_charged.toFixed(2)}</p>
                    </div>
                    {claim.amount_approved !== null && (
                      <div>
                        <p className="text-xs text-gray-600">Approved</p>
                        <p className="font-bold text-blue-600">${claim.amount_approved.toFixed(2)}</p>
                      </div>
                    )}
                    {claim.amount_paid !== null && (
                      <div>
                        <p className="text-xs text-gray-600">Paid</p>
                        <p className="font-bold text-green-600">${claim.amount_paid.toFixed(2)}</p>
                      </div>
                    )}
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
