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
import { Form, Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CheckCircle, FileText, Upload, X } from 'lucide-react';
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

            <div className="min-h-screen bg-zinc-950 p-4 sm:p-6">
                <div className="container mx-auto max-w-lg">
                    {/* Header */}
                    <div className="mb-6 text-center">
                        <h1 className="mb-2 text-4xl font-black text-amber-400 drop-shadow-lg">
                            📱 PisoPrint
                        </h1>
                        <p className="text-lg text-zinc-400">
                            Upload your PDF to print
                        </p>
                    </div>

                    {/* Upload Card */}
                    <Card className="border-2 border-zinc-700 bg-zinc-900/50 shadow-2xl">
                        <CardHeader className="space-y-1 pb-4">
                            <CardTitle className="text-2xl font-bold">
                                Upload Document
                            </CardTitle>
                            <CardDescription>
                                PDF files only • Max{' '}
                                {Math.round(maxFileSize / 1024 / 1024)}MB
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
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
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-4 border-dashed border-zinc-600 bg-zinc-800 p-8 text-center transition-all hover:border-blue-500 hover:bg-blue-950/30"
                                                onClick={() =>
                                                    document
                                                        .getElementById(
                                                            'fileInput',
                                                        )
                                                        ?.click()
                                                }
                                            >
                                                <motion.div
                                                    animate={{
                                                        y: [0, -10, 0],
                                                    }}
                                                    transition={{
                                                        repeat: Infinity,
                                                        duration: 2,
                                                        ease: 'easeInOut',
                                                    }}
                                                >
                                                    <Upload className="mx-auto mb-4 h-20 w-20 text-blue-400" />
                                                </motion.div>
                                                <p className="mb-2 text-xl font-bold text-white">
                                                    Tap to Select PDF
                                                </p>
                                                <p className="text-sm text-zinc-400">
                                                    Choose a file from your
                                                    device
                                                </p>
                                                <div className="mt-6 rounded-lg bg-amber-900 px-4 py-2">
                                                    <p className="text-sm font-bold text-amber-100">
                                                        📄 PDF Files Only
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <div className="space-y-4">
                                                {/* Selected File Display */}
                                                <div className="flex items-center gap-4 rounded-xl border-2 border-emerald-500 bg-emerald-950/20 p-4">
                                                    <div className="rounded-full bg-emerald-500 p-3">
                                                        <FileText className="h-8 w-8 text-white" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-base font-bold text-white">
                                                            {selectedFile.name}
                                                        </p>
                                                        <p className="text-sm text-emerald-300">
                                                            {formatFileSize(
                                                                selectedFile.size,
                                                            )}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 text-red-500 hover:bg-red-50 hover:text-red-600"
                                                        onClick={
                                                            handleClearFile
                                                        }
                                                        disabled={processing}
                                                    >
                                                        <X className="h-5 w-5" />
                                                    </Button>
                                                </div>

                                                {/* Upload Progress */}
                                                {processing && progress && (
                                                    <Card className="border-blue-600 bg-blue-950/20">
                                                        <CardContent className="p-4">
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="font-semibold text-white">
                                                                        Uploading...
                                                                    </span>
                                                                    <span className="font-bold text-blue-400">
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
                                                                    className="h-3"
                                                                />
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )}

                                                {/* Error Message */}
                                                {errors.file && (
                                                    <Alert className="border-2 border-red-600 bg-red-950/30">
                                                        <AlertTitle className="text-base font-bold text-red-400">
                                                            ⚠️ Upload Error
                                                        </AlertTitle>
                                                        <AlertDescription className="text-sm text-red-300">
                                                            {errors.file}
                                                        </AlertDescription>
                                                    </Alert>
                                                )}

                                                {/* Upload Button */}
                                                <motion.div
                                                    whileHover={{
                                                        scale: 1.02,
                                                    }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <Button
                                                        type="submit"
                                                        size="lg"
                                                        className="h-14 w-full rounded-xl bg-emerald-600 text-lg font-bold text-white shadow-lg hover:bg-emerald-500"
                                                        disabled={processing}
                                                    >
                                                        {processing ? (
                                                            <>
                                                                <span className="mr-2">
                                                                    ⏳
                                                                </span>
                                                                Uploading...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="mr-2 h-5 w-5" />
                                                                Upload to Kiosk
                                                            </>
                                                        )}
                                                    </Button>
                                                </motion.div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Form>
                        </CardContent>
                    </Card>

                    {/* Instructions */}
                    <Card className="mt-6 border-2 border-purple-600/50 bg-purple-950/20">
                        <CardContent className="p-4">
                            <h3 className="mb-3 text-lg font-bold text-purple-300">
                                📝 How it works
                            </h3>
                            <ol className="space-y-2 text-sm text-zinc-400">
                                <li className="flex gap-2">
                                    <span className="font-bold">1.</span>
                                    <span>
                                        Select your PDF file from this device
                                    </span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold">2.</span>
                                    <span>
                                        File will be uploaded to the kiosk
                                    </span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold">3.</span>
                                    <span>
                                        Go to the kiosk to preview and print
                                    </span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold">4.</span>
                                    <span>Insert coins to start printing</span>
                                </li>
                            </ol>
                        </CardContent>
                    </Card>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-zinc-500">
                            PisoPrint WiFi Upload Portal
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
