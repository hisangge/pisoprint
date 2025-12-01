import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Download, Eye, FileText, Search } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: admin.dashboard.url(),
    },
    {
        title: 'Print Jobs',
        href: admin.printJobs.index.url(),
    },
];

interface PrintJob {
    id: number;
    fileName: string;
    userName: string;
    pages: number;
    copies: number;
    colorMode: string;
    cost: number;
    status: string;
    createdAt: string;
    completedAt: string | null;
}

interface PaginationMeta {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
}

interface Props {
    printJobs?: {
        data: PrintJob[];
        meta: PaginationMeta;
    };
    filters?: {
        search?: string;
        status?: string;
    };
}

export default function PrintJobs({
    printJobs = {
        data: [],
        meta: { currentPage: 1, lastPage: 1, perPage: 15, total: 0 },
    },
    filters = {},
}: Props) {
    const [search, setSearch] = useState(filters?.search || '');
    const [perPage, setPerPage] = useState<string>(
        printJobs?.meta?.perPage?.toString() || '15',
    );

    const handleSearch = () => {
        router.get(
            admin.printJobs.index.url(),
            { search, per_page: perPage },
            { preserveState: true },
        );
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        router.get(
            admin.printJobs.index.url(),
            { search, per_page: value, page: 1 },
            { preserveState: true },
        );
    };

    const handleExport = () => {
        // Build query string with current filters
        const params = new URLSearchParams();

        if (search) {
            params.append('search', search);
        }

        // Create download link
        const queryString = params.toString();
        const url = queryString
            ? `${admin.printJobs.export.url()}?${queryString}`
            : admin.printJobs.export.url();

        // Trigger download
        window.location.href = url;
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            completed: 'bg-success/10 text-success border-success/20',
            printing: 'bg-info/10 text-info border-info/20',
            pending: 'bg-warning/10 text-warning border-warning/20',
            failed: 'bg-destructive/10 text-destructive border-destructive/20',
            cancelled: 'bg-muted text-muted-foreground',
        };

        return (
            <Badge
                variant="outline"
                className={
                    styles[status as keyof typeof styles] ||
                    'bg-muted text-muted-foreground'
                }
            >
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Print Jobs" />

            <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
                {/* Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold sm:text-3xl">
                            Print Jobs
                        </h1>
                        <p className="text-sm text-muted-foreground sm:text-base">
                            Complete history of all print jobs
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={handleExport}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>

                {/* Filters Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg sm:text-xl">
                            Filters
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            Search and filter print jobs
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search by filename or user..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) =>
                                        e.key === 'Enter' && handleSearch()
                                    }
                                    className="text-sm"
                                />
                            </div>
                            <Button
                                onClick={handleSearch}
                                className="w-full sm:w-auto"
                            >
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Print Jobs Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg sm:text-xl">
                            All Print Jobs ({printJobs?.meta?.total || 0})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs sm:text-sm">
                                            ID
                                        </TableHead>
                                        <TableHead className="text-xs sm:text-sm">
                                            File Name
                                        </TableHead>
                                        <TableHead className="text-xs sm:text-sm">
                                            User
                                        </TableHead>
                                        <TableHead className="text-xs sm:text-sm">
                                            Pages
                                        </TableHead>
                                        <TableHead className="text-xs sm:text-sm">
                                            Copies
                                        </TableHead>
                                        <TableHead className="text-xs sm:text-sm">
                                            Mode
                                        </TableHead>
                                        <TableHead className="text-xs sm:text-sm">
                                            Cost
                                        </TableHead>
                                        <TableHead className="text-xs sm:text-sm">
                                            Status
                                        </TableHead>
                                        <TableHead className="text-xs sm:text-sm">
                                            Created
                                        </TableHead>
                                        <TableHead className="text-xs sm:text-sm">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(printJobs?.data?.length || 0) === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={10}
                                                className="h-[400px] p-0"
                                            >
                                                <Empty className="border-0">
                                                    <EmptyHeader>
                                                        <EmptyMedia variant="icon">
                                                            <FileText />
                                                        </EmptyMedia>
                                                        <EmptyTitle>
                                                            No Print Jobs Yet
                                                        </EmptyTitle>
                                                        <EmptyDescription>
                                                            Print jobs will
                                                            appear here once
                                                            customers start
                                                            printing documents
                                                        </EmptyDescription>
                                                    </EmptyHeader>
                                                </Empty>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        printJobs?.data?.map((job) => (
                                            <TableRow key={job.id}>
                                                <TableCell className="text-xs font-medium sm:text-sm">
                                                    #{job.id}
                                                </TableCell>
                                                <TableCell className="max-w-[120px] truncate text-xs sm:max-w-xs sm:text-sm">
                                                    {job.fileName}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                    {job.userName}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                    {job.pages}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                    {job.copies}
                                                </TableCell>
                                                <TableCell className="text-xs capitalize sm:text-sm">
                                                    {job.colorMode}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                    ₱{job.cost.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(job.status)}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                    {new Date(
                                                        job.createdAt,
                                                    ).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                router.get(
                                                                    admin.printJobs.show.url(
                                                                        job.id,
                                                                    ),
                                                                )
                                                            }
                                                            className="h-8 w-8"
                                                        >
                                                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {(printJobs?.meta?.lastPage || 0) > 1 && (
                            <div className="mt-4 flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-0">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                                    <p className="text-xs text-muted-foreground sm:text-sm">
                                        Showing{' '}
                                        {((printJobs?.meta?.currentPage || 1) -
                                            1) *
                                            (printJobs?.meta?.perPage || 15) +
                                            1}{' '}
                                        to{' '}
                                        {Math.min(
                                            (printJobs?.meta?.currentPage ||
                                                1) *
                                                (printJobs?.meta?.perPage ||
                                                    15),
                                            printJobs?.meta?.total || 0,
                                        )}{' '}
                                        of {printJobs?.meta?.total || 0} results
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground sm:text-sm">
                                            Per page:
                                        </span>
                                        <Select
                                            value={perPage || '15'}
                                            onValueChange={handlePerPageChange}
                                        >
                                            <SelectTrigger className="h-8 w-[70px]">
                                                <SelectValue placeholder="15" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="15">
                                                    15
                                                </SelectItem>
                                                <SelectItem value="25">
                                                    25
                                                </SelectItem>
                                                <SelectItem value="50">
                                                    50
                                                </SelectItem>
                                                <SelectItem value="100">
                                                    100
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (
                                                            (printJobs?.meta
                                                                ?.currentPage ||
                                                                1) > 1
                                                        ) {
                                                            router.get(
                                                                admin.printJobs.index.url(),
                                                                {
                                                                    page:
                                                                        (printJobs
                                                                            ?.meta
                                                                            ?.currentPage ||
                                                                            1) -
                                                                        1,
                                                                    search,
                                                                    per_page:
                                                                        perPage,
                                                                },
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            );
                                                        }
                                                    }}
                                                    className={
                                                        (printJobs?.meta
                                                            ?.currentPage ||
                                                            1) === 1
                                                            ? 'pointer-events-none opacity-50'
                                                            : ''
                                                    }
                                                />
                                            </PaginationItem>

                                            {(() => {
                                                const currentPage =
                                                    printJobs?.meta
                                                        ?.currentPage || 1;
                                                const lastPage =
                                                    printJobs?.meta?.lastPage ||
                                                    1;
                                                const pages = [];

                                                // Always show first page
                                                pages.push(
                                                    <PaginationItem key={1}>
                                                        <PaginationLink
                                                            href="#"
                                                            isActive={
                                                                currentPage ===
                                                                1
                                                            }
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                router.get(
                                                                    admin.printJobs.index.url(),
                                                                    {
                                                                        page: 1,
                                                                        search,
                                                                        per_page:
                                                                            perPage,
                                                                    },
                                                                    {
                                                                        preserveState: false,
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            1
                                                        </PaginationLink>
                                                    </PaginationItem>,
                                                );

                                                // Show ellipsis if needed
                                                if (currentPage > 3) {
                                                    pages.push(
                                                        <PaginationItem key="ellipsis-start">
                                                            <PaginationEllipsis />
                                                        </PaginationItem>,
                                                    );
                                                }

                                                // Show pages around current page
                                                for (
                                                    let i = Math.max(
                                                        2,
                                                        currentPage - 1,
                                                    );
                                                    i <=
                                                    Math.min(
                                                        lastPage - 1,
                                                        currentPage + 1,
                                                    );
                                                    i++
                                                ) {
                                                    pages.push(
                                                        <PaginationItem key={i}>
                                                            <PaginationLink
                                                                href="#"
                                                                isActive={
                                                                    currentPage ===
                                                                    i
                                                                }
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault();
                                                                    router.get(
                                                                        admin.printJobs.index.url(),
                                                                        {
                                                                            page: i,
                                                                            search,
                                                                            per_page:
                                                                                perPage,
                                                                        },
                                                                        {
                                                                            preserveScroll: true,
                                                                        },
                                                                    );
                                                                }}
                                                            >
                                                                {i}
                                                            </PaginationLink>
                                                        </PaginationItem>,
                                                    );
                                                }

                                                // Show ellipsis if needed
                                                if (
                                                    currentPage <
                                                    lastPage - 2
                                                ) {
                                                    pages.push(
                                                        <PaginationItem key="ellipsis-end">
                                                            <PaginationEllipsis />
                                                        </PaginationItem>,
                                                    );
                                                }

                                                // Always show last page if more than 1 page
                                                if (lastPage > 1) {
                                                    pages.push(
                                                        <PaginationItem
                                                            key={lastPage}
                                                        >
                                                            <PaginationLink
                                                                href="#"
                                                                isActive={
                                                                    currentPage ===
                                                                    lastPage
                                                                }
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault();
                                                                    router.get(
                                                                        admin.printJobs.index.url(),
                                                                        {
                                                                            page: lastPage,
                                                                            search,
                                                                            per_page:
                                                                                perPage,
                                                                        },
                                                                        {
                                                                            preserveScroll: true,
                                                                        },
                                                                    );
                                                                }}
                                                            >
                                                                {lastPage}
                                                            </PaginationLink>
                                                        </PaginationItem>,
                                                    );
                                                }

                                                return pages;
                                            })()}

                                            <PaginationItem>
                                                <PaginationNext
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (
                                                            (printJobs?.meta
                                                                ?.currentPage ||
                                                                1) <
                                                            (printJobs?.meta
                                                                ?.lastPage || 1)
                                                        ) {
                                                            router.get(
                                                                admin.printJobs.index.url(),
                                                                {
                                                                    page:
                                                                        (printJobs
                                                                            ?.meta
                                                                            ?.currentPage ||
                                                                            1) +
                                                                        1,
                                                                    search,
                                                                    per_page:
                                                                        perPage,
                                                                },
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            );
                                                        }
                                                    }}
                                                    className={
                                                        (printJobs?.meta
                                                            ?.currentPage ||
                                                            1) ===
                                                        (printJobs?.meta
                                                            ?.lastPage || 1)
                                                            ? 'pointer-events-none opacity-50'
                                                            : ''
                                                    }
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
