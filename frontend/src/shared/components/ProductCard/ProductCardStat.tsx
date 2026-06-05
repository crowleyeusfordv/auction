import { Box, Text } from "@mantine/core";

interface ProductCardStatProps {
    label: string;
    value: React.ReactNode;
}

export default function ProductCardStat({ label, value }: ProductCardStatProps) {
    return (
        <Box>
            <Text fz={10} c="gray.5">{label}</Text>
            <Text fw={700} size="sm">{value}</Text>
        </Box>
    );
}
