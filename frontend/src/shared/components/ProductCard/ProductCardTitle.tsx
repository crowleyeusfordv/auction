import { Text } from "@mantine/core";
import type { TextProps } from "@mantine/core";
import type { PropsWithChildren } from "react";

export default function ProductCardTitle({ children, ...others }: PropsWithChildren<TextProps>) {
    return <Text fw={600} size="sm" truncate {...others}>{children}</Text>;
}
