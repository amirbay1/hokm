import React from 'react';
import GameTable from './components/GameTable';
import Scoreboard from './components/Scoreboard';
import useGameLogic from './hooks/useGameLogic';

const App: React.FC = () => {
  const gameLogic = useGameLogic();
  
  return (
    <div className="min-h-screen h-screen text-white flex flex-col items-center justify-center font-sans bg-wood-dark">
      {gameLogic.gameState && <Scoreboard gameState={gameLogic.gameState} onNewGame={gameLogic.initializeGame} />}
      <main className="w-full flex-grow flex items-center justify-center p-1 sm:p-2 overflow-hidden">
        <GameTable gameLogic={gameLogic} />
      </main>
    </div>
  );
};

export default App;