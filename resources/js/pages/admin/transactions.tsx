import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { Label } from '@/components/ui/label';
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
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
import { cn } from '@/lib/utils';
import admin from '@/routes/admin';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    ArrowDown,
    ArrowUp,
    CalendarIcon,
    DollarSign,
    Download,
    Filter,
    Search,
    TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: admin.dashboard.url(),
    },
    {
        title: 'Transactions',
        href: admin.transactions.index.url(),
    },
];

interface Transaction {
    id: number;
    type: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    description: string;
    sessionId: string | null;
    esp32Id: string | null;
    coinCount: number | null;
    coinValue: number | null;
    isVerified: boolean;
    createdAt: string;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
    printJob: {
        id: number;
        fileName: string;
        status: string;
    } | null;
}

interface Stats {
    totalRevenue: number;
    totalCoins: number;
    todayRevenue: number;
    todayCoins: number;
}

interface Props {
    transactions?: {
        data: Transaction[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
    stats?: Stats;
    filters?: {
        type?: string;
        from?: string;
        to?: string;
        search?: string;
    };
}

export default function Transactions({
    transactions = {
        data: [],
        links: [],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
    },
    stats = { totalRevenue: 0, totalCoins: 0, todayRevenue: 0, todayCoins: 0 },
    filters = {},
}: Props) {
    const [filterType, setFilterType] = useState(filters.type || 'all');
    const [dateFrom, setDateFrom] = useState<Date | undefined>(
        filters.from ? new Date(filters.from) : undefined,
    );
    const [dateTo, setDateTo] = useState<Date | undefined>(
        filters.to ? new Date(filters.to) : undefined,
    );
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [perPage, setPerPage] = useState<string>(
        transactions?.meta?.per_page?.toString() || '15',
    );

    const handleFilter = () => {
        router.get(
            admin.transactions.index.url(),
            {
                type: filterType !== 'all' ? filterType : undefined,
                from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
                to: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
                search: searchQuery || undefined,
                per_page: perPage,
            },
            { preserveState: true },
        );
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        router.get(
            admin.transactions.index.url(),
            {
                type: filterType !== 'all' ? filterType : undefined,
                from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
                to: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
                search: searchQuery || undefined,
                per_page: value,
                page: 1,
            },
            { preserveState: true },
        );
    };

    const handleClearFilters = () => {
        setFilterType('all');
        setDateFrom(undefined);
        setDateTo(undefined);
        setSearchQuery('');
        router.get(admin.transactions.index.url());
    };

    const handleExport = () => {
        // Build query string with current filters
        const params = new URLSearchParams();

        if (filterType !== 'all') {
            params.append('type', filterType);
        }
        if (dateFrom) {
            params.append('from', format(dateFrom, 'yyyy-MM-dd'));
        }
        if (dateTo) {
            params.append('to', format(dateTo, 'yyyy-MM-dd'));
        }
        if (searchQuery) {
            params.append('search', searchQuery);
        }

        // Create download link
        const queryString = params.toString();
        const url = queryString
            ? `${admin.transactions.export.url()}?${queryString}`
            : admin.transactions.export.url();

        // Trigger download
        window.location.href = url;
    };

    const getTransactionTypeBadge = (type: string) => {
        switch (type) {
            case 'coin_insert':
            case 'coin_deposit':
                return (
                    <Badge
                        variant="outline"
                        className="bg-success/10 text-success"
                    >
                        <ArrowDown className="mr-1 h-3 w-3" />
                        Coin Insert
                    </Badge>
                );
            case 'print_deduct':
            case 'print_deduction':
                return (
                    <Badge variant="outline" className="bg-info/10 text-info">
                        <ArrowUp className="mr-1 h-3 w-3" />
                        Print Deduction
                    </Badge>
                );
            default:
                return <Badge variant="outline">{type}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transactions" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold md:text-3xl">
                        Transactions
                    </h1>
                    <p className="text-sm text-muted-foreground md:text-base">
                        Financial transaction history and revenue tracking
                    </p>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium md:text-sm">
                                Total Revenue
                            </CardTitle>
                            <DollarSign className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold md:text-2xl">
                                ₱{stats.totalRevenue.toFixed(2)}
                            </div>
                            <p className="text-[10px] text-muted-foreground md:text-xs">
                                From print jobs
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium md:text-sm">
                                Total Coins
                            </CardTitle>
                            <TrendingUp className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold md:text-2xl">
                                ₱{stats.totalCoins.toFixed(2)}
                            </div>
                            <p className="text-[10px] text-muted-foreground md:text-xs">
                                Coins inserted
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium md:text-sm">
                                Today Revenue
                            </CardTitle>
                            <DollarSign className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold md:text-2xl">
                                ₱{stats.todayRevenue.toFixed(2)}
                            </div>
                            <p className="text-[10px] text-muted-foreground md:text-xs">
                                Today's earnings
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium md:text-sm">
                                Today Coins
                            </CardTitle>
                            <TrendingUp className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold md:text-2xl">
                                ₱{stats.todayCoins.toFixed(2)}
                            </div>
                            <p className="text-[10px] text-muted-foreground md:text-xs">
                                Today's coins
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                            <Filter className="h-4 w-4" />
                            Filters
                        </CardTitle>
                        <CardDescription className="text-xs md:text-sm">
                            Filter transactions by type, date range, or search
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Transaction Type</Label>
                                <Select
                                    value={filterType}
                                    onValueChange={setFilterType}
                                >
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="All types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Types
                                        </SelectItem>
                                        <SelectItem value="coin_insert">
                                            Coin Insert
                                        </SelectItem>
                                        <SelectItem value="print_deduct">
                                            Print Deduction
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="from">From Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="from"
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-start text-left font-normal',
                                                !dateFrom &&
                                                    'text-muted-foreground',
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateFrom ? (
                                                format(dateFrom, 'PPP')
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={dateFrom}
                                            onSelect={setDateFrom}
                                            captionLayout="dropdown"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="to">To Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="to"
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-start text-left font-normal',
                                                !dateTo &&
                                                    'text-muted-foreground',
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateTo ? (
                                                format(dateTo, 'PPP')
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={dateTo}
                                            onSelect={setDateTo}
                                            initialFocus
                                            captionLayout="dropdown-months"
                                            fromYear={2020}
                                            toYear={
                                                new Date().getFullYear() + 1
                                            }
                                            disabled={(date) =>
                                                dateFrom
                                                    ? date < dateFrom
                                                    : false
                                            }
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="search">Search</Label>
                                <div className="relative">
                                    <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        placeholder="Session ID..."
                                        className="pl-8"
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleFilter();
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                            <Button
                                onClick={handleFilter}
                                className="w-full sm:w-auto"
                            >
                                <Filter className="mr-2 h-4 w-4" />
                                Apply Filters
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleClearFilters}
                                className="w-full sm:w-auto"
                            >
                                Clear Filters
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full sm:ml-auto sm:w-auto"
                                onClick={handleExport}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Transactions Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base md:text-lg">
                            Transaction History
                        </CardTitle>
                        <CardDescription className="text-xs md:text-sm">
                            {transactions?.meta?.total || 0} total transactions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="whitespace-nowrap">
                                            ID
                                        </TableHead>
                                        <TableHead className="whitespace-nowrap">
                                            Type
                                        </TableHead>
                                        <TableHead className="whitespace-nowrap">
                                            Amount
                                        </TableHead>
                                        <TableHead className="whitespace-nowrap">
                                            Description
                                        </TableHead>
                                        <TableHead className="whitespace-nowrap">
                                            Session
                                        </TableHead>
                                        <TableHead className="whitespace-nowrap">
                                            User
                                        </TableHead>
                                        <TableHead className="whitespace-nowrap">
                                            Date
                                        </TableHead>
                                        <TableHead className="whitespace-nowrap">
                                            Status
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(transactions?.data?.length || 0) === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={8}
                                                className="h-[400px] p-0"
                                            >
                                                <Empty className="border-0">
                                                    <EmptyHeader>
                                                        <EmptyMedia variant="icon">
                                                            <TrendingUp />
                                                        </EmptyMedia>
                                                        <EmptyTitle>
                                                            No Transactions
                                                            Found
                                                        </EmptyTitle>
                                                        <EmptyDescription>
                                                            Transaction history
                                                            will appear here
                                                            once customers start
                                                            using the kiosk
                                                        </EmptyDescription>
                                                    </EmptyHeader>
                                                </Empty>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transactions?.data?.map(
                                            (transaction) => (
                                                <TableRow key={transaction.id}>
                                                    <TableCell className="font-mono text-xs whitespace-nowrap">
                                                        #{transaction.id}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        {getTransactionTypeBadge(
                                                            transaction.type,
                                                        )}
                                                    </TableCell>
                                                    <TableCell
                                                        className={`text-xs font-semibold whitespace-nowrap ${
                                                            transaction.type ===
                                                            'coin_deposit'
                                                                ? 'text-success'
                                                                : transaction.type ===
                                                                    'print_deduction'
                                                                  ? 'text-info'
                                                                  : 'text-warning'
                                                        }`}
                                                    >
                                                        {transaction.type ===
                                                        'coin_deposit'
                                                            ? '+'
                                                            : '-'}
                                                        ₱
                                                        {transaction.amount.toFixed(
                                                            2,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px]">
                                                        <span className="line-clamp-2 text-xs">
                                                            {
                                                                transaction.description
                                                            }
                                                        </span>
                                                        {transaction.printJob && (
                                                            <Link
                                                                href={admin.printJobs.show.url(
                                                                    transaction
                                                                        .printJob
                                                                        .id,
                                                                )}
                                                                className="mt-1 block text-xs text-primary hover:underline"
                                                            >
                                                                View Job
                                                            </Link>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs whitespace-nowrap">
                                                        {transaction.sessionId
                                                            ? `${transaction.sessionId.substring(0, 8)}...`
                                                            : '-'}
                                                    </TableCell>
                                                    <TableCell className="min-w-[120px]">
                                                        {transaction.user ? (
                                                            <div className="text-xs">
                                                                <div className="truncate font-medium">
                                                                    {
                                                                        transaction
                                                                            .user
                                                                            .name
                                                                    }
                                                                </div>
                                                                <div className="truncate text-[10px] text-muted-foreground">
                                                                    {
                                                                        transaction
                                                                            .user
                                                                            .email
                                                                    }
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">
                                                                Guest
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-xs whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span>
                                                                {new Date(
                                                                    transaction.createdAt,
                                                                ).toLocaleDateString()}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {new Date(
                                                                    transaction.createdAt,
                                                                ).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        {transaction.isVerified ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="bg-success/10 text-success text-xs"
                                                            >
                                                                Verified
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                Pending
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ),
                                        )
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {(transactions?.meta?.last_page || 0) > 1 && (
                            <div className="mt-4 flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-0">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                                    <p className="text-xs text-muted-foreground sm:text-sm">
                                        Showing{' '}
                                        {((transactions?.meta?.current_page ||
                                            1) -
                                            1) *
                                            (transactions?.meta?.per_page ||
                                                15) +
                                            1}{' '}
                                        to{' '}
                                        {Math.min(
                                            (transactions?.meta?.current_page ||
                                                1) *
                                                (transactions?.meta?.per_page ||
                                                    15),
                                            transactions?.meta?.total || 0,
                                        )}{' '}
                                        of {transactions?.meta?.total || 0}{' '}
                                        results
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
                                                            (transactions?.meta
                                                                ?.current_page ||
                                                                1) > 1
                                                        ) {
                                                            router.get(
                                                                admin.transactions.index.url(),
                                                                {
                                                                    page:
                                                                        (transactions
                                                                            ?.meta
                                                                            ?.current_page ||
                                                                            1) -
                                                                        1,
                                                                    type: filterType,
                                                                    start_date:
                                                                        dateFrom
                                                                            ? format(
                                                                                  dateFrom,
                                                                                  'yyyy-MM-dd',
                                                                              )
                                                                            : undefined,
                                                                    end_date:
                                                                        dateTo
                                                                            ? format(
                                                                                  dateTo,
                                                                                  'yyyy-MM-dd',
                                                                              )
                                                                            : undefined,
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
                                                        (transactions?.meta
                                                            ?.current_page ||
                                                            1) === 1
                                                            ? 'pointer-events-none opacity-50'
                                                            : ''
                                                    }
                                                />
                                            </PaginationItem>

                                            {(() => {
                                                const currentPage =
                                                    transactions?.meta
                                                        ?.current_page || 1;
                                                const lastPage =
                                                    transactions?.meta
                                                        ?.last_page || 1;
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
                                                                    admin.transactions.index.url(),
                                                                    {
                                                                        page: 1,
                                                                        type: filterType,
                                                                        start_date:
                                                                            dateFrom
                                                                                ? format(
                                                                                      dateFrom,
                                                                                      'yyyy-MM-dd',
                                                                                  )
                                                                                : undefined,
                                                                        end_date:
                                                                            dateTo
                                                                                ? format(
                                                                                      dateTo,
                                                                                      'yyyy-MM-dd',
                                                                                  )
                                                                                : undefined,
                                                                        per_page:
                                                                            perPage,
                                                                    },
                                                                    {
                                                                        preserveState: true,
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
                                                                        admin.transactions.index.url(),
                                                                        {
                                                                            page: i,
                                                                            type: filterType,
                                                                            start_date:
                                                                                dateFrom
                                                                                    ? format(
                                                                                          dateFrom,
                                                                                          'yyyy-MM-dd',
                                                                                      )
                                                                                    : undefined,
                                                                            end_date:
                                                                                dateTo
                                                                                    ? format(
                                                                                          dateTo,
                                                                                          'yyyy-MM-dd',
                                                                                      )
                                                                                    : undefined,
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
                                                                        admin.transactions.index.url(),
                                                                        {
                                                                            page: lastPage,
                                                                            type: filterType,
                                                                            start_date:
                                                                                dateFrom
                                                                                    ? format(
                                                                                          dateFrom,
                                                                                          'yyyy-MM-dd',
                                                                                      )
                                                                                    : undefined,
                                                                            end_date:
                                                                                dateTo
                                                                                    ? format(
                                                                                          dateTo,
                                                                                          'yyyy-MM-dd',
                                                                                      )
                                                                                    : undefined,
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
                                                            (transactions?.meta
                                                                ?.current_page ||
                                                                1) <
                                                            (transactions?.meta
                                                                ?.last_page ||
                                                                1)
                                                        ) {
                                                            router.get(
                                                                admin.transactions.index.url(),
                                                                {
                                                                    page:
                                                                        (transactions
                                                                            ?.meta
                                                                            ?.current_page ||
                                                                            1) +
                                                                        1,
                                                                    type: filterType,
                                                                    start_date:
                                                                        dateFrom
                                                                            ? format(
                                                                                  dateFrom,
                                                                                  'yyyy-MM-dd',
                                                                              )
                                                                            : undefined,
                                                                    end_date:
                                                                        dateTo
                                                                            ? format(
                                                                                  dateTo,
                                                                                  'yyyy-MM-dd',
                                                                              )
                                                                            : undefined,
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
                                                        (transactions?.meta
                                                            ?.current_page ||
                                                            1) ===
                                                        (transactions?.meta
                                                            ?.last_page || 1)
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
