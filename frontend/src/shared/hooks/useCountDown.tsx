import { useEffect, useState } from "react";



export default function useCountDown(endTime: number, isShowingUp: boolean) {
    const [, setTick] = useState(0);

    useEffect(() => {
        if (isShowingUp) setTick(t => t + 1);
    }, [isShowingUp]);

    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const seconds = Math.max(0, Math.floor((endTime - Date.now()) / 1000));

    return seconds;
}