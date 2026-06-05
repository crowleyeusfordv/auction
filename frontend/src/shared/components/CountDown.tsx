import { Text } from "@mantine/core";
import useCountDown from "../hooks/useCountDown";
import formatTime from "../utils/formatTime";

export default function CountDown({ endTime, isOpen }: { endTime: number, isOpen?: boolean }) {
    const seconds = useCountDown(endTime, isOpen ?? true);

    return <Text ta="center" fw={700} c="red.5" mb="md">{formatTime(seconds)}</Text>
}