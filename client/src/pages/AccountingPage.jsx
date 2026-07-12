import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { toast } from 'sonner';

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'];

const ACCOUNT_TYPE_COLORS = {
  asset: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  liability: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  equity: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  revenue: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  expense: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
};

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  posted: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  reversed: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  reconciled: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
};

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState('accounts');
  const [accounts, setAccounts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reports state
  const [trialBalance, setTrialBalance] = useState(null);
  const [incomeStatement, setIncomeStatement] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [reportType, setReportType] = useState('trial-balance');

  // Modals
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showReconModal, setShowReconModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgerAccount, setLedgerAccount] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);

  // Forms
  const [accountForm, setAccountForm] = useState({
    code: '',
    name: '',
    type: 'asset',
    description: '',
  });
  const [periodForm, setPeriodForm] = useState({ name: '', start_date: '', end_date: '' });
  const [entryForm, setEntryForm] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    lines: [
      { account_id: '', debit: '', credit: '', description: '' },
      { account_id: '', debit: '', credit: '', description: '' },
    ],
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'accounts') {
        const res = await api.get('/accounting/accounts');
        setAccounts(res.data.accounts);
      } else if (activeTab === 'journal') {
        const res = await api.get('/accounting/journal');
        setEntries(res.data.entries);
      } else if (activeTab === 'reports') {
        fetchReport();
      } else if (activeTab === 'reconciliation') {
        const res = await api.get('/accounting/reconciliation');
        setReconciliations(res.data.reconciliations);
      }
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      if (reportType === 'trial-balance') {
        const res = await api.get('/accounting/trial-balance');
        setTrialBalance(res.data);
      } else if (reportType === 'income-statement') {
        const res = await api.get('/accounting/income-statement');
        setIncomeStatement(res.data);
      } else if (reportType === 'balance-sheet') {
        const res = await api.get('/accounting/balance-sheet');
        setBalanceSheet(res.data);
      }
    } catch (err) {
      toast.error('Failed to load report');
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') fetchReport();
  }, [reportType]);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/accounting/accounts', accountForm);
      toast.success('Account created');
      setShowAccountModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Validate debits = credits
      const totalDebit = entryForm.lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
      const totalCredit = entryForm.lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        toast.error(`Debits (${totalDebit}) must equal credits (${totalCredit})`);
        setSaving(false);
        return;
      }

      // Filter out empty lines
      const lines = entryForm.lines.filter(
        (l) => l.account_id && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0)
      );

      if (lines.length < 2) {
        toast.error('At least 2 lines required');
        setSaving(false);
        return;
      }

      await api.post('/accounting/journal', { ...entryForm, lines });
      toast.success('Journal entry created');
      setShowEntryModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create entry');
    } finally {
      setSaving(false);
    }
  };

  const handlePostEntry = async (id) => {
    try {
      await api.put(`/accounting/journal/${id}/post`);
      toast.success('Entry posted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post entry');
    }
  };

  const handleReverseEntry = async (id) => {
    const reason = prompt('Reason for reversal:');
    if (reason === null) return;
    try {
      await api.put(`/accounting/journal/${id}/reverse`, { reason });
      toast.success('Entry reversed');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reverse entry');
    }
  };

  const handleCreatePeriod = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/accounting/periods', periodForm);
      toast.success('Period created');
      setShowPeriodModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create period');
    } finally {
      setSaving(false);
    }
  };

  const handleClosePeriod = async (id) => {
    if (!confirm('Close this accounting period? This will create closing entries.')) return;
    try {
      const res = await api.put(`/accounting/periods/${id}/close`);
      toast.success(`Period closed. Net income: ${formatMoney(res.data.net_income)} MMK`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to close period');
    }
  };

  const handleViewLedger = async (account) => {
    setLedgerAccount(account);
    try {
      const res = await api.get(`/accounting/ledger/${account.id}`);
      setLedgerData(res.data);
      setShowLedgerModal(true);
    } catch (err) {
      toast.error('Failed to load ledger');
    }
  };

  const formatMoney = (amount) => {
    if (amount === null || amount === undefined) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const addLine = () => {
    setEntryForm({
      ...entryForm,
      lines: [...entryForm.lines, { account_id: '', debit: '', credit: '', description: '' }],
    });
  };

  const removeLine = (index) => {
    if (entryForm.lines.length <= 2) return;
    setEntryForm({
      ...entryForm,
      lines: entryForm.lines.filter((_, i) => i !== index),
    });
  };

  const updateLine = (index, field, value) => {
    const lines = [...entryForm.lines];
    lines[index] = { ...lines[index], [field]: value };
    setEntryForm({ ...entryForm, lines });
  };

  const totalDebit = entryForm.lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredit = entryForm.lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);

  const tabs = [
    { id: 'accounts', label: 'Chart of Accounts', icon: '📒' },
    { id: 'journal', label: 'Journal Entries', icon: '📝' },
    { id: 'reports', label: 'Reports', icon: '📊' },
    { id: 'reconciliation', label: 'Bank Reconciliation', icon: '🏦' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 7V4h16v3M9 20h6M12 4v16" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
            Accounting
          </h1>
        </div>
        <div className="flex gap-2">
          {activeTab === 'accounts' && (
            <button
              onClick={() => setShowAccountModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              + New Account
            </button>
          )}
          {activeTab === 'journal' && (
            <button
              onClick={() => setShowEntryModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              + New Entry
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart of Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          {accounts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-left">
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Balance</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50 dark:divide-indigo-900">
                  {accounts.map((a) => (
                    <tr key={a.id} className="hover:bg-indigo-50/50">
                      <td className="px-4 py-3 font-mono text-indigo-900 dark:text-indigo-100">
                        {a.code}
                      </td>
                      <td className="px-4 py-3 font-medium text-indigo-900 dark:text-indigo-100">
                        {a.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${ACCOUNT_TYPE_COLORS[a.type]}`}
                        >
                          {a.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <span className={a.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatMoney(a.balance)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${a.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {a.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleViewLedger(a)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                        >
                          Ledger
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📒</div>
              <p className="text-lg font-medium text-purple-900 dark:text-purple-100 mb-2">
                No Accounts
              </p>
              <p className="text-purple-500 mb-4">
                Run the migration to seed the default chart of accounts.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Journal Entries Tab */}
      {activeTab === 'journal' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          {entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-left">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Debit</th>
                    <th className="px-4 py-3 font-medium">Credit</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50 dark:divide-indigo-900">
                  {entries.map((e) => (
                    <tr key={e.id} className="hover:bg-indigo-50/50">
                      <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400">
                        {e.entry_date}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-indigo-900 dark:text-indigo-100">
                        {e.reference || '—'}
                      </td>
                      <td className="px-4 py-3 text-indigo-900 dark:text-indigo-100 max-w-xs truncate">
                        {e.description}
                      </td>
                      <td className="px-4 py-3 font-medium text-indigo-600">
                        {formatMoney(e.total_debit)}
                      </td>
                      <td className="px-4 py-3 font-medium text-indigo-600">
                        {formatMoney(e.total_credit)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[e.status]}`}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {e.status === 'draft' && (
                            <button
                              onClick={() => handlePostEntry(e.id)}
                              className="text-xs text-green-600 hover:text-green-800 font-medium cursor-pointer"
                            >
                              Post
                            </button>
                          )}
                          {e.status === 'posted' && (
                            <button
                              onClick={() => handleReverseEntry(e.id)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer"
                            >
                              Reverse
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-lg font-medium text-purple-900 dark:text-purple-100 mb-2">
                No Journal Entries
              </p>
              <p className="text-purple-500 mb-4">
                Create your first journal entry to start bookkeeping.
              </p>
              <button
                onClick={() => setShowEntryModal(true)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 cursor-pointer"
              >
                + New Entry
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div>
          {/* Report Type Selector */}
          <div className="flex gap-2 mb-6">
            {['trial-balance', 'income-statement', 'balance-sheet'].map((type) => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  reportType === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                {type === 'trial-balance'
                  ? 'Trial Balance'
                  : type === 'income-statement'
                    ? 'Income Statement'
                    : 'Balance Sheet'}
              </button>
            ))}
          </div>

          {/* Trial Balance */}
          {reportType === 'trial-balance' && trialBalance && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-indigo-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  Trial Balance
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-left">
                      <th className="px-4 py-3 font-medium">Code</th>
                      <th className="px-4 py-3 font-medium">Account</th>
                      <th className="px-4 py-3 font-medium text-right">Debit</th>
                      <th className="px-4 py-3 font-medium text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-50 dark:divide-indigo-900">
                    {trialBalance.accounts.map((a) => (
                      <tr key={a.id} className="hover:bg-indigo-50/50">
                        <td className="px-4 py-3 font-mono text-indigo-900 dark:text-indigo-100">
                          {a.code}
                        </td>
                        <td className="px-4 py-3 text-indigo-900 dark:text-indigo-100">{a.name}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {a.display_debit > 0 ? formatMoney(a.display_debit) : ''}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {a.display_credit > 0 ? formatMoney(a.display_credit) : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-indigo-100 dark:bg-indigo-900 font-bold">
                      <td colSpan={2} className="px-4 py-3 text-indigo-900 dark:text-indigo-100">
                        Total
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatMoney(trialBalance.totals.debit)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatMoney(trialBalance.totals.credit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="px-6 py-3 border-t border-indigo-100 dark:border-gray-700">
                <span
                  className={`text-sm font-medium ${trialBalance.is_balanced ? 'text-green-600' : 'text-red-600'}`}
                >
                  {trialBalance.is_balanced ? '✓ Balanced' : '✗ Out of balance'}
                </span>
              </div>
            </div>
          )}

          {/* Income Statement */}
          {reportType === 'income-statement' && incomeStatement && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-indigo-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  Income Statement
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Revenue */}
                <div>
                  <h3 className="font-bold text-green-700 dark:text-green-400 mb-2">Revenue</h3>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                    {incomeStatement.revenue.map((r) => (
                      <div key={r.code} className="flex justify-between py-1">
                        <span className="text-indigo-900 dark:text-indigo-100">{r.name}</span>
                        <span className="font-medium text-green-600">{formatMoney(r.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 mt-2 border-t border-green-200 dark:border-green-800 font-bold">
                      <span>Total Revenue</span>
                      <span className="text-green-600">
                        {formatMoney(incomeStatement.totals.revenue)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expenses */}
                <div>
                  <h3 className="font-bold text-red-700 dark:text-red-400 mb-2">Expenses</h3>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                    {incomeStatement.expenses.map((e) => (
                      <div key={e.code} className="flex justify-between py-1">
                        <span className="text-indigo-900 dark:text-indigo-100">{e.name}</span>
                        <span className="font-medium text-red-600">{formatMoney(e.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 mt-2 border-t border-red-200 dark:border-red-800 font-bold">
                      <span>Total Expenses</span>
                      <span className="text-red-600">
                        {formatMoney(incomeStatement.totals.expenses)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Net Income */}
                <div
                  className={`rounded-xl p-4 ${incomeStatement.totals.net_income >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}
                >
                  <div className="flex justify-between font-bold text-lg">
                    <span
                      className={
                        incomeStatement.totals.net_income >= 0
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-red-800 dark:text-red-200'
                      }
                    >
                      Net Income
                    </span>
                    <span
                      className={
                        incomeStatement.totals.net_income >= 0
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-red-800 dark:text-red-200'
                      }
                    >
                      {formatMoney(incomeStatement.totals.net_income)} MMK
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Balance Sheet */}
          {reportType === 'balance-sheet' && balanceSheet && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-indigo-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  Balance Sheet
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assets */}
                <div>
                  <h3 className="font-bold text-blue-700 dark:text-blue-400 mb-2">Assets</h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                    {balanceSheet.assets.map((a) => (
                      <div key={a.code} className="flex justify-between py-1">
                        <span className="text-indigo-900 dark:text-indigo-100">{a.name}</span>
                        <span className="font-medium">{formatMoney(a.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 mt-2 border-t border-blue-200 dark:border-blue-800 font-bold">
                      <span>Total Assets</span>
                      <span>{formatMoney(balanceSheet.totals.assets)}</span>
                    </div>
                  </div>
                </div>

                {/* Liabilities & Equity */}
                <div>
                  <h3 className="font-bold text-red-700 dark:text-red-400 mb-2">Liabilities</h3>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-4">
                    {balanceSheet.liabilities.map((l) => (
                      <div key={l.code} className="flex justify-between py-1">
                        <span className="text-indigo-900 dark:text-indigo-100">{l.name}</span>
                        <span className="font-medium">{formatMoney(l.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 mt-2 border-t border-red-200 dark:border-red-800 font-bold">
                      <span>Total Liabilities</span>
                      <span>{formatMoney(balanceSheet.totals.liabilities)}</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-purple-700 dark:text-purple-400 mb-2">Equity</h3>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                    {balanceSheet.equity.map((e) => (
                      <div key={e.code} className="flex justify-between py-1">
                        <span className="text-indigo-900 dark:text-indigo-100">{e.name}</span>
                        <span className="font-medium">{formatMoney(e.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 mt-2 border-t border-purple-200 dark:border-purple-800 font-bold">
                      <span>Total Equity</span>
                      <span>{formatMoney(balanceSheet.totals.equity)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance Check */}
              <div className="px-6 py-3 border-t border-indigo-100 dark:border-gray-700">
                <div className="flex justify-between font-bold">
                  <span>Total Liabilities + Equity</span>
                  <span>
                    {formatMoney(balanceSheet.totals.liabilities + balanceSheet.totals.equity)}
                  </span>
                </div>
                <span
                  className={`text-sm font-medium ${balanceSheet.totals.is_balanced ? 'text-green-600' : 'text-red-600'}`}
                >
                  {balanceSheet.totals.is_balanced ? '✓ Balanced' : '✗ Out of balance'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bank Reconciliation Tab */}
      {activeTab === 'reconciliation' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          {reconciliations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-left">
                    <th className="px-4 py-3 font-medium">Account</th>
                    <th className="px-4 py-3 font-medium">Statement Date</th>
                    <th className="px-4 py-3 font-medium">Statement Balance</th>
                    <th className="px-4 py-3 font-medium">Book Balance</th>
                    <th className="px-4 py-3 font-medium">Difference</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50 dark:divide-indigo-900">
                  {reconciliations.map((r) => (
                    <tr key={r.id} className="hover:bg-indigo-50/50">
                      <td className="px-4 py-3 font-medium text-indigo-900 dark:text-indigo-100">
                        {r.account_name}
                      </td>
                      <td className="px-4 py-3 text-indigo-600">{r.statement_date}</td>
                      <td className="px-4 py-3 font-medium">{formatMoney(r.statement_balance)}</td>
                      <td className="px-4 py-3 font-medium">{formatMoney(r.book_balance)}</td>
                      <td className="px-4 py-3 font-medium">
                        <span
                          className={
                            Math.abs(r.difference) < 0.01 ? 'text-green-600' : 'text-red-600'
                          }
                        >
                          {formatMoney(r.difference)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[r.status]}`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏦</div>
              <p className="text-lg font-medium text-purple-900 dark:text-purple-100 mb-2">
                No Reconciliations
              </p>
              <p className="text-purple-500 mb-4">
                Create a reconciliation to compare book vs statement balances.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create Account Modal */}
      <Modal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        title="New Account"
      >
        <form onSubmit={handleCreateAccount} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Code *
              </label>
              <input
                type="text"
                required
                value={accountForm.code}
                onChange={(e) => setAccountForm({ ...accountForm, code: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 font-mono"
                placeholder="e.g., 1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Type *
              </label>
              <select
                required
                value={accountForm.type}
                onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer capitalize"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              value={accountForm.name}
              onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Description
            </label>
            <textarea
              value={accountForm.description}
              onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAccountModal(false)}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Journal Entry Modal */}
      <Modal
        isOpen={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        title="New Journal Entry"
      >
        <form onSubmit={handleCreateEntry} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={entryForm.entry_date}
                onChange={(e) => setEntryForm({ ...entryForm, entry_date: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Reference
              </label>
              <input
                type="text"
                value={entryForm.reference}
                onChange={(e) => setEntryForm({ ...entryForm, reference: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 font-mono"
                placeholder="e.g., FEE-001"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Description *
            </label>
            <input
              type="text"
              required
              value={entryForm.description}
              onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>

          {/* Lines */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Lines
              </label>
              <button
                type="button"
                onClick={addLine}
                className="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                + Add Line
              </button>
            </div>
            <div className="space-y-2">
              {entryForm.lines.map((line, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <select
                    value={line.account_id}
                    onChange={(e) => updateLine(i, 'account_id', e.target.value)}
                    className="flex-1 px-2 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800"
                  >
                    <option value="">Account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Debit"
                    value={line.debit}
                    onChange={(e) => updateLine(i, 'debit', e.target.value)}
                    className="w-24 px-2 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800 text-right"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Credit"
                    value={line.credit}
                    onChange={(e) => updateLine(i, 'credit', e.target.value)}
                    className="w-24 px-2 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800 text-right"
                  />
                  {entryForm.lines.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      className="text-red-500 hover:text-red-700 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-6 mt-2 text-sm font-medium">
              <span>Debit: {formatMoney(totalDebit)}</span>
              <span>Credit: {formatMoney(totalCredit)}</span>
              <span
                className={
                  Math.abs(totalDebit - totalCredit) < 0.01 ? 'text-green-600' : 'text-red-600'
                }
              >
                {Math.abs(totalDebit - totalCredit) < 0.01
                  ? '✓ Balanced'
                  : `✗ Diff: ${formatMoney(Math.abs(totalDebit - totalCredit))}`}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowEntryModal(false)}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || Math.abs(totalDebit - totalCredit) > 0.01}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Ledger Modal */}
      <Modal
        isOpen={showLedgerModal}
        onClose={() => setShowLedgerModal(false)}
        title={`Ledger — ${ledgerAccount?.name || ''}`}
      >
        {ledgerData && (
          <div>
            <div className="mb-4 text-sm text-purple-600 dark:text-purple-400">
              Account: {ledgerAccount?.code} — {ledgerAccount?.name}
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-indigo-50 dark:bg-indigo-950/40 text-left">
                    <th className="px-2 py-2 font-medium">Date</th>
                    <th className="px-2 py-2 font-medium">Ref</th>
                    <th className="px-2 py-2 font-medium">Description</th>
                    <th className="px-2 py-2 font-medium text-right">Debit</th>
                    <th className="px-2 py-2 font-medium text-right">Credit</th>
                    <th className="px-2 py-2 font-medium text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50 dark:divide-indigo-900">
                  {ledgerData.transactions.map((t, i) => (
                    <tr key={i} className="hover:bg-indigo-50/50">
                      <td className="px-2 py-2">{t.entry_date}</td>
                      <td className="px-2 py-2 font-mono">{t.reference || '—'}</td>
                      <td className="px-2 py-2">{t.description || t.entry_description || '—'}</td>
                      <td className="px-2 py-2 text-right">
                        {t.debit > 0 ? formatMoney(t.debit) : ''}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {t.credit > 0 ? formatMoney(t.credit) : ''}
                      </td>
                      <td className="px-2 py-2 text-right font-medium">
                        {formatMoney(t.running_balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-indigo-100 dark:bg-indigo-900 font-bold">
                    <td colSpan={5} className="px-2 py-2">
                      Closing Balance
                    </td>
                    <td className="px-2 py-2 text-right">
                      {formatMoney(ledgerData.closing_balance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
