import SessionTimeout from '@/components/session-timeout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import kiosk from '@/routes/kiosk';
import { Head, Link, router, usePoll } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    FileText,
    FolderOpen,
    HardDrive,
    Loader2,
    RotateCcw,
    Smartphone,
    UploadCloud,
    Wifi,
    X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useRef, useState } from 'react';

// --- TYPES ---
interface UsbFile {
    name: string;
    path: string;
    full_path: string;
    device: string;
    size: number;
    size_formatted: string;
    modified_at: string;
}

interface UsbDrive {
    device: string;
    path: string;
    mounted_at: string;
}

interface Props {
    maxFileSize: number;
    wifiInfo: {
        ssid: string;
        password: string;
        ip: string;
        url: string;
    };
    usbData: {
        usbDrives: UsbDrive[];
        files: UsbFile[];
        total_files: number;
        error?: string;
        message?: string;
    };
    pendingUpload?: {
        filename: string;
        original_name: string;
        pages: number;
        size: number;
        uploaded_at: string;
    };
}

export default function FileSelection({
    wifiInfo,
    usbData: initialUsbData,
    pendingUpload: initialPendingUpload,
}: Props) {
    // --- STATE ---
    const [usbData, setUsbData] = useState(initialUsbData);
    const [pendingUpload, setPendingUpload] = useState(initialPendingUpload);
    const [selectedFile, setSelectedFile] = useState<UsbFile | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const hasFilesRef = useRef(initialUsbData.files.length > 0);

    // --- POLLING LOGIC ---
    usePoll(
        2000,
        {
            only: ['usbData', 'pendingUpload'],
            onSuccess: (page) => {
                const updatedData = (
                    page.props as unknown as Record<string, unknown>
                ).usbData as typeof initialUsbData;
                const updatedPendingUpload = (
                    page.props as unknown as Record<string, unknown>
                ).pendingUpload as typeof initialPendingUpload;

                setUsbData(updatedData);
                setPendingUpload(updatedPendingUpload);

                // Auto-stop polling if we found files and didn't have them before
                if (updatedData.files.length > 0 && !hasFilesRef.current) {
                    hasFilesRef.current = true;
                }
            },
        },
        {
            autoStart: true,
            keepAlive: true,
        },
    );

    // --- HANDLERS ---

    const handleFileSelect = (file: UsbFile) => {
        setSelectedFile(file);
    };

    const handleClearFile = () => {
        setSelectedFile(null);
    };

    const handleUpload = () => {
        if (!selectedFile || isUploading) return;

        console.log('Starting USB upload for file:', selectedFile.name);
        console.log('Full path:', selectedFile.full_path);
        console.log('Device:', selectedFile.device);
        console.log('Path:', selectedFile.path);

        setIsUploading(true);

        // Use router.post directly with the data to avoid async state issues with setData
        router.post(
            kiosk.uploadFromUsb.url(),
            {
                device: selectedFile.device,
                file_path: selectedFile.path,
            },
            {
                onSuccess: () => {
                    console.log('USB upload successful');
                    setSelectedFile(null);
                },
                onError: (err) => {
                    console.error('Upload failed:', err);
                    // Don't reset the selection on error so user can try again
                },
                onFinish: () => {
                    setIsUploading(false);
                },
            },
        );
    };

    const handleAcceptUpload = () => {
        router.post(kiosk.acceptPendingUpload.url());
    };

    const handleTimeout = () => {
        router.visit(kiosk.home.url(), {
            method: 'get',
            data: { timeout: true },
        });
    };

    return (
        <>
            <Head title="Select File" />

            {/* Session Timeout Warning */}
            <SessionTimeout
                onTimeout={handleTimeout}
                timeoutMinutes={5}
                warningSeconds={60}
            />

            <div className="min-h-screen bg-white px-4 py-6">
                <div className="mx-auto max-w-7xl">
                    {/* PENDING UPLOAD ACCEPTANCE SCREEN */}
                    {pendingUpload ? (
                        <div className="flex min-h-[80vh] flex-col items-center justify-center">
                            {/* Success Animation */}
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 200,
                                    damping: 15,
                                }}
                                className="mb-8"
                            >
                                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-100">
                                    <Smartphone className="h-12 w-12" />
                                    <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white">
                                        <CheckCircle2 className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Header */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="mb-8 text-center"
                            >
                                <h1 className="text-3xl font-light text-sky-700">
                                    File Received!
                                </h1>
                                <p className="mt-2 text-sky-500">
                                    Ready to print from your device
                                </p>
                            </motion.div>

                            {/* File Info Card */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="mb-8 w-full"
                            >
                                <Card className="overflow-hidden border-2 border-sky-200 bg-white">
                                    <div className="bg-sky-50 p-4 text-center">
                                        <p className="font-bold break-all text-emerald-900">
                                            {pendingUpload.original_name}
                                        </p>
                                    </div>
                                    <CardContent className="flex items-center justify-between p-6">
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-slate-900">
                                                {pendingUpload.pages}
                                            </p>
                                            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                                                Pages
                                            </p>
                                        </div>
                                        <div className="h-10 w-px bg-slate-100" />
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-slate-900">
                                                {(
                                                    pendingUpload.size / 1024
                                                ).toFixed(0)}
                                            </p>
                                            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                                                KB
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Accept Button */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="w-full"
                            >
                                <Button
                                    size="lg"
                                    onClick={handleAcceptUpload}
                                    className="h-14 w-full bg-gradient-to-r from-sky-400 to-sky-500 text-lg font-bold text-white hover:from-sky-500 hover:to-sky-600"
                                >
                                    Continue to Preview
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </motion.div>
                        </div>
                    ) : (
                        /* NORMAL FILE SELECTION INTERFACE */
                        <>
                            {/* Header */}
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-12 w-12 rounded-full border-2 border-sky-400 bg-sky-400 text-white hover:bg-sky-500"
                                        asChild
                                    >
                                        <Link href={kiosk.home()}>
                                            <ArrowLeft className="h-5 w-5" />
                                        </Link>
                                    </Button>
                                    <h1 className="bg-gradient-to-r from-sky-400/80 to-sky-500/70 bg-clip-text text-xl font-bold text-transparent">
                                        Select File
                                    </h1>
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

                            <div className="space-y-6">
                                {/* USB Status Card */}
                                <Card
                                    className={`overflow-hidden border-2 transition-all ${
                                        usbData.usbDrives.length > 0
                                            ? 'border-sky-300 bg-sky-50'
                                            : 'border-sky-200 bg-white'
                                    }`}
                                >
                                    <div className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                                                    usbData.usbDrives.length > 0
                                                        ? 'bg-sky-100 text-sky-500'
                                                        : 'bg-sky-100 text-sky-400'
                                                }`}
                                            >
                                                <HardDrive className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <p
                                                    className={`font-bold ${
                                                        usbData.usbDrives
                                                            .length > 0
                                                            ? 'text-sky-700'
                                                            : 'text-sky-700'
                                                    }`}
                                                >
                                                    {usbData.usbDrives.length >
                                                    0
                                                        ? 'USB Drive Connected'
                                                        : 'Insert USB Drive'}
                                                </p>
                                                <p
                                                    className={`text-sm ${
                                                        usbData.usbDrives
                                                            .length > 0
                                                            ? 'text-sky-500'
                                                            : 'text-sky-500'
                                                    }`}
                                                >
                                                    {usbData.usbDrives.length >
                                                    0
                                                        ? `${usbData.usbDrives.length} device(s) found`
                                                        : 'Waiting for device...'}
                                                </p>
                                            </div>
                                            {usbData.usbDrives.length === 0 && (
                                                <Loader2 className="h-5 w-5 animate-spin text-sky-300" />
                                            )}
                                        </div>
                                    </div>
                                </Card>

                                {/* Error Display */}
                                {usbData.error && (
                                    <Alert className="border border-sky-300 bg-sky-50">
                                        <AlertCircle className="h-4 w-4 text-sky-600" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>
                                            {usbData.error}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Main Area: Either File Grid OR Selected File View */}
                                <Card className="overflow-hidden border-2 border-sky-200 bg-white">
                                    <CardHeader className="border-b border-sky-100 bg-sky-50/30 pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base font-bold text-sky-700">
                                            <FolderOpen className="h-5 w-5 text-sky-500" />
                                            {selectedFile
                                                ? 'Selected Document'
                                                : 'PDF Documents'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        {/* VIEW 1: SELECTED FILE (Ready to Upload) */}
                                        {selectedFile ? (
                                            <div className="space-y-6">
                                                <motion.div
                                                    initial={{
                                                        scale: 0.95,
                                                        opacity: 0,
                                                    }}
                                                    animate={{
                                                        scale: 1,
                                                        opacity: 1,
                                                    }}
                                                    className="rounded-xl bg-sky-50 p-4 ring-1 ring-sky-100"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="rounded-lg bg-sky-100 p-3 text-sky-600">
                                                            <FileText className="h-8 w-8" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="bg-gradient-to-r from-sky-600/90 to-sky-700/80 bg-clip-text font-bold break-all text-transparent">
                                                                {
                                                                    selectedFile.name
                                                                }
                                                            </h3>
                                                            <p className="mt-1 text-sm font-medium text-sky-600">
                                                                {
                                                                    selectedFile.size_formatted
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <Button
                                                        variant="outline"
                                                        onClick={
                                                            handleClearFile
                                                        }
                                                        disabled={isUploading}
                                                        className="h-12 rounded-xl border-2 border-sky-200 font-semibold text-sky-600 hover:bg-sky-50"
                                                    >
                                                        <X className="mr-2 h-4 w-4" />
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        onClick={handleUpload}
                                                        disabled={isUploading}
                                                        className="h-12 rounded-xl bg-gradient-to-r from-sky-400 to-sky-500 font-semibold text-white hover:from-sky-500 hover:to-sky-600"
                                                    >
                                                        {isUploading ? (
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <UploadCloud className="mr-2 h-4 w-4" />
                                                        )}
                                                        Upload
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* VIEW 2: FILE GRID (Browse) */
                                            <>
                                                {usbData.files.length === 0 ? (
                                                    <div className="flex h-40 flex-col items-center justify-center text-center">
                                                        <div className="rounded-full bg-sky-100 p-4">
                                                            <FileText className="h-8 w-8 text-sky-300" />
                                                        </div>
                                                        <p className="mt-4 font-medium text-sky-500">
                                                            {usbData.usbDrives
                                                                .length === 0
                                                                ? 'Please insert a USB drive'
                                                                : 'No PDF files found on drive'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                                                        {usbData.files.map(
                                                            (file) => (
                                                                <motion.div
                                                                    key={`${file.device}-${file.path}`}
                                                                    whileHover={{
                                                                        scale: 1.01,
                                                                    }}
                                                                    whileTap={{
                                                                        scale: 0.99,
                                                                    }}
                                                                    onClick={() =>
                                                                        handleFileSelect(
                                                                            file,
                                                                        )
                                                                    }
                                                                    className="cursor-pointer rounded-xl border border-transparent bg-sky-50/50 p-3 transition-all hover:border-sky-200 hover:bg-sky-50 hover:shadow-sm"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="rounded-lg bg-white p-2 text-sky-500 shadow-sm">
                                                                            <FileText className="h-5 w-5" />
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="truncate bg-gradient-to-r from-sky-600/90 to-sky-700/80 bg-clip-text font-semibold text-transparent">
                                                                                {
                                                                                    file.name
                                                                                }
                                                                            </p>
                                                                            <p className="text-xs text-sky-400">
                                                                                {
                                                                                    file.size_formatted
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* WiFi Upload Section */}
                                <Card className="overflow-hidden border-2 border-sky-200 bg-white">
                                    <div className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100">
                                                <Wifi className="h-6 w-6 text-sky-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-sky-700">
                                                    WiFi Upload
                                                </p>
                                                <p className="text-sm text-sky-500">
                                                    Scan to upload from phone
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <CardContent className="p-6">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="rounded-2xl border-2 border-dashed border-sky-300 bg-gradient-to-br from-sky-100/50 to-sky-200/30 p-4">
                                                <QRCodeSVG
                                                    value={
                                                        wifiInfo.url +
                                                        '/mobile/upload'
                                                    }
                                                    size={120}
                                                    fgColor="#1e3a8a"
                                                    bgColor="transparent"
                                                />
                                            </div>

                                            <div className="w-full space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">
                                                        Network
                                                    </span>
                                                    <span className="font-bold text-slate-900">
                                                        {wifiInfo.ssid}
                                                    </span>
                                                </div>
                                                <div className="h-px bg-slate-200" />
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">
                                                        Password
                                                    </span>
                                                    <span className="font-mono font-bold text-slate-900">
                                                        {wifiInfo.password}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
