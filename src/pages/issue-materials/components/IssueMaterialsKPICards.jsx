import React from 'react';
import Icon from '../../../components/AppIcon';

const KPICard = ({ title, value, subtitle, icon, color, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-3" />
        <div className="h-8 bg-muted rounded w-1/2 mb-2" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </div>
    );
  }
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
          <p className={`text-2xl font-bold mt-1 tabular-nums ${color || 'text-foreground'}`}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${color ? color?.replace('text-', 'bg-')?.replace('-600', '-100')?.replace('-700', '-100') : 'bg-primary/10'}`}>
          <Icon name={icon} size={18} className={color || 'text-primary'} />
        </div>
      </div>
    </div>
  );
};

const IssueMaterialsKPICards = ({ kpis, isLoading }) => {
  const cards = [
    {
      title: 'Total Issues Today',
      value: isLoading ? '—' : (kpis?.totalToday ?? 0),
      subtitle: 'Material issue transactions',
      icon: 'ClipboardList',
      color: 'text-blue-600'
    },
    {
      title: 'Total Qty Issued (Cases)',
      value: isLoading ? '—' : (kpis?.totalQtyIssued ?? 0)?.toLocaleString(),
      subtitle: 'Cases issued today',
      icon: 'Package',
      color: 'text-green-600'
    },
    {
      title: 'Total Issues This Month',
      value: isLoading ? '—' : (kpis?.totalThisMonth ?? 0),
      subtitle: 'Month-to-date issues',
      icon: 'Calendar',
      color: 'text-purple-600'
    },
    {
      title: 'Pending Confirmations',
      value: isLoading ? '—' : (kpis?.pendingConfirmations ?? 0),
      subtitle: 'Draft issues awaiting confirm',
      icon: 'Clock',
      color: kpis?.pendingConfirmations > 0 ? 'text-orange-600' : 'text-muted-foreground'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards?.map((card, i) => (
        <KPICard key={i} {...card} isLoading={isLoading} />
      ))}
    </div>
  );
};

export default IssueMaterialsKPICards;
