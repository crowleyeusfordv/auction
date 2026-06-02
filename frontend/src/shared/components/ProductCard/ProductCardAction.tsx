import { Button } from "@mantine/core";
import type { ButtonProps } from "@mantine/core";
import type { PropsWithChildren } from "react";

export default function ProductCardAction({ children, ...others }: PropsWithChildren<ButtonProps & React.ComponentPropsWithoutRef<'button'>>) {
    return (
        <Button size="xs" radius="md" {...others}>
            {children}
        </Button>
    );
}
