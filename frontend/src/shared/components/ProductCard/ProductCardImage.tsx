import { Image } from "@mantine/core";
import type { ImageProps } from "@mantine/core";

export default function ProductCardImage({ src, w = 64, h = 64, radius = "md", fit = "cover", ...others }: ImageProps) {
    return <Image src={src} w={w} h={h} radius={radius} fit={fit} style={{ flexShrink: 0 }} {...others} />;
}
