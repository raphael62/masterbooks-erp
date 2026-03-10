import React from 'react';


const ExecutivePerformance = ({ executives, isLoading }) => {
  const data = executives || [];

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground text-base">Executive Performance</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Target vs achievement this month</p>
        </div>
      </div>
      <div className="space-y-4">
        {isLoading
          ? Array.from({ length: 4 })?.map((_, i) => (
              <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
            ))
          : data?.map((exec) => {
              const pct = Math.min(Math.round((exec?.achieved / exec?.target) * 100), 100);
              const overTarget = exec?.achieved >= exec?.target;
              return (
                <div key={exec?.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {exec?.name?.split(' ')?.map(n => n?.[0])?.join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground leading-tight">{exec?.name}</p>
                        <p className="text-xs text-muted-foreground">{exec?.region}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        GHS {exec?.achieved?.toLocaleString('en-GB')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        of GHS {exec?.target?.toLocaleString('en-GB')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-700 ${
                          overTarget ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-500' : 'bg-red-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold w-10 text-right ${
                      overTarget ? 'text-emerald-600' : pct >= 80 ? 'text-amber-600' : 'text-red-500'
                    }`}>
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
};

export default ExecutivePerformance;
