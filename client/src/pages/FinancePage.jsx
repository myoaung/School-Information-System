import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function FinancePage() {
  const { user, isAdmin } = useAuth();
  const [tab, setTab] = useState(isAdmin ? 'overview' : 'myfees');
  const [overview, setOverview] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [form, setForm] = useState({ student_id: '', amount: '', fee_structure_id: '', due_date: '' });
  const [payForm, setPayForm] = useState({ amount: '', payment_method: 'cash', reference: '' });

  useEffect(() => {
    if (isAdmin) {
      api.get('/finance/overview').then(r => setOverview(r.data)).catch(() => {});
      api.get('/students').then(r => setStudents(r.data.students || [])).catch(() => {});
      api.get('/finance/fees').then(r => setFees(r.data)).catch(() => {});
    }
    api.get('/finance/invoices').then(r => setInvoices(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadInvoiceDetail = async (id) => {
    try {
      const r = await api.get(`/finance/invoices/${id}`);
      setInvoiceDetail(r.data);
      setSelectedInvoice(id);
    } catch {}
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/invoices', form);
      setShowInvoiceModal(false);
      setForm({ student_id: '', amount: '', fee_structure_id: '', due_date: '' });
      const r = await api.get('/finance/invoices');
      setInvoices(r.data);
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/payments', { ...payForm, invoice_id: selectedInvoice });
      setShowPaymentModal(false);
      setPayForm({ amount: '', payment_method: 'cash', reference: '' });
      loadInvoiceDetail(selectedInvoice);
      const r = await api.get('/finance/invoices');
      setInvoices(r.data);
      if (isAdmin) {
        const o = await api.get('/finance/overview');
        setOverview(o.data);
      }
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const formatCurrency = (n) => new Intl.NumberFormat().format(n) + ' MMK';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">Finance</h1>
          <p className="text-purple-600/60 dark:text-purple-300/60 mt-1">{isAdmin ? 'Manage fees, invoices and payments' : 'View your fees and payments'}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowInvoiceModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 cursor-pointer">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            New Invoice
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-purple-100/50 dark:bg-gray-800/50 rounded-xl p-1 overflow-x-auto">
        {(isAdmin ? ['overview', 'invoices', 'fees'] : ['myfees']).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer capitalize whitespace-nowrap ${
              tab === t ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-sm' : 'text-purple-600 dark:text-purple-400 hover:text-purple-800'
            }`}>{t === 'myfees' ? 'My Fees' : t}</button>
        ))}
      </div>

      {/* Admin Overview */}
      {tab === 'overview' && overview && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Invoiced" value={formatCurrency(overview.totalInvoiced)} color="purple" />
            <StatCard label="Paid" value={formatCurrency(overview.totalPaid)} color="green" />
            <StatCard label="Pending" value={formatCurrency(overview.totalPending)} color="orange" />
            <StatCard label="Overdue" value={formatCurrency(overview.totalOverdue)} color="red" />
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
            <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-4">Recent Payments</h3>
            <div className="space-y-2">
              {overview.recentPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-purple-50 dark:bg-gray-800 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100">{p.student_name}</p>
                    <p className="text-xs text-purple-500 dark:text-purple-400">{p.payment_method} • {p.reference || 'No ref'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(p.amount)}</p>
                    <p className="text-xs text-purple-400">{new Date(p.paid_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {!overview.recentPayments.length && <p className="text-sm text-purple-400 text-center py-4">No payments yet</p>}
            </div>
          </div>
        </>
      )}

      {/* Invoices */}
      {(tab === 'invoices' || tab === 'myfees') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-2 max-h-[600px] overflow-y-auto">
            {loading ? <div className="animate-pulse space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-purple-200 dark:bg-gray-700 rounded-xl" />)}</div> :
              invoices.map(inv => (
                <button key={inv.id} onClick={() => loadInvoiceDetail(inv.id)}
                  className={`w-full text-left p-4 rounded-xl transition-all cursor-pointer ${
                    selectedInvoice === inv.id ? 'bg-purple-100 dark:bg-purple-900/50 border-2 border-purple-300 dark:border-purple-700' : 'bg-white dark:bg-gray-800 border-2 border-transparent hover:bg-purple-50 dark:hover:bg-gray-700'
                  }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">INV-#{inv.id}</span>
                    <StatusBadge status={inv.status} />
                  </div>
                  <p className="text-xs text-purple-500 dark:text-purple-400">{inv.student_name || `Student #${inv.student_id}`}</p>
                  <p className="text-sm font-bold text-purple-700 dark:text-purple-300 mt-1">{formatCurrency(inv.amount)}</p>
                </button>
              ))
            }
            {!loading && !invoices.length && <p className="text-sm text-purple-400 text-center py-8">No invoices</p>}
          </div>

          <div className="md:col-span-2">
            {invoiceDetail ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100">Invoice INV-#{invoiceDetail.id}</h3>
                    <p className="text-sm text-purple-500 dark:text-purple-400">{invoiceDetail.student_name} • {invoiceDetail.student_code}</p>
                  </div>
                  <StatusBadge status={invoiceDetail.status} />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-purple-50 dark:bg-gray-800 rounded-xl">
                    <p className="text-xs text-purple-500 dark:text-purple-400">Amount</p>
                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{formatCurrency(invoiceDetail.amount)}</p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-gray-800 rounded-xl">
                    <p className="text-xs text-purple-500 dark:text-purple-400">Due Date</p>
                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{invoiceDetail.due_date || '—'}</p>
                  </div>
                  {invoiceDetail.fee_type && (
                    <div className="p-3 bg-purple-50 dark:bg-gray-800 rounded-xl">
                      <p className="text-xs text-purple-500 dark:text-purple-400">Fee Type</p>
                      <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{invoiceDetail.fee_type}</p>
                    </div>
                  )}
                  <div className="p-3 bg-purple-50 dark:bg-gray-800 rounded-xl">
                    <p className="text-xs text-purple-500 dark:text-purple-400">Paid</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(invoiceDetail.payments?.reduce((s, p) => s + p.amount, 0) || 0)}
                    </p>
                  </div>
                </div>
                {isAdmin && invoiceDetail.status !== 'paid' && (
                  <button onClick={() => setShowPaymentModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm cursor-pointer mb-4">
                    Record Payment
                  </button>
                )}
                <h4 className="font-bold text-purple-900 dark:text-purple-100 mb-3">Payment History</h4>
                <div className="space-y-2">
                  {invoiceDetail.payments?.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100">{p.payment_method || 'Payment'}</p>
                        <p className="text-xs text-purple-500">{p.reference || 'No reference'} • {new Date(p.paid_at).toLocaleString()}</p>
                      </div>
                      <p className="text-sm font-bold text-green-600">{formatCurrency(p.amount)}</p>
                    </div>
                  ))}
                  {!invoiceDetail.payments?.length && <p className="text-sm text-purple-400 text-center py-4">No payments recorded</p>}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-12 text-center">
                <svg className="w-16 h-16 text-purple-200 dark:text-purple-800 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                <p className="text-purple-400">Select an invoice to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fee Structures */}
      {tab === 'fees' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-purple-50 dark:bg-gray-800">
              <th className="px-4 py-3 text-left text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Fee Type</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Grade</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Academic Year</th>
            </tr></thead>
            <tbody>{fees.map(f => (
              <tr key={f.id} className="border-t border-purple-50 dark:border-gray-800">
                <td className="px-4 py-3 text-sm font-medium text-purple-900 dark:text-purple-100">{f.fee_type}</td>
                <td className="px-4 py-3 text-sm text-purple-700 dark:text-purple-300">{f.grade_name || 'All Grades'}</td>
                <td className="px-4 py-3 text-sm text-right font-bold text-purple-700 dark:text-purple-300">{formatCurrency(f.amount)}</td>
                <td className="px-4 py-3 text-sm text-purple-500 dark:text-purple-400">{f.academic_year_name || '—'}</td>
              </tr>
            ))}</tbody>
          </table>
          {!fees.length && <p className="p-6 text-center text-sm text-purple-400">No fee structures defined</p>}
        </div>
      )}

      {/* Create Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">Create Invoice</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="p-1 hover:bg-purple-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Student</label>
                <select value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})} required
                  className="w-full px-3 py-2 bg-purple-50 dark:bg-gray-700 border border-purple-200 dark:border-gray-600 rounded-lg text-sm text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="">Select student...</option>
                  {students.map(s => <option key={s.user_id || s.id} value={s.user_id || s.id}>{s.name} ({s.student_id})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Fee Structure (optional)</label>
                <select value={form.fee_structure_id} onChange={e => {
                  const fee = fees.find(f => f.id === parseInt(e.target.value));
                  setForm({...form, fee_structure_id: e.target.value, amount: fee ? String(fee.amount) : form.amount});
                }}
                  className="w-full px-3 py-2 bg-purple-50 dark:bg-gray-700 border border-purple-200 dark:border-gray-600 rounded-lg text-sm text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="">Custom amount...</option>
                  {fees.map(f => <option key={f.id} value={f.id}>{f.fee_type} - {f.grade_name || 'All'} ({formatCurrency(f.amount)})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Amount (MMK)</label>
                <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required
                  className="w-full px-3 py-2 bg-purple-50 dark:bg-gray-700 border border-purple-200 dark:border-gray-600 rounded-lg text-sm text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
                  className="w-full px-3 py-2 bg-purple-50 dark:bg-gray-700 border border-purple-200 dark:border-gray-600 rounded-lg text-sm text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowInvoiceModal(false)} className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg cursor-pointer">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-purple-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handlePayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Amount (MMK)</label>
                <input type="number" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} required
                  className="w-full px-3 py-2 bg-purple-50 dark:bg-gray-700 border border-purple-200 dark:border-gray-600 rounded-lg text-sm text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Payment Method</label>
                <select value={payForm.payment_method} onChange={e => setPayForm({...payForm, payment_method: e.target.value})}
                  className="w-full px-3 py-2 bg-purple-50 dark:bg-gray-700 border border-purple-200 dark:border-gray-600 rounded-lg text-sm text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_pay">Mobile Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Reference</label>
                <input type="text" value={payForm.reference} onChange={e => setPayForm({...payForm, reference: e.target.value})}
                  className="w-full px-3 py-2 bg-purple-50 dark:bg-gray-700 border border-purple-200 dark:border-gray-600 rounded-lg text-sm text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Optional reference" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg cursor-pointer">Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
    green: 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300',
    orange: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300',
    red: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300',
  };
  return (
    <div className={`rounded-2xl shadow-md p-4 text-center ${colors[color] || colors.purple}`}>
      <p className="text-lg md:text-xl font-bold">{value}</p>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300',
    paid: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300',
    overdue: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300',
    cancelled: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || styles.pending}`}>{status}</span>;
}
