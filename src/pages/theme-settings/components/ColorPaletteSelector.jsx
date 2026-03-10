import React from 'react';
import { Check } from 'lucide-react';
import { THEMES } from '../../../contexts/ThemeContext';

const ColorPaletteSelector = ({ selectedThemeId, previewThemeId, onHover, onSelect }) => {
  const themeList = Object.values(THEMES);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Color Themes</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Choose a predefined color palette</p>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        {themeList?.map((theme) => {
          const isSelected = selectedThemeId === theme?.id;
          const isPreviewing = previewThemeId === theme?.id;
          return (
            <button
              key={theme?.id}
              onClick={() => onSelect(theme?.id)}
              onMouseEnter={() => onHover(theme?.id)}
              onMouseLeave={() => onHover(selectedThemeId)}
              className={`relative flex flex-col items-start p-3 rounded-lg border-2 transition-all duration-150 text-left ${
                isSelected
                  ? 'border-foreground shadow-sm'
                  : isPreviewing
                  ? 'border-muted-foreground/50'
                  : 'border-border hover:border-muted-foreground/40'
              }`}
            >
              {/* Color Swatches */}
              <div className="flex items-center space-x-1 mb-2">
                {theme?.swatchColors?.map((color, i) => (
                  <div
                    key={i}
                    style={{ backgroundColor: color }}
                    className={`rounded-full transition-all duration-150 ${
                      i === 0 ? 'w-6 h-6' : i === 1 ? 'w-4 h-4' : 'w-3 h-3'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-foreground">{theme?.name}</span>
              <span className="text-xs text-muted-foreground font-mono mt-0.5">{theme?.primary}</span>
              {isSelected && (
                <div
                  style={{ backgroundColor: theme?.primary }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                >
                  <Check size={11} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ColorPaletteSelector;
