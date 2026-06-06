﻿import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { usersAPI } from '../../api/users';
import { paymentsAPI } from '../../api/payments';
import TopBarActions from '../../components/ui/TopBarActions';

const STATUS_STYLE = {
  completed: 'bg-[#22be70]/10 text-[#22be70]',
  pending:   'bg-[#ff8032]/10 text-[#ff8032]',
  failed:    'bg-[#f24545]/10 text-[#f24545]',
};

const AdminPayments = () => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [acting, setActing]     = useState(null);

  useEffect(() => {
    if (!isAuthenticated || role !== 'admin') navigate('/login', { replace: true });
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    usersAPI.getAllUsers()
      .then(async (uRes) => {
        const users = uRes?.users || [];
        const map = {};
        users.forEach((u) => { map[u.id] = u; });
        setUsersMap(map);

        // fetch payments for each user
        const results = await Promise.all(
          users.map((u) =>
            paymentsAPI.getUserPayments(u.id)
              .then((r) => r?.payments || [])
              .catch(() => [])
          )
        );
        const all = results.flat();
        // deduplicate by id
        const seen = new Set();
        const unique = all.filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        setPayments(unique);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = payments;
    if (statusFilter) list = list.filter((p) => (p.status || '').toLowerCase() === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => {
        const u = usersMap[p.user_id];
        return (u?.name || '').toLowerCase().includes(q) || (u?.email || '').toLowerCase().includes(q);
      });
    }
    return list;
  }, [payments, statusFilter, search, usersMap]);

  const total     = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const completed = payments.filter((p) => (p.status || '').toLowerCase() === 'completed');
  const revenue   = completed.reduce((s, p) => s + (p.amount || 0), 0);

  const handleComplete = async (p) => {
    setActing(p.id);
    try {
      await paymentsAPI.completePayment(p.id);
      setPayments((prev) => prev.map((x) => x.id === p.id ? { ...x, status: 'completed' } : x));
    } catch {}
    finally { setActing(null); }
  };

  const handleFail = async (p) => {
    setActing(p.id);
    try {
      await paymentsAPI.failPayment(p.id);
      setPayments((prev) => prev.map((x) => x.id === p.id ? { ...x, status: 'failed' } : x));
    } catch {}
    finally { setActing(null); }
  };

  const fmt = (v) => `$${(v || 0).toFixed(2)}`;

  return (
    <div className="flex h-screen bg-[#f5f6fa] font-sans">
      <AdminSidebar />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-[#ebebf0] px-8 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-[#0c0d12] text-[22px] font-bold leading-none">Payments</h1>
            <p className="text-[#6b6f7d] text-[13px] mt-1">
              {payments.length} total · Revenue: {fmt(revenue)}
            </p>
          </div>
          {/* Summary chips */}
          <div className="flex items-center gap-3">
            <TopBarActions />
            <div className="text-center px-4 py-2 bg-[#22be70]/10 rounded-xl">
              <p className="text-[18px] font-bold text-[#22be70]">{fmt(revenue)}</p>
              <p className="text-[11px] text-[#22be70]/80">Collected</p>
            </div>
            <div className="text-center px-4 py-2 bg-[#ff8032]/10 rounded-xl">
              <p className="text-[18px] font-bold text-[#ff8032]">
                {payments.filter((p) => (p.status || '').toLowerCase() === 'pending').length}
              </p>
              <p className="text-[11px] text-[#ff8032]/80">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-b border-[#ebebf0] px-8 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="relative flex-1 max-w-xs">
            <svg viewBox="0 0 16 16" fill="none" stroke="#8a90a1" strokeWidth="1.4" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2">
              <circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3" strokeLinecap="round"/>
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user..."
              className="w-full pl-9 pr-3 h-9 border border-[#d2d4d9] rounded-[8px] text-[13px] focus:outline-none focus:border-[#0d9488] bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 border border-[#d2d4d9] rounded-[8px] text-[13px] text-[#0c0d12] bg-white focus:outline-none focus:border-[#0d9488]"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <p className="text-[12px] text-[#6b6f7d] ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex-1 p-8 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-red-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#ebebf0] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f0f0f5]">
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-[#6b6f7d] uppercase tracking-wide">User</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-[#6b6f7d] uppercase tracking-wide">Amount</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-[#6b6f7d] uppercase tracking-wide">Status</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-[#6b6f7d] uppercase tracking-wide">Payment ID</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-[#6b6f7d] text-[13px]">No payments found</td>
                    </tr>
                  ) : filtered.map((p) => {
                    const u = usersMap[p.user_id];
                    const status = (p.status || 'pending').toLowerCase();
                    return (
                      <tr key={p.id} className="border-b border-[#f8f9fc] last:border-0 hover:bg-[#f8f9fc] transition-colors">
                        <td className="px-6 py-3">
                          <p className="text-[13px] font-medium text-[#0c0d12]">{u?.name || p.user_id?.slice(0, 8) || '-'}</p>
                          <p className="text-[11px] text-[#6b6f7d]">{u?.email || ''}</p>
                        </td>
                        <td className="px-6 py-3 text-[14px] font-bold text-[#0c0d12]">{fmt(p.amount)}</td>
                        <td className="px-6 py-3">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[status] || 'bg-[#f0f0f5] text-[#6b6f7d]'}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-[11px] text-[#b0b5c4] font-mono">{p.id?.slice(0, 8)}…</td>
                        <td className="px-6 py-3">
                          {status === 'pending' && (
                            <div className="flex items-center gap-3 justify-end">
                              <button
                                onClick={() => handleComplete(p)}
                                disabled={acting === p.id}
                                className="text-[12px] text-[#22be70] hover:underline font-medium disabled:opacity-40"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => handleFail(p)}
                                disabled={acting === p.id}
                                className="text-[12px] text-[#f24545] hover:underline font-medium disabled:opacity-40"
                              >
                                Fail
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;
