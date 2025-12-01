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
import kiosk from '@/routes/kiosk';
import { Head, Link, router, useForm, usePoll } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowLeft,
    Bell,
    CheckCircle,
    FileText,
    HardDrive,
    Loader2,
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
    const hasFilesRef = useRef(initialUsbData.files.length > 0);

    // Form handling for USB Upload
    const { post, processing, reset, clearErrors, setData } = useForm({
        device: '',
        file_path: '',
    });

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
        clearErrors();
    };

    const handleClearFile = () => {
        setSelectedFile(null);
        clearErrors();
    };

    const handleUpload = () => {
        if (!selectedFile || processing) return;

        console.log('Starting USB upload for file:', selectedFile.name);

        setData({
            device: selectedFile.device,
            file_path: selectedFile.path,
        });

        post(kiosk.uploadFromUsb.url(), {
            onSuccess: (response) => {
                console.log('USB upload successful:', response);
                reset();
                setSelectedFile(null);
                clearErrors();
            },
            onError: (err) => {
                console.error('Upload failed:', err);
                // Don't reset the form on error so user can try again
            },
            onFinish: () => {
                // Clear form data but keep selected file for retry
                clearErrors();
            },
        });
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

            <div className="min-h-screen bg-zinc-950 p-1">
                <div className="container mx-auto max-w-md">
                    {/* PENDING UPLOAD ACCEPTANCE SCREEN */}
                    {pendingUpload ? (
                        <div className="flex min-h-[calc(100vh-8px)] flex-col items-center justify-center px-2">
                            {/* Success Animation */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 200,
                                    damping: 15,
                                }}
                                className="mb-4 flex justify-center"
                            >
                                <div className="rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 p-4 shadow-2xl">
                                    <Bell className="h-16 w-16 text-white" />
                                </div>
                            </motion.div>

                            {/* Header */}
                            <div className="mb-4 text-center">
                                <h1 className="mb-1 text-2xl font-black tracking-tight text-amber-400 uppercase">
                                    📱 File Ready!
                                </h1>
                                <p className="text-sm text-zinc-400">
                                    A document was uploaded from mobile
                                </p>
                            </div>

                            {/* File Info Card */}
                            <Card className="mb-4 w-full border-4 border-emerald-500 bg-gradient-to-br from-emerald-950 to-emerald-900 shadow-2xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-center text-lg font-bold text-white">
                                        📄 {pendingUpload.original_name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 text-center">
                                    <div className="rounded-lg bg-emerald-950/50 p-3">
                                        <p className="text-base text-zinc-300">
                                            <span className="text-xl font-black text-emerald-400">
                                                {pendingUpload.pages}
                                            </span>{' '}
                                            {pendingUpload.pages === 1
                                                ? 'page'
                                                : 'pages'}
                                        </p>
                                        <p className="mt-1 text-xs text-emerald-300">
                                            Uploaded from mobile device
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Accept Button */}
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 2,
                                    repeatType: 'reverse',
                                }}
                                className="w-full"
                            >
                                <Button
                                    size="lg"
                                    onClick={handleAcceptUpload}
                                    className="h-16 w-full rounded-xl border-4 border-emerald-400 bg-gradient-to-br from-emerald-500 to-emerald-700 text-xl font-black text-white uppercase shadow-2xl hover:from-emerald-400 hover:to-emerald-600"
                                >
                                    ✅ Preview & Print This File
                                </Button>
                            </motion.div>

                            {/* Instructions */}
                            <div className="mt-4 text-center">
                                <p className="text-sm text-zinc-500">
                                    Click above to preview and print your
                                    document
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* NORMAL FILE SELECTION INTERFACE */
                        <>
                            {/* Header */}
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-10 w-10 border-2 border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                                        asChild
                                    >
                                        <Link href={kiosk.home()}>
                                            <ArrowLeft className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <div>
                                        <h1 className="text-lg font-black tracking-tight text-amber-400 uppercase">
                                            🔌 Select File
                                        </h1>
                                        <p className="text-xs text-zinc-400">
                                            USB drive or WiFi upload
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-xs text-zinc-600 hover:text-zinc-400"
                                    asChild
                                >
                                    <Link href={kiosk.reset()}>🔄 Reset</Link>
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {/* USB Status Card */}
                                <Card className="border-2 border-blue-600 bg-gradient-to-br from-blue-950/40 to-blue-900/20">
                                    <CardHeader className="p-3 pb-2">
                                        <CardTitle className="flex items-center gap-2 text-sm font-bold text-blue-400">
                                            <HardDrive className="h-4 w-4" />
                                            {usbData.usbDrives.length > 0
                                                ? '💾 USB Drive Connected'
                                                : '⏳ Waiting for USB...'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0">
                                        {usbData.usbDrives.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {usbData.usbDrives.map(
                                                    (drive) => (
                                                        <span
                                                            key={drive.device}
                                                            className="inline-flex items-center rounded-full border-2 border-blue-500 bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300"
                                                        >
                                                            {drive.device}
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-zinc-400">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span className="text-sm">
                                                    Please insert your flash
                                                    drive...
                                                </span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Error Display */}
                                {usbData.error && (
                                    <Alert className="border-2 border-red-600 bg-red-950/30">
                                        <AlertCircle className="h-5 w-5 text-red-400" />
                                        <AlertTitle className="text-sm font-bold text-red-400">
                                            ⚠️ Upload Failed
                                        </AlertTitle>
                                        <AlertDescription className="text-sm text-red-300">
                                            {usbData.error}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Main Area: Either File Grid OR Selected File View */}
                                <Card className="border-2 border-zinc-700 bg-zinc-800/50">
                                    <CardHeader className="p-3 pb-2">
                                        <CardTitle className="flex items-center gap-2 text-sm font-bold text-white">
                                            <FileText className="h-4 w-4 text-amber-400" />
                                            {selectedFile
                                                ? 'Selected File'
                                                : 'PDF Files'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0">
                                        {/* VIEW 1: SELECTED FILE (Ready to Upload) */}
                                        {selectedFile ? (
                                            <div className="flex flex-col justify-center space-y-3">
                                                <motion.div
                                                    initial={{
                                                        scale: 0.9,
                                                        opacity: 0,
                                                    }}
                                                    animate={{
                                                        scale: 1,
                                                        opacity: 1,
                                                    }}
                                                    className="flex w-full flex-col items-center rounded-xl border-2 border-emerald-500/50 bg-emerald-950/20 p-4 text-center"
                                                >
                                                    <div className="mb-3 rounded-full bg-emerald-500/20 p-3">
                                                        <FileText className="h-8 w-8 text-emerald-400" />
                                                    </div>
                                                    <h3 className="mb-1 text-base font-bold break-all text-white">
                                                        {selectedFile.name}
                                                    </h3>
                                                    <p className="mb-4 text-sm text-emerald-300">
                                                        {
                                                            selectedFile.size_formatted
                                                        }
                                                    </p>

                                                    <div className="grid w-full grid-cols-2 gap-3">
                                                        <Button
                                                            variant="outline"
                                                            onClick={
                                                                handleClearFile
                                                            }
                                                            disabled={
                                                                processing
                                                            }
                                                            className="h-10 border-2 border-zinc-600 text-sm hover:bg-zinc-800"
                                                        >
                                                            <X className="mr-2 h-4 w-4" />
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            onClick={
                                                                handleUpload
                                                            }
                                                            disabled={
                                                                processing
                                                            }
                                                            className="h-10 border-2 border-emerald-500 bg-emerald-600 text-sm font-bold hover:bg-emerald-500"
                                                        >
                                                            {processing ? (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                            )}
                                                            Upload
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                                <p className="text-center text-xs text-zinc-500">
                                                    Click Upload to preview your
                                                    document
                                                </p>
                                            </div>
                                        ) : (
                                            /* VIEW 2: FILE GRID (Browse) */
                                            <>
                                                {usbData.files.length === 0 ? (
                                                    <div className="flex h-32 flex-col items-center justify-center text-center text-zinc-500">
                                                        <FileText className="mb-2 h-10 w-10 opacity-20" />
                                                        <p className="text-base font-bold">
                                                            No PDF Files Found
                                                        </p>
                                                        <p className="text-sm">
                                                            {usbData.usbDrives
                                                                .length === 0
                                                                ? 'Waiting for drive...'
                                                                : 'This drive has no PDF files.'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto">
                                                        {usbData.files.map(
                                                            (file) => (
                                                                <motion.div
                                                                    key={`${file.device}-${file.path}`}
                                                                    whileHover={{
                                                                        scale: 1.02,
                                                                    }}
                                                                    whileTap={{
                                                                        scale: 0.98,
                                                                    }}
                                                                    onClick={() =>
                                                                        handleFileSelect(
                                                                            file,
                                                                        )
                                                                    }
                                                                    className="cursor-pointer rounded-lg border-2 border-zinc-700 bg-zinc-800/50 p-3 transition-all hover:border-amber-500 hover:bg-amber-950/20"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400">
                                                                            <FileText className="h-5 w-5" />
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="truncate text-sm font-bold text-white">
                                                                                {
                                                                                    file.name
                                                                                }
                                                                            </p>
                                                                            <p className="text-xs text-zinc-400">
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
                                <Card className="border-2 border-purple-600 bg-gradient-to-br from-purple-950/40 to-purple-900/20">
                                    <CardHeader className="p-3 pb-2">
                                        <CardTitle className="flex items-center gap-2 text-sm font-bold text-purple-300">
                                            <Wifi className="h-4 w-4" />
                                            📱 WiFi Upload
                                        </CardTitle>
                                        <CardDescription className="text-xs text-purple-400">
                                            No USB? Scan QR code with your phone
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-col items-center gap-3 p-3 pt-0">
                                        <div className="rounded-xl border-4 border-white bg-white p-2 shadow-lg">
                                            <QRCodeSVG
                                                value={
                                                    wifiInfo.url +
                                                    '/mobile/upload'
                                                }
                                                size={100}
                                            />
                                        </div>
                                        <div className="w-full space-y-2 rounded-lg border-2 border-purple-600/50 bg-purple-950/30 p-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-zinc-400">
                                                    WiFi:
                                                </span>
                                                <span className="text-sm font-bold text-white">
                                                    {wifiInfo.ssid}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-zinc-400">
                                                    Password:
                                                </span>
                                                <span className="font-mono text-sm font-bold text-white">
                                                    {wifiInfo.password}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-center text-xs text-purple-300">
                                            {wifiInfo.url}/mobile/upload
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Footer */}
                            <div className="mt-4 text-center">
                                <p className="text-xs text-zinc-600">
                                    Select a file to continue
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
