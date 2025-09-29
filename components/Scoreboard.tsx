import React from 'react';
import { GameState } from '../types';

interface ScoreboardProps {
  gameState: GameState;
  onNewGame: () => void;
}

const TeamScore: React.FC<{ name: string; gameScore: number; tricksWon: number; layout: 'default' | 'reversed' }> = ({ name, gameScore, tricksWon, layout }) => {
    
    const scoreBlock = (
        <div className="flex flex-col items-center">
            <span className="text-xs opacity-80">امتیاز</span>
            <span className="font-bold text-lg sm:text-xl text-green-300">{gameScore}</span>
        </div>
    );

    const trickBlock = (
        <div className="flex flex-col items-center">
            <span className="text-xs opacity-80">دست</span>
            <span className="font-bold text-lg sm:text-xl text-yellow-300">{tricksWon}</span>
        </div>
    );
    
    const separator = <div className="w-[1px] h-8 bg-white opacity-20"></div>;

    const scoreBoxContent = layout === 'default'
        ? (<>{trickBlock}{separator}{scoreBlock}</>)  // Default: Tricks | Score
        : (<>{scoreBlock}{separator}{trickBlock}</>); // Reversed: Score | Tricks
    
    return (
        <div className="flex items-center gap-2 sm:gap-4 text-sm sm:text-base">
            <span className="font-bold hidden sm:inline">{name}</span>
            <div className="flex items-center gap-3 bg-black bg-opacity-20 px-3 py-1 rounded">
                {scoreBoxContent}
            </div>
        </div>
    );
}

const Scoreboard: React.FC<ScoreboardProps> = ({ gameState, onNewGame }) => {
  const { teams } = gameState;

  return (
    <div className="w-full bg-wood-dark shadow-lg p-2 flex justify-between items-center z-10">
        <TeamScore 
            name="شما" 
            gameScore={teams.Team1.gameScore} 
            tricksWon={teams.Team1.roundTricksWon}
            layout="reversed" // امتیاز در چپ، دست در راست
        />

        <button onClick={onNewGame} className="text-xs sm:text-sm bg-red-700 hover:bg-red-600 px-4 py-2 rounded shadow-md transition-colors mx-2 sm:mx-4">بازی جدید</button>
        
        <TeamScore 
            name="حریف" 
            gameScore={teams.Team2.gameScore} 
            tricksWon={teams.Team2.roundTricksWon}
            layout="default" // دست در چپ، امتیاز در راست
        />
    </div>
  );
};

export default Scoreboard;
