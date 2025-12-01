'use client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import kiosk from '@/routes/kiosk';
import { Head, Link, router, usePoll } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Coins,
    FileText,
    Printer,
    RotateCcw,
    Upload,
    Wifi,
} from 'lucide-react';

interface Props {
    pendingUpload?: {
        filename: string;
        original_name: string;
        pages: number;
        size: number;
        uploaded_at: string;
    };
}

export default function Home({ pendingUpload }: Props) {
    usePoll(3000, { only: ['pendingUpload'] });

    const handleAcceptUpload = () => {
        router.post(kiosk.acceptPendingUpload.url());
    };

    return (
        <>
            <Head title="Piso Print Kiosk" />
            <div className="min-h-screen bg-white">
                {/* Header */}
                <div className="border-b border-sky-100 bg-sky-50/30">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
                        <div className="flex items-center gap-3">
                            <Printer className="h-8 w-8 text-sky-400" />
                            <h1 className="text-2xl font-semibold text-sky-700">
                                Piso Print
                            </h1>
                        </div>
                        <Button
                            variant="ghost"
                            className="text-sky-400 hover:bg-sky-50 hover:text-sky-600"
                            asChild
                        >
                            <Link href={kiosk.reset()}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Reset
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="mx-auto max-w-7xl px-8 py-12">
                    {/* Pending Upload Alert */}
                    {pendingUpload && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mb-12"
                        >
                            <Alert className="border border-sky-200 bg-sky-50">
                                <Wifi className="h-5 w-5 text-sky-500" />
                                <AlertTitle className="text-sky-800">
                                    File Received via WiFi
                                </AlertTitle>
                                <AlertDescription className="mt-3">
                                    <div className="mb-4 rounded-lg border border-sky-200 bg-white p-4">
                                        <p className="font-medium text-sky-800">
                                            {pendingUpload.original_name}
                                        </p>
                                        <p className="text-sm text-sky-500">
                                            {pendingUpload.pages} page
                                            {pendingUpload.pages > 1 && 's'}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleAcceptUpload}
                                        className="w-full bg-sky-400 hover:bg-sky-500"
                                    >
                                        Continue to Print
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        </motion.div>
                    )}

                    {/* Hero Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-16 text-center"
                    >
                        <h2 className="mb-4 text-5xl font-light text-sky-700">
                            Start Printing
                        </h2>
                        <p className="mb-8 text-lg text-sky-500">
                            Upload via USB or WiFi
                        </p>
                        <Button
                            asChild
                            size="lg"
                            className="h-16 bg-gradient-to-r from-sky-400 to-sky-500 px-12 text-lg hover:from-sky-500 hover:to-sky-600"
                        >
                            <Link href={kiosk.upload()}>
                                <Upload className="mr-3 h-5 w-5" />
                                Upload File
                                <ArrowRight className="ml-3 h-5 w-5" />
                            </Link>
                        </Button>
                    </motion.div>

                    {/* Pricing Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-16"
                    >
                        <h3 className="mb-8 text-center text-2xl font-light text-sky-700">
                            Pricing
                        </h3>
                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="rounded-lg border-2 border-sky-200 bg-white p-8 text-center transition-all hover:border-sky-300 hover:shadow-md">
                                <FileText className="mx-auto mb-4 h-8 w-8 text-sky-400" />
                                <p className="mb-2 text-lg font-medium text-sky-800">
                                    Black & White
                                </p>
                                <p className="mb-4 text-sm text-sky-500">
                                    Text documents
                                </p>
                                <p className="text-4xl font-light text-sky-700">
                                    ₱2
                                </p>
                                <p className="text-sm text-sky-400">per page</p>
                            </div>

                            <div className="rounded-lg border-2 border-sky-200 bg-white p-8 text-center transition-all hover:border-sky-300 hover:shadow-md">
                                <FileText className="mx-auto mb-4 h-8 w-8 text-sky-400" />
                                <p className="mb-2 text-lg font-medium text-sky-800">
                                    Grayscale
                                </p>
                                <p className="mb-4 text-sm text-sky-500">
                                    Images & graphics
                                </p>
                                <p className="text-4xl font-light text-sky-700">
                                    ₱3
                                </p>
                                <p className="text-sm text-sky-400">per page</p>
                            </div>

                            <div className="rounded-lg border-2 border-sky-200 bg-white p-8 text-center transition-all hover:border-sky-300 hover:shadow-md">
                                <FileText className="mx-auto mb-4 h-8 w-8 text-sky-400" />
                                <p className="mb-2 text-lg font-medium text-sky-800">
                                    Full Color
                                </p>
                                <p className="mb-4 text-sm text-sky-500">
                                    Photos & vibrant
                                </p>
                                <p className="text-4xl font-light text-sky-700">
                                    ₱5
                                </p>
                                <p className="text-sm text-sky-400">per page</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Steps */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-16"
                    >
                        <h3 className="mb-8 text-center text-2xl font-light text-sky-700">
                            How It Works
                        </h3>
                        <div className="grid gap-8 md:grid-cols-3">
                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-sky-300 bg-sky-50 shadow-lg shadow-sky-200/50">
                                    <span className="text-2xl font-light text-sky-600">
                                        1
                                    </span>
                                </div>
                                <Upload className="mx-auto mb-3 h-6 w-6 text-sky-400" />
                                <p className="text-lg text-sky-700">
                                    Upload File
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-sky-300 bg-sky-50 shadow-lg shadow-sky-200/50">
                                    <span className="text-2xl font-light text-sky-600">
                                        2
                                    </span>
                                </div>
                                <FileText className="mx-auto mb-3 h-6 w-6 text-sky-400" />
                                <p className="text-lg text-sky-700">
                                    Select Options
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-sky-300 bg-sky-50 shadow-lg shadow-sky-200/50">
                                    <span className="text-2xl font-light text-sky-600">
                                        3
                                    </span>
                                </div>
                                <Coins className="mx-auto mb-3 h-6 w-6 text-sky-400" />
                                <p className="text-lg text-sky-700">
                                    Insert Coins
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
}
