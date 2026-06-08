import { Card, Grid, Image, Group, Title, Box, Text } from "@mantine/core";
import type { Order } from "../types/auction";



export default function OrderCard({id, productImage, productName, winnerName, dateSold, price}: Order) {
    return (
        <Card key={id} shadow="sm" padding="lg" radius="md" withBorder>
            <Grid>
                <Grid.Col span={2}>
                    <Image
                        src={productImage || 'https://placehold.co/200x200?text=%E6%97%A0%E5%9B%BE%E7%89%87'}
                        height={100}
                        alt={productName}
                        radius="md"
                        fallbackSrc="https://placehold.co/200x200?text=%E6%97%A0%E5%9B%BE%E7%89%87"
                    />
                </Grid.Col>
                <Grid.Col span={10}>
                    <Group justify="space-between" align="center" h="100%">
                        <Box>
                            <Title order={4}>{productName}</Title>
                            <Text size="sm" c="dimmed">获胜者：{winnerName}</Text>
                            <Text size="sm" c="dimmed">成交日期：{new Date(dateSold).toLocaleDateString()}</Text>
                            <Text size="xs" c="dimmed">订单编号：{id}</Text>
                        </Box>
                        <Title order={3} c="blue">¥{price}</Title>
                    </Group>
                </Grid.Col>
            </Grid>
        </Card>
    )
}
