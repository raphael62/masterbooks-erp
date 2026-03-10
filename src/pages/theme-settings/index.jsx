import React, { useState, useCallback } from 'react';
import { Check, RotateCcw, Save, Palette } from 'lucide-react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { useTheme } from '../../contexts/ThemeContext';
import ThemePreviewPanel from './components/ThemePreviewPanel';
import ColorPaletteSelector from './components/ColorPaletteSelector';
import CustomColorPicker from './components/CustomColorPicker';

const ThemeSettings = () => {
  const { currentThemeId, saving, saveTheme, resetTheme, applyTheme } = useTheme();
  const [selectedThemeId, setSelectedThemeId] = useState(currentThemeId);
  const [previewThemeId, setPreviewThemeId] = useState(currentThemeId);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [customColor, setCustomColor] = useState('');

  const handleHover = useCallback((themeId) => {
    setPreviewThemeId(themeId);
    applyTheme(themeId);
  }, [applyTheme]);

  const handleSelect = useCallback((themeId) => {
    setSelectedThemeId(themeId);
    setPreviewThemeId(themeId);
    applyTheme(themeId);
    setCustomColor('');
  }, [applyTheme]);

  const handleCustomColor = useCallback((color) => {
    setCustomColor(color);
    // Apply custom color directly to CSS vars for preview
    document.documentElement?.style?.setProperty('--color-primary', color);
    document.documentElement?.style?.setProperty('--color-ring', color);
  }, []);

  const handleSave = async () => {
    setSaveError('');
    setSaveSuccess(false);
    const { error } = await saveTheme(selectedThemeId);
    if (error) {
      setSaveError('Failed to save preferences. Please try again.');
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleReset = async () => {
    setSaveError('');
    setSaveSuccess(false);
    setSelectedThemeId('purple');
    setPreviewThemeId('purple');
    setCustomColor('');
    const { error } = await resetTheme();
    if (error) {
      setSaveError('Failed to reset theme. Please try again.');
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <BreadcrumbNavigation />

        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-1">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Palette size={16} className="text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Theme Settings</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-11">
            Customize the color scheme across your entire MasterBooks ERP application
          </p>
        </div>

        {/* Status Messages */}
        {saveSuccess && (
          <div className="mb-4 flex items-center space-x-2 px-4 py-3 bg-success/10 border border-success/20 rounded-lg">
            <Check size={16} className="text-success" />
            <span className="text-sm text-success font-medium">Theme preferences saved successfully!</span>
          </div>
        )}
        {saveError && (
          <div className="mb-4 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <span className="text-sm text-destructive">{saveError}</span>
          </div>
        )}

        {/* Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Live Preview (60%) */}
          <div className="lg:col-span-3 space-y-4">
            <ThemePreviewPanel previewThemeId={previewThemeId} />
          </div>

          {/* Right: Controls (40%) */}
          <div className="lg:col-span-2 space-y-4">
            <ColorPaletteSelector
              selectedThemeId={selectedThemeId}
              previewThemeId={previewThemeId}
              onHover={handleHover}
              onSelect={handleSelect}
            />

            <CustomColorPicker
              currentColor={customColor}
              onColorChange={handleCustomColor}
            />

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Save Preferences</span>
                  </>
                )}
              </button>
              <button
                onClick={handleReset}
                disabled={saving}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-muted text-foreground rounded-lg font-medium text-sm hover:bg-accent transition-colors disabled:opacity-60"
              >
                <RotateCcw size={15} />
                <span>Reset to Default (Purple)</span>
              </button>
            </div>

            {/* Info Note */}
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Tip:</span> Hover over a theme to preview it instantly. Click to select, then save to persist your preference. Theme changes apply across all screens immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ThemeSettings;
