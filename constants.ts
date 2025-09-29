import { Suit, Rank } from './types';

export const SUITS: Suit[] = ['Spades', 'Hearts', 'Clubs', 'Diamonds'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  Spades: '♠',
  Hearts: '♥',
  Clubs: '♣',
  Diamonds: '♦',
};

export const SUIT_COLORS: Record<Suit, string> = {
  Spades: 'text-black',
  Hearts: 'text-red-600',
  Clubs: 'text-black',
  Diamonds: 'text-red-600',
};

export const RANK_VALUES_NORMAL: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

export const RANK_VALUES_NARS: Record<Rank, number> = {
  'A': 1, 'K': 2, 'Q': 3, 'J': 4, '10': 5, '9': 6, '8': 7, '7': 8, '6': 9, '5': 10, '4': 11, '3': 12, '2': 13,
};

export const RANK_VALUES_ACENARS: Record<Rank, number> = {
  'K': 1, 'Q': 2, 'J': 3, '10': 4, '9': 5, '8': 6, '7': 7, '6': 8, '5': 9, '4': 10, '3': 11, '2': 12, 'A': 13,
};


export const PLAYER_CONFIG_FA = {
  1: { name: 'شما', isHuman: true, team: 'Team1' as 'Team1' | 'Team2' },
  2: { name: 'بازیکن ۲', isHuman: false, team: 'Team2' as 'Team1' | 'Team2' },
  3: { name: 'یار شما', isHuman: false, team: 'Team1' as 'Team1' | 'Team2' },
  4: { name: 'بازیکن ۴', isHuman: false, team: 'Team2' as 'Team1' | 'Team2' },
};

export const NEXT_PLAYER_MAP: Record<number, number> = { 1: 4, 4: 3, 3: 2, 2: 1 };
export const PREVIOUS_PLAYER_MAP: Record<number, number> = { 1: 2, 2: 3, 3: 4, 4: 1 };