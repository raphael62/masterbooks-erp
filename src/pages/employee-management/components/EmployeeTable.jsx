import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const EmployeeTable = ({ 
  employees, 
  selectedEmployees, 
  onSelectEmployee, 
  onSelectAll, 
  onSort, 
  sortConfig,
  onQuickAction 
}) => {
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

  const getSortIcon = (column) => {
    if (sortConfig?.key !== column) return 'ArrowUpDown';
    return sortConfig?.direction === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  const isAllSelected = employees?.length > 0 && selectedEmployees?.length === employees?.length;
  const isIndeterminate = selectedEmployees?.length > 0 && selectedEmployees?.length < employees?.length;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={onSelectAll}
                  className="rounded border-border focus:ring-2 focus:ring-primary"
                />
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort('name')}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-colors duration-150 ease-out"
                >
                  <span>Employee</span>
                  <Icon name={getSortIcon('name')} size={14} />
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort('department')}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-colors duration-150 ease-out"
                >
                  <span>Department</span>
                  <Icon name={getSortIcon('department')} size={14} />
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort('role')}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-colors duration-150 ease-out"
                >
                  <span>Role</span>
                  <Icon name={getSortIcon('role')} size={14} />
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort('status')}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-colors duration-150 ease-out"
                >
                  <span>Status</span>
                  <Icon name={getSortIcon('status')} size={14} />
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <span className="text-sm font-medium text-foreground">Attendance</span>
              </th>
              <th className="text-left px-4 py-3">
                <span className="text-sm font-medium text-foreground">Performance</span>
              </th>
              <th className="text-right px-4 py-3">
                <span className="text-sm font-medium text-foreground">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {employees?.map((employee) => (
              <tr 
                key={employee?.id}
                className={`hover:bg-accent/50 transition-colors duration-150 ease-out ${
                  selectedEmployees?.includes(employee?.id) ? 'bg-accent/30' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedEmployees?.includes(employee?.id)}
                    onChange={() => onSelectEmployee(employee?.id)}
                    className="rounded border-border focus:ring-2 focus:ring-primary"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
                        <Image
                          src={employee?.avatar}
                          alt={employee?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                        employee?.attendanceStatus === 'Present' ? 'bg-success' : 
                        employee?.attendanceStatus === 'Late' ? 'bg-warning' : 'bg-error'
                      }`} />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{employee?.name}</div>
                      <div className="text-sm text-muted-foreground">{employee?.employeeId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-foreground">{employee?.department}</div>
                  <div className="text-xs text-muted-foreground">{employee?.location}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-foreground">{employee?.role}</div>
                  <div className="text-xs text-muted-foreground">{employee?.employmentType}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(employee?.status)}`}>
                    {employee?.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className={`text-sm font-medium ${getAttendanceStatusColor(employee?.attendanceStatus)}`}>
                    {employee?.attendanceStatus}
                  </div>
                  <div className="text-xs text-muted-foreground">{employee?.lastAttendance}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${employee?.performanceScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {employee?.performanceScore}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onQuickAction('view', employee)}
                      className="h-8 w-8"
                    >
                      <Icon name="Eye" size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onQuickAction('edit', employee)}
                      className="h-8 w-8"
                    >
                      <Icon name="Edit" size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onQuickAction('more', employee)}
                      className="h-8 w-8"
                    >
                      <Icon name="MoreHorizontal" size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeTable;