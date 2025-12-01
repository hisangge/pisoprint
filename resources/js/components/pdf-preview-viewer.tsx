import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChevronLeft,
    ChevronRight,
    Eye,
    EyeOff,
    Maximize2,
    Minimize2,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker - use absolute URL for production compatibility
pdfjs.GlobalWorkerOptions.workerSrc =
    window.location.origin + '/pdf.worker.min.js';

interface PdfPreviewViewerProps {
    fileUrl: string;
    className?: string;
}

export default function PdfPreviewViewer({
    fileUrl,
    className = '',
}: PdfPreviewViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const onDocumentLoadSuccess = useCallback(
        ({ numPages }: { numPages: number }) => {
            setNumPages(numPages);
            setIsLoading(false);
            setError(null);
        },
        [],
    );

    const onDocumentLoadError = useCallback((error: Error) => {
        console.error('Error loading PDF:', error);
        setIsLoading(false);
        setError(error.message || 'Failed to load PDF file');
    }, []);

    const changePage = useCallback(
        (offset: number) => {
            setPageNumber((prevPageNumber) => {
                const newPage = prevPageNumber + offset;
                return Math.min(Math.max(1, newPage), numPages);
            });
        },
        [numPages],
    );

    const goToPage = useCallback(
        (page: number) => {
            setPageNumber(Math.min(Math.max(1, page), numPages));
        },
        [numPages],
    );

    const zoomIn = useCallback(() => {
        setScale((prevScale) => Math.min(prevScale + 0.25, 3.0));
    }, []);

    const zoomOut = useCallback(() => {
        setScale((prevScale) => Math.max(prevScale - 0.25, 0.5));
    }, []);

    const toggleFullscreen = useCallback(() => {
        setIsFullscreen((prev) => !prev);
    }, []);

    const toggleThumbnails = useCallback(() => {
        setShowThumbnails((prev) => !prev);
    }, []);

    return (
        <Card className={className}>
            <CardHeader className="p-3">
                <CardTitle className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        Preview
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={toggleThumbnails}
                            title={
                                showThumbnails
                                    ? 'Hide thumbnails'
                                    : 'Show thumbnails'
                            }
                        >
                            {showThumbnails ? (
                                <EyeOff className="h-3 w-3" />
                            ) : (
                                <Eye className="h-3 w-3" />
                            )}
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                {isLoading && !error && (
                    <div className="flex items-center justify-center py-6">
                        <div className="text-center">
                            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                            <p className="text-xs text-muted-foreground">
                                Loading...
                            </p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex items-center justify-center py-6">
                        <div className="text-center">
                            <div className="mx-auto mb-2 text-4xl">⚠️</div>
                            <p className="mb-2 text-sm text-red-400">
                                Failed to load PDF
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                <div
                    className={`${isLoading || error ? 'hidden' : ''} ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-2' : ''}`}
                >
                    {isFullscreen && (
                        <div className="mb-2 flex items-center justify-between">
                            <h3 className="text-sm font-semibold">
                                PDF Preview
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={toggleFullscreen}
                            >
                                <Minimize2 className="mr-1 h-3 w-3" />
                                Exit
                            </Button>
                        </div>
                    )}

                    <div
                        className={`flex gap-2 ${isFullscreen ? 'h-[calc(100vh-4rem)]' : ''}`}
                    >
                        {/* Thumbnail sidebar - Smaller */}
                        {showThumbnails && numPages > 1 && (
                            <div className="max-h-[300px] w-20 flex-shrink-0 space-y-1 overflow-y-auto">
                                <Document
                                    file={fileUrl}
                                    onLoadError={onDocumentLoadError}
                                >
                                    {Array.from(
                                        new Array(numPages),
                                        (_, index) => (
                                            <div
                                                key={`thumb_${index + 1}`}
                                                className={`cursor-pointer rounded border transition-all hover:border-primary ${
                                                    pageNumber === index + 1
                                                        ? 'border-primary shadow'
                                                        : 'border-border'
                                                }`}
                                                onClick={() =>
                                                    goToPage(index + 1)
                                                }
                                            >
                                                <Page
                                                    pageNumber={index + 1}
                                                    width={70}
                                                    renderTextLayer={false}
                                                    renderAnnotationLayer={
                                                        false
                                                    }
                                                />
                                                <p className="bg-muted py-0.5 text-center text-[9px]">
                                                    {index + 1}
                                                </p>
                                            </div>
                                        ),
                                    )}
                                </Document>
                            </div>
                        )}

                        {/* Main preview area */}
                        <div className="flex min-w-0 flex-1 flex-col">
                            {/* Controls - Compact */}
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => changePage(-1)}
                                        disabled={pageNumber <= 1}
                                    >
                                        <ChevronLeft className="h-3 w-3" />
                                    </Button>

                                    <span className="px-1 text-xs font-medium whitespace-nowrap">
                                        {pageNumber}/{numPages}
                                    </span>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => changePage(1)}
                                        disabled={pageNumber >= numPages}
                                    >
                                        <ChevronRight className="h-3 w-3" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={zoomOut}
                                        disabled={scale <= 0.5}
                                    >
                                        <ZoomOut className="h-3 w-3" />
                                    </Button>

                                    <span className="w-10 text-center text-xs font-medium">
                                        {Math.round(scale * 100)}%
                                    </span>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={zoomIn}
                                        disabled={scale >= 3.0}
                                    >
                                        <ZoomIn className="h-3 w-3" />
                                    </Button>

                                    {!isFullscreen && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="ml-1 h-7 w-7 p-0"
                                            onClick={toggleFullscreen}
                                        >
                                            <Maximize2 className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* PDF Document - Smaller container */}
                            <div className="flex flex-1 items-start justify-center overflow-auto rounded border bg-muted/30 p-2">
                                <Document
                                    file={fileUrl}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    onLoadError={onDocumentLoadError}
                                    loading={
                                        <div className="flex items-center justify-center py-6">
                                            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                                        </div>
                                    }
                                >
                                    <div className="bg-white shadow-lg">
                                        <Page
                                            pageNumber={pageNumber}
                                            scale={scale}
                                            renderTextLayer={false}
                                            renderAnnotationLayer={false}
                                        />
                                    </div>
                                </Document>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
