<script async type="module" src="https://esm.sh/react@18.3.1"></script>
<script async type="module" src="https://esm.sh/react-dom@18.3.1/client"></script>
import React from 'react';
import GameTable from './components/GameTable';
import Scoreboard from './components/Scoreboard';
import useGameLogic from './hooks/useGameLogic';

const App: React.FC = () => {
  const gameLogic = useGameLogic();
  
  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-start font-sans bg-wood-dark p-2 sm:p-4">
      {gameLogic.gameState && <Scoreboard gameState={gameLogic.gameState} onNewGame={gameLogic.initializeGame} />}
      <main className="w-full flex-grow flex justify-center overflow-hidden">
        <GameTable gameLogic={gameLogic} />
      </main>
    </div>
  );
};

export default App;