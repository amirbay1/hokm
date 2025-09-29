import React from 'react';
import { Suit, HokmMode } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../constants';

interface HokmPickerProps {
  onSelect: (suit: Suit | null, mode: HokmMode) => void;
}

const HokmPicker: React.FC<HokmPickerProps> = ({ onSelect }) => {
  const suits: Suit[] = ['Spades', 'Hearts', 'Clubs', 'Diamonds'];
  const specialModes: {mode: HokmMode, label: string}[] = [
      {mode: 'Nars', label: 'نرس (2)'},
      {mode: 'AceNars', label: 'آس نرس (A2)'},
      {mode: 'Sar', label: 'سرس (A)'}
    ];

  return (
    <div className="absolute top-1/2 -translate-y-full left-1/2 -translate-x-1/2 z-50 mb-40 sm:mb-24">
      <div className="bg-green-900 bg-opacity-90 p-4 sm:p-6 rounded-lg shadow-xl border-2 border-yellow-500 backdrop-blur-sm">
        <h2 className="text-xl sm:text-2xl font-bold text-center text-yellow-300 mb-4">انتخاب حکم</h2>
        <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-4">
          {suits.map(suit => (
            <button
              key={suit}
              onClick={() => onSelect(suit, 'Normal')}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center text-5xl sm:text-6xl shadow-md transition-transform transform hover:scale-110 ${SUIT_COLORS[suit]} bg-white`}
            >
              {SUIT_SYMBOLS[suit]}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {specialModes.map(({mode, label}) => (
                 <button
                    key={mode}
                    onClick={() => onSelect(null, mode)}
                    className="p-2 sm:p-3 bg-yellow-600 text-white font-bold rounded shadow-md hover:bg-yellow-500 transition-colors text-sm sm:text-base"
                >
                    {label}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default HokmPicker;