import React from 'react';
import { Card as CardType } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../constants';

interface CardProps {
  card: CardType;
  faceUp: boolean;
  className?: string;
  onClick?: () => void;
  isPlayable?: boolean;
}

const Card: React.FC<CardProps> = ({ card, faceUp, className = '', onClick, isPlayable }) => {
  if (!faceUp) {
    return (
      <div className={`w-16 h-24 sm:w-20 sm:h-28 bg-blue-700 rounded-lg border-2 border-blue-900 shadow-md ${className}`}>
        <div className="w-full h-full rounded-md bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center">
            <div className="w-10/12 h-5/6 border-2 border-blue-400 rounded-md"></div>
        </div>
      </div>
    );
  }

  const { suit, rank } = card;
  const suitColor = SUIT_COLORS[suit];
  const suitSymbol = SUIT_SYMBOLS[suit];

  const clickableClasses = onClick ? 'cursor-pointer transition-all duration-200 transform hover:-translate-y-2 hover:shadow-lg' : '';
  const playableClasses = isPlayable ? 'ring-2 ring-yellow-300 shadow-yellow-300/50' : '';

  return (
    <div 
        onClick={onClick}
        dir="ltr"
        className={`w-16 h-24 sm:w-20 sm:h-28 bg-white rounded-lg border border-gray-300 shadow-md p-1 flex flex-col justify-between relative ${suitColor} ${clickableClasses} ${playableClasses} ${className}`}
    >
      <div className="flex flex-col items-start">
        <div className="font-bold text-lg sm:text-xl leading-none">{rank}</div>
        <div className="text-lg sm:text-xl leading-none">{suitSymbol}</div>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl sm:text-5xl opacity-50">
        {suitSymbol}
      </div>
      <div className="flex flex-col items-end rotate-180">
        <div className="font-bold text-lg sm:text-xl leading-none">{rank}</div>
        <div className="text-lg sm:text-xl leading-none">{suitSymbol}</div>
      </div>
    </div>
  );
};

export default Card;
