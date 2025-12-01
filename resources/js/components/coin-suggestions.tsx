import { Lightbulb } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface Props {
    totalNeeded: number;
}

export default function CoinSuggestions({ totalNeeded }: Props) {
    const generateSuggestions = (amount: number): string[] => {
        const suggestions: string[] = [];

        // Calculate different coin combinations
        const coins = [20, 10, 5, 1];

        // Greedy algorithm for 3 different combinations
        const combinations: number[][] = [];

        // Combination 1: Maximum ₱20 coins
        let remaining = amount;
        const combo1 = [0, 0, 0, 0];
        for (let i = 0; i < coins.length; i++) {
            combo1[i] = Math.floor(remaining / coins[i]);
            remaining %= coins[i];
        }
        combinations.push(combo1);

        // Combination 2: Maximum ₱10 coins
        remaining = amount;
        const combo2 = [0, 0, 0, 0];
        combo2[1] = Math.floor(remaining / 10);
        remaining %= 10;
        combo2[2] = Math.floor(remaining / 5);
        remaining %= 5;
        combo2[3] = remaining;
        combinations.push(combo2);

        // Combination 3: Maximum ₱5 coins
        remaining = amount;
        const combo3 = [0, 0, 0, 0];
        combo3[2] = Math.floor(remaining / 5);
        remaining %= 5;
        combo3[3] = remaining;
        combinations.push(combo3);

        // Format combinations
        combinations.forEach((combo) => {
            const parts: string[] = [];
            if (combo[0] > 0) parts.push(`${combo[0]}× ₱20`);
            if (combo[1] > 0) parts.push(`${combo[1]}× ₱10`);
            if (combo[2] > 0) parts.push(`${combo[2]}× ₱5`);
            if (combo[3] > 0) parts.push(`${combo[3]}× ₱1`);

            if (parts.length > 0) {
                suggestions.push(parts.join(' + '));
            }
        });

        // Remove duplicates and return up to 3 suggestions
        return [...new Set(suggestions)].slice(0, 3);
    };

    const suggestions = generateSuggestions(totalNeeded);

    if (suggestions.length === 0) {
        return null;
    }

    return (
        <Alert className="border-amber-600 bg-amber-950/20">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <AlertTitle className="text-sm font-bold text-amber-400">
                You can pay ₱{totalNeeded.toFixed(2)} with:
            </AlertTitle>
            <AlertDescription>
                <ul className="mt-2 space-y-1 text-xs text-amber-200">
                    {suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-center gap-2">
                            <span className="text-amber-400">•</span>
                            <span className="font-mono">{suggestion}</span>
                        </li>
                    ))}
                </ul>
            </AlertDescription>
        </Alert>
    );
}
