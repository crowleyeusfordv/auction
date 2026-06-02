import { Badge, Flex, Text } from "@mantine/core";
import { IoPersonSharp } from "react-icons/io5";
import { useLiveRoomStore } from "../store/liveRoomStore";
import { useCurrentAuctionId } from "../store/LiveRoomContext";

export function ViewerCount() {
  const auctionId = useCurrentAuctionId();
  const count = useLiveRoomStore(s => s.rooms[auctionId]?.viewerCount || 0);

  return (
    <Badge size="xl" className="shadow-md" radius="sm">
      <Flex gap={4} align="center">
        <IoPersonSharp /> <Text>{count}</Text>
      </Flex>
    </Badge>
  );
}
