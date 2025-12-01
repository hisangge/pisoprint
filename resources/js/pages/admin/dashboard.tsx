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
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    DollarSign,
    FileText,
    Printer,
    TrendingUp,
    Users,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: admin.dashboard.url(),
    },
];

interface DashboardStats {
    totalRevenue: number;
    revenueToday: number;
    totalPrintJobs: number;
    printJobsToday: number;
    activePrintJobs: number;
    totalUsers: number;
    esp32Status: {
        connected: boolean;
        healthy: boolean;
        lastHeartbeat: string | null;
    };
    printerStatus: {
        online: boolean;
        queuedJobs: number;
    };
}

interface RecentJob {
    id: number;
    fileName: string;
    status: string;
    cost: number;
    createdAt: string;
}

interface Props {
    stats?: DashboardStats;
    recentJobs?: RecentJob[];
}

export default function Dashboard({
    stats = {
        totalRevenue: 0,
        revenueToday: 0,
        totalPrintJobs: 0,
        printJobsToday: 0,
        activePrintJobs: 0,
        totalUsers: 0,
        esp32Status: {
            connected: false,
            healthy: false,
            lastHeartbeat: null,
        },
        printerStatus: {
            online: false,
            queuedJobs: 0,
        },
    },
    recentJobs = [],
}: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold sm:text-3xl">
                        Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground sm:text-base">
                        Overview of your print kiosk system
                    </p>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Revenue Today */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium sm:text-sm">
                                Revenue Today
                            </CardTitle>
                            <DollarSign className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold sm:text-2xl">
                                ₱{stats.revenueToday.toFixed(2)}
                            </div>
                            <p className="text-[10px] text-muted-foreground sm:text-xs">
                                Total: ₱{stats.totalRevenue.toFixed(2)}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Print Jobs Today */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium sm:text-sm">
                                Print Jobs Today
                            </CardTitle>
                            <FileText className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold sm:text-2xl">
                                {stats.printJobsToday}
                            </div>
                            <p className="text-[10px] text-muted-foreground sm:text-xs">
                                Total: {stats.totalPrintJobs} jobs
                            </p>
                        </CardContent>
                    </Card>

                    {/* Active Print Jobs */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium sm:text-sm">
                                Active Jobs
                            </CardTitle>
                            <Activity className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold sm:text-2xl">
                                {stats.activePrintJobs}
                            </div>
                            <p className="text-[10px] text-muted-foreground sm:text-xs">
                                Currently printing
                            </p>
                        </CardContent>
                    </Card>

                    {/* Total Users */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium sm:text-sm">
                                Total Users
                            </CardTitle>
                            <Users className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold sm:text-2xl">
                                {stats.totalUsers}
                            </div>
                            <p className="text-[10px] text-muted-foreground sm:text-xs">
                                Registered accounts
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                    {/* System Health */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base sm:text-lg">
                                System Health
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Hardware and printer status
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4">
                            {/* ESP32 Status */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="text-xs font-medium sm:text-sm">
                                        ESP32 Coin Acceptor
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`h-2 w-2 rounded-full ${
                                            stats.esp32Status.healthy
                                                ? 'bg-success'
                                                : stats.esp32Status.connected
                                                  ? 'bg-warning'
                                                  : 'bg-destructive'
                                        }`}
                                    />
                                    <span className="text-xs text-muted-foreground sm:text-sm">
                                        {stats.esp32Status.healthy
                                            ? 'Healthy'
                                            : stats.esp32Status.connected
                                              ? 'Connected'
                                              : 'Offline'}
                                    </span>
                                </div>
                            </div>

                            {stats.esp32Status.lastHeartbeat && (
                                <p className="text-[10px] text-muted-foreground sm:text-xs">
                                    Last heartbeat:{' '}
                                    {new Date(
                                        stats.esp32Status.lastHeartbeat,
                                    ).toLocaleString()}
                                </p>
                            )}

                            {/* Printer Status */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="text-xs font-medium sm:text-sm">
                                        Printer
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`h-2 w-2 rounded-full ${
                                            stats.printerStatus.online
                                                ? 'bg-success'
                                                : 'bg-destructive'
                                        }`}
                                    />
                                    <span className="text-xs text-muted-foreground sm:text-sm">
                                        {stats.printerStatus.online
                                            ? 'Online'
                                            : 'Offline'}
                                    </span>
                                </div>
                            </div>

                            {stats.printerStatus.queuedJobs > 0 && (
                                <p className="text-[10px] text-muted-foreground sm:text-xs">
                                    {stats.printerStatus.queuedJobs} job(s) in
                                    queue
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Print Jobs */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base sm:text-lg">
                                Recent Print Jobs
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Latest printing activity
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 sm:space-y-3">
                                {(recentJobs?.length || 0) === 0 ? (
                                    <Empty className="border-0 p-8">
                                        <EmptyHeader>
                                            <EmptyMedia variant="icon">
                                                <FileText />
                                            </EmptyMedia>
                                            <EmptyTitle>
                                                No Recent Jobs
                                            </EmptyTitle>
                                            <EmptyDescription>
                                                Print jobs will appear here once
                                                processing starts
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                ) : (
                                    recentJobs?.slice(0, 5).map((job) => (
                                        <div
                                            key={job.id}
                                            className="flex items-center justify-between gap-2 text-xs sm:text-sm"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-medium sm:text-sm">
                                                    {job.fileName}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground sm:text-xs">
                                                    {new Date(
                                                        job.createdAt,
                                                    ).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                                                <span
                                                    className={`rounded px-1.5 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs ${
                                                        job.status ===
                                                        'completed'
                                                            ? 'bg-success/10 text-success'
                                                            : job.status ===
                                                                'failed'
                                                              ? 'bg-destructive/10 text-destructive'
                                                              : 'bg-info/10 text-info'
                                                    }`}
                                                >
                                                    {job.status
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        job.status.slice(1)}
                                                </span>
                                                <span className="text-[10px] font-medium sm:text-xs">
                                                    ₱
                                                    {Number(job.cost).toFixed(
                                                        2,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            {(recentJobs?.length || 0) > 0 && (
                                <div className="mt-3 sm:mt-4">
                                    <Link
                                        href={admin.printJobs.index.url()}
                                        className="text-xs text-primary hover:underline sm:text-sm"
                                    >
                                        View all print jobs →
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base sm:text-lg">
                            Quick Actions
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            Common administrative tasks
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                            <Link
                                href={admin.printJobs.index.url()}
                                className="flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-accent sm:gap-3 sm:p-4"
                            >
                                <FileText className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
                                <div>
                                    <p className="text-sm font-medium sm:text-base">
                                        Print Jobs
                                    </p>
                                    <p className="text-[10px] text-muted-foreground sm:text-xs">
                                        View history
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href={admin.transactions.index.url()}
                                className="flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-accent sm:gap-3 sm:p-4"
                            >
                                <TrendingUp className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
                                <div>
                                    <p className="text-sm font-medium sm:text-base">
                                        Transactions
                                    </p>
                                    <p className="text-[10px] text-muted-foreground sm:text-xs">
                                        Financial logs
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href={admin.settings.index.url()}
                                className="flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-accent sm:gap-3 sm:p-4"
                            >
                                <Activity className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
                                <div>
                                    <p className="text-sm font-medium sm:text-base">
                                        Settings
                                    </p>
                                    <p className="text-[10px] text-muted-foreground sm:text-xs">
                                        Configure system
                                    </p>
                                </div>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
