import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

const InvoiceHistoryModal = ({ invoiceId, invoiceNo, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (invoiceId) {
      fetchHistory();
    }
  }, [invoiceId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        ?.from('audit_logs')
        ?.select('*')
        ?.eq('record_id', invoiceId)
        ?.order('created_at', { ascending: true });
      if (!error) {
        setLogs(data || []);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d?.toLocaleString('en-GB', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: true,
    });
  };

  const getVoucherStatus = (log) => {
    const newData = log?.new_data || {};
    return newData?.status || log?.old_data?.status || 'Draft';
  };

  const getProgressStatus = () => 'Confirm';

  const getStatusLabel = (log, idx) => {
    if (log?.action === 'INSERT') return 'New';
    if (log?.action === 'DELETE') return 'Delete';
    return idx === 0 ? 'New' : 'Modify';
  };

  const getUserDisplay = (log) => {
    return log?.user_email ? log?.user_email?.split('@')?.[0]?.toUpperCase() : (log?.user_id ? log?.user_id?.slice(0, 8)?.toUpperCase() : 'SYSTEM');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-2xl flex flex-col" style={{ width: '680px', maxHeight: '80vh' }}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2.5 rounded-t-lg"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <h3 className="text-sm font-semibold text-white">History</h3>
          <button onClick={onClose} className="text-white hover:text-gray-200 text-lg leading-none font-bold">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-700">History</p>
            {invoiceNo && (
              <p className="text-xs text-gray-500 mt-0.5">[{invoiceNo}]</p>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 rounded-full animate-spin" style={{ borderTopColor: 'var(--color-primary)' }} />
            </div>
          ) : logs?.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">No history records found.</div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-primary)' }}>
                    <th className="px-3 py-2 text-white font-semibold text-center border border-purple-400 w-10">No.</th>
                    <th className="px-3 py-2 text-white font-semibold text-center border border-purple-400">User ID</th>
                    <th className="px-3 py-2 text-white font-semibold text-center border border-purple-400">Operation Time</th>
                    <th className="px-3 py-2 text-white font-semibold text-center border border-purple-400">Voucher Status</th>
                    <th className="px-3 py-2 text-white font-semibold text-center border border-purple-400">Progress Status</th>
                    <th className="px-3 py-2 text-white font-semibold text-center border border-purple-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs?.map((log, idx) => (
                    <tr key={log?.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-1.5 text-center border border-gray-200 text-gray-600">{idx + 1}</td>
                      <td className="px-3 py-1.5 text-center border border-gray-200 font-medium" style={{ color: 'var(--color-primary)' }}>
                        {getUserDisplay(log)}
                      </td>
                      <td className="px-3 py-1.5 text-center border border-gray-200 text-gray-700">
                        {formatDateTime(log?.created_at)}
                      </td>
                      <td className="px-3 py-1.5 text-center border border-gray-200 text-gray-700 capitalize">
                        {getVoucherStatus(log)}
                      </td>
                      <td className="px-3 py-1.5 text-center border border-gray-200 text-gray-700">
                        {getProgressStatus()}
                      </td>
                      <td className="px-3 py-1.5 text-center border border-gray-200 font-medium text-gray-800">
                        {getStatusLabel(log, idx)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-start px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="h-8 px-5 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceHistoryModal;
