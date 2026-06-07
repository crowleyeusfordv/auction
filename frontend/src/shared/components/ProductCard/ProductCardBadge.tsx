import { Badge } from "@mantine/core";
import type { BadgeProps } from "@mantine/core";
import type { PropsWithChildren } from "react";

export default function ProductCardBadge({ children, color, ...others }: PropsWithChildren<BadgeProps>) {
    return (
        <Badge
            color={color}
            variant="filled"
            {...others}
        >
            {children}
        </Badge>
    );
}

