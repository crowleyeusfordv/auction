如需清理演示数据到空表状态，运行：
```
docker exec -it pg psql -U postgres -d auction_db -c "DELETE FROM bids;"
docker exec -it pg psql -U postgres -d auction_db -c "DELETE FROM auctions;"
docker exec -it pg psql -U postgres -d auction_db -c "DELETE FROM users;"
```
运行脚本
```
python -m scripts.create_tables
```