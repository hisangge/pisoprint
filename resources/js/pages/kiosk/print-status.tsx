import SessionTimeout from '@/components/session-timeout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import kiosk from '@/routes/kiosk';
import { Head, Link, router, usePage, usePoll } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    FileText,
    Home,
    Loader2,
    Printer,
    RefreshCw,
    XCircle,
} from 'lucide-react';

type PrintJobStatus =
    | 'pending'
    | 'printing'
    | 'completed'
    | 'failed'
    | 'cancelled';

interface PrintJob {
    id: number;
    fileName: string;
    pages: number;
    status: PrintJobStatus;
    currentPage?: number;
    errorMessage?: string;
    startedAt?: string;
    completedAt?: string;
    colorMode: 'grayscale' | 'color';
    copies: number;
}

interface Props {
    printJob: PrintJob;
}

export default function PrintStatus({ printJob: initialJob }: Props) {
    const { props } = usePage();
    const currentPrintJob = props.printJob as PrintJob;

    // Use Inertia's usePoll for automatic polling
    const { stop: stopPolling } = usePoll(
        3000,
        {
            only: ['printJob'],
            onSuccess: (page) => {
                const job = page.props.printJob as PrintJob;
                // Stop polling when job is complete or failed
                if (job.status === 'completed' || job.status === 'failed') {
                    stopPolling();
                }
            },
        },
        {
            autoStart:
                initialJob.status === 'pending' ||
                initialJob.status === 'printing',
        },
    );

    const printJob = currentPrintJob;

    const handleCancelJob = async () => {
        if (!confirm('Are you sure you want to cancel this print job?')) {
            return;
        }

        // Double-check the job is still active
        if (!isActive) {
            alert('This print job can no longer be cancelled.');
            return;
        }

        try {
            const response = await fetch(kiosk.print.cancel.url(printJob.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            const data = await response.json();

            if (data.success) {
                // Success - redirect to home page
                window.location.href = kiosk.home.url();
            } else {
                // Show error message
                alert(data.message || 'Failed to cancel print job');
            }
        } catch (error) {
            console.error('Error cancelling job:', error);
            alert('An error occurred while cancelling the print job');
        }
    };

    const handleRetryJob = () => {
        // Retry by redirecting to home to start new job
        router.visit(kiosk.home());
    };

    const handleTimeout = () => {
        router.visit(kiosk.home(), {
            data: { timeout: true },
        });
    };

    const getStatusIcon = () => {
        switch (printJob.status) {
            case 'completed':
                return (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', duration: 0.5 }}
                    >
                        <CheckCircle2 className="h-24 w-24 text-emerald-400" />
                    </motion.div>
                );
            case 'failed':
                return (
                    <motion.div
                        animate={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                    >
                        <XCircle className="h-24 w-24 text-red-400" />
                    </motion.div>
                );
            case 'cancelled':
                return <AlertCircle className="h-24 w-24 text-amber-400" />;
            case 'printing':
                return (
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        <Printer className="h-24 w-24 text-blue-400" />
                    </motion.div>
                );
            default:
                return (
                    <Loader2 className="h-24 w-24 animate-spin text-zinc-400" />
                );
        }
    };

    const getStatusText = () => {
        switch (printJob.status) {
            case 'completed':
                return 'Print Complete!';
            case 'failed':
                return 'Print Failed';
            case 'cancelled':
                return 'Print Cancelled';
            case 'printing':
                return 'Printing...';
            default:
                return 'Preparing Print Job...';
        }
    };

    const getStatusDescription = () => {
        switch (printJob.status) {
            case 'completed':
                return 'Your document has been printed successfully.';
            case 'failed':
                return (
                    printJob.errorMessage ||
                    'An error occurred during printing.'
                );
            case 'cancelled':
                return 'The print job was cancelled.';
            case 'printing':
                return 'Your document is being printed. Please wait at the printer.';
            default:
                return 'Sending document to printer...';
        }
    };

    const progressPercentage =
        printJob.currentPage && printJob.pages
            ? Math.min(
                  (printJob.currentPage / (printJob.pages * printJob.copies)) *
                      100,
                  100,
              )
            : 0;

    const isActive =
        printJob.status === 'pending' || printJob.status === 'printing';
    const isComplete = printJob.status === 'completed';
    const hasFailed =
        printJob.status === 'failed' || printJob.status === 'cancelled';

    return (
        <>
            <Head title="Print Status" />

            {/* Session Timeout Warning */}
            <SessionTimeout
                onTimeout={handleTimeout}
                timeoutMinutes={5}
                warningSeconds={60}
            />

            <div className="min-h-screen bg-zinc-950 p-3">
                <div className="container mx-auto max-w-2xl">
                    {/* Header */}
                    <div className="mb-4 flex items-center justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-zinc-600 hover:text-zinc-400"
                            asChild
                        >
                            <Link href={kiosk.reset()}>🔄 Reset</Link>
                        </Button>
                    </div>

                    {/* Status Card */}
                    <Card className="mb-4 border-4 border-zinc-700 bg-gradient-to-b from-zinc-800 to-zinc-900 shadow-2xl">
                        <CardHeader className="p-6">
                            <div className="flex flex-col items-center space-y-4 text-center">
                                {getStatusIcon()}
                                <div>
                                    <CardTitle className="mb-2 text-3xl font-black tracking-tight text-white uppercase">
                                        {getStatusText()}
                                    </CardTitle>
                                    <CardDescription className="text-base text-zinc-300">
                                        {getStatusDescription()}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 p-6 pt-0">
                            {/* Progress Bar (only show when printing) */}
                            {isActive && printJob.currentPage && (
                                <Card className="border-2 border-blue-600 bg-blue-950/30">
                                    <CardContent className="p-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-blue-300">
                                                        Printing Page
                                                    </p>
                                                    <p className="text-3xl font-black text-blue-400">
                                                        {printJob.currentPage} /{' '}
                                                        {printJob.pages *
                                                            printJob.copies}
                                                    </p>
                                                </div>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{
                                                        repeat: Infinity,
                                                        duration: 2,
                                                        ease: 'linear',
                                                    }}
                                                >
                                                    <Printer className="h-16 w-16 text-blue-400" />
                                                </motion.div>
                                            </div>
                                            <Progress
                                                value={progressPercentage}
                                                className="h-6"
                                            />
                                            <div className="flex justify-between text-sm">
                                                <span className="font-bold text-white">
                                                    {progressPercentage.toFixed(
                                                        0,
                                                    )}
                                                    % Complete
                                                </span>
                                                <span className="font-bold text-blue-400">
                                                    {Math.ceil(
                                                        printJob.pages *
                                                            printJob.copies -
                                                            (printJob.currentPage ||
                                                                0),
                                                    )}{' '}
                                                    pages remaining
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Print Job Details */}
                            <Card className="border-2 border-zinc-700 bg-zinc-900/50">
                                <CardHeader className="p-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-bold text-white">
                                        <FileText className="h-5 w-5 text-amber-400" />
                                        Document Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 p-4 pt-0">
                                    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
                                        <p className="truncate text-sm font-bold text-white">
                                            {printJob.fileName}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 text-center">
                                            <p className="text-xs text-zinc-400">
                                                Pages
                                            </p>
                                            <p className="text-xl font-bold text-white">
                                                {printJob.pages}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 text-center">
                                            <p className="text-xs text-zinc-400">
                                                Copies
                                            </p>
                                            <p className="text-xl font-bold text-white">
                                                {printJob.copies}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 text-center">
                                            <p className="text-xs text-zinc-400">
                                                Mode
                                            </p>
                                            <p className="text-sm font-bold text-white capitalize">
                                                {printJob.colorMode}
                                            </p>
                                        </div>
                                    </div>

                                    {printJob.startedAt && (
                                        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
                                            <p className="text-xs text-zinc-400">
                                                Started At
                                            </p>
                                            <p className="text-sm font-bold text-white">
                                                {new Date(
                                                    printJob.startedAt,
                                                ).toLocaleString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    )}

                                    {printJob.completedAt && (
                                        <div className="rounded-lg border border-emerald-700 bg-emerald-950/30 p-3">
                                            <p className="text-xs text-emerald-400">
                                                Completed At
                                            </p>
                                            <p className="text-sm font-bold text-white">
                                                {new Date(
                                                    printJob.completedAt,
                                                ).toLocaleString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Error Recovery (show when failed) */}
                            {hasFailed && (
                                <div className="space-y-3">
                                    <Alert className="border-2 border-red-600 bg-red-950/30">
                                        <AlertTriangle className="h-5 w-5 text-red-400" />
                                        <AlertTitle className="text-base font-bold text-red-400">
                                            ⚠️ Print Job Failed
                                        </AlertTitle>
                                        <AlertDescription className="text-sm text-red-300">
                                            {printJob.errorMessage ||
                                                'An error occurred while printing your document. Please try again or contact staff for assistance.'}
                                        </AlertDescription>
                                    </Alert>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            onClick={handleRetryJob}
                                            className="h-14 border-2 border-blue-600 bg-blue-600 text-base font-bold hover:bg-blue-700"
                                        >
                                            <RefreshCw className="mr-2 h-5 w-5" />
                                            Retry Print
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleCancelJob}
                                            className="h-14 border-2 border-red-600 bg-red-950/30 text-base font-bold text-red-300 hover:bg-red-900/50"
                                        >
                                            <XCircle className="mr-2 h-5 w-5" />
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {!hasFailed && (
                                <div className="flex gap-3">
                                    {isActive && (
                                        <Button
                                            variant="outline"
                                            className="h-14 flex-1 border-2 border-red-600 bg-red-950/30 text-base font-bold text-red-300 hover:bg-red-900/50"
                                            onClick={handleCancelJob}
                                        >
                                            <XCircle className="mr-2 h-5 w-5" />
                                            Cancel Job
                                        </Button>
                                    )}

                                    {(isComplete || hasFailed) && (
                                        <motion.div
                                            className="flex-1"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Button
                                                className="h-16 w-full rounded-xl border-4 border-emerald-600 bg-gradient-to-br from-emerald-500 to-emerald-700 text-lg font-black text-white uppercase shadow-2xl hover:from-emerald-400 hover:to-emerald-600"
                                                asChild
                                            >
                                                <Link href={kiosk.home()}>
                                                    <Home className="mr-2 h-6 w-6" />
                                                    Return to Home
                                                </Link>
                                            </Button>
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Instructions Alert */}
                    {isActive && (
                        <Alert className="border-2 border-amber-600 bg-amber-950/30">
                            <Printer className="h-5 w-5 text-amber-400" />
                            <AlertTitle className="text-base font-bold text-amber-400">
                                ⚠️ Important - Please Wait
                            </AlertTitle>
                            <AlertDescription>
                                <ul className="mt-3 space-y-2 text-sm text-amber-300">
                                    <li className="flex gap-2">
                                        <span className="font-bold">1.</span>
                                        <span>Do not remove USB drive yet</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold">2.</span>
                                        <span>
                                            Stay near the printer to collect
                                            pages
                                        </span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold">3.</span>
                                        <span>
                                            Wait until all pages are printed
                                        </span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold">4.</span>
                                        <span>
                                            Contact staff if printer stops
                                        </span>
                                    </li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Success Message */}
                    {isComplete && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Alert className="border-2 border-emerald-600 bg-emerald-950/30">
                                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                <AlertTitle className="text-xl font-bold text-emerald-400">
                                    ✅ Print Job Complete!
                                </AlertTitle>
                                <AlertDescription>
                                    <div className="mt-3 space-y-2 text-sm text-emerald-300">
                                        <p className="font-bold">
                                            📄 Your document has been printed
                                            successfully!
                                        </p>
                                        <ul className="ml-4 list-disc space-y-1">
                                            <li>
                                                Collect your pages from the
                                                printer tray
                                            </li>
                                            <li>
                                                Check that you have all{' '}
                                                {printJob.pages *
                                                    printJob.copies}{' '}
                                                pages
                                            </li>
                                            <li>
                                                You can now remove your USB
                                                drive
                                            </li>
                                        </ul>
                                        <p className="mt-3 text-xs text-emerald-400">
                                            Thank you for using Piso Print! 🎉
                                        </p>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                </div>
            </div>
        </>
    );
}
