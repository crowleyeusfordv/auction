import { Flex } from "@mantine/core";
import type { FlexProps } from "@mantine/core";
import type { PropsWithChildren } from "react";

export default function ProductCardContent({ children, direction = "column", gap = "xs", ...others }: PropsWithChildren<FlexProps>) {
    return <Flex direction={direction} gap={gap} style={{ flex: 1, overflow: 'hidden' }} {...others}>{children}</Flex>;
}
