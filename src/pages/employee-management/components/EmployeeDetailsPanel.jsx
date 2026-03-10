import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const EmployeeDetailsPanel = ({ employee, onClose, onAction }) => {
  if (!employee) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 h-fit">
        <div className="text-center py-12">
          <Icon name="Users" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Employee Selected</h3>
          <p className="text-sm text-muted-foreground">
            Select an employee from the list to view their details and perform actions.
          </p>
        </div>
      </div>
    );
  }

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
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Employee Details</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <Icon name="X" size={16} />
        </Button>
      </div>
      {/* Employee Profile */}
      <div className="p-6">
        <div className="flex items-start space-x-4 mb-6">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
              <Image
                src={employee?.avatar}
                alt={employee?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-card ${
              employee?.attendanceStatus === 'Present' ? 'bg-success' : 
              employee?.attendanceStatus === 'Late' ? 'bg-warning' : 'bg-error'
            }`} />
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-semibold text-foreground mb-1">{employee?.name}</h4>
            <p className="text-muted-foreground mb-2">{employee?.role}</p>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(employee?.status)}`}>
              {employee?.status}
            </span>
          </div>
        </div>

        {/* Key Information */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Employee ID</label>
              <p className="text-sm text-foreground font-mono">{employee?.employeeId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Department</label>
              <p className="text-sm text-foreground">{employee?.department}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Location</label>
              <p className="text-sm text-foreground">{employee?.location}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Employment Type</label>
              <p className="text-sm text-foreground">{employee?.employmentType}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Contact Information</label>
            <div className="mt-1 space-y-1">
              <div className="flex items-center text-sm text-foreground">
                <Icon name="Mail" size={14} className="mr-2 text-muted-foreground" />
                {employee?.email}
              </div>
              <div className="flex items-center text-sm text-foreground">
                <Icon name="Phone" size={14} className="mr-2 text-muted-foreground" />
                {employee?.phone}
              </div>
            </div>
          </div>
        </div>

        {/* Current Attendance */}
        <div className="bg-muted/30 rounded-lg p-4 mb-6">
          <h5 className="font-medium text-foreground mb-3">Today's Attendance</h5>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className={`text-sm font-medium ${getAttendanceStatusColor(employee?.attendanceStatus)}`}>
                {employee?.attendanceStatus}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Check-in</span>
              <span className="text-sm text-foreground">{employee?.lastAttendance}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Location</span>
              <span className="text-sm text-foreground">{employee?.checkInLocation || 'Office'}</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mb-6">
          <h5 className="font-medium text-foreground mb-3">Performance Overview</h5>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Overall Score</span>
                <span className="text-sm font-medium text-foreground">{employee?.performanceScore}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${employee?.performanceScore}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Attendance Rate</span>
                <p className="font-medium text-foreground">{employee?.attendanceRate || '95%'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tasks Completed</span>
                <p className="font-medium text-foreground">{employee?.tasksCompleted || '24/28'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h5 className="font-medium text-foreground">Quick Actions</h5>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction('edit', employee)}
              iconName="Edit"
              iconSize={14}
              fullWidth
            >
              Edit Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction('payslip', employee)}
              iconName="FileText"
              iconSize={14}
              fullWidth
            >
              View Payslip
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction('attendance', employee)}
              iconName="Clock"
              iconSize={14}
              fullWidth
            >
              Attendance
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction('performance', employee)}
              iconName="TrendingUp"
              iconSize={14}
              fullWidth
            >
              Performance
            </Button>
          </div>
          
          <div className="pt-3 border-t border-border">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction('call', employee)}
                iconName="Phone"
                iconSize={14}
                fullWidth
              >
                Call
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction('message', employee)}
                iconName="MessageSquare"
                iconSize={14}
                fullWidth
              >
                Message
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsPanel;