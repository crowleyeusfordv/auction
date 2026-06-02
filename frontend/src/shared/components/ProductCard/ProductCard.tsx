import { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';
import { Paper, Flex } from '@mantine/core';
import ProductCardImage from './ProductCardImage';
import ProductCardInfo from './ProductCardInfo';
import ProductCardTitle from './ProductCardTitle';
import ProductCardStats from './ProductCardStats';
import ProductCardStat from './ProductCardStat';
import ProductCardBadge from './ProductCardBadge';
import ProductCardAction from './ProductCardAction';

import type { PaperProps } from '@mantine/core';

const ProductCardContext = createContext<{}>({});
export const useProductCard = () => useContext(ProductCardContext);

function Root({ children, ...others }: PropsWithChildren<PaperProps>) {
    return (
        <ProductCardContext.Provider value={{}}>
            <Paper bg="white" p="sm" radius="md" mb="md" pos="relative" shadow='sm' style={{ zIndex: 10 }} {...others}>
                <Flex gap="md" align="center">
                    {children}
                </Flex>
            </Paper>
        </ProductCardContext.Provider>
    );
}

Root.Image = ProductCardImage;
Root.Info = ProductCardInfo;
Root.Title = ProductCardTitle;
Root.Stats = ProductCardStats;
Root.Stat = ProductCardStat;
Root.Badge = ProductCardBadge;
Root.Action = ProductCardAction;

export default Root;
