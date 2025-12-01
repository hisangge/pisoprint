import { Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

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
        <Card className="overflow-hidden border-2 border-sky-200 bg-white">
            <CardHeader className="border-b border-sky-100 bg-sky-50/30 pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-sky-700">
                    <Coins className="h-5 w-5 text-sky-500" />
                    You can pay ₱{totalNeeded.toFixed(2)} with:
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                <div className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 rounded-lg bg-slate-50 p-3"
                        >
                            <span className="text-sky-500">•</span>
                            <span className="font-mono text-sm font-semibold text-slate-900">
                                {suggestion}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
