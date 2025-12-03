import { Button } from '@/components/ui/button';
import mobile from '@/routes/mobile';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    Clock,
    Coins,
    FileText,
    Printer,
    Upload,
} from 'lucide-react';

interface Props {
    fileName: string;
    pages: number;
}

export default function UploadSuccess({ fileName, pages }: Props) {
    return (
        <>
            <Head title="Upload Successful - PisoPrint" />

            <div className="min-h-screen bg-white">
                {/* Header */}
                <div className="border-b border-sky-100 bg-sky-50/30">
                    <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-5">
                        <div className="flex items-center gap-3">
                            <Printer className="h-7 w-7 text-sky-400" />
                            <h1 className="text-xl font-semibold text-sky-700">
                                Piso Print
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="mx-auto max-w-lg px-6 py-8">
                    {/* Success Animation */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                            type: 'spring',
                            stiffness: 200,
                            damping: 15,
                        }}
                        className="mb-6 flex justify-center"
                    >
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-sky-300 bg-sky-50 shadow-lg shadow-sky-200/50">
                            <CheckCircle className="h-10 w-10 text-sky-500" />
                        </div>
                    </motion.div>

                    {/* Title */}
                    <div className="mb-8 text-center">
                        <h2 className="mb-2 text-2xl font-light text-sky-700">
                            Upload Successful!
                        </h2>
                        <p className="text-sky-500">
                            Your file is ready at the kiosk
                        </p>
                    </div>

                    {/* File Info Card */}
                    <div className="mb-6 rounded-xl border-2 border-sky-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-400">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-sky-800">
                                    {fileName}
                                </p>
                                <p className="text-sm text-sky-500">
                                    {pages} {pages === 1 ? 'page' : 'pages'}
                                </p>
                            </div>
                            <CheckCircle className="h-6 w-6 text-sky-400" />
                        </div>
                    </div>

                    {/* Ready Message */}
                    <div className="mb-8 rounded-xl border-2 border-sky-300 bg-sky-50 p-6 text-center">
                        <Printer className="mx-auto mb-3 h-10 w-10 text-sky-400" />
                        <p className="mb-1 text-lg font-medium text-sky-700">
                            File Ready at Kiosk!
                        </p>
                        <p className="text-sm text-sky-500">
                            Go to the kiosk touchscreen to continue
                        </p>
                    </div>

                    {/* Next Steps */}
                    <div className="mb-8">
                        <h3 className="mb-4 text-center text-lg font-light text-sky-700">
                            Next Steps
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-4 rounded-lg border border-sky-100 bg-sky-50/50 p-4">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-sky-300 bg-white">
                                    <span className="text-sm font-light text-sky-600">
                                        1
                                    </span>
                                </div>
                                <p className="text-sky-700">
                                    Go to the kiosk machine
                                </p>
                            </div>
                            <div className="flex items-center gap-4 rounded-lg border border-sky-100 bg-sky-50/50 p-4">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-sky-300 bg-white">
                                    <span className="text-sm font-light text-sky-600">
                                        2
                                    </span>
                                </div>
                                <p className="text-sky-700">
                                    Accept the file on the touchscreen
                                </p>
                            </div>
                            <div className="flex items-center gap-4 rounded-lg border border-sky-100 bg-sky-50/50 p-4">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-sky-300 bg-white">
                                    <span className="text-sm font-light text-sky-600">
                                        3
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sky-700">
                                    <Coins className="h-4 w-4 text-sky-400" />
                                    Insert coins and print!
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upload Another Button */}
                    <Button
                        asChild
                        size="lg"
                        className="h-14 w-full rounded-xl bg-gradient-to-r from-sky-400 to-sky-500 text-lg font-medium text-white shadow-lg shadow-sky-200 hover:from-sky-500 hover:to-sky-600"
                    >
                        <Link href={mobile.upload()}>
                            <Upload className="mr-2 h-5 w-5" />
                            Upload Another File
                        </Link>
                    </Button>

                    {/* Timer Note */}
                    <div className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3">
                        <Clock className="h-4 w-4 text-sky-400" />
                        <p className="text-sm text-sky-600">
                            File available for 15 minutes
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="fixed right-0 bottom-0 left-0 border-t border-sky-100 bg-white/80 backdrop-blur-sm">
                    <div className="mx-auto max-w-7xl px-6 py-3 text-center">
                        <p className="text-sm text-sky-400">
                            Piso Print Kiosk System
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
