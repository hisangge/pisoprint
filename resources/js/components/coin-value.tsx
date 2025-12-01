import { cn } from '@/lib/utils';
import { Coins } from 'lucide-react';

interface Props {
    value: number;
    label?: string;
    size?: 'small' | 'medium' | 'large' | 'huge';
    variant?: 'inserted' | 'needed' | 'remaining';
    className?: string;
}

export default function CoinValue({
    value,
    label,
    size = 'medium',
    variant = 'inserted',
    className,
}: Props) {
    // Ensure value is a number
    const numericValue =
        typeof value === 'number' ? value : parseFloat(String(value)) || 0;

    const sizeClasses = {
        small: 'text-2xl',
        medium: 'text-4xl',
        large: 'text-5xl',
        huge: 'text-6xl',
    };

    const variantClasses = {
        inserted: 'text-emerald-400 border-emerald-500 bg-emerald-950/50',
        needed: 'text-blue-400 border-blue-500 bg-blue-950/50',
        remaining: 'text-red-400 border-red-500 bg-red-950/50',
    };

    const iconColors = {
        inserted: 'text-emerald-400',
        needed: 'text-blue-400',
        remaining: 'text-red-400',
    };

    return (
        <div
            className={cn(
                'flex items-center gap-3 rounded-lg border-2 p-4',
                variantClasses[variant],
                className,
            )}
        >
            <Coins className={cn('h-8 w-8', iconColors[variant])} />
            <div className="flex-1">
                {label && (
                    <p className="mb-1 text-xs font-semibold tracking-wider uppercase opacity-80">
                        {label}
                    </p>
                )}
                <p className={cn('font-bold tabular-nums', sizeClasses[size])}>
                    ₱{numericValue.toFixed(2)}
                </p>
            </div>
        </div>
    );
}
