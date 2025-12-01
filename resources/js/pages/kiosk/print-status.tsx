import SessionTimeout from '@/components/session-timeout';
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
    RotateCcw,
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
                        className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
                    >
                        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                    </motion.div>
                );
            case 'failed':
                return (
                    <motion.div
                        animate={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                        className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100"
                    >
                        <XCircle className="h-10 w-10 text-red-600" />
                    </motion.div>
                );
            case 'cancelled':
                return (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
                        <AlertCircle className="h-10 w-10 text-amber-600" />
                    </div>
                );
            case 'printing':
                return (
                    <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-100"
                    >
                        <Printer className="h-10 w-10 text-sky-600" />
                    </motion.div>
                );
            default:
                return (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                        <Loader2 className="h-10 w-10 animate-spin text-slate-500" />
                    </div>
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

            <div className="min-h-screen overflow-x-hidden bg-white px-4 py-6">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100">
                                <Printer className="h-6 w-6 text-sky-500" />
                            </div>
                            <div>
                                <h1 className="bg-gradient-to-r from-sky-400/80 to-sky-500/70 bg-clip-text text-xl font-bold text-transparent">
                                    Print Status
                                </h1>
                                <p className="text-sm text-slate-500">
                                    Track your print job
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-slate-600"
                            asChild
                        >
                            <Link href={kiosk.reset()}>
                                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                                Reset
                            </Link>
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {/* Status Card */}
                        <Card className="overflow-hidden border-2 border-sky-200 bg-white">
                            <CardHeader className="border-b border-sky-100 bg-sky-50/30 p-6">
                                <div className="flex flex-col items-center space-y-4 text-center">
                                    {getStatusIcon()}
                                    <div>
                                        <CardTitle className="mb-2 text-2xl font-bold text-slate-800">
                                            {getStatusText()}
                                        </CardTitle>
                                        <CardDescription className="text-base text-slate-500">
                                            {getStatusDescription()}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 p-6">
                                {/* Progress Bar (only show when printing) */}
                                {isActive && printJob.currentPage && (
                                    <Card className="border-2 border-sky-200 bg-white">
                                        <CardContent className="p-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-500">
                                                            Printing Page
                                                        </p>
                                                        <p className="text-3xl font-bold text-sky-600">
                                                            {
                                                                printJob.currentPage
                                                            }{' '}
                                                            /{' '}
                                                            {printJob.pages *
                                                                printJob.copies}
                                                        </p>
                                                    </div>
                                                    <motion.div
                                                        animate={{
                                                            rotate: 360,
                                                        }}
                                                        transition={{
                                                            repeat: Infinity,
                                                            duration: 2,
                                                            ease: 'linear',
                                                        }}
                                                        className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100"
                                                    >
                                                        <Printer className="h-7 w-7 text-sky-500" />
                                                    </motion.div>
                                                </div>
                                                <Progress
                                                    value={progressPercentage}
                                                    className="h-4"
                                                />
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-semibold text-sky-600">
                                                        {progressPercentage.toFixed(
                                                            0,
                                                        )}
                                                        % Complete
                                                    </span>
                                                    <span className="text-slate-500">
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
                                <Card className="border-2 border-sky-200 bg-white">
                                    <CardHeader className="border-b border-sky-100 bg-sky-50/30 px-4 py-3">
                                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-sky-700">
                                            <FileText className="h-4 w-4 text-sky-500" />
                                            Document Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 p-4">
                                        <div className="rounded-lg bg-slate-50 p-3">
                                            <p className="text-xs text-slate-500">
                                                File Name
                                            </p>
                                            <p className="truncate text-sm font-semibold text-slate-800">
                                                {printJob.fileName}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="rounded-lg bg-slate-50 p-3 text-center">
                                                <p className="text-xs text-slate-500">
                                                    Pages
                                                </p>
                                                <p className="text-xl font-bold text-slate-800">
                                                    {printJob.pages}
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-slate-50 p-3 text-center">
                                                <p className="text-xs text-slate-500">
                                                    Copies
                                                </p>
                                                <p className="text-xl font-bold text-slate-800">
                                                    {printJob.copies}
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-slate-50 p-3 text-center">
                                                <p className="text-xs text-slate-500">
                                                    Mode
                                                </p>
                                                <p className="text-sm font-bold text-slate-800 capitalize">
                                                    {printJob.colorMode}
                                                </p>
                                            </div>
                                        </div>

                                        {printJob.startedAt && (
                                            <div className="rounded-lg bg-slate-50 p-3">
                                                <p className="text-xs text-slate-500">
                                                    Started At
                                                </p>
                                                <p className="text-sm font-semibold text-slate-800">
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
                                            <div className="rounded-lg bg-emerald-50 p-3">
                                                <p className="text-xs text-emerald-600">
                                                    Completed At
                                                </p>
                                                <p className="text-sm font-semibold text-emerald-700">
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
                                    <div className="space-y-4">
                                        <Card className="border-2 border-red-300 bg-red-50">
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-red-700">
                                                            Print Job Failed
                                                        </p>
                                                        <p className="text-sm text-red-600">
                                                            {printJob.errorMessage ||
                                                                'An error occurred while printing your document. Please try again or contact staff for assistance.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                onClick={handleRetryJob}
                                                className="h-14 rounded-xl bg-sky-500 text-base font-semibold text-white hover:bg-sky-600"
                                            >
                                                <RefreshCw className="mr-2 h-5 w-5" />
                                                Retry Print
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={handleCancelJob}
                                                className="h-14 rounded-xl border-2 border-slate-300 text-base font-semibold text-slate-600 hover:bg-slate-50"
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
                                                className="h-14 flex-1 rounded-xl border-2 border-slate-300 text-base font-semibold text-slate-600 hover:bg-slate-50"
                                                onClick={handleCancelJob}
                                            >
                                                <XCircle className="mr-2 h-5 w-5" />
                                                Cancel Job
                                            </Button>
                                        )}

                                        {(isComplete || hasFailed) && (
                                            <motion.div
                                                className="flex-1"
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                            >
                                                <Button
                                                    className="h-14 w-full rounded-xl bg-sky-500 text-base font-semibold text-white shadow-lg hover:bg-sky-600"
                                                    asChild
                                                >
                                                    <Link href={kiosk.home()}>
                                                        <Home className="mr-2 h-5 w-5" />
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
                            <Card className="border-2 border-amber-200 bg-amber-50">
                                <CardHeader className="border-b border-amber-100 bg-amber-50/50 px-4 py-3">
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                        Important - Please Wait
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-3 rounded-lg bg-white p-3">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-600">
                                                1
                                            </span>
                                            <span className="text-sm text-slate-700">
                                                Do not remove USB drive yet
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3 rounded-lg bg-white p-3">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-600">
                                                2
                                            </span>
                                            <span className="text-sm text-slate-700">
                                                Stay near the printer to collect
                                                pages
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3 rounded-lg bg-white p-3">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-600">
                                                3
                                            </span>
                                            <span className="text-sm text-slate-700">
                                                Wait until all pages are printed
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3 rounded-lg bg-white p-3">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-600">
                                                4
                                            </span>
                                            <span className="text-sm text-slate-700">
                                                Contact staff if printer stops
                                            </span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {/* Success Message */}
                        {isComplete && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Card className="border-2 border-emerald-300 bg-emerald-50">
                                    <CardHeader className="border-b border-emerald-100 bg-emerald-50/50 px-4 py-3">
                                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            Print Job Complete!
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <p className="mb-3 font-medium text-emerald-700">
                                            Your document has been printed
                                            successfully!
                                        </p>
                                        <ul className="space-y-2">
                                            <li className="flex items-start gap-3 rounded-lg bg-white p-3">
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                                <span className="text-sm text-slate-700">
                                                    Collect your pages from the
                                                    printer tray
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-3 rounded-lg bg-white p-3">
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                                <span className="text-sm text-slate-700">
                                                    Check that you have all{' '}
                                                    {printJob.pages *
                                                        printJob.copies}{' '}
                                                    pages
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-3 rounded-lg bg-white p-3">
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                                <span className="text-sm text-slate-700">
                                                    You can now remove your USB
                                                    drive
                                                </span>
                                            </li>
                                        </ul>
                                        <p className="mt-4 text-center text-sm text-emerald-600">
                                            Thank you for using Piso Print! 🎉
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
