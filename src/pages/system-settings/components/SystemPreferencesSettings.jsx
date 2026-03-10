import React, { useState } from 'react';

import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const SystemPreferencesSettings = () => {
  const [preferences, setPreferences] = useState({
    // Regional Settings
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    numberFormat: "1,000.00",
    currency: "GHS",
    currencyPosition: "before",
    timezone: "Africa/Accra",
    language: "en",
    
    // Business Settings
    fiscalYearStart: "01-01",
    workingDaysStart: "monday",
    workingDaysEnd: "friday",
    workingHoursStart: "08:00",
    workingHoursEnd: "17:00",
    
    // System Behavior
    autoSaveInterval: 30,
    sessionTimeout: 120,
    maxLoginAttempts: 5,
    passwordExpiry: 90,
    enableAutoBackup: true,
    backupFrequency: "daily",
    backupRetention: 30,
    
    // Offline Settings
    syncInterval: 5,
    maxOfflineData: 1000,
    enableOfflineMode: true,
    autoSyncOnConnection: true,
    conflictResolution: "server_wins",
    
    // Notification Settings
    enableEmailNotifications: true,
    enableSmsNotifications: false,
    enablePushNotifications: true,
    lowStockThreshold: 10,
    creditLimitWarning: 80,
    
    // Security Settings
    enableTwoFactor: false,
    requirePasswordChange: true,
    enableAuditLog: true,
    enableDataEncryption: true,
    allowRemoteAccess: true,
    
    // Integration Settings
    enableBarcodeScanning: false,
    enableMobilePayments: true,
    enablePrintIntegration: true,
    enableEmailIntegration: true,
    enableSmsIntegration: false
  });

  const [isLoading, setIsLoading] = useState(false);

  const dateFormats = [
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/12/2025)" },
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY (12/31/2025)" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2025-12-31)" },
    { value: "DD-MM-YYYY", label: "DD-MM-YYYY (31-12-2025)" }
  ];

  const timeFormats = [
    { value: "12h", label: "12 Hour (3:30 PM)" },
    { value: "24h", label: "24 Hour (15:30)" }
  ];

  const numberFormats = [
    { value: "1,000.00", label: "1,000.00 (Comma separator)" },
    { value: "1.000,00", label: "1.000,00 (European format)" },
    { value: "1 000.00", label: "1 000.00 (Space separator)" }
  ];

  const currencies = [
    { value: "GHS", label: "Ghana Cedis (GHS)" },
    { value: "USD", label: "US Dollars (USD)" },
    { value: "EUR", label: "Euros (EUR)" },
    { value: "GBP", label: "British Pounds (GBP)" }
  ];

  const currencyPositions = [
    { value: "before", label: "Before amount (GHS 100.00)" },
    { value: "after", label: "After amount (100.00 GHS)" }
  ];

  const timezones = [
    { value: "Africa/Accra", label: "Ghana Standard Time (GMT)" },
    { value: "UTC", label: "Coordinated Universal Time (UTC)" },
    { value: "Africa/Lagos", label: "West Africa Time (WAT)" }
  ];

  const languages = [
    { value: "en", label: "English" },
    { value: "tw", label: "Twi" },
    { value: "ga", label: "Ga" },
    { value: "fr", label: "French" }
  ];

  const workingDays = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" }
  ];

  const backupFrequencies = [
    { value: "hourly", label: "Every Hour" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" }
  ];

  const conflictResolutions = [
    { value: "server_wins", label: "Server Wins (Overwrite local)" },
    { value: "client_wins", label: "Client Wins (Keep local)" },
    { value: "manual", label: "Manual Resolution (Ask user)" },
    { value: "timestamp", label: "Latest Timestamp Wins" }
  ];

  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      console.log('Preferences saved:', preferences);
      setIsLoading(false);
    }, 1500);
  };

  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to reset all preferences to default values?')) {
      // Reset to default values
      setPreferences({
        dateFormat: "DD/MM/YYYY",
        timeFormat: "24h",
        numberFormat: "1,000.00",
        currency: "GHS",
        currencyPosition: "before",
        timezone: "Africa/Accra",
        language: "en",
        fiscalYearStart: "01-01",
        workingDaysStart: "monday",
        workingDaysEnd: "friday",
        workingHoursStart: "08:00",
        workingHoursEnd: "17:00",
        autoSaveInterval: 30,
        sessionTimeout: 120,
        maxLoginAttempts: 5,
        passwordExpiry: 90,
        enableAutoBackup: true,
        backupFrequency: "daily",
        backupRetention: 30,
        syncInterval: 5,
        maxOfflineData: 1000,
        enableOfflineMode: true,
        autoSyncOnConnection: true,
        conflictResolution: "server_wins",
        enableEmailNotifications: true,
        enableSmsNotifications: false,
        enablePushNotifications: true,
        lowStockThreshold: 10,
        creditLimitWarning: 80,
        enableTwoFactor: false,
        requirePasswordChange: true,
        enableAuditLog: true,
        enableDataEncryption: true,
        allowRemoteAccess: true,
        enableBarcodeScanning: false,
        enableMobilePayments: true,
        enablePrintIntegration: true,
        enableEmailIntegration: true,
        enableSmsIntegration: false
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">System Preferences</h3>
          <p className="text-sm text-muted-foreground">
            Configure system behavior and regional settings
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={handleResetToDefaults}
            iconName="RotateCcw"
            iconPosition="left"
          >
            Reset to Defaults
          </Button>
          <Button 
            variant="default" 
            onClick={handleSavePreferences}
            loading={isLoading}
            iconName="Save"
            iconPosition="left"
          >
            Save Preferences
          </Button>
        </div>
      </div>
      {/* Regional Settings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="font-medium text-foreground mb-4">Regional Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Date Format"
            options={dateFormats}
            value={preferences?.dateFormat}
            onChange={(value) => handlePreferenceChange('dateFormat', value)}
          />
          <Select
            label="Time Format"
            options={timeFormats}
            value={preferences?.timeFormat}
            onChange={(value) => handlePreferenceChange('timeFormat', value)}
          />
          <Select
            label="Number Format"
            options={numberFormats}
            value={preferences?.numberFormat}
            onChange={(value) => handlePreferenceChange('numberFormat', value)}
          />
          <Select
            label="Currency"
            options={currencies}
            value={preferences?.currency}
            onChange={(value) => handlePreferenceChange('currency', value)}
          />
          <Select
            label="Currency Position"
            options={currencyPositions}
            value={preferences?.currencyPosition}
            onChange={(value) => handlePreferenceChange('currencyPosition', value)}
          />
          <Select
            label="Timezone"
            options={timezones}
            value={preferences?.timezone}
            onChange={(value) => handlePreferenceChange('timezone', value)}
          />
          <Select
            label="Language"
            options={languages}
            value={preferences?.language}
            onChange={(value) => handlePreferenceChange('language', value)}
          />
        </div>
      </div>
      {/* Business Settings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="font-medium text-foreground mb-4">Business Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fiscal Year Start"
            type="text"
            value={preferences?.fiscalYearStart}
            onChange={(e) => handlePreferenceChange('fiscalYearStart', e?.target?.value)}
            description="Format: MM-DD (e.g., 01-01 for January 1st)"
          />
          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Working Days Start"
              options={workingDays}
              value={preferences?.workingDaysStart}
              onChange={(value) => handlePreferenceChange('workingDaysStart', value)}
            />
            <Select
              label="Working Days End"
              options={workingDays}
              value={preferences?.workingDaysEnd}
              onChange={(value) => handlePreferenceChange('workingDaysEnd', value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Working Hours Start"
              type="time"
              value={preferences?.workingHoursStart}
              onChange={(e) => handlePreferenceChange('workingHoursStart', e?.target?.value)}
            />
            <Input
              label="Working Hours End"
              type="time"
              value={preferences?.workingHoursEnd}
              onChange={(e) => handlePreferenceChange('workingHoursEnd', e?.target?.value)}
            />
          </div>
        </div>
      </div>
      {/* System Behavior */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="font-medium text-foreground mb-4">System Behavior</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Auto-save Interval (seconds)"
            type="number"
            value={preferences?.autoSaveInterval}
            onChange={(e) => handlePreferenceChange('autoSaveInterval', parseInt(e?.target?.value))}
            description="How often to auto-save form data"
          />
          <Input
            label="Session Timeout (minutes)"
            type="number"
            value={preferences?.sessionTimeout}
            onChange={(e) => handlePreferenceChange('sessionTimeout', parseInt(e?.target?.value))}
            description="Automatic logout after inactivity"
          />
          <Input
            label="Max Login Attempts"
            type="number"
            value={preferences?.maxLoginAttempts}
            onChange={(e) => handlePreferenceChange('maxLoginAttempts', parseInt(e?.target?.value))}
            description="Account lockout after failed attempts"
          />
          <Input
            label="Password Expiry (days)"
            type="number"
            value={preferences?.passwordExpiry}
            onChange={(e) => handlePreferenceChange('passwordExpiry', parseInt(e?.target?.value))}
            description="Force password change after days"
          />
        </div>
        
        <div className="mt-6 space-y-4">
          <Checkbox
            label="Enable Auto Backup"
            description="Automatically backup system data"
            checked={preferences?.enableAutoBackup}
            onChange={(e) => handlePreferenceChange('enableAutoBackup', e?.target?.checked)}
          />
          {preferences?.enableAutoBackup && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
              <Select
                label="Backup Frequency"
                options={backupFrequencies}
                value={preferences?.backupFrequency}
                onChange={(value) => handlePreferenceChange('backupFrequency', value)}
              />
              <Input
                label="Backup Retention (days)"
                type="number"
                value={preferences?.backupRetention}
                onChange={(e) => handlePreferenceChange('backupRetention', parseInt(e?.target?.value))}
                description="How long to keep backup files"
              />
            </div>
          )}
        </div>
      </div>
      {/* Offline Settings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="font-medium text-foreground mb-4">Offline & Sync Settings</h4>
        <div className="space-y-4">
          <Checkbox
            label="Enable Offline Mode"
            description="Allow application to work without internet connection"
            checked={preferences?.enableOfflineMode}
            onChange={(e) => handlePreferenceChange('enableOfflineMode', e?.target?.checked)}
          />
          
          {preferences?.enableOfflineMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
              <Input
                label="Sync Interval (minutes)"
                type="number"
                value={preferences?.syncInterval}
                onChange={(e) => handlePreferenceChange('syncInterval', parseInt(e?.target?.value))}
                description="How often to sync when online"
              />
              <Input
                label="Max Offline Records"
                type="number"
                value={preferences?.maxOfflineData}
                onChange={(e) => handlePreferenceChange('maxOfflineData', parseInt(e?.target?.value))}
                description="Maximum records to store offline"
              />
              <div className="md:col-span-2">
                <Select
                  label="Conflict Resolution"
                  options={conflictResolutions}
                  value={preferences?.conflictResolution}
                  onChange={(value) => handlePreferenceChange('conflictResolution', value)}
                  description="How to handle data conflicts during sync"
                />
              </div>
              <div className="md:col-span-2">
                <Checkbox
                  label="Auto-sync on Connection"
                  description="Automatically sync when internet connection is restored"
                  checked={preferences?.autoSyncOnConnection}
                  onChange={(e) => handlePreferenceChange('autoSyncOnConnection', e?.target?.checked)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Notification Settings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="font-medium text-foreground mb-4">Notification Settings</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Checkbox
              label="Email Notifications"
              description="Send notifications via email"
              checked={preferences?.enableEmailNotifications}
              onChange={(e) => handlePreferenceChange('enableEmailNotifications', e?.target?.checked)}
            />
            <Checkbox
              label="SMS Notifications"
              description="Send notifications via SMS"
              checked={preferences?.enableSmsNotifications}
              onChange={(e) => handlePreferenceChange('enableSmsNotifications', e?.target?.checked)}
            />
            <Checkbox
              label="Push Notifications"
              description="Browser push notifications"
              checked={preferences?.enablePushNotifications}
              onChange={(e) => handlePreferenceChange('enablePushNotifications', e?.target?.checked)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Low Stock Threshold"
              type="number"
              value={preferences?.lowStockThreshold}
              onChange={(e) => handlePreferenceChange('lowStockThreshold', parseInt(e?.target?.value))}
              description="Alert when stock falls below this level"
            />
            <Input
              label="Credit Limit Warning (%)"
              type="number"
              value={preferences?.creditLimitWarning}
              onChange={(e) => handlePreferenceChange('creditLimitWarning', parseInt(e?.target?.value))}
              description="Alert when credit usage exceeds percentage"
            />
          </div>
        </div>
      </div>
      {/* Security Settings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="font-medium text-foreground mb-4">Security Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Checkbox
            label="Enable Two-Factor Authentication"
            description="Require 2FA for all user logins"
            checked={preferences?.enableTwoFactor}
            onChange={(e) => handlePreferenceChange('enableTwoFactor', e?.target?.checked)}
          />
          <Checkbox
            label="Require Password Change"
            description="Force users to change default passwords"
            checked={preferences?.requirePasswordChange}
            onChange={(e) => handlePreferenceChange('requirePasswordChange', e?.target?.checked)}
          />
          <Checkbox
            label="Enable Audit Log"
            description="Log all user actions for security"
            checked={preferences?.enableAuditLog}
            onChange={(e) => handlePreferenceChange('enableAuditLog', e?.target?.checked)}
          />
          <Checkbox
            label="Enable Data Encryption"
            description="Encrypt sensitive data at rest"
            checked={preferences?.enableDataEncryption}
            onChange={(e) => handlePreferenceChange('enableDataEncryption', e?.target?.checked)}
          />
          <Checkbox
            label="Allow Remote Access"
            description="Enable access from external networks"
            checked={preferences?.allowRemoteAccess}
            onChange={(e) => handlePreferenceChange('allowRemoteAccess', e?.target?.checked)}
          />
        </div>
      </div>
      {/* Integration Settings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="font-medium text-foreground mb-4">Integration Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Checkbox
            label="Enable Barcode Scanning"
            description="Support for barcode scanner devices"
            checked={preferences?.enableBarcodeScanning}
            onChange={(e) => handlePreferenceChange('enableBarcodeScanning', e?.target?.checked)}
          />
          <Checkbox
            label="Enable Mobile Payments"
            description="Support mobile money and card payments"
            checked={preferences?.enableMobilePayments}
            onChange={(e) => handlePreferenceChange('enableMobilePayments', e?.target?.checked)}
          />
          <Checkbox
            label="Enable Print Integration"
            description="Support for receipt and document printing"
            checked={preferences?.enablePrintIntegration}
            onChange={(e) => handlePreferenceChange('enablePrintIntegration', e?.target?.checked)}
          />
          <Checkbox
            label="Enable Email Integration"
            description="Send invoices and reports via email"
            checked={preferences?.enableEmailIntegration}
            onChange={(e) => handlePreferenceChange('enableEmailIntegration', e?.target?.checked)}
          />
          <Checkbox
            label="Enable SMS Integration"
            description="Send notifications and alerts via SMS"
            checked={preferences?.enableSmsIntegration}
            onChange={(e) => handlePreferenceChange('enableSmsIntegration', e?.target?.checked)}
          />
        </div>
      </div>
    </div>
  );
};

export default SystemPreferencesSettings;