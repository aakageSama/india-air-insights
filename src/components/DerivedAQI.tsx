// Derived AQI Component
// Shows the confidence-weighted average AQI with methodology explanation

import { DerivedAQI as DerivedAQIType, AgreementAnalysis, getAQICategory } from '@/types/aqi';

interface DerivedAQIProps {
  derived: DerivedAQIType;
  agreement: AgreementAnalysis;
}

export function DerivedAQIDisplay({ derived, agreement }: DerivedAQIProps) {
  const category = derived.value !== null ? getAQICategory(derived.value) : null;

  const getAQIColorClass = () => {
    if (!category) return 'text-muted-foreground';
    switch (category.color) {
      case 'aqi-good':
        return 'text-aqi-good';
      case 'aqi-satisfactory':
        return 'text-aqi-satisfactory';
      case 'aqi-moderate':
        return 'text-aqi-moderate';
      case 'aqi-poor':
        return 'text-aqi-poor';
      case 'aqi-verypoor':
        return 'text-aqi-verypoor';
      case 'aqi-severe':
        return 'text-aqi-severe';
      default:
        return 'text-foreground';
    }
  };

  const getAgreementClass = () => {
    switch (agreement.level) {
      case 'high':
        return 'text-freshness-fresh';
      case 'partial':
        return 'text-freshness-aging';
      case 'outlier':
        return 'text-freshness-stale';
      case 'insufficient':
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="source-card border-2 border-primary/20">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="source-tag bg-primary text-primary-foreground">DERIVED</span>
          <p className="text-xs text-muted-foreground mt-1">
            Confidence-Weighted Average
          </p>
        </div>
        <div className={`text-xs font-mono ${getAgreementClass()}`}>
          AGREEMENT: {agreement.level.toUpperCase()}
        </div>
      </div>

      {/* Derived AQI Value */}
      <div className="mb-4">
        {derived.value !== null ? (
          <div className="flex items-baseline gap-2">
            <span className={`aqi-value ${getAQIColorClass()}`}>{derived.value}</span>
            {category && (
              <span className={`text-sm font-mono ${getAQIColorClass()}`}>
                {category.label}
              </span>
            )}
          </div>
        ) : (
          <div className="aqi-value text-muted-foreground">N/A</div>
        )}
      </div>

      {/* Confidence Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs font-mono mb-1">
          <span className="text-muted-foreground">Confidence</span>
          <span>{derived.confidence}%</span>
        </div>
        <div className="h-2 bg-muted rounded overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${derived.confidence}%` }}
          />
        </div>
      </div>

      {/* Sources Used */}
      <div className="mb-3">
        <span className="data-label">Sources used:</span>
        <div className="flex gap-1 mt-1 flex-wrap">
          {derived.sources.map((source) => (
            <span key={source} className="source-tag text-xs">
              {source}
            </span>
          ))}
          {derived.sources.length === 0 && (
            <span className="text-xs text-muted-foreground">None</span>
          )}
        </div>
      </div>

      {/* Agreement Analysis */}
      <div className="info-banner mb-3">
        <div className="font-semibold mb-1">Source Agreement: {agreement.level.toUpperCase()}</div>
        <p className="text-xs">{agreement.explanation}</p>
        {agreement.spread !== null && (
          <p className="text-xs mt-1">
            Spread: <span className="font-mono">{agreement.spread}</span> AQI points
          </p>
        )}
      </div>

      {/* Methodology */}
      <details className="mt-2">
        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
          Calculation methodology
        </summary>
        <p className="text-xs text-muted-foreground mt-1 pl-2 border-l-2 border-border font-mono">
          {derived.methodology}
        </p>
      </details>

      {/* Health Implications */}
      {category && (
        <div className="mt-3 pt-3 border-t border-dashed border-border">
          <span className="data-label">Health Implication:</span>
          <p className="text-sm mt-1">{category.healthImplication}</p>
        </div>
      )}
    </div>
  );
}
