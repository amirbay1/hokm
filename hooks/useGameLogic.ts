import { useState, useCallback, useEffect } from 'react';
import { GameState, Card, PlayerId, Suit, HokmMode, Player, TeamState, Trick, GamePhase } from '../types';
import { SUITS, RANKS, PLAYER_CONFIG_FA, RANK_VALUES_NORMAL, RANK_VALUES_NARS, RANK_VALUES_ACENARS, NEXT_PLAYER_MAP, SUIT_SYMBOLS } from '../constants';
import * as aiService from '../services/aiService';

const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const getCardValue = useCallback((card: Card, leadSuit: Suit | null, hokm: GameState['hokm']): number => {
    const isHokm = card.suit === hokm.suit && hokm.mode === 'Normal';
    const isLead = card.suit === leadSuit;

    let rankValue = 0;
    switch (hokm.mode) {
        case 'Nars':
            rankValue = RANK_VALUES_NARS[card.rank];
            break;
        case 'AceNars':
            rankValue = RANK_VALUES_ACENARS[card.rank];
            break;
        default: // Normal or Sar
            rankValue = RANK_VALUES_NORMAL[card.rank];
            break;
    }

    if (hokm.mode === 'Sar') {
        if (isLead) return rankValue;
        return 0;
    }

    if (isHokm) return rankValue + 100;
    if (isLead) return rankValue;
    return 0;
  }, []);

  const determineTrickWinner = useCallback((trick: Trick, hokm: GameState['hokm']): PlayerId => {
    if (trick.cards.length === 0) throw new Error("Cannot determine winner of an empty trick.");
    
    return trick.cards.reduce((winningCard, currentCard) => {
        const winningValue = getCardValue(winningCard.card, trick.leadSuit, hokm);
        const currentValue = getCardValue(currentCard.card, trick.leadSuit, hokm);
        return currentValue > winningValue ? currentCard : winningCard;
    }).player;
  }, [getCardValue]);

  const getValidMoves = useCallback((hand: Card[], leadSuit: Suit | null): Card[] => {
    if (!leadSuit) return hand;
    const cardsInLeadSuit = hand.filter(card => card.suit === leadSuit);
    return cardsInLeadSuit.length > 0 ? cardsInLeadSuit : hand;
  }, []);

  const initializeGame = useCallback((
    initialTeams: Record<'Team1'|'Team2', TeamState> = { 
        Team1: { gameScore: 0, roundTricksWon: 0 }, 
        Team2: { gameScore: 0, roundTricksWon: 0 } 
    },
    initialDealer?: PlayerId
    ) => {
    
    const dealer = initialDealer ?? (Math.floor(Math.random() * 4) + 1) as PlayerId;
    const ruler = NEXT_PLAYER_MAP[dealer] as PlayerId;
    console.log(`--- NEW GAME --- Dealer: ${dealer}, Ruler: ${ruler}`);

    const deck: Card[] = [];
    SUITS.forEach(suit => RANKS.forEach(rank => deck.push({ id: `${rank}-${suit}`, suit, rank })));
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    const players: Record<PlayerId, Player> = { 1: null!, 2: null!, 3: null!, 4: null! };
    for (const id in PLAYER_CONFIG_FA) {
        const playerId = parseInt(id) as PlayerId;
        players[playerId] = { ...PLAYER_CONFIG_FA[playerId], id: playerId, hand: [] };
    }

    setGameState({
      deck,
      players,
      phase: 'DEALING_INITIAL',
      dealer,
      ruler,
      currentPlayer: ruler,
      hokm: { suit: null, mode: 'Normal' },
      currentTrick: { cards: [], leadSuit: null, winner: null, starter: ruler },
      teams: {
        Team1: { ...initialTeams.Team1, roundTricksWon: 0 },
        Team2: { ...initialTeams.Team2, roundTricksWon: 0 }
      },
      trickHistory: [],
      voidSuits: { 1: {}, 2: {}, 3: {}, 4: {} },
      playedCards: [],
      message: `کارت‌ها در حال پخش شدن...`,
      roundWinner: null,
      roundPoints: 0,
    });
  }, []);

  const handleHokmSelect = useCallback((suit: Suit | null, mode: HokmMode) => {
    setGameState(prev => {
        if (!prev || prev.phase !== 'HOKM_SELECTION') return prev;
        
        console.log(`Hokm selected: ${mode}, ${suit}`);
        
        const hokmSymbol = mode === 'Normal' ? SUIT_SYMBOLS[suit!] : (mode === 'Nars' ? '(2)' : mode === 'AceNars' ? '(A2)' : '(A)');
        return {
            ...prev,
            hokm: { suit, mode },
            phase: 'DEALING_REMAINING',
            message: `حکم ${hokmSymbol} است! در حال پخش باقی کارت‌ها...`,
        };
    });
  }, []);

  const handlePlayCard = useCallback((playerId: PlayerId, card: Card) => {
    setGameState(prev => {
        if (!prev || prev.phase !== 'TRICK_PLAY' || prev.currentPlayer !== playerId) return prev;

        const player = prev.players[playerId];
        const validMoves = getValidMoves(player.hand, prev.currentTrick.leadSuit);
        if (!validMoves.some(c => c.id === card.id)) {
            console.error("Invalid move attempted by player", playerId, card);
            return prev;
        }
        
        console.log(`Player ${playerId} plays ${card.id}`);

        const newHand = player.hand.filter(c => c.id !== card.id);
        const newPlayers = { ...prev.players, [playerId]: { ...player, hand: newHand } };
        
        const newTrick = { ...prev.currentTrick };
        newTrick.cards.push({ player: playerId, card });
        
        let newVoidSuits = prev.voidSuits;
        if (newTrick.cards.length === 1) {
            newTrick.leadSuit = card.suit;
        } else if (card.suit !== newTrick.leadSuit) {
            newVoidSuits = { ...prev.voidSuits, [playerId]: { ...prev.voidSuits[playerId], [newTrick.leadSuit!]: true }};
            console.log(`Player ${playerId} is now void in ${newTrick.leadSuit}`);
        }
        
        const nextPlayerId = NEXT_PLAYER_MAP[prev.currentPlayer] as PlayerId;

        if (newTrick.cards.length === 4) {
            return {
                ...prev,
                players: newPlayers,
                currentTrick: newTrick,
                voidSuits: newVoidSuits,
                playedCards: [...prev.playedCards, card],
                phase: 'TRICK_EVALUATION',
                message: 'در حال بررسی برنده دست...'
            };
        } else {
            return {
                ...prev,
                players: newPlayers,
                currentTrick: newTrick,
                voidSuits: newVoidSuits,
                playedCards: [...prev.playedCards, card],
                currentPlayer: nextPlayerId,
                message: `نوبت ${prev.players[nextPlayerId].name}...`
            };
        }
    });
  }, [getValidMoves]);

  const handleBaamResponse = useCallback((response: boolean) => {
    setGameState(prev => {
      if (!prev || prev.phase !== 'BAAM_PROMPT') return prev;
      if (response) {
        console.log("Team", prev.roundWinner, "is going for Baam!");
        return {
          ...prev,
          phase: 'TRICK_PLAY', // Continue playing
          message: `تیم ${prev.roundWinner === 'Team1' ? 'شما' : 'حریف'} بام را اعلام کرد! باید تمام دست‌ها را ببرند.`
        }
      } else {
        console.log("Team", prev.roundWinner, "declined Baam.");
        const newTeams = JSON.parse(JSON.stringify(prev.teams));
        newTeams[prev.roundWinner!].gameScore += prev.roundPoints;
        return { ...prev, phase: 'ROUND_END', teams: newTeams, message: `دور با امتیاز ${prev.roundPoints} برای تیم ${prev.roundWinner === 'Team1' ? 'شما' : 'حریف'} تمام شد.` };
      }
    });
  }, []);

  // Main Game Loop Effect - REFACTORED TO PREVENT STALE STATE
  useEffect(() => {
    if (!gameState) return;
    const { phase } = gameState;

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const run = (fn: () => void, delay: number) => timeouts.push(setTimeout(fn, delay));

    const processStateUpdate = (updater: (prevState: GameState) => GameState) => {
        setGameState(prev => prev ? updater(prev) : null);
    };

    if (phase === 'DEALING_INITIAL') {
      run(() => processStateUpdate(prev => {
        if (prev.phase !== 'DEALING_INITIAL') return prev;
        const deck = [...prev.deck];
        const players: Record<PlayerId, Player> = JSON.parse(JSON.stringify(prev.players));
        let pId = prev.dealer;
        for (let i = 0; i < 20; i++) {
          pId = NEXT_PLAYER_MAP[pId] as PlayerId;
          players[pId].hand.push(deck.pop()!);
        }
        console.log("Dealt 5 cards to each player.");
        return {
          ...prev,
          deck,
          players,
          phase: 'HOKM_SELECTION',
          message: `نوبت ${players[prev.ruler].name} برای انتخاب حکم است.`
        };
      }), 1000);
    } else if (phase === 'HOKM_SELECTION' && !gameState.players[gameState.ruler].isHuman) {
      run(() => processStateUpdate(prev => {
        if (prev.phase !== 'HOKM_SELECTION' || prev.players[prev.ruler].isHuman) return prev;
        const aiHokm = aiService.chooseHokm(prev.players[prev.ruler].hand);
        
        const { suit, mode } = aiHokm;
        console.log(`[AI] Hokm selected: ${mode}, ${suit}`);
        const hokmSymbol = mode === 'Normal' ? SUIT_SYMBOLS[suit!] : (mode === 'Nars' ? '(2)' : mode === 'AceNars' ? '(A2)' : '(A)');
        return { ...prev, hokm: { suit, mode }, phase: 'DEALING_REMAINING', message: `حکم ${hokmSymbol} است! در حال پخش باقی کارت‌ها...` };
      }), 2000);
    } else if (phase === 'DEALING_REMAINING') {
      run(() => processStateUpdate(prev => {
        if (prev.phase !== 'DEALING_REMAINING') return prev;
        const deck = [...prev.deck];
        const players: Record<PlayerId, Player> = JSON.parse(JSON.stringify(prev.players));
        let pId = prev.dealer;
        while (deck.length > 0) {
          pId = NEXT_PLAYER_MAP[pId] as PlayerId;
          players[pId].hand.push(deck.pop()!);
        }
        console.log("Dealt remaining cards. Sorting hands...");

        const hokmSuit = prev.hokm.suit;
        const colorOrder: Record<Suit, 'Red' | 'Black'> = { Hearts: 'Red', Diamonds: 'Red', Spades: 'Black', Clubs: 'Black' };
        
        const getSuitOrder = (hs: Suit | null): Suit[] => {
            if (!hs) return SUITS;
            const hokmColor = colorOrder[hs];
            const otherSuits = SUITS.filter(s => s !== hs);
            const sortedOtherSuits: Suit[] = [];
            let lastColor = hokmColor;
            while(otherSuits.length > 0) {
                const nextSuitIndex = otherSuits.findIndex(s => colorOrder[s] !== lastColor);
                if (nextSuitIndex !== -1) {
                    const [nextSuit] = otherSuits.splice(nextSuitIndex, 1);
                    sortedOtherSuits.push(nextSuit);
                    lastColor = colorOrder[nextSuit];
                } else {
                    sortedOtherSuits.push(...otherSuits);
                    break;
                }
            }
            return [hs, ...sortedOtherSuits];
        };

        const suitOrder = getSuitOrder(hokmSuit);

        for (const player of Object.values(players)) {
            player.hand.sort((a, b) => {
                const suitIndexA = suitOrder.indexOf(a.suit);
                const suitIndexB = suitOrder.indexOf(b.suit);
                if (suitIndexA !== suitIndexB) return suitIndexA - suitIndexB;
                return RANK_VALUES_NORMAL[b.rank] - RANK_VALUES_NORMAL[a.rank];
            });
        }

        return { ...prev, deck, players, phase: 'TRICK_PLAY', message: `بازی شروع شد! نوبت ${players[prev.ruler].name}...` };
      }), 1500);
    } else if (phase === 'TRICK_PLAY' && !gameState.players[gameState.currentPlayer].isHuman) {
      run(() => processStateUpdate(prev => {
        if (prev.phase !== 'TRICK_PLAY' || !prev.currentPlayer || prev.players[prev.currentPlayer].isHuman) return prev;
        
        const aiPlayer = prev.players[prev.currentPlayer];
        const validMoves = getValidMoves(aiPlayer.hand, prev.currentTrick.leadSuit);
        const cardToPlay = aiService.playCard(aiPlayer, prev, validMoves);
        
        if (!cardToPlay) {
            console.error("[CRITICAL] AI Failed to select a card.", { player: aiPlayer, state: prev, validMoves });
            return prev; // Stall the game to prevent crash
        }
        
        // Inline handlePlayCard logic
        const playerId = prev.currentPlayer;
        const newHand = aiPlayer.hand.filter(c => c.id !== cardToPlay.id);
        const newPlayers = { ...prev.players, [playerId]: { ...aiPlayer, hand: newHand } };
        const newTrick = { ...prev.currentTrick, cards: [...prev.currentTrick.cards, { player: playerId, card: cardToPlay }] };
        let newVoidSuits = prev.voidSuits;

        if (newTrick.cards.length === 1) {
            newTrick.leadSuit = cardToPlay.suit;
        } else if (cardToPlay.suit !== newTrick.leadSuit) {
            newVoidSuits = { ...prev.voidSuits, [playerId]: { ...prev.voidSuits[playerId], [newTrick.leadSuit!]: true }};
            console.log(`Player ${playerId} is now void in ${newTrick.leadSuit}`);
        }
        
        const nextPlayerId = NEXT_PLAYER_MAP[prev.currentPlayer] as PlayerId;
        const isTrickOver = newTrick.cards.length === 4;

        return {
            ...prev,
            players: newPlayers,
            currentTrick: newTrick,
            voidSuits: newVoidSuits,
            playedCards: [...prev.playedCards, cardToPlay],
            phase: isTrickOver ? 'TRICK_EVALUATION' : 'TRICK_PLAY',
            currentPlayer: isTrickOver ? prev.currentPlayer : nextPlayerId,
            message: isTrickOver ? 'در حال بررسی برنده دست...' : `نوبت ${prev.players[nextPlayerId].name}...`
        };
      }), 1500);
    } else if (phase === 'TRICK_EVALUATION') {
      run(() => processStateUpdate(prev => {
        if (prev.phase !== 'TRICK_EVALUATION') return prev;
        const winnerId = determineTrickWinner(prev.currentTrick, prev.hokm);
        const winnerTeam = prev.players[winnerId].team;
        
        console.log(`Trick winner: Player ${winnerId} (Team ${winnerTeam})`);
        
        const newTeams = JSON.parse(JSON.stringify(prev.teams));
        newTeams[winnerTeam].roundTricksWon++;
        const newTrickHistory = [...prev.trickHistory, { ...prev.currentTrick, winner: winnerId }];

        if (newTeams.Team1.roundTricksWon >= 7 || newTeams.Team2.roundTricksWon >= 7) {
            const roundWinner = newTeams.Team1.roundTricksWon >= 7 ? 'Team1' : 'Team2';
            const loserTeam = roundWinner === 'Team1' ? 'Team2' : 'Team1';
            const isKot = newTeams[loserTeam].roundTricksWon === 0;
            const rulerTeam = prev.players[prev.ruler].team;
            let points = 1;
            if (isKot) {
              points = rulerTeam === roundWinner ? 2 : 3;
              console.log(`KOT! Team ${roundWinner} gets ${points} points.`);
              return { ...prev, trickHistory: newTrickHistory, teams: newTeams, phase: 'BAAM_PROMPT', roundWinner, roundPoints: points, message: `کت! آیا تیم ${roundWinner === 'Team1' ? 'شما' : 'حریف'} درخواست بام دارد؟` };
            } else {
              console.log(`Round won by ${roundWinner}`);
              newTeams[roundWinner].gameScore += points;
              return { ...prev, trickHistory: newTrickHistory, teams: newTeams, phase: 'ROUND_END', roundWinner, roundPoints: points, message: `دور با امتیاز ${points} برای تیم ${roundWinner === 'Team1' ? 'شما' : 'حریف'} تمام شد.` };
            }
        }
        
        // A Baam is in progress if `prev.roundWinner` is set.
        if (prev.roundWinner && newTeams[prev.roundWinner].roundTricksWon < newTrickHistory.length) {
          console.log("Baam failed!");
          // BUG FIX: Update the score on `newTeams` which has the latest trick count, not on a fresh clone of `prev.teams`.
          newTeams[prev.roundWinner].gameScore += prev.roundPoints;
          return { ...prev, trickHistory: newTrickHistory, teams: newTeams, phase: 'ROUND_END', message: `تلاش برای بام ناموفق بود!` };
        }

        if (prev.roundWinner && newTrickHistory.length === 13 && newTeams[prev.roundWinner].roundTricksWon === 13) {
            console.log("BAAM SUCCESS!");
            return { ...prev, phase: 'GAME_OVER', message: `بام! تیم ${prev.roundWinner === 'Team1' ? 'شما' : 'حریف'} برنده بازی شد!` };
        }
        
        return { ...prev, phase: 'TRICK_PLAY', teams: newTeams, currentPlayer: winnerId, currentTrick: { cards: [], leadSuit: null, winner: null, starter: winnerId }, trickHistory: newTrickHistory, message: `دست را ${prev.players[winnerId].name} برد. نوبت اوست...` };
      }), 2000);
// Fix: Corrected AI Baam decision logic to avoid race conditions and fixed typing errors.
    } else if (phase === 'BAAM_PROMPT') {
      // This logic is for AI players to decide on Baam.
      // The human player's decision is handled by the UI in GameTable.
      // We only want an AI to decide if the winning team has no human players.
      const playersArray = Object.values(gameState.players) as Player[];
      const winningTeamHasHuman = playersArray.some(p => p.team === gameState.roundWinner && p.isHuman);

      if (!winningTeamHasHuman) {
        const aiDecider = playersArray.find(p => p.team === gameState.roundWinner);
        if (aiDecider) { // Should always find a player on the winning team
          run(() => {
            const decision = aiService.decideBaam(aiDecider, gameState);
            handleBaamResponse(decision);
          }, 2000);
        }
      }
    } else if (phase === 'ROUND_END') {
      run(() => processStateUpdate(prev => {
        if (prev.phase !== 'ROUND_END') return prev;
        const { Team1, Team2 } = prev.teams;
        const scoreDiff = Math.abs(Team1.gameScore - Team2.gameScore);
        if ((Team1.gameScore >= 7 || Team2.gameScore >= 7) && scoreDiff >= 2) {
          const winner = Team1.gameScore > Team2.gameScore ? 'تیم شما' : 'تیم حریف';
          return { ...prev, phase: 'GAME_OVER', message: `${winner} برنده نهایی بازی شد!` };
        }
        return { ...prev, phase: 'ROUND_TRANSITION' };
      }), 3000);
    } else if (phase === 'ROUND_TRANSITION') {
      run(() => {
        const rulerTeam = gameState.players[gameState.ruler].team;
        const newDealer = rulerTeam === gameState.roundWinner ? gameState.dealer : gameState.ruler;
        initializeGame(gameState.teams, newDealer);
      }, 500);
    }

    return () => timeouts.forEach(clearTimeout);
  }, [gameState, determineTrickWinner, getValidMoves, initializeGame, handleHokmSelect, handlePlayCard, handleBaamResponse]);
  
  return {
    gameState,
    initializeGame,
    handleHokmSelect,
    handlePlayCard,
    getValidMoves,
    handleBaamResponse,
  };
};

export default useGameLogic;
