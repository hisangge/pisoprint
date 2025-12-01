import CoinSuggestions from '@/components/coin-suggestions';
import CoinValue from '@/components/coin-value';
import SessionTimeout from '@/components/session-timeout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import kiosk from '@/routes/kiosk';
import { Head, router, usePage, usePoll } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Coins, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';

interface PaymentStatus {
    amountPaid: number;
    amountRequired: number;
    coinInsertions: Array<{
        value: number;
        timestamp: string;
    }>;
    isComplete: boolean;
    sessionId: string;
}

interface Props {
    uploadInfo: {
        fileName: string;
        pages: number;
        cost: number;
    };
    paymentStatus: PaymentStatus;
}

export default function Payment({
    uploadInfo,
    paymentStatus: initialStatus,
}: Props) {
    const { url } = usePage();
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const requiredAmountFromUrl = urlParams.get('required_amount');

    const [printError, setPrintError] = useState<string | null>(null);
    const [isSubmittingPrint, setIsSubmittingPrint] = useState(false);

    // Use Inertia's usePoll for automatic polling
    const { stop: stopPolling } = usePoll(
        2000,
        {
            only: ['paymentStatus'],
            onSuccess: (page) => {
                const status = page.props.paymentStatus as PaymentStatus;
                // Auto-navigate to print when payment complete
                if (status.isComplete && !isSubmittingPrint) {
                    stopPolling();
                    setTimeout(async () => {
                        setIsSubmittingPrint(true);
                        setPrintError(null);

                        // Get print settings from sessionStorage
                        const printSettingsStr =
                            sessionStorage.getItem('print_settings');
                        const printSettings = printSettingsStr
                            ? JSON.parse(printSettingsStr)
                            : {};

                        try {
                            // Submit print job via fetch since it returns JSON
                            const response = await fetch(
                                kiosk.print.submit.url(),
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRF-TOKEN':
                                            document
                                                .querySelector(
                                                    'meta[name="csrf-token"]',
                                                )
                                                ?.getAttribute('content') || '',
                                    },
                                    credentials: 'include',
                                    body: JSON.stringify({
                                        sessionId: status.sessionId,
                                        color_mode:
                                            printSettings.color_mode || 'bw',
                                        copies: printSettings.copies || 1,
                                        orientation:
                                            printSettings.orientation ||
                                            'portrait',
                                    }),
                                },
                            );

                            const data = await response.json();

                            if (data.success && data.print_job_id) {
                                // Clear session storage
                                sessionStorage.removeItem('print_settings');
                                sessionStorage.removeItem('required_amount');

                                // Navigate to print status page
                                router.get(kiosk.printStatus.url(), {
                                    jobId: data.print_job_id,
                                });
                            } else {
                                console.error(
                                    'Failed to submit print job:',
                                    data.error,
                                    data.message,
                                );
                                setPrintError(
                                    data.message ||
                                        'Failed to submit print job. Please try again.',
                                );
                                setIsSubmittingPrint(false);
                                // Don't redirect to home - let user retry
                            }
                        } catch (error) {
                            console.error('Error submitting print job:', error);
                            setPrintError(
                                'Network error. Please check your connection and try again.',
                            );
                            setIsSubmittingPrint(false);
                        }
                    }, 2500);
                }
            },
        },
        {
            autoStart: !initialStatus.isComplete,
        },
    );

    const paymentStatus = initialStatus;

    // Check if payment status is valid for current session
    const isPaymentStatusValid =
        !requiredAmountFromUrl ||
        parseFloat(requiredAmountFromUrl) === initialStatus.amountRequired;

    // If payment status doesn't match URL parameter, redirect to reset
    if (!isPaymentStatusValid && requiredAmountFromUrl) {
        stopPolling();
        router.visit(kiosk.reset.url());
        return null; // Don't render anything while redirecting
    }

    const handleCancel = () => {
        stopPolling();
        router.visit(kiosk.preview.url());
    };

    const progressPercentage =
        paymentStatus.amountRequired > 0
            ? Math.min(
                  (paymentStatus.amountPaid / paymentStatus.amountRequired) *
                      100,
                  100,
              )
            : 0;

    const remainingAmount = Math.max(
        paymentStatus.amountRequired - paymentStatus.amountPaid,
        0,
    );

    const handleTimeout = () => {
        stopPolling();
        router.visit(kiosk.home.url(), {
            method: 'get',
            data: { timeout: true },
        });
    };

    const handleReset = () => {
        stopPolling();
        router.visit(kiosk.reset.url());
    };

    return (
        <>
            <Head title="Insert Coins" />

            {/* Session Timeout Warning */}
            <SessionTimeout
                onTimeout={handleTimeout}
                timeoutMinutes={5}
                warningSeconds={60}
            />

            <div className="min-h-screen bg-zinc-950 p-1">
                <div className="container mx-auto max-w-md">
                    {/* Header */}
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 border-2 border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                                onClick={handleCancel}
                                disabled={
                                    paymentStatus.isComplete ||
                                    isSubmittingPrint
                                }
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <h1 className="text-lg font-black tracking-tight text-amber-400 uppercase">
                                    💰 Insert Coins
                                </h1>
                                <p className="text-xs text-zinc-400">
                                    {uploadInfo.fileName.length > 30
                                        ? uploadInfo.fileName.substring(0, 30) +
                                          '...'
                                        : uploadInfo.fileName}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-zinc-600 hover:text-zinc-400"
                            onClick={handleReset}
                        >
                            🔄 Reset
                        </Button>
                    </div>

                    {/* PAYMENT STATUS - FIRST THING USER SEES */}
                    <div className="mb-3 space-y-2">
                        <CoinValue
                            value={paymentStatus.amountPaid}
                            label="Inserted"
                            size="large"
                            variant="inserted"
                        />

                        <CoinValue
                            value={paymentStatus.amountRequired}
                            label="Total Cost"
                            size="large"
                            variant="needed"
                        />

                        {remainingAmount > 0 && (
                            <motion.div
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 1.5,
                                }}
                            >
                                <CoinValue
                                    value={remainingAmount}
                                    label="Insert More"
                                    size="huge"
                                    variant="remaining"
                                />
                            </motion.div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <Card className="mb-3 border-2 border-zinc-700 bg-zinc-800/50">
                        <CardContent className="p-3">
                            <div className="space-y-2">
                                <Progress
                                    value={progressPercentage}
                                    className="h-6"
                                />
                                <div className="text-center">
                                    <span className="text-base font-bold text-white">
                                        {(isNaN(progressPercentage)
                                            ? 0
                                            : progressPercentage
                                        ).toFixed(0)}
                                        % Complete
                                    </span>
                                    {remainingAmount > 0 && (
                                        <div className="mt-1 text-sm font-bold text-red-400">
                                            ₱{remainingAmount.toFixed(2)}{' '}
                                            remaining
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Accepted Coins Visual */}
                    <Card className="mb-3 border-2 border-amber-600 bg-gradient-to-br from-amber-950/40 to-amber-900/20">
                        <CardContent className="p-3">
                            <p className="mb-2 text-center text-xs font-bold text-amber-400">
                                💳 Accepted Coins
                            </p>
                            <div className="flex justify-center gap-2">
                                {[1, 5, 10, 20].map((value) => (
                                    <div
                                        key={value}
                                        className="flex flex-col items-center gap-1"
                                    >
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full border-3 border-amber-500 bg-gradient-to-br from-amber-300 to-amber-600 shadow-lg">
                                            <span className="text-sm font-black text-zinc-900">
                                                ₱{value}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Complete Message */}
                    {paymentStatus.isComplete && !printError && (
                        <Card className="mb-3 border-2 border-emerald-600 bg-emerald-950/30">
                            <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-emerald-400" />
                                    <div>
                                        <p className="text-sm font-bold text-emerald-400">
                                            ✅ Payment Complete!
                                        </p>
                                        <p className="text-xs text-emerald-300">
                                            {isSubmittingPrint
                                                ? 'Starting print job...'
                                                : 'Print job submitted successfully'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Print Error Message */}
                    {printError && (
                        <Card className="mb-3 border-2 border-red-600 bg-red-950/30">
                            <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                    <X className="h-6 w-6 flex-shrink-0 text-red-400" />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-red-400">
                                            ⚠️ Print Failed
                                        </p>
                                        <p className="mb-2 text-xs text-red-300">
                                            {printError}
                                        </p>
                                        <Button
                                            onClick={() => {
                                                setPrintError(null);
                                                setIsSubmittingPrint(false);
                                                // Restart the polling to try again
                                                router.reload();
                                            }}
                                            variant="outline"
                                            size="sm"
                                            className="border-red-600 text-red-300 hover:bg-red-900/50"
                                        >
                                            <RefreshCw className="mr-2 h-3 w-3" />
                                            Try Again
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Coin Suggestions */}
                    {remainingAmount > 0 && (
                        <div className="mb-3">
                            <CoinSuggestions totalNeeded={remainingAmount} />
                        </div>
                    )}

                    {/* Coin Insertion History */}
                    {paymentStatus.coinInsertions.length > 0 && (
                        <Card className="mb-3 border-2 border-zinc-700 bg-zinc-800/50">
                            <CardHeader className="p-3">
                                <CardTitle className="text-xs font-bold text-white">
                                    Recent Coins Inserted
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 p-3 pt-0">
                                {paymentStatus.coinInsertions
                                    .slice(-5)
                                    .reverse()
                                    .map((coin, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-2"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-amber-600 bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-bold text-zinc-900">
                                                    ₱{coin.value}
                                                </div>
                                                <span className="text-xs font-bold text-white">
                                                    Coin Inserted
                                                </span>
                                            </div>
                                            <span className="text-xs text-zinc-400">
                                                {new Date(
                                                    coin.timestamp,
                                                ).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Instructions */}
                    <Alert className="border-2 border-zinc-700 bg-zinc-800/50">
                        <Coins className="h-4 w-4 text-amber-400" />
                        <AlertTitle className="text-sm font-bold text-white">
                            💡 How to Pay
                        </AlertTitle>
                        <AlertDescription>
                            <ol className="mt-2 mb-3 space-y-1 text-xs text-zinc-300">
                                <li className="flex gap-2">
                                    <span className="font-bold text-amber-400">
                                        1.
                                    </span>
                                    <span>
                                        Insert coins one at a time into the slot
                                    </span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-amber-400">
                                        2.
                                    </span>
                                    <span>
                                        Accepted coins: ₱1, ₱5, ₱10, ₱20
                                    </span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-amber-400">
                                        3.
                                    </span>
                                    <span>
                                        Wait for the full amount to be inserted
                                    </span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-amber-400">
                                        4.
                                    </span>
                                    <span>
                                        Printing starts automatically when
                                        complete
                                    </span>
                                </li>
                            </ol>
                        </AlertDescription>
                    </Alert>
                </div>
            </div>

            {/* Cancel Payment Button - Outside card at bottom */}
            {!paymentStatus.isComplete && !printError && (
                <div className="mt-4 px-4 pb-6">
                    <Button
                        variant="outline"
                        className="h-14 w-full border-2 border-red-600 bg-red-950/30 text-base font-bold text-red-300 hover:bg-red-900/50"
                        onClick={handleCancel}
                        disabled={isSubmittingPrint}
                    >
                        <X className="mr-2 h-5 w-5" />
                        Cancel Payment
                    </Button>
                </div>
            )}
        </>
    );
}
