import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import kiosk from '@/routes/kiosk';
import { Head, Link, router, usePoll } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Bell, Coins, Printer } from 'lucide-react';

interface Props {
    wifiInfo?: {
        ssid: string;
        password: string;
        ip: string;
        url: string;
    };
    pendingUpload?: {
        filename: string;
        original_name: string;
        pages: number;
        size: number;
        uploaded_at: string;
    };
}

export default function Home({ pendingUpload }: Props) {
    // Poll for pending uploads every 3 seconds
    usePoll(3000, {
        only: ['pendingUpload'],
    });

    const handleAcceptUpload = () => {
        router.post(kiosk.acceptPendingUpload.url());
    };
    return (
        <>
            <Head title="Piso Print Kiosk" />

            <div className="min-h-screen bg-zinc-950 p-1">
                <div className="container mx-auto max-w-md">
                    {/* Header - Bold Coin-Operated Branding */}
                    <div className="mb-3 text-center">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="mb-3 flex justify-center"
                        >
                            <div className="rounded-full bg-gradient-to-br from-amber-400 to-amber-600 p-4">
                                <Coins className="h-16 w-16 text-zinc-900" />
                            </div>
                        </motion.div>
                        <h1 className="mb-1 text-2xl font-black tracking-tight text-amber-400 uppercase">
                            🪙 Piso Print
                        </h1>
                        <div className="inline-block rounded-full border-2 border-amber-600 bg-amber-950/50 px-4 py-1">
                            <p className="text-sm font-bold tracking-wider text-amber-400 uppercase">
                                Coin-Operated Printing
                            </p>
                        </div>
                        <p className="mt-2 text-xs text-zinc-400">
                            Insert Coins • Print Documents • Fast & Easy
                        </p>
                    </div>

                    {/* Big Start Button - Vending Machine Style - FIRST THING USER SEES */}
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        transition={{
                            repeat: Infinity,
                            duration: 2,
                            repeatType: 'reverse',
                        }}
                        className="mb-4"
                    >
                        <Button
                            size="lg"
                            className="h-16 w-full rounded-xl border-4 border-emerald-600 bg-gradient-to-br from-emerald-500 to-emerald-700 text-lg font-black tracking-wider text-white uppercase shadow-2xl transition-all hover:from-emerald-400 hover:to-emerald-600 hover:shadow-emerald-500/50"
                            asChild
                        >
                            <Link
                                href={kiosk.upload()}
                                prefetch="mount"
                                cacheFor="1m"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 1.5,
                                    }}
                                    className="mr-2"
                                >
                                    🪙
                                </motion.div>
                                Tap to Start Printing
                            </Link>
                        </Button>
                    </motion.div>

                    {/* WiFi Upload Notification */}
                    {pendingUpload && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-3"
                        >
                            <Alert className="border-4 border-emerald-500 bg-gradient-to-br from-emerald-950 to-emerald-900">
                                <Bell className="h-6 w-6 text-emerald-400" />
                                <AlertTitle className="text-2xl font-black text-emerald-300">
                                    📱 New File Uploaded from WiFi!
                                </AlertTitle>
                                <AlertDescription className="mt-2 space-y-3">
                                    <div className="rounded-lg bg-emerald-950/50 p-3">
                                        <p className="text-base font-bold text-white">
                                            📄 {pendingUpload.original_name}
                                        </p>
                                        <p className="mt-1 text-sm text-emerald-300">
                                            {pendingUpload.pages}{' '}
                                            {pendingUpload.pages === 1
                                                ? 'page'
                                                : 'pages'}
                                        </p>
                                    </div>
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Button
                                            size="lg"
                                            onClick={handleAcceptUpload}
                                            className="h-16 w-full rounded-xl border-4 border-emerald-400 bg-gradient-to-br from-emerald-500 to-emerald-700 text-xl font-black text-white uppercase shadow-2xl hover:from-emerald-400 hover:to-emerald-600"
                                        >
                                            ✅ Preview & Print This File
                                        </Button>
                                    </motion.div>
                                </AlertDescription>
                            </Alert>
                        </motion.div>
                    )}

                    {/* Coin-to-Page Conversion - Vending Machine Style */}
                    <Card className="mb-3 border-4 border-amber-700 bg-gradient-to-b from-zinc-800 to-zinc-900 shadow-2xl">
                        <CardHeader className="border-b border-zinc-700 bg-zinc-800/50 p-3 text-center">
                            <CardTitle className="text-lg font-black tracking-wider text-amber-400 uppercase">
                                💵 What You Can Print
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs text-zinc-300">
                                Drop coins to print documents
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 p-3">
                            {/* Pricing List - Bold & Clear */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between rounded-lg border-2 border-zinc-700 bg-zinc-800/80 p-2 transition-all hover:border-zinc-600 hover:bg-zinc-800">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-600 bg-gradient-to-br from-amber-400 to-amber-600 font-bold text-zinc-900 shadow-lg">
                                            ₱2
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">
                                                1 Page
                                            </p>
                                            <p className="text-xs text-zinc-400">
                                                Black & White
                                            </p>
                                        </div>
                                    </div>
                                    <Printer className="h-4 w-4 text-zinc-500" />
                                </div>

                                <div className="flex items-center justify-between rounded-lg border-2 border-zinc-700 bg-zinc-800/80 p-2 transition-all hover:border-zinc-600 hover:bg-zinc-800">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-600 bg-gradient-to-br from-amber-400 to-amber-600 font-bold text-zinc-900 shadow-lg">
                                            ₱3
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">
                                                1 Page
                                            </p>
                                            <p className="text-xs text-zinc-400">
                                                Grayscale
                                            </p>
                                        </div>
                                    </div>
                                    <Printer className="h-4 w-4 text-zinc-500" />
                                </div>

                                <div className="flex items-center justify-between rounded-lg border-2 border-purple-600 bg-purple-950/30 p-2 transition-all hover:border-purple-500 hover:bg-purple-950/50">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-purple-500 bg-gradient-to-br from-purple-400 to-purple-600 font-bold text-white shadow-lg">
                                            ₱5
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">
                                                1 Page
                                            </p>
                                            <p className="text-xs text-purple-300">
                                                Full Color ⭐
                                            </p>
                                        </div>
                                    </div>
                                    <Printer className="h-4 w-4 text-purple-400" />
                                </div>

                                <div className="flex items-center justify-between rounded-lg border-2 border-emerald-600 bg-emerald-950/30 p-2 transition-all hover:border-emerald-500 hover:bg-emerald-950/50">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-emerald-500 bg-gradient-to-br from-emerald-400 to-emerald-600 font-bold text-white shadow-lg">
                                            ₱10
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">
                                                5 Pages
                                            </p>
                                            <p className="text-xs text-emerald-300">
                                                Black & White 💰
                                            </p>
                                        </div>
                                    </div>
                                    <Printer className="h-4 w-4 text-emerald-400" />
                                </div>
                            </div>

                            {/* Accepted Coins Display */}
                            <div className="mt-4 rounded-lg border-2 border-amber-700 bg-amber-950/30 p-3">
                                <p className="mb-2 text-center text-xs font-bold tracking-wider text-amber-400 uppercase">
                                    Accepted Coins
                                </p>
                                <div className="flex justify-center gap-2">
                                    {[1, 5, 10, 20].map((coin) => (
                                        <div
                                            key={coin}
                                            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-600 bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-zinc-900 shadow-md"
                                        >
                                            ₱{coin}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* How It Works */}
                    <div className="mb-3">
                        <h2 className="mb-2 text-center text-lg font-bold tracking-wide text-amber-400 uppercase">
                            ⚡ How It Works
                        </h2>

                        <Card className="border-2 border-zinc-700 bg-zinc-800/50">
                            <CardContent className="space-y-2 p-3">
                                <div className="flex items-start gap-2">
                                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-black text-zinc-900 shadow-lg">
                                        1
                                    </div>
                                    <div className="min-w-0 flex-1 pt-0.5">
                                        <h3 className="text-sm font-bold text-white">
                                            Upload Your File
                                        </h3>
                                        <p className="text-xs text-zinc-400">
                                            Use USB drive or WiFi upload
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-black text-zinc-900 shadow-lg">
                                        2
                                    </div>
                                    <div className="min-w-0 flex-1 pt-0.5">
                                        <h3 className="text-sm font-bold text-white">
                                            Choose Print Settings
                                        </h3>
                                        <p className="text-xs text-zinc-400">
                                            Color, copies, pages
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-black text-zinc-900 shadow-lg">
                                        3
                                    </div>
                                    <div className="min-w-0 flex-1 pt-0.5">
                                        <h3 className="text-sm font-bold text-white">
                                            See Total Cost
                                        </h3>
                                        <p className="text-xs text-zinc-400">
                                            Clear breakdown of charges
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-black text-white shadow-lg">
                                        4
                                    </div>
                                    <div className="min-w-0 flex-1 pt-0.5">
                                        <h3 className="text-sm font-bold text-emerald-400">
                                            💰 Insert Coins & Print!
                                        </h3>
                                        <p className="text-xs text-emerald-300">
                                            Accepts ₱1, ₱5, ₱10, ₱20 coins
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Footer Branding */}
                    <div className="mt-3 rounded-lg border-2 border-zinc-700 bg-zinc-800/30 p-4 text-center">
                        <p className="text-sm font-bold tracking-wider text-amber-400 uppercase">
                            ⚡ Fast • 💰 Affordable • ✅ Easy
                        </p>
                        <p className="mt-2 text-xs text-zinc-500">
                            Powered by Piso Print System
                        </p>
                        <div className="mt-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-zinc-600 hover:text-zinc-400"
                                asChild
                            >
                                <Link href={kiosk.reset()}>🔄 Reset Kiosk</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
