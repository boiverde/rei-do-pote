"use client";

import { BetSlipProvider } from "./context/BetSlipContext";

export function Providers({ children }) {
    return (
        <BetSlipProvider>
            {children}
        </BetSlipProvider>
    );
}
