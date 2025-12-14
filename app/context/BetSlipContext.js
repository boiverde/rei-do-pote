"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

const BetSlipContext = createContext();

export function BetSlipProvider({ children }) {
    const [bets, setBets] = useState([]);

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('betslip');
        if (saved) setBets(JSON.parse(saved));
    }, []);

    // Save to local storage on change
    useEffect(() => {
        localStorage.setItem('betslip', JSON.stringify(bets));
    }, [bets]);

    const addBet = (selection) => {
        // Check if already exists
        const exists = bets.find(b => b.id === selection.id && b.option === selection.option);
        if (exists) {
            removeBet(selection.id, selection.option);
            return;
        }

        // Check if conflicting bet (same market, different option)
        const conflict = bets.find(b => b.id === selection.id);
        if (conflict) {
            // Replace it
            const newBets = bets.map(b => b.id === selection.id ? selection : b);
            setBets(newBets);
        } else {
            setBets([...bets, selection]);
        }
    };

    const removeBet = (marketId, option) => {
        setBets(bets.filter(b => !(b.id === marketId && b.option === option)));
    };

    const clearSlip = () => setBets([]);

    return (
        <BetSlipContext.Provider value={{ bets, addBet, removeBet, clearSlip }}>
            {children}
        </BetSlipContext.Provider>
    );
}

export function useBetSlip() {
    return useContext(BetSlipContext);
}
