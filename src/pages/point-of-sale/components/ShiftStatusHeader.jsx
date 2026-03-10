import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const ShiftStatusHeader = ({ shift, onShiftAction }) => {
  const [showShiftDetails, setShowShiftDetails] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    })?.format(amount);
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })?.format(date);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowShiftDetails(!showShiftDetails)}
        className="flex items-center space-x-3 px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors duration-150 ease-out"
      >
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${shift?.status === 'active' ? 'bg-success animate-pulse' : 'bg-muted'}`} />
          <span className="text-sm font-medium text-foreground">
            Shift {shift?.number}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {shift?.cashier} • {formatTime(shift?.startTime)}
        </div>
        <Icon 
          name={showShiftDetails ? "ChevronUp" : "ChevronDown"} 
          size={16} 
          className="text-muted-foreground" 
        />
      </button>
      {showShiftDetails && (
        <>
          <div 
            className="fixed inset-0 z-150" 
            onClick={() => setShowShiftDetails(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-lg shadow-modal z-200 animate-fadeIn">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-popover-foreground">Shift Details</h3>
                <button
                  onClick={() => setShowShiftDetails(false)}
                  className="p-1 rounded hover:bg-accent transition-colors duration-150 ease-out"
                >
                  <Icon name="X" size={14} className="text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cashier</span>
                  <span className="text-sm font-medium">{shift?.cashier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Start Time</span>
                  <span className="text-sm font-mono">{formatTime(shift?.startTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Opening Balance</span>
                  <span className="text-sm font-mono">{formatCurrency(shift?.openingBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Transactions</span>
                  <span className="text-sm font-mono">{shift?.transactionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Sales</span>
                  <span className="text-sm font-mono text-success">{formatCurrency(shift?.totalSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cash in Drawer</span>
                  <span className="text-sm font-mono">{formatCurrency(shift?.cashInDrawer)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border mt-4">
                <button
                  onClick={() => {
                    onShiftAction('close');
                    setShowShiftDetails(false);
                  }}
                  className="w-full py-2 px-3 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors duration-150 ease-out"
                >
                  Close Shift
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShiftStatusHeader;