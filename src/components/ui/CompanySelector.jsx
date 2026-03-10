import React, { useState, useRef, useEffect } from 'react';
import Icon from '../AppIcon';
import { useCompanyLocation } from '../../contexts/CompanyLocationContext';

const CompanySelector = () => {
  const { companies, selectedCompany, setSelectedCompany, loading } = useCompanyLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef?.current && !dropdownRef?.current?.contains(e?.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 bg-muted rounded-md">
        <div className="w-3 h-3 rounded-full bg-muted-foreground/30 animate-pulse" />
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!companies?.length) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md hover:bg-primary/15 transition-all duration-200 ease-out max-w-[180px] group hover:scale-105 active:scale-95 hover:border-primary/40 hover:shadow-sm"
        title={selectedCompany?.name || 'Select Company'}
      >
        <div className="w-5 h-5 rounded bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-primary-foreground text-xs font-bold">
            {selectedCompany?.code?.charAt(0) || 'C'}
          </span>
        </div>
        <span className="text-xs font-medium text-white truncate flex-1 text-left">
          {selectedCompany?.name || 'Select Company'}
        </span>
        <Icon
          name={isOpen ? 'ChevronUp' : 'ChevronDown'}
          size={12}
          className="text-white/70 flex-shrink-0 group-hover:text-white transition-colors"
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-popover border border-border rounded-lg shadow-lg z-200 animate-fadeIn">
          <div className="p-2 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2">
              Select Company
            </p>
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {companies?.map((company) => (
              <button
                key={company?.id}
                onClick={() => {
                  setSelectedCompany(company);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 text-left hover:bg-accent transition-colors duration-100 ${
                  selectedCompany?.id === company?.id ? 'bg-primary/10' : ''
                }`}
              >
                <div className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary text-xs font-bold">
                    {company?.code?.charAt(0) || 'C'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{company?.name}</p>
                  <p className="text-xs text-muted-foreground">{company?.code}</p>
                </div>
                {selectedCompany?.id === company?.id && (
                  <Icon name="Check" size={14} className="text-primary flex-shrink-0" />
                )}
                {company?.is_default && selectedCompany?.id !== company?.id && (
                  <span className="text-xs text-muted-foreground">Default</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySelector;
