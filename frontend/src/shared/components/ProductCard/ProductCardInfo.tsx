import { Box } from "@mantine/core";
import type { BoxProps } from "@mantine/core";
import type { PropsWithChildren } from "react";

export default function ProductCardInfo({ children, ...others }: PropsWithChildren<BoxProps>) {
    return <Box style={{ flex: 1, overflow: 'hidden' }} {...others}>{children}</Box>;
}
