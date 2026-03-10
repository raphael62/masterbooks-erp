import React from 'react';
import Icon from '../../../components/AppIcon';

const NumericKeypad = ({ isVisible, onNumberClick, onClear, onBackspace, onClose }) => {
  const keypadButtons = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['0', '.', 'clear']
  ];

  const handleButtonClick = (value) => {
    switch (value) {
      case 'clear':
        onClear();
        break;
      case 'backspace':
        onBackspace();
        break;
      default:
        onNumberClick(value);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-300 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-modal w-full max-w-sm animate-fadeIn">
        {/* Keypad Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-medium text-card-foreground">Numeric Keypad</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-accent transition-colors duration-150 ease-out"
          >
            <Icon name="X" size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Keypad Grid */}
        <div className="p-4">
          <div className="grid grid-cols-3 gap-3">
            {keypadButtons?.flat()?.map((button, index) => {
              if (button === 'clear') {
                return (
                  <button
                    key={index}
                    onClick={() => handleButtonClick('clear')}
                    className="col-span-1 h-14 bg-error text-error-foreground rounded-lg hover:bg-error/90 transition-colors duration-150 ease-out font-medium"
                  >
                    Clear
                  </button>
                );
              }

              return (
                <button
                  key={index}
                  onClick={() => handleButtonClick(button)}
                  className="h-14 bg-muted hover:bg-accent text-foreground rounded-lg transition-colors duration-150 ease-out font-medium text-lg"
                >
                  {button}
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={() => handleButtonClick('backspace')}
              className="h-12 bg-warning text-warning-foreground rounded-lg hover:bg-warning/90 transition-colors duration-150 ease-out flex items-center justify-center"
            >
              <Icon name="Delete" size={20} />
            </button>
            
            <button
              onClick={onClose}
              className="h-12 bg-success text-success-foreground rounded-lg hover:bg-success/90 transition-colors duration-150 ease-out font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NumericKeypad;