import React, { useState } from 'react';
import { Building2, Phone, Mail, MapPin, Hash, Edit2, Trash2, FileText } from 'lucide-react';

const CompanyCard = ({ company, onEdit, onDelete }) => {
  const [hovered, setHovered] = useState(false);

  const isActive = company?.is_active !== false;

  return (
    <div
      className={`relative bg-white rounded-xl border transition-all duration-200 cursor-pointer group ${
        hovered
          ? 'border-purple-300 shadow-lg -translate-y-0.5'
          : 'border-gray-200 shadow-sm hover:shadow-md'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Action buttons - visible on hover */}
      <div
        className={`absolute top-3 right-3 flex items-center gap-1 transition-all duration-150 ${
          hovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'
        }`}
      >
        <button
          onClick={(e) => { e?.stopPropagation(); onEdit?.(company); }}
          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
          title="Edit company"
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={(e) => { e?.stopPropagation(); onDelete?.(company); }}
          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
          title="Delete company"
        >
          <Trash2 size={13} />
        </button>
      </div>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4 pr-16">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Building2 size={20} className="text-purple-700" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{company?.name}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-mono">
                <Hash size={10} />
                {company?.code}
              </span>
              <span className="text-gray-300">·</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  isActive
                    ? 'bg-green-100 text-green-700' :'bg-gray-100 text-gray-500'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                  isActive ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2">
          {company?.address && (
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <MapPin size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{company?.address}</span>
            </div>
          )}
          {company?.phone && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Phone size={12} className="text-gray-400 flex-shrink-0" />
              <span>{company?.phone}</span>
            </div>
          )}
          {company?.email && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Mail size={12} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">{company?.email}</span>
            </div>
          )}
          {company?.vat_number && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <FileText size={12} className="text-gray-400 flex-shrink-0" />
              <span className="font-mono">{company?.vat_number}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyCard;
