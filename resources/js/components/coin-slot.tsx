import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Props {
    acceptedCoins?: number[];
    className?: string;
    animated?: boolean;
}

export default function CoinSlot({
    acceptedCoins = [1, 5, 10, 20],
    className,
    animated = true,
}: Props) {
    return (
        <div className={cn('space-y-4', className)}>
            {/* Coin Slot Visual */}
            <div className="relative mx-auto max-w-md">
                <div className="rounded-xl border-4 border-zinc-700 bg-gradient-to-b from-zinc-800 to-zinc-900 p-8 shadow-2xl">
                    {/* Slot Opening */}
                    <div className="relative mx-auto h-16 w-48 overflow-hidden rounded-lg border-2 border-zinc-600 bg-gradient-to-b from-black to-zinc-950 shadow-inner">
                        {/* Slot Guide Lines */}
                        <div className="absolute top-1/2 right-0 left-0 h-0.5 -translate-y-1/2 bg-zinc-700"></div>

                        {/* Drop Arrows */}
                        <div className="absolute inset-0 flex items-center justify-center gap-4">
                            {animated ? (
                                <>
                                    <motion.div
                                        animate={{ y: [0, 10, 0] }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 1.5,
                                            delay: 0,
                                        }}
                                        className="text-2xl text-amber-400/50"
                                    >
                                        ↓
                                    </motion.div>
                                    <motion.div
                                        animate={{ y: [0, 10, 0] }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 1.5,
                                            delay: 0.3,
                                        }}
                                        className="text-2xl text-amber-400/50"
                                    >
                                        ↓
                                    </motion.div>
                                    <motion.div
                                        animate={{ y: [0, 10, 0] }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 1.5,
                                            delay: 0.6,
                                        }}
                                        className="text-2xl text-amber-400/50"
                                    >
                                        ↓
                                    </motion.div>
                                </>
                            ) : (
                                <>
                                    <div className="text-2xl text-amber-400/50">
                                        ↓
                                    </div>
                                    <div className="text-2xl text-amber-400/50">
                                        ↓
                                    </div>
                                    <div className="text-2xl text-amber-400/50">
                                        ↓
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Label */}
                    <div className="mt-4 text-center">
                        <p className="text-lg font-bold tracking-wider text-amber-400 uppercase">
                            💰 Insert Coins Here
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                            Drop coins into slot above
                        </p>
                    </div>
                </div>

                {/* Metallic Shine Effect */}
                <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent"></div>
            </div>

            {/* Accepted Coins Display */}
            <div className="text-center">
                <p className="mb-2 text-sm font-semibold text-muted-foreground">
                    Accepted Coins:
                </p>
                <div className="flex justify-center gap-3">
                    {acceptedCoins.map((coin) => (
                        <div
                            key={coin}
                            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-600 bg-gradient-to-br from-amber-400 to-amber-600 font-bold text-zinc-900 shadow-lg"
                        >
                            ₱{coin}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
