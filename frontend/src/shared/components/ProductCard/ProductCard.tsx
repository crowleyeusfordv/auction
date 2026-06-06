import type { PropsWithChildren } from 'react';
import { Paper, Flex } from '@mantine/core';
import type { PaperProps, FlexProps } from '@mantine/core';
import ProductCardImage from './ProductCardImage';
import ProductCardContent from './ProductCardContent';
import ProductCardTitle from './ProductCardTitle';
import ProductCardStats from './ProductCardStats';
import ProductCardStat from './ProductCardStat';
import ProductCardBadge from './ProductCardBadge';

interface ProductCardRootProps extends PaperProps {
    /** Props passed to inner Flex container */
    flexProps?: FlexProps;
}

function Root({ children, flexProps, ...others }: PropsWithChildren<ProductCardRootProps>) {
    return (
        <Paper bg="white" p="sm" radius="md" mb="md" shadow="sm" {...others}>
            <Flex gap="md" align="center" {...flexProps}>
                {children}
            </Flex>
        </Paper>
    );
}

Root.Image = ProductCardImage;
Root.Content = ProductCardContent;
Root.Title = ProductCardTitle;
Root.Stats = ProductCardStats;
Root.Stat = ProductCardStat;
Root.Badge = ProductCardBadge;

export default Root;
