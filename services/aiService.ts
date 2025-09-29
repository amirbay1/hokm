import { Card, GameState, Player, HokmMode, Suit, PlayerId } from '../types';
import { RANK_VALUES_NORMAL, RANK_VALUES_NARS, RANK_VALUES_ACENARS, PREVIOUS_PLAYER_MAP, SUITS } from '../constants';

const getCardValue = (card: Card, leadSuit: Suit | null, hokm: GameState['hokm']): number => {
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
      return 0; // In Sar, off-suit cards have no value
    }

    if (isHokm) return rankValue + 100;
    if (isLead) return rankValue;
    return 0; // Card is off-suit and not hokm
};

export const chooseHokm = (hand: Card[]): { suit: Suit | null; mode: HokmMode } => {
    console.log("[AI] Deciding Hokm with hand:", hand.map(c => c.id));
    
    // Less than 8% chance to pick a special mode
    if (Math.random() < 0.08) {
        const specialModes: HokmMode[] = ['Nars', 'AceNars', 'Sar'];
        const mode = specialModes[Math.floor(Math.random() * specialModes.length)];
        console.log(`[AI] Chose special Hokm mode: ${mode}`);
        return { suit: null, mode };
    }

    const suitCounts: Record<Suit, number> = { Spades: 0, Hearts: 0, Clubs: 0, Diamonds: 0 };
    const suitStrengths: Record<Suit, number> = { Spades: 0, Hearts: 0, Clubs: 0, Diamonds: 0 };

    for (const card of hand) {
        suitCounts[card.suit]++;
        suitStrengths[card.suit] += RANK_VALUES_NORMAL[card.rank];
    }

    let bestSuit: Suit = 'Spades';
    let maxScore = 0;

    for (const suit of (Object.keys(suitCounts) as Suit[])) {
        const score = suitCounts[suit] * 3 + suitStrengths[suit]; // Weight count more than strength
        if (score > maxScore) {
            maxScore = score;
            bestSuit = suit;
        }
    }

    console.log(`[AI] Chose Hokm suit: ${bestSuit}`);
    return { suit: bestSuit, mode: 'Normal' };
};

