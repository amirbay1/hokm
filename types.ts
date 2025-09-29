export type Suit = 'Spades' | 'Hearts' | 'Clubs' | 'Diamonds';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type PlayerId = 1 | 2 | 3 | 4;

export interface Player {
  id: PlayerId;
  name: string;
  hand: Card[];
  isHuman: boolean;
  team: 'Team1' | 'Team2';
}

export type HokmMode = 'Normal' | 'Nars' | 'AceNars' | 'Sar';

export interface PlayedCard {
  player: PlayerId;
  card: Card;
}

export interface Trick {
  cards: PlayedCard[];
  leadSuit: Suit | null;
  winner: PlayerId | null;
  starter: PlayerId;
}

export interface TeamState {
  gameScore: number;
  roundTricksWon: number;
}

export type GamePhase = 
  | 'INITIALIZING'
  | 'DEALING_INITIAL'
  | 'HOKM_SELECTION'
  | 'DEALING_REMAINING'
  | 'TRICK_PLAY'
  | 'TRICK_EVALUATION'
  | 'BAAM_PROMPT'
  | 'ROUND_END'
  | 'ROUND_TRANSITION'
  | 'GAME_OVER';

export interface GameState {
  deck: Card[];
  players: Record<PlayerId, Player>;
  phase: GamePhase;
  dealer: PlayerId;
  ruler: PlayerId;
  currentPlayer: PlayerId;
  hokm: {
    suit: Suit | null;
    mode: HokmMode;
  };
  currentTrick: Trick;
  teams: {
    Team1: TeamState;
    Team2: TeamState;
  };
  trickHistory: Trick[];
  voidSuits: Record<PlayerId, Partial<Record<Suit, boolean>>>;
  playedCards: Card[];
  message: string;
  roundWinner: 'Team1' | 'Team2' | null;
  roundPoints: number;
}