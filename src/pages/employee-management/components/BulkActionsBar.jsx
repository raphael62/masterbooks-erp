import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const BulkActionsBar = ({ selectedCount, onBulkAction, onClearSelection }) => {
  const [selectedAction, setSelectedAction] = useState('');

  const bulkActionOptions = [
    { value: '', label: 'Choose action...' },
    { value: 'activate', label: 'Activate Employees' },
    { value: 'deactivate', label: 'Deactivate Employees' },
    { value: 'update-department', label: 'Update Department' },
    { value: 'update-location', label: 'Update Location' },
    { value: 'export-selected', label: 'Export Selected' },
    { value: 'send-notification', label: 'Send Notification' },
    { value: 'generate-payslips', label: 'Generate Payslips' }
  ];

  const handleApplyAction = () => {
    if (selectedAction) {
      onBulkAction(selectedAction);
      setSelectedAction('');
    }
  };

  if (selectedCount === 0) return null;

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Icon name="CheckSquare" size={20} className="text-primary" />
            <span className="font-medium text-foreground">
              {selectedCount} employee{selectedCount > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Select
              options={bulkActionOptions}
              value={selectedAction}
              onChange={setSelectedAction}
              placeholder="Choose action"
              className="w-48"
            />

            <Button
              variant="default"
              size="sm"
              onClick={handleApplyAction}
              disabled={!selectedAction}
              iconName="Play"
              iconSize={14}
            >
              Apply
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onBulkAction('export-selected')}
            iconName="Download"
            iconSize={14}
          >
            Export Selected
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            iconName="X"
            iconSize={14}
          >
            Clear Selection
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-primary/20">
        <span className="text-sm text-muted-foreground">Quick actions:</span>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onBulkAction('activate')}
          iconName="UserCheck"
          iconSize={12}
        >
          Activate
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onBulkAction('deactivate')}
          iconName="UserX"
          iconSize={12}
        >
          Deactivate
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onBulkAction('send-notification')}
          iconName="Bell"
          iconSize={12}
        >
          Notify
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onBulkAction('generate-payslips')}
          iconName="FileText"
          iconSize={12}
        >
          Payslips
        </Button>
      </div>
    </div>
  );
};

export default BulkActionsBar;