export const playCard = (player: Player, gameState: GameState, validMoves: Card[]): Card => {
    const { currentTrick, hokm, players, playedCards, ruler } = gameState;
    // Fix: Correctly determine partner ID for all players.
    const partnerId = player.id === 1 ? 3 : player.id === 3 ? 1 : player.id === 2 ? 4 : 2;

    console.log(`[AI] Player ${player.id} thinking. Hand: ${player.hand.map(c => c.id)}. Valid moves: ${validMoves.map(c => c.id)}`);

    if (validMoves.length === 1) {
        console.log(`[AI] Player ${player.id}: Only one valid move. Playing ${validMoves[0].id}`);
        return validMoves[0];
    }
    
    const sortedValidMoves = [...validMoves].sort((a, b) => 
        getCardValue(a, currentTrick.leadSuit, hokm) - getCardValue(b, currentTrick.leadSuit, hokm)
    );
    const lowestCard = sortedValidMoves[0];
    const highestCard = sortedValidMoves[sortedValidMoves.length - 1];

    // --- Active Memory Analysis ---
    const playedAces = new Set(playedCards.filter(c => c.rank === 'A').map(c => c.suit));
    const playedHokmCards = playedCards.filter(c => c.suit === hokm.suit);

    // --- Lead Strategy ---
    if (currentTrick.cards.length === 0) {
        console.log(`[AI] Player ${player.id}: Leading the trick.`);
        const isRulerTeam = players[player.id].team === players[ruler].team;

        // Ruler's Logic: Draw trumps first
        if (isRulerTeam && hokm.suit && playedHokmCards.length < 5) { // Heuristic to check if trumps are mostly out
             const hokmCards = validMoves.filter(c => c.suit === hokm.suit);
             if (hokmCards.length > 0) {
                const highestHokm = hokmCards.sort((a,b) => RANK_VALUES_NORMAL[b.rank] - RANK_VALUES_NORMAL[a.rank])[0];
                if (highestHokm.rank !== 'A') { // Avoid leading with Hokm Ace as a signal
                    console.log("[AI] As Ruler team, drawing trumps with:", highestHokm.id);
                    return highestHokm;
                }
             }
        }

        // Universal: Lead with safe high cards (Aces, or Kings if Ace is gone)
        const nonHokmAces = validMoves.filter(c => c.rank === 'A' && c.suit !== hokm.suit);
        if (nonHokmAces.length > 0) {
            console.log("[AI] Leading with non-hokm Ace (Signal of strength):", nonHokmAces[0].id);
            return nonHokmAces[0];
        }
        
        const safeKings = validMoves.filter(c => c.rank === 'K' && c.suit !== hokm.suit && playedAces.has(c.suit));
         if (safeKings.length > 0) {
            console.log("[AI] Leading with a safe King (Ace is out):", safeKings[0].id);
            return safeKings[0];
        }
        
        // Opposition Logic: Attack ruler with Aces
        if (!isRulerTeam) {
            if (nonHokmAces.length > 0) {
                console.log("[AI] Opposition attacking with Ace:", nonHokmAces[0].id);
                return nonHokmAces[0];
            }
        }

        // Default lead: Lead a low card from a suit with few cards to get void
        const suitCounts = SUITS.reduce((acc, suit) => ({...acc, [suit]: 0}), {} as Record<Suit, number>);
        validMoves.forEach(c => suitCounts[c.suit]++);
        
        let bestSuitToVoid: Suit | null = null;
        let minSuitCount = 14;
        
        for (const s of SUITS) {
            if (s !== hokm.suit && suitCounts[s] > 0 && suitCounts[s] < minSuitCount) {
                minSuitCount = suitCounts[s];
                bestSuitToVoid = s;
            }
        }
        
        if (bestSuitToVoid) {
            const lowestCardInThatSuit = validMoves
                .filter(c => c.suit === bestSuitToVoid)
                .sort((a, b) => RANK_VALUES_NORMAL[a.rank] - RANK_VALUES_NORMAL[b.rank])[0];
            console.log(`[AI] Default lead: Trying to get void in ${bestSuitToVoid} with ${lowestCardInThatSuit.id}`);
            return lowestCardInThatSuit;
        }

        console.log("[AI] Forced to lead with lowest card:", lowestCard.id);
        return lowestCard; // Last resort
    }

    // --- Response Strategy ---
    const winningCardInTrick = currentTrick.cards.reduce((winning, current) => {
        return getCardValue(current.card, currentTrick.leadSuit, hokm) > getCardValue(winning.card, currentTrick.leadSuit, hokm) ? current : winning;
    });

    const isPartnerWinning = winningCardInTrick.player === partnerId;

    // "کمترین هزینه" (Support Partner Logic)
    if (isPartnerWinning) {
        console.log(`[AI] Player ${player.id}: Partner is winning. Playing low (کمترین هزینه).`);
        const leadSuitCards = validMoves.filter(c => c.suit === currentTrick.leadSuit);
        if (leadSuitCards.length > 0) {
            const lowestOfLeadSuit = leadSuitCards.sort((a,b) => RANK_VALUES_NORMAL[a.rank] - RANK_VALUES_NORMAL[b.rank])[0];
            console.log("[AI] Playing lowest of lead suit:", lowestOfLeadSuit.id);
            return lowestOfLeadSuit;
        }
        // "رد دادن" (Slough a low card)
        const nonHokmCards = sortedValidMoves.filter(c => c.suit !== hokm.suit);
        if(nonHokmCards.length > 0){
             console.log("[AI] Sloughing lowest non-hokm card:", nonHokmCards[0].id);
             return nonHokmCards[0];
        }
        console.log("[AI] Sloughing lowest card:", lowestCard.id);
        return lowestCard; 
    }
    
    // "بازیکن کلیدی" (Key player - 3rd to play) must play high
    if (currentTrick.cards.length === 2) { // 3rd player
         const leadSuitCards = validMoves.filter(c => c.suit === currentTrick.leadSuit);
         if(leadSuitCards.length > 0) {
            const highestLeadCard = leadSuitCards.sort((a,b) => RANK_VALUES_NORMAL[b.rank] - RANK_VALUES_NORMAL[a.rank])[0];
            console.log(`[AI] Player ${player.id}: Position 3. Playing high in suit: ${highestLeadCard.id}`);
            return highestLeadCard;
         }
    }

    // Try to win if partner is not winning
    const highestValueInTrick = getCardValue(winningCardInTrick.card, currentTrick.leadSuit, hokm);
    const potentialWinningCards = sortedValidMoves.filter(c => getCardValue(c, currentTrick.leadSuit, hokm) > highestValueInTrick);

    if (potentialWinningCards.length > 0) {
        // Play the *lowest* card that can still win
        const bestCardToWin = potentialWinningCards[0];
        console.log(`[AI] Player ${player.id}: Trying to win with cheapest winning card ${bestCardToWin.id}`);
        return bestCardToWin;
    }
    
    // Cannot win, play lowest card ("رد دادن")
    console.log(`[AI] Player ${player.id}: Cannot win. Playing lowest card ${lowestCard.id}`);
    return lowestCard;
};

export const decideBaam = (player: Player, gameState: GameState): boolean => {
    // AI Baam logic: Go for it if you have a very strong hand
    const { hokm } = gameState;
    let highCards = 0;
    for (const card of player.hand) {
        if(card.suit === hokm.suit && RANK_VALUES_NORMAL[card.rank] >= 12) highCards++; // Q,K,A of hokm
        if(card.rank === 'A' && card.suit !== hokm.suit) highCards++;
    }
    const decision = highCards >= 4; // More conservative heuristic
    console.log(`[AI] Player ${player.id} decides on Baam: ${decision} (High cards: ${highCards})`);
    return decision;
}