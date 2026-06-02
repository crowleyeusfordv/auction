import { Badge } from "@mantine/core";
import type { BadgeProps } from "@mantine/core";
import type { PropsWithChildren } from "react";

export default function ProductCardBadge({ children, color, style, ...others }: PropsWithChildren<BadgeProps>) {
    return (
        <Badge
            color={color}
            variant="filled"
            pos="absolute"
            top={10}
            right={10}
            style={{ zIndex: 20, ...style }}
            {...others}
        >
            {children}
        </Badge>
    );
}
