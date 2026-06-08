import { Image } from "@mantine/core";
import type { ImageProps } from "@mantine/core";
import { resolveMediaUrl } from "@/shared/config/urls";

export default function ProductCardImage({ src, w = 64, h = 64, radius = "md", fit = "cover", ...others }: ImageProps) {
    const resolvedSrc = typeof src === "string" ? resolveMediaUrl(src) : src;

    return <Image src={resolvedSrc || undefined} w={w} h={h} radius={radius} fit={fit} style={{ flexShrink: 0 }} {...others} />;
}
