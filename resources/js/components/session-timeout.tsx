import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
    onTimeout?: () => void;
    timeoutMinutes?: number;
    warningSeconds?: number;
}

export default function SessionTimeout({
    onTimeout,
    timeoutMinutes = 5,
    warningSeconds = 60,
}: Props) {
    const [timeRemaining, setTimeRemaining] = useState(timeoutMinutes * 60);

    // Reset timer on user activity
    useEffect(() => {
        const handleActivity = () => {
            setTimeRemaining(timeoutMinutes * 60);
        };

        // Listen for user interactions
        window.addEventListener('mousedown', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('touchstart', handleActivity);
        window.addEventListener('scroll', handleActivity);

        return () => {
            window.removeEventListener('mousedown', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
            window.removeEventListener('scroll', handleActivity);
        };
    }, [timeoutMinutes]);

    // Countdown timer
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onTimeout?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [onTimeout]);

    // Only show warning when time is running low
    if (timeRemaining > warningSeconds) {
        return null;
    }

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;

    return (
        <Alert
            variant={timeRemaining < 30 ? 'destructive' : 'default'}
            className="fixed bottom-4 left-1/2 z-50 w-auto -translate-x-1/2 shadow-lg"
        >
            <Clock className="h-4 w-4" />
            <AlertTitle className="text-sm font-bold">
                Session Expiring Soon
            </AlertTitle>
            <AlertDescription className="text-xs">
                {minutes > 0 ? (
                    <>
                        {minutes}:{seconds.toString().padStart(2, '0')} minutes
                        remaining
                    </>
                ) : (
                    <>{seconds} seconds remaining</>
                )}
            </AlertDescription>
        </Alert>
    );
}
