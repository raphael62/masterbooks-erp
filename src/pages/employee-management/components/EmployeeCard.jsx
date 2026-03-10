import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const EmployeeCard = ({ employee, onSelect, isSelected, onQuickAction }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-success text-success-foreground';
      case 'On Leave': return 'bg-warning text-warning-foreground';
      case 'Inactive': return 'bg-error text-error-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getAttendanceStatusColor = (status) => {
    switch (status) {
      case 'Present': return 'text-success';
      case 'Late': return 'text-warning';
      case 'Absent': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div 
      className={`
        bg-card border border-border rounded-lg p-4 cursor-pointer transition-all duration-200 ease-out
        ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50 hover:shadow-sm'}
      `}
      onClick={() => onSelect(employee)}
    >
      <div className="flex items-start space-x-4">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
            <Image
              src={employee?.avatar}
              alt={employee?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${
            employee?.attendanceStatus === 'Present' ? 'bg-success' : 
            employee?.attendanceStatus === 'Late' ? 'bg-warning' : 'bg-error'
          }`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-medium text-foreground truncate">{employee?.name}</h3>
              <p className="text-sm text-muted-foreground">{employee?.role}</p>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(employee?.status)}`}>
              {employee?.status}
            </span>
          </div>

          <div className="space-y-1 mb-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <Icon name="Building2" size={14} className="mr-2" />
              <span>{employee?.department}</span>
            </div>
            <div className="flex items-center text-sm">
              <Icon name="Clock" size={14} className="mr-2 text-muted-foreground" />
              <span className={getAttendanceStatusColor(employee?.attendanceStatus)}>
                {employee?.attendanceStatus} - {employee?.lastAttendance}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              ID: {employee?.employeeId}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e?.stopPropagation();
                  onQuickAction('call', employee);
                }}
                className="p-1 rounded hover:bg-accent transition-colors duration-150 ease-out"
                title="Call employee"
              >
                <Icon name="Phone" size={14} className="text-muted-foreground" />
              </button>
              <button
                onClick={(e) => {
                  e?.stopPropagation();
                  onQuickAction('message', employee);
                }}
                className="p-1 rounded hover:bg-accent transition-colors duration-150 ease-out"
                title="Send message"
              >
                <Icon name="MessageSquare" size={14} className="text-muted-foreground" />
              </button>
              <button
                onClick={(e) => {
                  e?.stopPropagation();
                  onQuickAction('edit', employee);
                }}
                className="p-1 rounded hover:bg-accent transition-colors duration-150 ease-out"
                title="Edit employee"
              >
                <Icon name="Edit" size={14} className="text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeCard;