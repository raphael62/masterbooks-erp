import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const ValueDisplay = ({ value }) => {
  if (value === null || value === undefined) return <span className="text-muted-foreground italic">null</span>;
  if (typeof value === 'boolean') return <span className="text-primary">{value?.toString()}</span>;
  if (typeof value === 'number') return <span className="text-secondary">{value}</span>;
  if (typeof value === 'object') return <span className="text-muted-foreground">{JSON.stringify(value)}</span>;
  return <span className="text-success">"{String(value)}"</span>;
};

const ChangesViewer = ({ changedFields, oldData, newData, action }) => {
  const [expanded, setExpanded] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  if (action === 'INSERT') {
    const keys = newData ? Object.keys(newData)?.filter(k => !['id', 'created_at', 'updated_at']?.includes(k)) : [];
    if (keys?.length === 0) return <span className="text-xs text-muted-foreground">New record</span>;
    return (
      <div>
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-success hover:underline">
          <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={12} />
          {keys?.length} fields inserted
        </button>
        {expanded && (
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {keys?.map(k => (
              <div key={k} className="flex items-start gap-2 text-xs">
                <span className="text-muted-foreground font-mono w-32 flex-shrink-0 truncate">{k}:</span>
                <span className="text-success"><ValueDisplay value={newData?.[k]} /></span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (action === 'DELETE') {
    return <span className="text-xs text-error font-medium">Record deleted</span>;
  }

  // UPDATE
  if (!changedFields || Object.keys(changedFields)?.length === 0) {
    return <span className="text-xs text-muted-foreground">No field changes</span>;
  }

  const fields = Object.entries(changedFields);

  return (
    <div>
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-secondary hover:underline">
        <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={12} />
        {fields?.length} field{fields?.length !== 1 ? 's' : ''} changed
      </button>
      {expanded && (
        <div className="mt-2 border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50">
            <span className="text-xs font-semibold text-muted-foreground">Field Changes</span>
            <button onClick={() => setShowRaw(!showRaw)} className="text-xs text-muted-foreground hover:text-foreground">
              {showRaw ? 'Table' : 'Raw JSON'}
            </button>
          </div>
          {showRaw ? (
            <pre className="p-3 text-xs font-mono text-foreground overflow-x-auto max-h-48">
              {JSON.stringify(changedFields, null, 2)}
            </pre>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">Field</th>
                  <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">Before</th>
                  <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fields?.map(([field, change]) => (
                  <tr key={field}>
                    <td className="px-3 py-1.5 font-mono text-foreground">{field}</td>
                    <td className="px-3 py-1.5 text-error max-w-[120px] truncate">
                      <ValueDisplay value={change?.before} />
                    </td>
                    <td className="px-3 py-1.5 text-success max-w-[120px] truncate">
                      <ValueDisplay value={change?.after} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default ChangesViewer;
