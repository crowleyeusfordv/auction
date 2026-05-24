# 原理讲解及用法(Principle and Usage)
`smoke_test.py'用于验证Python 后端项目能否成功连接 PostgreSQL，并通过 SQLAlchemy model 正常写入、提交、查询数据。如需清理演示数据到空表状态，运行：
```
docker exec -it pg psql -U postgres -d auction_db -c "DELETE FROM bids;"
docker exec -it pg psql -U postgres -d auction_db -c "DELETE FROM auctions;"
docker exec -it pg psql -U postgres -d auction_db -c "DELETE FROM users;"
```

## 架构原理图
```
             用户 / 前端
                 |
                 v
              FastAPI
                 |
                 v
            SQLAlchemy
                 |
                 v
             PostgreSQL
                 ^
                 |
              Alembic
            管理表结构变化
```

各部分作用
| 工具 | 作用 |
| :--- | :--- |
| **FastAPI** | 建 API，接收请求，返回响应 |
| **PostgreSQL** | 保存数据 |
| **SQLAlchemy** | 用 Python 操作 PostgreSQL |
| **Alembic** | 管理数据库结构变化 |
| **migration 文件** | 记录一次具体的数据库结构修改 |

FastAPI接口：
```
POST /users          创建用户/Create user
GET /users/{id}      查询用户/Get user by ID
POST /auctions       创建拍卖/Create auction
GET /auctions        查询拍卖列表/Get auction list
POST /bids           提交出价/Submit bid
GET /auctions/{id}/bids 查询某个拍卖的出价/Get bids for a specific auction
```

## Alembic 迁移管理
在集成 Alembic 之前，我们已经证明了后端可以使用 SQLAlchemy 成功连接 PostgreSQL，并且可以围绕用户、拍卖、出价这三个核心业务实体完成真实的数据写入、关联和查询。但是之后修改数据必须通过 Alembic 来管理，不能直接修改数据库结构，否则会导致迁移文件无法正确生成。

### 本地数据库启动
本项目推荐每个开发者在自己电脑上运行独立的 PostgreSQL，不要连接其他人的 Docker 数据库。
项目根目录已经提供 `docker-compose.yml`，默认使用本机 `5432` 端口。
启动数据库：
```bash
docker compose up -d
```
修改代码后创建migration文件：
``` 
alembic revision --autogenerate -m "描述本次修改的内容"
```
**注意：自动生成后一定要检查 migration 文件。**
确认没问题后执行：
```
alembic upgrade head
```
然后Git提交代码

其他人拉取代码后执行
```
alembic upgrade head
```
## Git

每次开发前都在`main`分支拉取最新代码

确认当前分支是`main`，且没有未提交的更改
```
git checkout main
git pull origin main
```

自己根据jira任务创建分支，命名规范为`feature/xxx`，其中`xxx`是任务的简短描述
```
git checkout -b feature/KAN-xxx
```
开发完成后，提交代码并推送到远程分支
```
git add .
git commit -m "KAN-xxx: 描述本次提交的内容"
git push origin feature/KAN-xxx
```

在GitHub上创建Pull Request，选择将`feature/KAN-xxx`分支合并到`develop`分支，填写PR描述，等待代码审查和合并。
