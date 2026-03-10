import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import { supabase } from '../../../lib/supabase';

const CreateEmployeeModal = ({ isOpen, onClose, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    employeeId: '',
    department: '',
    role: '',
    location: '',
    employmentType: '',
    startDate: '',
    reportingManager: '',
    salary: '',
    systemAccess: false,
    permissions: [],
    documents: []
  });

  const [errors, setErrors] = useState({});
  const [locations, setLocations] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const fetchDropdowns = async () => {
        const [locRes, roleRes] = await Promise.all([
          supabase?.from('locations')?.select('id, name')?.eq('is_active', true)?.order('name'),
          supabase?.from('roles')?.select('id, name')?.order('name'),
        ]);
        if (!locRes?.error) setLocations(locRes?.data || []);
        if (!roleRes?.error) setRoles(roleRes?.data || []);
      };
      fetchDropdowns();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = [
    { id: 1, title: 'Personal Details', icon: 'User' },
    { id: 2, title: 'Employment', icon: 'Briefcase' },
    { id: 3, title: 'System Access', icon: 'Shield' },
    { id: 4, title: 'Review', icon: 'CheckCircle' }
  ];

  const departmentOptions = [
    { value: 'Sales', label: 'Sales' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Finance', label: 'Finance' },
    { value: 'HR', label: 'Human Resources' },
    { value: 'IT', label: 'Information Technology' },
    { value: 'Logistics', label: 'Logistics' },
    { value: 'Production', label: 'Production' }
  ];

  const locationOptions = [
    { value: '', label: 'Select Location' },
    ...locations?.map(l => ({ value: l?.name, label: l?.name }))
  ];

  const roleOptions = [
    { value: '', label: 'Select Role' },
    ...roles?.map(r => ({ value: r?.name, label: r?.name }))
  ];

  const employmentTypeOptions = [
    { value: 'Full-time', label: 'Full-time' },
    { value: 'Part-time', label: 'Part-time' },
    { value: 'Contract', label: 'Contract' },
    { value: 'Intern', label: 'Intern' }
  ];

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' }
  ];

  const permissionOptions = [
    { value: 'dashboard.view', label: 'Dashboard Access' },
    { value: 'sales.view', label: 'Sales Management' },
    { value: 'customers.view', label: 'Customer Management' },
    { value: 'inventory.view', label: 'Inventory Management' },
    { value: 'reports.view', label: 'Reports Access' },
    { value: 'settings.access', label: 'System Settings' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePermissionChange = (permission, checked) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev?.permissions, permission]
        : prev?.permissions?.filter(p => p !== permission)
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData?.firstName) newErrors.firstName = 'First name is required';
        if (!formData?.lastName) newErrors.lastName = 'Last name is required';
        if (!formData?.email) newErrors.email = 'Email is required';
        if (!formData?.phone) newErrors.phone = 'Phone number is required';
        break;
      case 2:
        if (!formData?.employeeId) newErrors.employeeId = 'Employee ID is required';
        if (!formData?.department) newErrors.department = 'Department is required';
        if (!formData?.role) newErrors.role = 'Role is required';
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      onSubmit?.(formData);
      onClose?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Create New Employee</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Step {currentStep} of {steps?.length}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center px-5 py-3 border-b border-border gap-2">
          {steps?.map((step, idx) => (
            <React.Fragment key={step?.id}>
              <div className={`flex items-center gap-2 ${
                step?.id === currentStep ? 'text-primary' :
                step?.id < currentStep ? 'text-success' : 'text-muted-foreground'
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  step?.id === currentStep ? 'bg-primary text-white' :
                  step?.id < currentStep ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {step?.id < currentStep ? <Icon name="Check" size={12} /> : step?.id}
                </div>
                <span className="text-xs font-medium hidden sm:block">{step?.title}</span>
              </div>
              {idx < steps?.length - 1 && <div className="flex-1 h-px bg-border" />}
            </React.Fragment>
          ))}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Step 1: Personal Details */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="First Name" value={formData?.firstName} onChange={(e) => handleInputChange('firstName', e?.target?.value)} error={errors?.firstName} required />
              <Input label="Last Name" value={formData?.lastName} onChange={(e) => handleInputChange('lastName', e?.target?.value)} error={errors?.lastName} required />
              <Input label="Email" type="email" value={formData?.email} onChange={(e) => handleInputChange('email', e?.target?.value)} error={errors?.email} required />
              <Input label="Phone" type="tel" value={formData?.phone} onChange={(e) => handleInputChange('phone', e?.target?.value)} error={errors?.phone} required />
              <Input label="Date of Birth" type="date" value={formData?.dateOfBirth} onChange={(e) => handleInputChange('dateOfBirth', e?.target?.value)} />
              <Select label="Gender" options={genderOptions} value={formData?.gender} onChange={(v) => handleInputChange('gender', v)} />
              <div className="sm:col-span-2">
                <Input label="Address" value={formData?.address} onChange={(e) => handleInputChange('address', e?.target?.value)} />
              </div>
              <Input label="Emergency Contact" value={formData?.emergencyContact} onChange={(e) => handleInputChange('emergencyContact', e?.target?.value)} />
              <Input label="Emergency Phone" type="tel" value={formData?.emergencyPhone} onChange={(e) => handleInputChange('emergencyPhone', e?.target?.value)} />
            </div>
          )}

          {/* Step 2: Employment */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Employee ID" value={formData?.employeeId} onChange={(e) => handleInputChange('employeeId', e?.target?.value)} error={errors?.employeeId} required />
              <Select label="Department" options={departmentOptions} value={formData?.department} onChange={(v) => handleInputChange('department', v)} error={errors?.department} />
              <Select label="Role" options={roleOptions} value={formData?.role} onChange={(v) => handleInputChange('role', v)} error={errors?.role} />
              <Select label="Location" options={locationOptions} value={formData?.location} onChange={(v) => handleInputChange('location', v)} />
              <Select label="Employment Type" options={employmentTypeOptions} value={formData?.employmentType} onChange={(v) => handleInputChange('employmentType', v)} />
              <Input label="Start Date" type="date" value={formData?.startDate} onChange={(e) => handleInputChange('startDate', e?.target?.value)} />
              <Input label="Salary" type="number" value={formData?.salary} onChange={(e) => handleInputChange('salary', e?.target?.value)} placeholder="0.00" />
            </div>
          )}

          {/* Step 3: System Access */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Checkbox
                  checked={formData?.systemAccess}
                  onChange={(checked) => handleInputChange('systemAccess', checked)}
                />
                <div>
                  <div className="text-sm font-medium text-foreground">Enable System Access</div>
                  <div className="text-xs text-muted-foreground">Allow this employee to log in to the system</div>
                </div>
              </div>
              {formData?.systemAccess && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Permissions</h4>
                  <div className="space-y-2">
                    {permissionOptions?.map(perm => (
                      <label key={perm?.value} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                        <Checkbox
                          checked={formData?.permissions?.includes(perm?.value)}
                          onChange={(checked) => handlePermissionChange(perm?.value, checked)}
                        />
                        <span className="text-sm text-foreground">{perm?.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">Personal Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Name:</span> <span>{formData?.firstName} {formData?.lastName}</span></div>
                  <div><span className="text-muted-foreground">Email:</span> <span>{formData?.email}</span></div>
                  <div><span className="text-muted-foreground">Phone:</span> <span>{formData?.phone}</span></div>
                  <div><span className="text-muted-foreground">Gender:</span> <span>{formData?.gender}</span></div>
                </div>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">Employment Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">ID:</span> <span>{formData?.employeeId}</span></div>
                  <div><span className="text-muted-foreground">Department:</span> <span>{formData?.department}</span></div>
                  <div><span className="text-muted-foreground">Role:</span> <span>{formData?.role}</span></div>
                  <div><span className="text-muted-foreground">Location:</span> <span>{formData?.location}</span></div>
                  <div><span className="text-muted-foreground">Type:</span> <span>{formData?.employmentType}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-border">
          <Button variant="outline" onClick={currentStep === 1 ? onClose : handleBack}>
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button onClick={currentStep === 4 ? handleSubmit : handleNext}>
            {currentStep === 4 ? 'Create Employee' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateEmployeeModal;