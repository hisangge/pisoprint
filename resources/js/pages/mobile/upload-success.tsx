import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import mobile from '@/routes/mobile';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CheckCircle, FileText, Printer } from 'lucide-react';

interface Props {
    fileName: string;
    pages: number;
}

export default function UploadSuccess({ fileName, pages }: Props) {
    return (
        <>
            <Head title="Upload Successful - PisoPrint" />

            <div className="min-h-screen bg-zinc-950 p-4 sm:p-6">
                <div className="container mx-auto max-w-lg">
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
                        <div className="rounded-full bg-emerald-500 p-6 shadow-2xl">
                            <CheckCircle className="h-20 w-20 text-white" />
                        </div>
                    </motion.div>

                    {/* Header */}
                    <div className="mb-6 text-center">
                        <h1 className="mb-2 text-4xl font-black text-amber-400 drop-shadow-lg">
                            ✅ Upload Successful!
                        </h1>
                        <p className="text-lg text-zinc-400">
                            Your file is ready to print
                        </p>
                    </div>

                    {/* File Info Card */}
                    <Card className="mb-6 border-2 border-zinc-700 bg-zinc-900/50 shadow-2xl">
                        <CardHeader className="space-y-1 pb-4">
                            <CardTitle className="text-2xl font-bold text-white">
                                File Uploaded
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* File Details */}
                            <div className="flex items-center gap-4 rounded-xl border-2 border-emerald-500 bg-emerald-950/20 p-4">
                                <div className="rounded-full bg-emerald-500 p-3">
                                    <FileText className="h-8 w-8 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-base font-bold text-white">
                                        {fileName}
                                    </p>
                                    <p className="text-sm text-emerald-300">
                                        {pages} {pages === 1 ? 'page' : 'pages'}
                                    </p>
                                </div>
                            </div>

                            {/* Ready Message */}
                            <div className="rounded-xl border-2 border-emerald-500 bg-emerald-950/20 p-6 text-center">
                                <div className="mb-3 flex items-center justify-center">
                                    <CheckCircle className="h-12 w-12 text-emerald-400" />
                                </div>
                                <p className="mb-2 text-xl font-bold text-white">
                                    File Ready at Kiosk!
                                </p>
                                <p className="text-sm font-semibold text-zinc-400">
                                    Your document is now available on the kiosk
                                    screen
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Instructions Card */}
                    <Card className="border-2 border-purple-600/50 bg-purple-950/20">
                        <CardContent className="p-6">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-purple-300">
                                <Printer className="h-5 w-5" />
                                Next Steps
                            </h3>
                            <ol className="space-y-3">
                                <li className="flex gap-3 text-zinc-400">
                                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-sm font-bold text-purple-300">
                                        1
                                    </span>
                                    <span>
                                        Go to the PisoPrint kiosk machine
                                    </span>
                                </li>
                                <li className="flex gap-3 text-zinc-400">
                                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-sm font-bold text-purple-300">
                                        2
                                    </span>
                                    <span>Tap on your file to preview it</span>
                                </li>
                                <li className="flex gap-3 text-zinc-400">
                                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-sm font-bold text-purple-300">
                                        3
                                    </span>
                                    <span>
                                        Adjust print settings (copies, color
                                        mode)
                                    </span>
                                </li>
                                <li className="flex gap-3 text-zinc-400">
                                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-sm font-bold text-purple-300">
                                        4
                                    </span>
                                    <span>Insert coins to start printing</span>
                                </li>
                            </ol>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="mt-6 space-y-3">
                        <Button
                            asChild
                            size="lg"
                            className="h-14 w-full rounded-xl bg-emerald-600 text-lg font-bold text-white shadow-lg hover:bg-emerald-500"
                        >
                            <Link href={mobile.upload()}>
                                Upload Another File
                            </Link>
                        </Button>
                    </div>

                    {/* Footer Note */}
                    <Card className="mt-6 border-2 border-emerald-500/50 bg-emerald-950/20">
                        <CardContent className="p-4">
                            <p className="text-center text-sm font-semibold text-emerald-300">
                                ⏱️ File available for 15 minutes
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
