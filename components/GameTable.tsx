<script async type="module" src="https://esm.sh/react@18.3.1"></script>
<script async type="module" src="https://esm.sh/react-dom@18.3.1/client"></script>
import React, { useEffect } from 'react';
import PlayerArea from './PlayerArea';
import Card from './Card';
import HokmPicker from './HokmPicker';
import useGameLogic from '../hooks/useGameLogic';

interface GameTableProps {
    gameLogic: ReturnType<typeof useGameLogic>;
}

const GameTable: React.FC<GameTableProps> = ({ gameLogic }) => {
  const { gameState, handlePlayCard, getValidMoves, handleHokmSelect, initializeGame, handleBaamResponse } = gameLogic;
  
  useEffect(() => {
    initializeGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!gameState) {
    return <div className="text-center text-xl">در حال بارگذاری بازی...</div>;
  }
  
  const { players, phase, ruler, currentPlayer, currentTrick, teams, roundWinner } = gameState;
  const humanPlayer = players[1];
  const validMoves = getValidMoves(humanPlayer.hand, currentTrick.leadSuit);

  const renderPlayerArea = (playerId: 1 | 2 | 3 | 4) => {
    const player = players[playerId];
    if (!player) return null;
    
    const positionMap = { 1: 'bottom', 2: 'right', 3: 'top', 4: 'left' };
    
    return (
        <PlayerArea 
            player={player}
            position={positionMap[playerId] as 'bottom' | 'left' | 'top' | 'right'}
            isCurrentPlayer={currentPlayer === playerId}
            isRuler={ruler === playerId}
            hokm={gameState.hokm}
            onCardPlay={(card) => handlePlayCard(playerId, card)}
            validMoves={playerId === 1 ? validMoves : []}
        />
    )
  }
  
  return (
    <div className="w-full aspect-[5/4] max-w-7xl max-h-[90vh] sm:max-h-[1000px] relative bg-felt-green rounded-xl md:rounded-3xl border-4 md:border-8 border-wood-light shadow-2xl">
        {phase === 'GAME_OVER' && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50 rounded-lg md:rounded-2xl">
                <div className="text-2xl sm:text-4xl font-bold mb-4 text-yellow-400">{gameState.message}</div>
                <div className="text-lg sm:text-2xl mb-6">امتیاز نهایی: {teams.Team1.gameScore} - {teams.Team2.gameScore}</div>
                <button onClick={() => initializeGame()} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded text-lg sm:text-xl font-bold">بازی مجدد</button>
            </div>
        )}
        {phase === 'HOKM_SELECTION' && ruler === 1 && <HokmPicker onSelect={handleHokmSelect} />}

        {phase === 'BAAM_PROMPT' && roundWinner === 'Team1' && (
             <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50 rounded-lg md:rounded-2xl">
                <div className="text-xl sm:text-3xl font-bold mb-4 text-yellow-400">کت! آیا درخواست بام دارید؟</div>
                <div className="flex gap-4">
                  <button onClick={() => handleBaamResponse(true)} className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded text-lg sm:text-xl font-bold">بله</button>
                  <button onClick={() => handleBaamResponse(false)} className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded text-lg sm:text-xl font-bold">خیر</button>
                </div>
            </div>
        )}
        
        {/* Responsive Player Grid */}
        <div className="absolute inset-0 grid grid-cols-5 grid-rows-3 p-1 sm:p-4">
            <div className="col-start-3 row-start-1 flex justify-center items-start pt-2">{renderPlayerArea(3)}</div>
            <div className="col-start-1 row-start-2 flex justify-start items-center pl-2">{renderPlayerArea(4)}</div>
            <div className="col-start-5 row-start-2 flex justify-end items-center pr-2">{renderPlayerArea(2)}</div>
            <div className="col-start-3 row-start-3 flex justify-center items-end pb-2">{renderPlayerArea(1)}</div>

            {/* Trick pile */}
            <div className="col-start-3 row-start-2 flex justify-center items-center">
                <div className="relative w-32 h-32 sm:w-48 sm:h-48">
                {currentTrick.cards.map((played) => {
                    const positionClasses = {
                        1: 'translate-y-8 sm:translate-y-14', // bottom
                        2: '-translate-x-8 sm:-translate-x-14', // right
                        3: '-translate-y-8 sm:-translate-y-14', // top
                        4: 'translate-x-8 sm:translate-x-14', // left
                    };
                    return (
                        <div key={played.card.id} className={`absolute flex items-center justify-center inset-0`}>
                            <div className={`transform transition-all duration-300 ${positionClasses[played.player]}`}>
                                <div className="scale-90 sm:scale-100"><Card card={played.card} faceUp={true} /></div>
                            </div>
                        </div>
                    )
                })}
                </div>
            </div>
        </div>
    </div>
  );
};

export default GameTable;