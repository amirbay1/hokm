import React from 'react';
import { Player, Card as CardType, GameState } from '../types';
import Card from './Card';
import { SUIT_SYMBOLS } from '../constants';

interface PlayerAreaProps {
  player: Player;
  position: 'bottom' | 'left' | 'top' | 'right';
  isCurrentPlayer: boolean;
  isRuler: boolean;
  hokm: GameState['hokm'];
  onCardPlay: (card: CardType) => void;
  validMoves: CardType[];
}

const PlayerArea: React.FC<PlayerAreaProps> = ({ player, position, isCurrentPlayer, isRuler, hokm, onCardPlay, validMoves }) => {
  const isHuman = player.isHuman;

  const getPositionClasses = () => {
    switch (position) {
      case 'top': return 'flex-col items-center';
      case 'bottom': return 'flex-col items-center';
      case 'left': return 'flex-col-reverse items-start';
      case 'right': return 'flex-col items-end';
      default: return '';
    }
  };
  
  const getHandContainerClasses = () => {
     switch (position) {
      case 'top':
      case 'bottom':
        return 'flex justify-center items-center';
      case 'left':
        return 'flex flex-col justify-center items-start -space-y-16 sm:-space-y-20';
       case 'right':
        return 'flex flex-col justify-center items-end -space-y-16 sm:-space-y-20';
      default: return '';
    }
  }

  const getCardTransform = (index: number, total: number) => {
    if (position === 'bottom') {
      const offset = (index - (total - 1) / 2) * 25; // in pixels - Increased for better visibility
      const rotation = (index - (total - 1) / 2) * 4; // in degrees
      return {
        transform: `translateX(${offset}px) rotate(${rotation}deg)`,
        transformOrigin: 'bottom center',
        zIndex: index,
      };
    }
     if (position === 'top') {
       const offset = (index - (total - 1) / 2) * 10;
       return { transform: `translateX(${offset}px)`, zIndex: total - index };
     }
    return { zIndex: index };
  };

  const hokmSymbol = hokm.mode === 'Normal' ? SUIT_SYMBOLS[hokm.suit!] : (hokm.mode === 'Nars' ? '2' : hokm.mode === 'AceNars' ? 'A2' : 'A');

  return (
    <div className={`relative flex ${getPositionClasses()}`}>
      <div className={`relative mb-2 px-3 py-1 rounded-lg shadow-md flex items-center gap-2 whitespace-nowrap ${isCurrentPlayer ? 'bg-yellow-400 text-black animate-pulse' : 'bg-black bg-opacity-40'}`}>
        {isRuler ? (
          <span className="font-bold text-sm sm:text-base">
            👑 {player.name} ({hokmSymbol})
          </span>
        ) : (
          <span className="font-bold text-sm sm:text-base">{player.name}</span>
        )}
      </div>

      <div className={`relative ${getHandContainerClasses()}`} style={{ minHeight: '120px', minWidth: '100px'}}>
        {player.hand.map((card, index) => {
            const isPlayable = validMoves.some(c => c.id === card.id);
            return (
                <div 
                    key={card.id} 
                    className={`absolute transition-all duration-300 ease-out hover:-translate-y-2`}
                    style={getCardTransform(index, player.hand.length)}
                >
                    <Card
                        card={card}
                        faceUp={isHuman}
                        onClick={isHuman && isCurrentPlayer && isPlayable ? () => onCardPlay(card) : undefined}
                        isPlayable={isHuman && isCurrentPlayer && isPlayable}
                    />
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default PlayerArea;