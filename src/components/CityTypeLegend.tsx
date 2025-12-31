// City Type Legend Component
// Explains the meaning of city classification colors

export function CityTypeLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs font-mono">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-sm bg-city-metro" />
        <span className="text-muted-foreground">METRO — Major urban centers (&gt;4M pop.)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-sm bg-city-tier2" />
        <span className="text-muted-foreground">TIER-2 — Growing urban centers (1-4M pop.)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-sm bg-city-industrial" />
        <span className="text-muted-foreground">INDUSTRIAL — Heavy industry hubs</span>
      </div>
    </div>
  );
}
