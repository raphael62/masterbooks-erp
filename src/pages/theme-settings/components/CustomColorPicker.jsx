import React, { useState } from 'react';
import { Pipette } from 'lucide-react';

const CustomColorPicker = ({ currentColor, onColorChange }) => {
  const [inputValue, setInputValue] = useState(currentColor || '#6D28D9');
  const [error, setError] = useState('');

  const isValidHex = (hex) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/?.test(hex);

  const handleInputChange = (e) => {
    const val = e?.target?.value;
    setInputValue(val);
    setError('');
    if (isValidHex(val)) {
      onColorChange(val);
    }
  };

  const handleColorPickerChange = (e) => {
    const val = e?.target?.value;
    setInputValue(val);
    setError('');
    onColorChange(val);
  };

  const handleBlur = () => {
    if (!isValidHex(inputValue)) {
      setError('Enter a valid hex color (e.g. #6D28D9)');
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center space-x-2">
          <Pipette size={14} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Custom Color</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Enter a custom hex color for your primary brand color</p>
      </div>
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              type="color"
              value={isValidHex(inputValue) ? inputValue : '#6D28D9'}
              onChange={handleColorPickerChange}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-background"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="#6D28D9"
              maxLength={7}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono"
            />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
          <div
            style={{ backgroundColor: isValidHex(inputValue) ? inputValue : '#6D28D9' }}
            className="w-10 h-10 rounded-lg border border-border flex-shrink-0"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Tip: Selecting a custom color will override the predefined theme palette.
        </p>
      </div>
    </div>
  );
};

export default CustomColorPicker;
