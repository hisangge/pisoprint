import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Form, Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    CheckCircle,
    FileText,
    Printer,
    Upload,
    Wifi,
    X,
} from 'lucide-react';
import { useCallback, useState } from 'react';

interface Props {
    maxFileSize: number;
}

export default function MobileUpload({ maxFileSize }: Props) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileSelect = useCallback(
        (file: File) => {
            // Validate file type
            if (!file.type.includes('pdf')) {
                alert('Please select a PDF file');
                return;
            }

            // Validate file size
            if (file.size > maxFileSize) {
                alert(
                    `File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`,
                );
                return;
            }

            setSelectedFile(file);
        },
        [maxFileSize],
    );

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleClearFile = () => {
        setSelectedFile(null);
        // Clear the file input
        const fileInput = document.getElementById(
            'fileInput',
        ) as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (
            Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
        );
    };

    return (
        <>
            <Head title="Upload PDF - PisoPrint" />

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
                    {/* Title */}
                    <div className="mb-6 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-sky-300 bg-sky-50 shadow-lg shadow-sky-200/50">
                            <Wifi className="h-8 w-8 text-sky-400" />
                        </div>
                        <h2 className="mb-2 text-2xl font-light text-sky-700">
                            Upload PDF
                        </h2>
                        <p className="text-sky-500">
                            PDF files only • Max{' '}
                            {Math.round(maxFileSize / 1024 / 1024)}MB
                        </p>
                    </div>

                    {/* Upload Card */}
                    <Form
                        action="/mobile/upload"
                        method="post"
                        encType="multipart/form-data"
                    >
                        {({ processing, errors, progress }) => (
                            <div className="space-y-4">
                                {/* Hidden file input - always in DOM */}
                                <input
                                    id="fileInput"
                                    type="file"
                                    name="file"
                                    accept=".pdf,application/pdf"
                                    className="hidden"
                                    onChange={handleFileInputChange}
                                    required
                                />

                                {!selectedFile ? (
                                    <motion.div
                                        whileTap={{ scale: 0.98 }}
                                        className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-sky-300 bg-sky-50/50 p-8 text-center transition-all active:border-sky-400 active:bg-sky-100/50"
                                        onClick={() =>
                                            document
                                                .getElementById('fileInput')
                                                ?.click()
                                        }
                                    >
                                        <motion.div
                                            animate={{
                                                y: [0, -8, 0],
                                            }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 2,
                                                ease: 'easeInOut',
                                            }}
                                        >
                                            <Upload className="mx-auto mb-4 h-14 w-14 text-sky-400" />
                                        </motion.div>
                                        <p className="mb-2 text-lg font-medium text-sky-700">
                                            Tap to Select PDF
                                        </p>
                                        <p className="text-sm text-sky-500">
                                            Choose a file from your device
                                        </p>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Selected File Display */}
                                        <div className="flex items-center gap-4 rounded-xl border-2 border-sky-400 bg-sky-50 p-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-400">
                                                <FileText className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-medium text-sky-800">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-sm text-sky-500">
                                                    {formatFileSize(
                                                        selectedFile.size,
                                                    )}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 text-sky-400 hover:bg-sky-100 hover:text-sky-600"
                                                onClick={handleClearFile}
                                                disabled={processing}
                                            >
                                                <X className="h-5 w-5" />
                                            </Button>
                                        </div>

                                        {/* Upload Progress */}
                                        {processing && progress && (
                                            <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-medium text-sky-700">
                                                            Uploading...
                                                        </span>
                                                        <span className="font-bold text-sky-500">
                                                            {
                                                                progress.percentage
                                                            }
                                                            %
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={
                                                            progress.percentage
                                                        }
                                                        className="h-2"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Error Message */}
                                        {errors.file && (
                                            <Alert className="border-2 border-red-200 bg-red-50">
                                                <AlertTitle className="font-medium text-red-700">
                                                    Upload Error
                                                </AlertTitle>
                                                <AlertDescription className="text-sm text-red-600">
                                                    {errors.file}
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        {/* Upload Button */}
                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="h-14 w-full rounded-xl bg-gradient-to-r from-sky-400 to-sky-500 text-lg font-medium text-white shadow-lg shadow-sky-200 hover:from-sky-500 hover:to-sky-600"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <>Uploading...</>
                                            ) : (
                                                <>
                                                    <CheckCircle className="mr-2 h-5 w-5" />
                                                    Upload to Kiosk
                                                    <ArrowRight className="ml-2 h-5 w-5" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </Form>

                    {/* Instructions */}
                    <div className="mt-8">
                        <h3 className="mb-4 text-center text-lg font-light text-sky-700">
                            How It Works
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-4 rounded-lg border border-sky-100 bg-sky-50/50 p-4">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-sky-300 bg-white">
                                    <span className="text-sm font-light text-sky-600">
                                        1
                                    </span>
                                </div>
                                <p className="text-sky-700">
                                    Select your PDF file
                                </p>
                            </div>
                            <div className="flex items-center gap-4 rounded-lg border border-sky-100 bg-sky-50/50 p-4">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-sky-300 bg-white">
                                    <span className="text-sm font-light text-sky-600">
                                        2
                                    </span>
                                </div>
                                <p className="text-sky-700">
                                    Go to kiosk and accept the file
                                </p>
                            </div>
                            <div className="flex items-center gap-4 rounded-lg border border-sky-100 bg-sky-50/50 p-4">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-sky-300 bg-white">
                                    <span className="text-sm font-light text-sky-600">
                                        3
                                    </span>
                                </div>
                                <p className="text-sky-700">
                                    Insert coins and print!
                                </p>
                            </div>
                        </div>
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
