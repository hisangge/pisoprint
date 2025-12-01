import CoinSuggestions from '@/components/coin-suggestions';
import PdfPreviewViewer from '@/components/pdf-preview-viewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import kiosk from '@/routes/kiosk';
import type {
    ColorMode,
    Orientation,
    PrintJobFormData,
} from '@/types/models/print-job';
import type { CostCalculation, UploadInfo } from '@/types/models/upload-info';
import { Head, Link, router, useRemember } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, Coins, FileText, Printer } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface Props {
    uploadInfo: UploadInfo;
}

export default function PrintPreview({ uploadInfo }: Props) {
    // Debug logging for URL issues
    console.log('PrintPreview - uploadInfo:', uploadInfo);
    console.log('PrintPreview - preview_url:', uploadInfo.preview_url);

    // Use Inertia's useRemember to preserve form state across navigation
    const [formData, setFormData] = useRemember<PrintJobFormData>(
        {
            color_mode: 'bw',
            copies: 1,
            orientation: 'portrait',
        },
        `PrintPreview:${uploadInfo.filename || 'default'}`,
    );

    // Cost calculation state (not remembered - recalculated on load)
    const [cost, setCost] = useState<CostCalculation | null>(null);
    const [calculating, setCalculating] = useState(false);
    const [calculationError, setCalculationError] = useState<string | null>(
        null,
    );

    // Calculate cost whenever settings change
    const calculateCost = useCallback(async () => {
        setCalculating(true);
        setCalculationError(null);
        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            if (!csrfToken) {
                throw new Error('CSRF token not found');
            }

            const response = await fetch(kiosk.calculateCost.url(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    pages: uploadInfo.pages,
                    copies: formData.copies,
                    color_mode: formData.color_mode,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setCost(data);
            } else {
                const errorText = await response.text();
                console.error(
                    'Cost calculation failed:',
                    response.status,
                    errorText,
                );
                setCalculationError(
                    `Failed to calculate cost (Error ${response.status})`,
                );
            }
        } catch (error) {
            console.error('Failed to calculate cost:', error);
            setCalculationError(
                error instanceof Error
                    ? error.message
                    : 'Network error. Please check your connection.',
            );
        } finally {
            setCalculating(false);
        }
    }, [uploadInfo.pages, formData.copies, formData.color_mode]);

    useEffect(() => {
        void calculateCost();
    }, [calculateCost]);

    const handleContinue = () => {
        // Store print settings in session and navigate to payment
        sessionStorage.setItem('print_settings', JSON.stringify(formData));
        sessionStorage.setItem('required_amount', cost?.cost.toString() || '0');

        router.visit(kiosk.payment(), {
            data: {
                required_amount: cost?.cost || 0,
            },
        });
    };

    const formatCurrency = (amount: number) => {
        return `₱${amount.toFixed(2)}`;
    };

    return (
        <>
            <Head title="Print Preview" />

            <div className="min-h-screen overflow-x-hidden bg-zinc-950 p-3">
                <div className="mx-auto w-full max-w-3xl">
                    {/* Header */}
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-12 w-12 flex-shrink-0 border-2 border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                                asChild
                            >
                                <Link href={kiosk.upload()}>
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                            </Button>
                            <div className="min-w-0 flex-1">
                                <h1 className="truncate text-2xl font-black tracking-tight text-amber-400 uppercase">
                                    📄 Your Document is Ready
                                </h1>
                                <p className="text-sm text-zinc-400">
                                    Review settings and cost
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-zinc-600 hover:text-zinc-400"
                            asChild
                        >
                            <Link href={kiosk.reset()}>🔄 Reset</Link>
                        </Button>
                    </div>

                    {/* PDF Preview - Expanded for better view */}
                    {uploadInfo.preview_url && (
                        <Card className="mb-4 border-2 border-zinc-700 bg-zinc-800/50">
                            <CardHeader className="p-3">
                                <CardTitle className="text-sm font-bold text-white">
                                    📄 Document Preview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                                <PdfPreviewViewer
                                    fileUrl={uploadInfo.preview_url}
                                />
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid w-full gap-4 md:grid-cols-2">
                        {/* Left Column - File Info & Settings */}
                        <div className="min-w-0 space-y-4">
                            {/* File Information */}
                            <Card className="border-2 border-zinc-700 bg-zinc-800/50">
                                <CardHeader className="p-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-bold text-white">
                                        <FileText className="h-5 w-5 text-blue-400" />
                                        Document Info
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 p-4 pt-0">
                                    <div className="flex justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                                        <span className="text-sm text-zinc-400">
                                            Filename:
                                        </span>
                                        <span className="max-w-[180px] truncate text-sm font-bold text-white">
                                            {uploadInfo.original_name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                                        <span className="text-sm text-zinc-400">
                                            Total Pages:
                                        </span>
                                        <span className="text-sm font-bold text-white">
                                            {uploadInfo.pages} pages
                                        </span>
                                    </div>
                                    <div className="flex justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                                        <span className="text-sm text-zinc-400">
                                            File Size:
                                        </span>
                                        <span className="text-sm font-bold text-white">
                                            {uploadInfo.size
                                                ? (
                                                      uploadInfo.size /
                                                      1024 /
                                                      1024
                                                  ).toFixed(2)
                                                : '0.00'}{' '}
                                            MB
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Print Settings */}
                            <Card className="border-2 border-zinc-700 bg-zinc-800/50">
                                <CardHeader className="p-4">
                                    <CardTitle className="text-base font-bold text-white">
                                        <Printer className="mr-2 inline-block h-5 w-5 text-amber-400" />
                                        Print Settings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 p-4 pt-0">
                                    {/* Color Mode */}
                                    <div className="space-y-3">
                                        <Label className="text-sm font-bold text-white">
                                            Color Mode
                                        </Label>
                                        <RadioGroup
                                            value={formData.color_mode}
                                            onValueChange={(value) =>
                                                setFormData({
                                                    ...formData,
                                                    color_mode:
                                                        value as ColorMode,
                                                })
                                            }
                                            className="space-y-2"
                                        >
                                            <div className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-zinc-700 bg-zinc-900/50 p-3 transition-all hover:border-zinc-600 hover:bg-zinc-900">
                                                <RadioGroupItem
                                                    value="bw"
                                                    id="bw"
                                                />
                                                <Label
                                                    htmlFor="bw"
                                                    className="flex flex-1 cursor-pointer items-center justify-between text-sm"
                                                >
                                                    <span className="font-bold text-white">
                                                        Black & White
                                                    </span>
                                                    <span className="text-lg font-bold text-amber-400">
                                                        ₱2/page
                                                    </span>
                                                </Label>
                                            </div>

                                            <div className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-zinc-700 bg-zinc-900/50 p-3 transition-all hover:border-zinc-600 hover:bg-zinc-900">
                                                <RadioGroupItem
                                                    value="grayscale"
                                                    id="grayscale"
                                                />
                                                <Label
                                                    htmlFor="grayscale"
                                                    className="flex flex-1 cursor-pointer items-center justify-between text-sm"
                                                >
                                                    <span className="font-bold text-white">
                                                        Grayscale
                                                    </span>
                                                    <span className="text-lg font-bold text-amber-400">
                                                        ₱3/page
                                                    </span>
                                                </Label>
                                            </div>

                                            <div className="flex cursor-pointer items-center space-x-3 rounded-lg border-2 border-purple-600 bg-purple-950/30 p-3 transition-all hover:border-purple-500 hover:bg-purple-950/50">
                                                <RadioGroupItem
                                                    value="color"
                                                    id="color"
                                                />
                                                <Label
                                                    htmlFor="color"
                                                    className="flex flex-1 cursor-pointer items-center justify-between text-sm"
                                                >
                                                    <span className="font-bold text-white">
                                                        Full Color ⭐
                                                    </span>
                                                    <span className="text-lg font-bold text-purple-400">
                                                        ₱5/page
                                                    </span>
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    {/* Number of Copies */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="copies"
                                            className="text-sm font-bold text-white"
                                        >
                                            Number of Copies
                                        </Label>
                                        <Select
                                            value={formData.copies.toString()}
                                            onValueChange={(value) =>
                                                setFormData({
                                                    ...formData,
                                                    copies: parseInt(value),
                                                })
                                            }
                                        >
                                            <SelectTrigger
                                                id="copies"
                                                className="h-12 border-2 border-zinc-700 bg-zinc-900/50 text-base font-bold text-white"
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[...Array(10)].map((_, i) => (
                                                    <SelectItem
                                                        key={i + 1}
                                                        value={(
                                                            i + 1
                                                        ).toString()}
                                                        className="text-sm"
                                                    >
                                                        {i + 1}{' '}
                                                        {i === 0
                                                            ? 'copy'
                                                            : 'copies'}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Orientation */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-white">
                                            Page Orientation
                                        </Label>
                                        <RadioGroup
                                            value={formData.orientation}
                                            onValueChange={(value) =>
                                                setFormData({
                                                    ...formData,
                                                    orientation:
                                                        value as Orientation,
                                                })
                                            }
                                            className="grid grid-cols-2 gap-3"
                                        >
                                            <div className="flex cursor-pointer items-center space-x-2 rounded-lg border-2 border-zinc-700 bg-zinc-900/50 p-3 transition-all hover:border-zinc-600 hover:bg-zinc-900">
                                                <RadioGroupItem
                                                    value="portrait"
                                                    id="portrait"
                                                />
                                                <Label
                                                    htmlFor="portrait"
                                                    className="flex-1 cursor-pointer text-sm font-bold text-white"
                                                >
                                                    Portrait 📄
                                                </Label>
                                            </div>

                                            <div className="flex cursor-pointer items-center space-x-2 rounded-lg border-2 border-zinc-700 bg-zinc-900/50 p-3 transition-all hover:border-zinc-600 hover:bg-zinc-900">
                                                <RadioGroupItem
                                                    value="landscape"
                                                    id="landscape"
                                                />
                                                <Label
                                                    htmlFor="landscape"
                                                    className="flex-1 cursor-pointer text-sm font-bold text-white"
                                                >
                                                    Landscape 📃
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Cost Summary */}
                        <div className="min-w-0 space-y-4">
                            <Card className="border-4 border-amber-700 bg-gradient-to-b from-zinc-800 to-zinc-900 shadow-2xl">
                                <CardHeader className="border-b border-zinc-700 bg-zinc-800/50 p-4">
                                    <CardTitle className="flex items-center gap-2 text-xl font-black text-amber-400 uppercase">
                                        <Coins className="h-6 w-6" />
                                        Cost Breakdown
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 p-4">
                                    {calculating ? (
                                        <div className="py-8 text-center">
                                            <div className="mb-2 text-4xl">
                                                ⏳
                                            </div>
                                            <p className="text-sm text-zinc-400">
                                                Calculating cost...
                                            </p>
                                        </div>
                                    ) : calculationError ? (
                                        <div className="py-8 text-center">
                                            <div className="mb-2 text-4xl">
                                                ⚠️
                                            </div>
                                            <p className="text-sm text-red-400">
                                                {calculationError}
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-4"
                                                onClick={calculateCost}
                                            >
                                                Retry
                                            </Button>
                                        </div>
                                    ) : cost ? (
                                        <>
                                            {/* Cost Details */}
                                            <div className="space-y-3 rounded-lg border-2 border-zinc-700 bg-zinc-900/50 p-4">
                                                <div className="flex justify-between border-b border-zinc-700 pb-2">
                                                    <span className="text-sm text-zinc-400">
                                                        Pages to Print
                                                    </span>
                                                    <span className="text-base font-bold text-white">
                                                        {uploadInfo.pages} pages
                                                    </span>
                                                </div>
                                                <div className="flex justify-between border-b border-zinc-700 pb-2">
                                                    <span className="text-sm text-zinc-400">
                                                        Number of Copies
                                                    </span>
                                                    <span className="text-base font-bold text-white">
                                                        {formData.copies}×
                                                    </span>
                                                </div>
                                                <div className="flex justify-between border-b border-zinc-700 pb-2">
                                                    <span className="text-sm text-zinc-400">
                                                        Total Pages
                                                    </span>
                                                    <span className="text-base font-bold text-white">
                                                        {cost.total_pages} pages
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-zinc-400">
                                                        Price Per Page
                                                    </span>
                                                    <span className="text-base font-bold text-amber-400">
                                                        {formatCurrency(
                                                            cost.price_per_page,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Total Cost - Large Display */}
                                            <motion.div
                                                initial={{ scale: 0.95 }}
                                                animate={{ scale: 1 }}
                                                className="rounded-xl border-4 border-emerald-600 bg-gradient-to-br from-emerald-950 to-emerald-900 p-6 text-center shadow-xl"
                                            >
                                                <p className="mb-2 text-sm font-bold tracking-wider text-emerald-400 uppercase">
                                                    Total Cost
                                                </p>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Coins className="h-8 w-8 text-emerald-400" />
                                                    <span className="text-5xl font-black text-emerald-400">
                                                        {formatCurrency(
                                                            cost.cost,
                                                        )}
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-xs text-emerald-300">
                                                    Insert coins to complete
                                                    payment
                                                </p>
                                            </motion.div>

                                            {/* Coin Suggestions */}
                                            <CoinSuggestions
                                                totalNeeded={cost.cost}
                                            />

                                            {/* Continue Button */}
                                            <motion.div
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <Button
                                                    size="lg"
                                                    className="h-16 w-full rounded-xl border-4 border-emerald-600 bg-gradient-to-br from-emerald-500 to-emerald-700 text-lg font-black text-white uppercase shadow-2xl hover:from-emerald-400 hover:to-emerald-600"
                                                    onClick={handleContinue}
                                                >
                                                    <Coins className="mr-2 h-6 w-6" />
                                                    Insert ₱
                                                    {cost.cost.toFixed(2)} to
                                                    Print
                                                </Button>
                                            </motion.div>

                                            <p className="text-center text-xs text-zinc-500">
                                                💡 No payment until coins are
                                                inserted
                                            </p>
                                        </>
                                    ) : null}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
