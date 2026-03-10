import React, { useState, useEffect, useMemo } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import EmployeeTable from './components/EmployeeTable';
import CreateEmployeeModal from './components/CreateEmployeeModal';
import EmployeeFilters from './components/EmployeeFilters';
import EmployeeDetailsPanel from './components/EmployeeDetailsPanel';
import BulkActionsBar from './components/BulkActionsBar';

const EmployeeManagement = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    location: '',
    employmentType: '',
    status: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc'
  });

  // Mock employee data
  const [employees, setEmployees] = useState([
    {
      id: 1,
      employeeId: 'EMP001',
      name: 'Kwame Asante',
      email: 'kwame.asante@masterbooks.gh',
      phone: '+233 24 123 4567',
      role: 'Sales Manager',
      department: 'Sales',
      location: 'Accra Main',
      employmentType: 'Full-time',
      status: 'Active',
      attendanceStatus: 'Present',
      lastAttendance: '08:30 AM',
      checkInLocation: 'Office',
      performanceScore: 92,
      attendanceRate: '96%',
      tasksCompleted: '28/30',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 2,
      employeeId: 'EMP002',
      name: 'Akosua Mensah',
      email: 'akosua.mensah@masterbooks.gh',
      phone: '+233 24 234 5678',
      role: 'Business Executive',
      department: 'Sales',
      location: 'Kumasi Branch',
      employmentType: 'Full-time',
      status: 'Active',
      attendanceStatus: 'Present',
      lastAttendance: '08:45 AM',
      checkInLocation: 'Field',
      performanceScore: 88,
      attendanceRate: '94%',
      tasksCompleted: '25/28',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 3,
      employeeId: 'EMP003',
      name: 'Kofi Osei',
      email: 'kofi.osei@masterbooks.gh',
      phone: '+233 24 345 6789',
      role: 'Inventory Manager',
      department: 'Operations',
      location: 'Accra Main',
      employmentType: 'Full-time',
      status: 'Active',
      attendanceStatus: 'Late',
      lastAttendance: '09:15 AM',
      checkInLocation: 'Office',
      performanceScore: 85,
      attendanceRate: '89%',
      tasksCompleted: '22/26',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 4,
      employeeId: 'EMP004',
      name: 'Ama Boateng',
      email: 'ama.boateng@masterbooks.gh',
      phone: '+233 24 456 7890',
      role: 'Accountant',
      department: 'Finance',
      location: 'Accra Main',
      employmentType: 'Full-time',
      status: 'Active',
      attendanceStatus: 'Present',
      lastAttendance: '08:20 AM',
      checkInLocation: 'Office',
      performanceScore: 95,
      attendanceRate: '98%',
      tasksCompleted: '30/30',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 5,
      employeeId: 'EMP005',
      name: 'Yaw Appiah',
      email: 'yaw.appiah@masterbooks.gh',
      phone: '+233 24 567 8901',
      role: 'HR Assistant',
      department: 'HR',
      location: 'Accra Main',
      employmentType: 'Part-time',
      status: 'On Leave',
      attendanceStatus: 'Absent',
      lastAttendance: 'Yesterday',
      checkInLocation: 'N/A',
      performanceScore: 78,
      attendanceRate: '85%',
      tasksCompleted: '18/24',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 6,
      employeeId: 'EMP006',
      name: 'Efua Darko',
      email: 'efua.darko@masterbooks.gh',
      phone: '+233 24 678 9012',
      role: 'IT Support',
      department: 'IT',
      location: 'Takoradi Branch',
      employmentType: 'Contract',
      status: 'Active',
      attendanceStatus: 'Present',
      lastAttendance: '08:00 AM',
      checkInLocation: 'Office',
      performanceScore: 90,
      attendanceRate: '92%',
      tasksCompleted: '26/28',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
    }
  ]);

  // Filter and sort employees
  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = employees?.filter(employee => {
      const matchesSearch = searchTerm === '' || 
        employee?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        employee?.employeeId?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        employee?.role?.toLowerCase()?.includes(searchTerm?.toLowerCase());

      const matchesDepartment = filters?.department === '' || employee?.department === filters?.department;
      const matchesLocation = filters?.location === '' || employee?.location === filters?.location;
      const matchesEmploymentType = filters?.employmentType === '' || employee?.employmentType === filters?.employmentType;
      const matchesStatus = filters?.status === '' || employee?.status === filters?.status;

      return matchesSearch && matchesDepartment && matchesLocation && matchesEmploymentType && matchesStatus;
    });

    // Sort employees
    filtered?.sort((a, b) => {
      const aValue = a?.[sortConfig?.key];
      const bValue = b?.[sortConfig?.key];

      if (aValue < bValue) return sortConfig?.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig?.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [employees, searchTerm, filters, sortConfig]);

  const handleToggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    } else {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    }
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleSelectEmployeeCheckbox = (employeeId) => {
    setSelectedEmployees(prev => 
      prev?.includes(employeeId)
        ? prev?.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    const allSelected = selectedEmployees?.length === filteredAndSortedEmployees?.length;
    setSelectedEmployees(allSelected ? [] : filteredAndSortedEmployees?.map(emp => emp?.id));
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({ ...prev, [filterKey]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      department: '',
      location: '',
      employmentType: '',
      status: ''
    });
    setSearchTerm('');
  };

  const handleQuickAction = (action, employee) => {
    switch (action) {
      case 'edit': console.log('Edit employee:', employee);
        break;
      case 'view':
        setSelectedEmployee(employee);
        break;
      case 'call': console.log('Call employee:', employee?.phone);
        break;
      case 'message': console.log('Message employee:', employee?.email);
        break;
      case 'payslip': console.log('View payslip for:', employee);
        break;
      case 'attendance': console.log('View attendance for:', employee);
        break;
      case 'performance':
        console.log('View performance for:', employee);
        break;
      default:
        console.log('Action:', action, employee);
    }
  };

  const handleBulkAction = (action) => {
    const selectedEmployeeData = employees?.filter(emp => selectedEmployees?.includes(emp?.id));
    console.log('Bulk action:', action, selectedEmployeeData);
    
    // Clear selection after action
    setSelectedEmployees([]);
  };

  const handleCreateEmployee = (employeeData) => {
    console.log('Create employee:', employeeData);
    // In a real app, this would make an API call
  };

  const handleExport = () => {
    console.log('Export employees:', filteredAndSortedEmployees);
  };

  // Auto-select first employee on desktop
  useEffect(() => {
    if (window.innerWidth >= 1024 && filteredAndSortedEmployees?.length > 0 && !selectedEmployee) {
      setSelectedEmployee(filteredAndSortedEmployees?.[0]);
    }
  }, [filteredAndSortedEmployees, selectedEmployee]);

  return (
    <AppLayout>
      <div className="p-6">
        <BreadcrumbNavigation />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Employee Management</h1>
            <p className="text-muted-foreground">
              Manage employee records, track attendance, and handle HR operations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <EmployeeFilters
              searchQuery={searchTerm}
              onSearchChange={setSearchTerm}
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              onExport={handleExport}
              onAddEmployee={() => setIsCreateModalOpen(true)}
            />
            
            {selectedEmployees?.length > 0 && (
              <BulkActionsBar
                selectedCount={selectedEmployees?.length}
                onBulkAction={handleBulkAction}
                onClearSelection={() => setSelectedEmployees([])}
              />
            )}
            
            <EmployeeTable
              employees={filteredAndSortedEmployees}
              searchTerm={searchTerm}
              selectedEmployees={selectedEmployees}
              onSelectEmployee={handleSelectEmployeeCheckbox}
              onSelectAll={handleSelectAll}
              onEmployeeSelect={setSelectedEmployees}
              onEmployeeClick={handleSelectEmployee}
              onSort={handleSort}
              sortConfig={sortConfig}
              onQuickAction={handleQuickAction}
            />
          </div>
          
          <div>
            <EmployeeDetailsPanel
              employee={selectedEmployee}
              onClose={() => setSelectedEmployee(null)}
              onAction={handleQuickAction}
            />
          </div>
        </div>

        <CreateEmployeeModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onEmployeeCreated={(employee) => {
            setEmployees([...employees, employee]);
            setIsCreateModalOpen(false);
          }}
        />
      </div>
    </AppLayout>
  );
};

export default EmployeeManagement;