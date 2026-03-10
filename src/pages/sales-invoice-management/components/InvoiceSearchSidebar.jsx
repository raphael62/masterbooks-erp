import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const InvoiceSearchSidebar = ({ onInvoiceSelect, onCreateNew, selectedInvoice }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  const mockInvoices = [
    {
      id: 'INV-2025-001',
      customer: 'Ashanti Gold Company Ltd.',
      amount: 25000.00,
      status: 'paid',
      dueDate: '2025-01-15',
      createdDate: '2025-01-01'
    },
    {
      id: 'INV-2025-002',
      customer: 'Tema Oil Refinery',
      amount: 18500.00,
      status: 'sent',
      dueDate: '2025-01-20',
      createdDate: '2025-01-05'
    },
    {
      id: 'INV-2025-003',
      customer: 'Ghana Commercial Bank',
      amount: 12750.00,
      status: 'overdue',
      dueDate: '2024-12-25',
      createdDate: '2024-12-10'
    },
    {
      id: 'INV-2025-004',
      customer: 'Accra Mall Limited',
      amount: 8900.00,
      status: 'draft',
      dueDate: '2025-01-25',
      createdDate: '2025-01-08'
    }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' }
  ];

  const getStatusColor = (status) => {
    const colors = {
      draft: 'text-gray-600 bg-gray-100',
      sent: 'text-purple-600 bg-purple-100',
      paid: 'text-green-600 bg-green-100',
      overdue: 'text-red-600 bg-red-100'
    };
    return colors?.[status] || 'text-gray-600 bg-gray-100';
  };

  const filteredInvoices = mockInvoices?.filter(invoice => {
    const matchesSearch = invoice?.customer?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
                         invoice?.id?.toLowerCase()?.includes(searchQuery?.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Invoices</h2>
          <Button
            onClick={onCreateNew}
            size="sm"
            className="flex items-center space-x-2"
          >
            <Icon name="Plus" size={16} />
            <span className="hidden sm:inline">New</span>
          </Button>
        </div>

        {/* Search */}
        <div className="space-y-3">
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e?.target?.value)}
            className="w-full"
            icon="Search"
          />

          {/* Filters */}
          <div className="grid grid-cols-1 gap-2">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={statusOptions}
            />
            <Select
              value={dateRange}
              onValueChange={setDateRange}
              options={dateRangeOptions}
            />
          </div>
        </div>
      </div>
      {/* Invoice List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-2">
          {filteredInvoices?.map((invoice) => (
            <div
              key={invoice?.id}
              onClick={() => onInvoiceSelect(invoice)}
              className={`p-3 rounded-lg border cursor-pointer transition-all duration-150 hover:bg-accent ${
                selectedInvoice?.id === invoice?.id
                  ? 'border-primary bg-accent' :'border-border bg-card hover:border-border-hover'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-foreground text-sm">{invoice?.id}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {invoice?.customer}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice?.status)}`}>
                  {invoice?.status?.charAt(0)?.toUpperCase() + invoice?.status?.slice(1)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">
                  GHS {invoice?.amount?.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-muted-foreground">
                  Due: {new Date(invoice?.dueDate)?.toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>
          ))}

          {filteredInvoices?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="FileText" size={48} className="mx-auto mb-4 opacity-50" />
              <p>No invoices found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
      {/* Quick Stats */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-semibold text-foreground">
              GHS {mockInvoices?.reduce((sum, inv) => sum + inv?.amount, 0)?.toLocaleString('en-GH')}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className="font-semibold text-red-600">
              GHS {mockInvoices?.filter(inv => inv?.status === 'overdue' || inv?.status === 'sent')
                ?.reduce((sum, inv) => sum + inv?.amount, 0)?.toLocaleString('en-GH')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSearchSidebar;