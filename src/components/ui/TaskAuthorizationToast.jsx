import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const TOAST_TIMEOUT = 30000; // 30 seconds

const TaskAuthorizationToast = () => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev?.filter(t => t?.id !== id));
  }, []);

  const handleAccept = async (toast) => {
    try {
      await supabase
        ?.from('task_authorizations')
        ?.update({ status: 'accepted', updated_at: new Date()?.toISOString() })
        ?.eq('id', toast?.recordId);
    } catch (err) {
      console.error('Error accepting authorization:', err);
    }
    removeToast(toast?.id);
  };

  const handleReject = async (toast) => {
    try {
      await supabase
        ?.from('task_authorizations')
        ?.update({ status: 'rejected', updated_at: new Date()?.toISOString() })
        ?.eq('id', toast?.recordId);
    } catch (err) {
      console.error('Error rejecting authorization:', err);
    }
    removeToast(toast?.id);
  };

  useEffect(() => {
    const channel = supabase
      ?.channel('task-authorizations-realtime')
      ?.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'task_authorizations' },
        (payload) => {
          const record = payload?.new;
          if (!record) return;

          const toastId = `toast-${Date.now()}-${Math.random()?.toString(36)?.slice(2)}`;
          const newToast = {
            id: toastId,
            recordId: record?.id,
            requesterName: record?.requester_name,
            module: record?.module,
            actionType: record?.action_type,
            recordRef: record?.record_ref,
            message: record?.message,
          };

          setToasts(prev => [...prev, newToast]);

          // Auto-dismiss after 30 seconds
          setTimeout(() => {
            removeToast(toastId);
          }, TOAST_TIMEOUT);
        }
      )
      ?.subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [removeToast]);

  if (toasts?.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end" style={{ maxWidth: '340px' }}>
      {toasts?.map((toast) => (
        <div
          key={toast?.id}
          className="w-full bg-card rounded-lg shadow-lg border border-border overflow-hidden animate-slideInRight"
          style={{ animation: 'slideInRight 0.3s ease-out' }}
        >
          {/* Toast Header */}
          <div
            className="flex items-center justify-between px-3 py-2 bg-primary"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">
                  {toast?.requesterName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-primary-foreground text-xs font-semibold truncate" style={{ maxWidth: '200px' }}>
                Task Authorization
              </span>
            </div>
            <button
              onClick={() => removeToast(toast?.id)}
              className="text-primary-foreground hover:text-primary-foreground/80 text-sm leading-none ml-2 transition-opacity"
            >
              ✕
            </button>
          </div>

          {/* Toast Body */}
          <div className="px-3 py-2.5">
            <p className="text-xs text-foreground leading-relaxed">
              <span className="font-semibold">{toast?.requesterName}</span>
              {' has requested ['}
              <span className="font-medium text-primary">{toast?.module}</span>
              {'] Task Authorization.'}
              {toast?.actionType && (
                <>
                  <br />
                  {'(Action: '}
                  <span className="font-medium text-error">{toast?.actionType}</span>
                  {')'}
                </>
              )}
              {toast?.recordRef && (
                <>
                  <br />
                  <span className="text-muted-foreground">Ref: {toast?.recordRef}</span>
                </>
              )}
            </p>
          </div>

          {/* Toast Actions */}
          <div className="flex items-center gap-2 px-3 pb-2.5">
            <button
              onClick={() => handleAccept(toast)}
              className="flex-1 h-7 text-xs font-semibold text-primary-foreground rounded transition-colors bg-primary hover:bg-primary/90"
            >
              Accept
            </button>
            <button
              onClick={() => handleReject(toast)}
              className="flex-1 h-7 text-xs font-semibold bg-muted text-foreground rounded hover:bg-accent transition-colors border border-border"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskAuthorizationToast;
