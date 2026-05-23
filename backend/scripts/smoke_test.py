from decimal import Decimal
from datetime import datetime, timezone, timedelta

from app.db.session import SessionLocal
from app.models.user import User
from app.models.auction import Auction
from app.models.bid import Bid


def main():
    # 用上下文管理器，脚本结束自动关闭
    session = SessionLocal()
    try:
        # 1) 创建两个用户：卖家和买家
        seller = User(name="Alice", role="seller")
        buyer = User(name="Bob", role="buyer")
        session.add_all([seller, buyer])
        session.flush()  # 先拿到生成的 UUID

        # 2) 创建一个拍卖，指向卖家
        auction = Auction(
            seller_id=seller.id,
            product_name="Nintendo Switch",
            description="Like new, boxed",
            image_url=None,
            video_url=None,
            starting_bid=Decimal("100.00"),
            increment_value=Decimal("5.00"),
            buy_out_price=Decimal("300.00"),
            status="not_started",
            base_duration=60,  # 分钟
            scheduled_time_to_start=datetime.now(timezone.utc) + timedelta(minutes=5),
            is_extended_duration=False,
            trigger_seconds=None,
            seconds_extended=None,
        )
        session.add(auction)
        session.flush()

        # 3) 创建一个出价
        bid = Bid(
            auction_id=auction.id,
            buyer_id=buyer.id,
            amount=Decimal("105.00"),
        )
        session.add(bid)

        # 4) 提交写入事务
        session.commit()

        # 5) 查询并打印（SELECT 也会开启一个隐式事务，查询后再 commit 一下，日志会更干净）
        users_count = session.query(User).count()
        auctions_count = session.query(Auction).count()
        bids_count = session.query(Bid).count()
        session.commit()

        print(f"Seed done. users={users_count}, auctions={auctions_count}, bids={bids_count}")
        print(f"Seller id={seller.id}, Buyer id={buyer.id}, Auction id={auction.id}, Bid id={bid.id}")

    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()