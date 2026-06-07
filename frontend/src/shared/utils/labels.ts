export const auctionStatusLabels: Record<string, string> = {
  completed: '已结束',
  cancelled: '已取消',
  on_going: '进行中',
  not_started: '未开始',
  ended: '已结束',
  upcoming: '即将开始',
};

export function getAuctionStatusLabel(status: string) {
  return auctionStatusLabels[status] || status;
}
