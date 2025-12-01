import CoinSuggestions from '@/components/coin-suggestions';
import SessionTimeout from '@/components/session-timeout';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import kiosk from '@/routes/kiosk';
import { Head, router, usePage, usePoll } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    CheckCircle2,
    Coins,
    RefreshCw,
    RotateCcw,
    X,
} from 'lucide-react';
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

            <div className="min-h-screen overflow-x-hidden bg-white px-4 py-6">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-12 w-12 rounded-full border-2 border-sky-400 bg-sky-400 text-white hover:bg-sky-500"
                                onClick={handleCancel}
                                disabled={
                                    paymentStatus.isComplete ||
                                    isSubmittingPrint
                                }
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="bg-gradient-to-r from-sky-400/80 to-sky-500/70 bg-clip-text text-xl font-bold text-transparent">
                                    Insert Coins
                                </h1>
                                <p className="text-sm text-slate-500">
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
                            className="text-slate-400 hover:text-slate-600"
                            onClick={handleReset}
                        >
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                            Reset
                        </Button>
                    </div>

                    {/* PAYMENT STATUS - FIRST THING USER SEES */}
                    <div className="mb-4 space-y-3">
                        <Card className="overflow-hidden border-2 border-sky-200 bg-white">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100">
                                            <Coins className="h-5 w-5 text-sky-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">
                                                Amount Inserted
                                            </p>
                                            <p className="text-2xl font-bold text-sky-600">
                                                ₱
                                                {paymentStatus.amountPaid.toFixed(
                                                    2,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-500">
                                            Total Cost
                                        </p>
                                        <p className="text-2xl font-bold text-slate-700">
                                            ₱
                                            {paymentStatus.amountRequired.toFixed(
                                                2,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {remainingAmount > 0 && (
                            <motion.div
                                animate={{ scale: [1, 1.01, 1] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 1.5,
                                }}
                            >
                                <Card className="overflow-hidden border-2 border-amber-300 bg-amber-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-amber-600">
                                                    Please Insert
                                                </p>
                                                <p className="text-4xl font-black text-amber-600">
                                                    ₱
                                                    {remainingAmount.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <Card className="mb-4 border-2 border-sky-200 bg-white">
                        <CardContent className="p-4">
                            <div className="space-y-3">
                                <Progress
                                    value={progressPercentage}
                                    className="h-4"
                                />
                                <div className="text-center">
                                    <span className="text-lg font-bold text-sky-600">
                                        {(isNaN(progressPercentage)
                                            ? 0
                                            : progressPercentage
                                        ).toFixed(0)}
                                        % Complete
                                    </span>
                                    {remainingAmount > 0 && (
                                        <p className="mt-1 text-sm text-slate-500">
                                            ₱{remainingAmount.toFixed(2)}{' '}
                                            remaining
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Accepted Coins Visual */}
                    <Card className="mb-4 border-2 border-sky-200 bg-white">
                        <CardHeader className="border-b border-sky-100 bg-sky-50/30 px-4 py-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-sky-700">
                                <Coins className="h-4 w-4 text-sky-500" />
                                Accepted Coins
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="flex justify-center gap-3">
                                {[1, 5, 10, 20].map((value) => (
                                    <div
                                        key={value}
                                        className="flex flex-col items-center gap-1"
                                    >
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full border-3 border-sky-400 bg-gradient-to-br from-sky-100 to-sky-200 shadow-md">
                                            <span className="text-base font-black text-sky-700">
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
                        <Card className="mb-4 border-2 border-emerald-300 bg-emerald-50">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-emerald-700">
                                            Payment Complete!
                                        </p>
                                        <p className="text-sm text-emerald-600">
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
                        <Card className="mb-4 border-2 border-red-300 bg-red-50">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                                        <X className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-red-700">
                                            Print Failed
                                        </p>
                                        <p className="mb-3 text-sm text-red-600">
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
                                            className="border-red-300 text-red-700 hover:bg-red-100"
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
                        <div className="mb-4">
                            <CoinSuggestions totalNeeded={remainingAmount} />
                        </div>
                    )}

                    {/* Coin Insertion History */}
                    {paymentStatus.coinInsertions.length > 0 && (
                        <Card className="mb-4 border-2 border-sky-200 bg-white">
                            <CardHeader className="border-b border-sky-100 bg-sky-50/30 px-4 py-3">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-sky-700">
                                    <Coins className="h-4 w-4 text-sky-500" />
                                    Recent Coins Inserted
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 p-4">
                                {paymentStatus.coinInsertions
                                    .slice(-5)
                                    .reverse()
                                    .map((coin, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-sky-400 bg-gradient-to-br from-sky-100 to-sky-200 text-xs font-bold text-sky-700">
                                                    ₱{coin.value}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">
                                                    Coin Inserted
                                                </span>
                                            </div>
                                            <span className="text-sm text-slate-500">
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
                    <Card className="mb-4 border-2 border-sky-200 bg-white">
                        <CardHeader className="border-b border-sky-100 bg-sky-50/30 px-4 py-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-sky-700">
                                <Coins className="h-4 w-4 text-sky-500" />
                                How to Pay
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <ol className="space-y-2">
                                <li className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-600">
                                        1
                                    </span>
                                    <span className="text-sm text-slate-700">
                                        Insert coins one at a time into the slot
                                    </span>
                                </li>
                                <li className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-600">
                                        2
                                    </span>
                                    <span className="text-sm text-slate-700">
                                        Accepted coins: ₱1, ₱5, ₱10, ₱20
                                    </span>
                                </li>
                                <li className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-600">
                                        3
                                    </span>
                                    <span className="text-sm text-slate-700">
                                        Wait for the full amount to be inserted
                                    </span>
                                </li>
                                <li className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-600">
                                        4
                                    </span>
                                    <span className="text-sm text-slate-700">
                                        Printing starts automatically when
                                        complete
                                    </span>
                                </li>
                            </ol>
                        </CardContent>
                    </Card>

                    {/* Cancel Payment Button */}
                    {!paymentStatus.isComplete && !printError && (
                        <Button
                            variant="outline"
                            className="h-14 w-full rounded-xl border-2 border-slate-300 bg-white text-base font-semibold text-slate-600 hover:bg-slate-50"
                            onClick={handleCancel}
                            disabled={isSubmittingPrint}
                        >
                            <X className="mr-2 h-5 w-5" />
                            Cancel Payment
                        </Button>
                    )}
                </div>
            </div>
        </>
    );
}
