import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Calendar, FileText, Printer, User } from 'lucide-react';

interface PrintJob {
    id: number;
    fileName: string;
    filePath: string;
    fileSize: number;
    pages: number;
    copies: number;
    colorMode: string;
    orientation: string;
    paperSize: string;
    cost: number;
    status: string;
    priority: number;
    cupsJobId: number | null;
    printerName: string;
    errorMessage: string | null;
    user: {
        id: number;
        name: string;
        email: string;
    };
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
}

interface Props {
    printJob: PrintJob;
}

export default function PrintJobDetail({ printJob }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: admin.dashboard.url(),
        },
        {
            title: 'Print Jobs',
            href: admin.printJobs.index.url(),
        },
        {
            title: `Job #${printJob.id}`,
            href: admin.printJobs.show.url(printJob.id),
        },
    ];

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            completed: 'bg-success/10 text-success border-success',
            printing: 'bg-primary/10 text-primary border-primary',
            pending: 'bg-warning/10 text-warning border-warning',
            failed: 'bg-destructive/10 text-destructive border-destructive',
            cancelled: 'bg-muted text-muted-foreground border-muted',
        };

        return (
            <Badge className={variants[status] || variants.pending}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Print Job #${printJob.id}`} />

            <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold sm:text-3xl">
                            Print Job #{printJob.id}
                        </h1>
                        <p className="text-sm text-muted-foreground sm:text-base">
                            {printJob.fileName}
                        </p>
                    </div>
                    {getStatusBadge(printJob.status)}
                </div>

                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                    {/* File Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                                File Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-2">
                                <div className="text-xs text-muted-foreground sm:text-sm">
                                    File Name
                                </div>
                                <div className="text-xs font-medium break-all sm:text-sm">
                                    {printJob.fileName}
                                </div>

                                <div className="text-xs text-muted-foreground sm:text-sm">
                                    File Size
                                </div>
                                <div className="text-xs font-medium sm:text-sm">
                                    {formatFileSize(printJob.fileSize)}
                                </div>

                                <div className="text-xs text-muted-foreground sm:text-sm">
                                    Pages
                                </div>
                                <div className="text-xs font-medium sm:text-sm">
                                    {printJob.pages}
                                </div>

                                <div className="text-xs text-muted-foreground sm:text-sm">
                                    Copies
                                </div>
                                <div className="text-xs font-medium sm:text-sm">
                                    {printJob.copies}
                                </div>

                                <div className="text-xs text-muted-foreground sm:text-sm">
                                    Color Mode
                                </div>
                                <div className="text-xs font-medium capitalize sm:text-sm">
                                    {printJob.colorMode}
                                </div>

                                <div className="text-xs text-muted-foreground sm:text-sm">
                                    Orientation
                                </div>
                                <div className="text-xs font-medium capitalize sm:text-sm">
                                    {printJob.orientation}
                                </div>

                                <div className="text-xs text-muted-foreground sm:text-sm">
                                    Paper Size
                                </div>
                                <div className="text-xs font-medium sm:text-sm">
                                    {printJob.paperSize}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* User Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                                User Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-2">
                                <div className="text-xs text-muted-foreground sm:text-sm">
                                    Name
                                </div>
                                <div className="text-xs font-medium sm:text-sm">
                                    {printJob.user.name}
                                </div>

                                <div className="text-xs text-muted-foreground sm:text-sm">
                                    Email
                                </div>
                                <div className="text-xs font-medium break-all sm:text-sm">
                                    {printJob.user.email}
                                </div>

                                <div className="text-xs text-muted-foreground sm:text-sm">
                                    User ID
                                </div>
                                <div className="text-xs font-medium sm:text-sm">
                                    #{printJob.user.id}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Printer Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Printer className="h-4 w-4 sm:h-5 sm:w-5" />
                                Printer Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-2">
                                <div className="text-xs text-muted-foreground sm:text-sm">
                                    Printer
                                </div>
                                <div className="text-xs font-medium sm:text-sm">
                                    {printJob.printerName}
                                </div>

                                <div className="text-xs text-muted-foreground sm:text-sm">
                                    CUPS Job ID
                                </div>
                                <div className="text-xs font-medium sm:text-sm">
                                    {printJob.cupsJobId
                                        ? `#${printJob.cupsJobId}`
                                        : 'N/A'}
                                </div>

                                <div className="text-xs text-muted-foreground sm:text-sm">
                                    Priority
                                </div>
                                <div className="text-xs font-medium sm:text-sm">
                                    {printJob.priority}
                                </div>
                            </div>

                            {printJob.errorMessage && (
                                <div className="mt-4 rounded-lg bg-destructive/10 p-3">
                                    <p className="text-xs font-medium text-destructive sm:text-sm">
                                        Error Message
                                    </p>
                                    <p className="mt-1 text-xs break-words text-destructive/90 sm:text-sm">
                                        {printJob.errorMessage}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment & Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                                Timeline & Payment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-2">
                                <div className="text-xs text-muted-foreground sm:text-sm">
                                    Cost
                                </div>
                                <div className="text-xs font-medium sm:text-sm">
                                    ₱{printJob.cost.toFixed(2)}
                                </div>

                                <div className="text-xs text-muted-foreground sm:text-sm">
                                    Created
                                </div>
                                <div className="text-xs font-medium sm:text-sm">
                                    {formatDate(printJob.createdAt)}
                                </div>

                                <div className="text-xs text-muted-foreground sm:text-sm">
                                    Started
                                </div>
                                <div className="text-xs font-medium sm:text-sm">
                                    {formatDate(printJob.startedAt)}
                                </div>

                                <div className="text-xs text-muted-foreground sm:text-sm">
                                    Completed
                                </div>
                                <div className="text-xs font-medium sm:text-sm">
                                    {formatDate(printJob.completedAt)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
