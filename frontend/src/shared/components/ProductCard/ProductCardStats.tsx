import { Flex } from "@mantine/core";
import type { FlexProps } from "@mantine/core";
import type { PropsWithChildren } from "react";

export default function ProductCardStats({ children, ...others }: PropsWithChildren<FlexProps>) {
    return <Flex mt="sm" gap={20} {...others}>{children}</Flex>;
}
