import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import { type BreadcrumbItem } from '@/types';
import { Form, Head } from '@inertiajs/react';
import {
    AlertTriangle,
    DollarSign,
    HardDrive,
    Printer,
    Save,
    Wifi,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: admin.dashboard.url(),
    },
    {
        title: 'Settings',
        href: admin.settings.index.url(),
    },
];

interface Settings {
    printing: {
        defaultPrinter: string;
        cupsServer: string;
        pricing: {
            bw: number;
            grayscale: number;
            color: number;
        };
        maxCopies: number;
        maxPagesPerJob: number;
        maxFileSize: number;
        paperSize: string;
    };
    hardware: {
        esp32Id: string;
        serialPort: string;
        baudRate: number;
        heartbeatTimeout: number;
        acceptedCoins: number[];
        coinTimeout: number;
        maxCoinPerTransaction: number;
    };
    wifi: {
        ssid: string;
        password: string;
        ipAddress: string;
        dhcpRange: string;
    };
}

interface AvailablePrinter {
    id: string;
    name: string;
    isOnline: boolean;
}

interface Props {
    settings: Settings;
    availablePrinters: AvailablePrinter[];
}

export default function Settings({ settings, availablePrinters }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Settings" />

            <div className="flex flex-col gap-6 p-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-3xl font-bold">System Settings</h1>
                    <p className="text-muted-foreground">
                        Configure printing, hardware, and system preferences
                    </p>
                </div>

                <Form
                    action={admin.settings.update.url()}
                    method="post"
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            {/* Printing Settings */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Printer className="h-5 w-5" />
                                        Printing Settings
                                    </CardTitle>
                                    <CardDescription>
                                        Configure printer and print job settings
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FieldGroup>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field>
                                                <FieldLabel htmlFor="defaultPrinter">
                                                    Default Printer
                                                </FieldLabel>
                                                <Select
                                                    name="printing[defaultPrinter]"
                                                    defaultValue={
                                                        settings.printing
                                                            .defaultPrinter
                                                    }
                                                >
                                                    <SelectTrigger id="defaultPrinter">
                                                        <SelectValue placeholder="Select a printer" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availablePrinters.length ===
                                                        0 ? (
                                                            <SelectItem
                                                                value=""
                                                                disabled
                                                            >
                                                                No printers
                                                                available
                                                            </SelectItem>
                                                        ) : (
                                                            availablePrinters.map(
                                                                (printer) => (
                                                                    <SelectItem
                                                                        key={
                                                                            printer.id
                                                                        }
                                                                        value={
                                                                            printer.id
                                                                        }
                                                                    >
                                                                        {
                                                                            printer.name
                                                                        }
                                                                        {printer.isOnline
                                                                            ? ' (Online)'
                                                                            : ' (Offline)'}
                                                                    </SelectItem>
                                                                ),
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                {errors[
                                                    'printing.defaultPrinter'
                                                ] && (
                                                    <FieldDescription className="text-destructive">
                                                        {
                                                            errors[
                                                                'printing.defaultPrinter'
                                                            ]
                                                        }
                                                    </FieldDescription>
                                                )}
                                            </Field>

                                            <Field>
                                                <FieldLabel htmlFor="cupsServer">
                                                    CUPS Server
                                                </FieldLabel>
                                                <Input
                                                    id="cupsServer"
                                                    name="printing[cupsServer]"
                                                    defaultValue={
                                                        settings.printing
                                                            .cupsServer
                                                    }
                                                    placeholder="localhost"
                                                />
                                            </Field>

                                            <Field>
                                                <FieldLabel htmlFor="paperSize">
                                                    Paper Size
                                                </FieldLabel>
                                                <Select
                                                    name="printing[paperSize]"
                                                    defaultValue={
                                                        settings.printing
                                                            .paperSize
                                                    }
                                                >
                                                    <SelectTrigger id="paperSize">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Letter">
                                                            Letter (8.5" × 11")
                                                        </SelectItem>
                                                        <SelectItem value="Legal">
                                                            Legal (8.5" × 14")
                                                        </SelectItem>
                                                        <SelectItem value="A4">
                                                            A4 (210mm × 297mm)
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </Field>

                                            <Field>
                                                <FieldLabel htmlFor="maxFileSize">
                                                    Max File Size (MB)
                                                </FieldLabel>
                                                <Input
                                                    id="maxFileSize"
                                                    name="printing[maxFileSize]"
                                                    type="number"
                                                    defaultValue={
                                                        settings.printing
                                                            .maxFileSize /
                                                        1024 /
                                                        1024
                                                    }
                                                    min="1"
                                                    max="100"
                                                />
                                            </Field>

                                            <Field>
                                                <FieldLabel htmlFor="maxCopies">
                                                    Max Copies
                                                </FieldLabel>
                                                <Input
                                                    id="maxCopies"
                                                    name="printing[maxCopies]"
                                                    type="number"
                                                    defaultValue={
                                                        settings.printing
                                                            .maxCopies
                                                    }
                                                    min="1"
                                                    max="1000"
                                                />
                                            </Field>

                                            <Field>
                                                <FieldLabel htmlFor="maxPagesPerJob">
                                                    Max Pages Per Job
                                                </FieldLabel>
                                                <Input
                                                    id="maxPagesPerJob"
                                                    name="printing[maxPagesPerJob]"
                                                    type="number"
                                                    defaultValue={
                                                        settings.printing
                                                            .maxPagesPerJob
                                                    }
                                                    min="1"
                                                    max="1000"
                                                />
                                            </Field>
                                        </div>
                                    </FieldGroup>

                                    {/* Pricing */}
                                    <div>
                                        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                                            <DollarSign className="h-4 w-4" />
                                            Pricing Per Page
                                        </h3>
                                        <FieldGroup>
                                            <div className="grid gap-4 md:grid-cols-3">
                                                <Field>
                                                    <FieldLabel htmlFor="priceBW">
                                                        Black & White (₱)
                                                    </FieldLabel>
                                                    <Input
                                                        id="priceBW"
                                                        name="printing[pricing][bw]"
                                                        type="number"
                                                        step="0.01"
                                                        defaultValue={
                                                            settings.printing
                                                                ?.pricing?.bw ??
                                                            0
                                                        }
                                                        min="0"
                                                    />
                                                </Field>

                                                <Field>
                                                    <FieldLabel htmlFor="priceGrayscale">
                                                        Grayscale (₱)
                                                    </FieldLabel>
                                                    <Input
                                                        id="priceGrayscale"
                                                        name="printing[pricing][grayscale]"
                                                        type="number"
                                                        step="0.01"
                                                        defaultValue={
                                                            settings.printing
                                                                ?.pricing
                                                                ?.grayscale ?? 0
                                                        }
                                                        min="0"
                                                    />
                                                </Field>

                                                <Field>
                                                    <FieldLabel htmlFor="priceColor">
                                                        Color (₱)
                                                    </FieldLabel>
                                                    <Input
                                                        id="priceColor"
                                                        name="printing[pricing][color]"
                                                        type="number"
                                                        step="0.01"
                                                        defaultValue={
                                                            settings.printing
                                                                ?.pricing
                                                                ?.color ?? 0
                                                        }
                                                        min="0"
                                                    />
                                                </Field>
                                            </div>
                                        </FieldGroup>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Hardware Settings */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <HardDrive className="h-5 w-5" />
                                        Hardware Configuration
                                    </CardTitle>
                                    <CardDescription>
                                        ESP32 coin acceptor and hardware
                                        settings
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FieldGroup>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field>
                                                <FieldLabel htmlFor="esp32Id">
                                                    ESP32 Device ID
                                                </FieldLabel>
                                                <Input
                                                    id="esp32Id"
                                                    name="hardware[esp32Id]"
                                                    defaultValue={
                                                        settings.hardware
                                                            .esp32Id
                                                    }
                                                    placeholder="ESP32_COIN_001"
                                                />
                                            </Field>

                                            <Field>
                                                <FieldLabel htmlFor="serialPort">
                                                    Serial Port
                                                </FieldLabel>
                                                <Input
                                                    id="serialPort"
                                                    name="hardware[serialPort]"
                                                    defaultValue={
                                                        settings.hardware
                                                            .serialPort
                                                    }
                                                    placeholder="/dev/ttyUSB0"
                                                />
                                            </Field>

                                            <Field>
                                                <FieldLabel htmlFor="baudRate">
                                                    Baud Rate
                                                </FieldLabel>
                                                <Select
                                                    name="hardware[baudRate]"
                                                    defaultValue={(
                                                        settings.hardware
                                                            ?.baudRate ?? 9600
                                                    ).toString()}
                                                >
                                                    <SelectTrigger id="baudRate">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="9600">
                                                            9600
                                                        </SelectItem>
                                                        <SelectItem value="19200">
                                                            19200
                                                        </SelectItem>
                                                        <SelectItem value="38400">
                                                            38400
                                                        </SelectItem>
                                                        <SelectItem value="57600">
                                                            57600
                                                        </SelectItem>
                                                        <SelectItem value="115200">
                                                            115200
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </Field>

                                            <Field>
                                                <FieldLabel htmlFor="heartbeatTimeout">
                                                    Heartbeat Timeout (sec)
                                                </FieldLabel>
                                                <Input
                                                    id="heartbeatTimeout"
                                                    name="hardware[heartbeatTimeout]"
                                                    type="number"
                                                    defaultValue={
                                                        settings.hardware
                                                            .heartbeatTimeout
                                                    }
                                                    min="10"
                                                    max="300"
                                                />
                                            </Field>

                                            <Field>
                                                <FieldLabel htmlFor="coinTimeout">
                                                    Coin Timeout (sec)
                                                </FieldLabel>
                                                <Input
                                                    id="coinTimeout"
                                                    name="hardware[coinTimeout]"
                                                    type="number"
                                                    defaultValue={
                                                        settings.hardware
                                                            .coinTimeout
                                                    }
                                                    min="10"
                                                    max="300"
                                                />
                                            </Field>

                                            <Field>
                                                <FieldLabel htmlFor="maxCoinPerTransaction">
                                                    Max Coins Per Transaction
                                                </FieldLabel>
                                                <Input
                                                    id="maxCoinPerTransaction"
                                                    name="hardware[maxCoinPerTransaction]"
                                                    type="number"
                                                    defaultValue={
                                                        settings.hardware
                                                            .maxCoinPerTransaction
                                                    }
                                                    min="1"
                                                    max="500"
                                                />
                                            </Field>
                                        </div>
                                    </FieldGroup>

                                    <div className="rounded-lg border bg-muted/30 p-4">
                                        <h4 className="mb-2 font-semibold">
                                            Accepted Coins
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Currently accepting:{' '}
                                            {(
                                                settings.hardware
                                                    ?.acceptedCoins ?? []
                                            )
                                                .map((coin) => `₱${coin}`)
                                                .join(', ')}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            To modify accepted coins, update the
                                            hardware.php config file
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* WiFi Settings */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Wifi className="h-5 w-5" />
                                        WiFi Hotspot
                                    </CardTitle>
                                    <CardDescription>
                                        Configure WiFi access point for file
                                        uploads
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FieldGroup>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field>
                                                <FieldLabel htmlFor="wifiSsid">
                                                    SSID (Network Name)
                                                </FieldLabel>
                                                <Input
                                                    id="wifiSsid"
                                                    name="wifi[ssid]"
                                                    defaultValue={
                                                        settings.wifi.ssid
                                                    }
                                                    placeholder="PisoPrint_Kiosk"
                                                />
                                            </Field>

                                            <Field>
                                                <FieldLabel htmlFor="wifiPassword">
                                                    Password
                                                </FieldLabel>
                                                <Input
                                                    id="wifiPassword"
                                                    name="wifi[password]"
                                                    type="password"
                                                    defaultValue={
                                                        settings.wifi.password
                                                    }
                                                    placeholder="Minimum 8 characters"
                                                    minLength={8}
                                                />
                                            </Field>

                                            <Field>
                                                <FieldLabel htmlFor="wifiIpAddress">
                                                    IP Address
                                                </FieldLabel>
                                                <Input
                                                    id="wifiIpAddress"
                                                    name="wifi[ipAddress]"
                                                    defaultValue={
                                                        settings.wifi.ipAddress
                                                    }
                                                    placeholder="pisoprint.local"
                                                />
                                            </Field>

                                            <Field>
                                                <FieldLabel htmlFor="wifiDhcpRange">
                                                    DHCP Range
                                                </FieldLabel>
                                                <Input
                                                    id="wifiDhcpRange"
                                                    name="wifi[dhcpRange]"
                                                    defaultValue={
                                                        settings.wifi.dhcpRange
                                                    }
                                                    placeholder="192.168.4.100,192.168.4.200"
                                                />
                                            </Field>
                                        </div>
                                    </FieldGroup>

                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Warning</AlertTitle>
                                        <AlertDescription>
                                            Changes to WiFi settings require
                                            system restart and manual WiFi
                                            hotspot reconfiguration
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                            </Card>

                            {/* Save Button */}
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    size="lg"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Saving...' : 'Save Settings'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
