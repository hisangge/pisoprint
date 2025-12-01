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
import { ArrowLeft, Coins, FileText, Printer, RotateCcw } from 'lucide-react';
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

            <div className="min-h-screen overflow-x-hidden bg-white px-4 py-6">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-12 w-12 rounded-full border-2 border-sky-400 bg-sky-400 text-white hover:bg-sky-500"
                                asChild
                            >
                                <Link href={kiosk.upload()}>
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                            </Button>
                            <h1 className="bg-gradient-to-r from-sky-400/80 to-sky-500/70 bg-clip-text text-xl font-bold text-transparent">
                                Print Preview
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
                        {/* Top Section - Cost Summary (Moved to top for visibility) */}
                        <Card className="overflow-hidden border-2 border-sky-200 bg-white">
                            <div className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100">
                                        <Coins className="h-6 w-6 text-sky-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sky-700">
                                            Cost Summary
                                        </p>
                                        <p className="text-sm text-sky-500">
                                            Review before payment
                                        </p>
                                    </div>
                                    {cost && !calculating && (
                                        <div className="text-right">
                                            <p className="text-3xl font-black text-sky-600">
                                                {formatCurrency(cost.cost)}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {cost.total_pages} pages ×{' '}
                                                {formatCurrency(
                                                    cost.price_per_page,
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Continue Button - Prominent position */}
                        {cost && !calculating && !calculationError && (
                            <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Button
                                    size="lg"
                                    className="h-14 w-full rounded-xl bg-gradient-to-r from-sky-400 to-sky-500 text-lg font-bold text-white hover:from-sky-500 hover:to-sky-600"
                                    onClick={handleContinue}
                                >
                                    <Coins className="mr-2 h-5 w-5" />
                                    Insert {formatCurrency(cost.cost)} to Print
                                </Button>
                            </motion.div>
                        )}

                        {/* Error or Loading State */}
                        {calculating && (
                            <div className="py-4 text-center">
                                <div className="mb-2 text-2xl">⏳</div>
                                <p className="text-sm text-slate-500">
                                    Calculating cost...
                                </p>
                            </div>
                        )}
                        {calculationError && (
                            <Card className="border-2 border-red-200 bg-red-50 p-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-red-600">
                                        {calculationError}
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-red-300 text-red-600 hover:bg-red-100"
                                        onClick={calculateCost}
                                    >
                                        Retry
                                    </Button>
                                </div>
                            </Card>
                        )}

                        {/* PDF Preview */}
                        {uploadInfo.preview_url && (
                            <Card className="overflow-hidden border-2 border-sky-200 bg-white">
                                <CardHeader className="border-b border-sky-100 bg-sky-50/30 pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base font-bold text-sky-700">
                                        <FileText className="h-5 w-5 text-sky-500" />
                                        Document Preview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <PdfPreviewViewer
                                        fileUrl={uploadInfo.preview_url}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            {/* File Information */}
                            <Card className="overflow-hidden border-2 border-sky-200 bg-white">
                                <CardHeader className="border-b border-sky-100 bg-sky-50/30 pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base font-bold text-sky-700">
                                        <FileText className="h-5 w-5 text-sky-500" />
                                        Document Info
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between rounded-lg bg-slate-50 p-3">
                                            <span className="text-sm text-slate-500">
                                                Filename
                                            </span>
                                            <span className="max-w-[180px] truncate text-sm font-semibold text-slate-900">
                                                {uploadInfo.original_name}
                                            </span>
                                        </div>
                                        <div className="flex justify-between rounded-lg bg-slate-50 p-3">
                                            <span className="text-sm text-slate-500">
                                                Pages
                                            </span>
                                            <span className="text-sm font-semibold text-slate-900">
                                                {uploadInfo.pages}
                                            </span>
                                        </div>
                                        <div className="flex justify-between rounded-lg bg-slate-50 p-3">
                                            <span className="text-sm text-slate-500">
                                                Size
                                            </span>
                                            <span className="text-sm font-semibold text-slate-900">
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
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Print Settings */}
                            <Card className="overflow-hidden border-2 border-sky-200 bg-white">
                                <CardHeader className="border-b border-sky-100 bg-sky-50/30 pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base font-bold text-sky-700">
                                        <Printer className="h-5 w-5 text-sky-500" />
                                        Print Settings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 p-4">
                                    {/* Color Mode */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-600">
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
                                            className="grid grid-cols-3 gap-2"
                                        >
                                            <div
                                                className={`flex cursor-pointer flex-col items-center rounded-lg border-2 p-3 text-center transition-all ${
                                                    formData.color_mode === 'bw'
                                                        ? 'border-sky-500 bg-sky-100 ring-2 ring-sky-200'
                                                        : 'border-sky-200 bg-sky-50/50 hover:border-sky-300 hover:bg-sky-50'
                                                }`}
                                                onClick={() =>
                                                    setFormData({
                                                        ...formData,
                                                        color_mode: 'bw',
                                                    })
                                                }
                                            >
                                                <RadioGroupItem
                                                    value="bw"
                                                    id="bw"
                                                    className="sr-only"
                                                />
                                                <Label
                                                    htmlFor="bw"
                                                    className="cursor-pointer text-center"
                                                >
                                                    <span className="block text-xs font-semibold text-slate-700">
                                                        B&W
                                                    </span>
                                                    <span className="block text-sm font-bold text-sky-600">
                                                        ₱2
                                                    </span>
                                                </Label>
                                            </div>
                                            <div
                                                className={`flex cursor-pointer flex-col items-center rounded-lg border-2 p-3 text-center transition-all ${
                                                    formData.color_mode ===
                                                    'grayscale'
                                                        ? 'border-sky-500 bg-sky-100 ring-2 ring-sky-200'
                                                        : 'border-sky-200 bg-sky-50/50 hover:border-sky-300 hover:bg-sky-50'
                                                }`}
                                                onClick={() =>
                                                    setFormData({
                                                        ...formData,
                                                        color_mode: 'grayscale',
                                                    })
                                                }
                                            >
                                                <RadioGroupItem
                                                    value="grayscale"
                                                    id="grayscale"
                                                    className="sr-only"
                                                />
                                                <Label
                                                    htmlFor="grayscale"
                                                    className="cursor-pointer text-center"
                                                >
                                                    <span className="block text-xs font-semibold text-slate-700">
                                                        Gray
                                                    </span>
                                                    <span className="block text-sm font-bold text-sky-600">
                                                        ₱3
                                                    </span>
                                                </Label>
                                            </div>
                                            <div
                                                className={`flex cursor-pointer flex-col items-center rounded-lg border-2 p-3 text-center transition-all ${
                                                    formData.color_mode ===
                                                    'color'
                                                        ? 'border-sky-500 bg-sky-100 ring-2 ring-sky-200'
                                                        : 'border-sky-200 bg-sky-50/50 hover:border-sky-300 hover:bg-sky-50'
                                                }`}
                                                onClick={() =>
                                                    setFormData({
                                                        ...formData,
                                                        color_mode: 'color',
                                                    })
                                                }
                                            >
                                                <RadioGroupItem
                                                    value="color"
                                                    id="color"
                                                    className="sr-only"
                                                />
                                                <Label
                                                    htmlFor="color"
                                                    className="cursor-pointer text-center"
                                                >
                                                    <span className="block text-xs font-semibold text-slate-700">
                                                        Color
                                                    </span>
                                                    <span className="block text-sm font-bold text-sky-600">
                                                        ₱5
                                                    </span>
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    {/* Copies and Orientation in a row */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Copies */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-slate-600">
                                                Copies
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
                                                <SelectTrigger className="h-10 border-2 border-sky-200 bg-sky-50/50 font-semibold text-slate-700">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[...Array(10)].map(
                                                        (_, i) => (
                                                            <SelectItem
                                                                key={i + 1}
                                                                value={(
                                                                    i + 1
                                                                ).toString()}
                                                            >
                                                                {i + 1}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Orientation */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-slate-600">
                                                Orientation
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
                                                className="grid grid-cols-2 gap-2"
                                            >
                                                <div
                                                    className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-2 transition-all ${
                                                        formData.orientation ===
                                                        'portrait'
                                                            ? 'border-sky-500 bg-sky-100 ring-2 ring-sky-200'
                                                            : 'border-sky-200 bg-sky-50/50 hover:border-sky-300'
                                                    }`}
                                                    onClick={() =>
                                                        setFormData({
                                                            ...formData,
                                                            orientation:
                                                                'portrait',
                                                        })
                                                    }
                                                >
                                                    <RadioGroupItem
                                                        value="portrait"
                                                        id="portrait"
                                                        className="sr-only"
                                                    />
                                                    <Label
                                                        htmlFor="portrait"
                                                        className="cursor-pointer text-lg"
                                                    >
                                                        📄
                                                    </Label>
                                                </div>
                                                <div
                                                    className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-2 transition-all ${
                                                        formData.orientation ===
                                                        'landscape'
                                                            ? 'border-sky-500 bg-sky-100 ring-2 ring-sky-200'
                                                            : 'border-sky-200 bg-sky-50/50 hover:border-sky-300'
                                                    }`}
                                                    onClick={() =>
                                                        setFormData({
                                                            ...formData,
                                                            orientation:
                                                                'landscape',
                                                        })
                                                    }
                                                >
                                                    <RadioGroupItem
                                                        value="landscape"
                                                        id="landscape"
                                                        className="sr-only"
                                                    />
                                                    <Label
                                                        htmlFor="landscape"
                                                        className="cursor-pointer text-lg"
                                                    >
                                                        📃
                                                    </Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Coin Suggestions */}
                        {cost && !calculating && !calculationError && (
                            <CoinSuggestions totalNeeded={cost.cost} />
                        )}

                        <p className="text-center text-xs text-slate-400">
                            💡 No payment until coins are inserted
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
