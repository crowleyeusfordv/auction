# 直播竞拍平台

一个基于 React + FastAPI 的实时竞拍系统。项目包含买家移动端竞拍体验、卖家拍卖管理后台、WebSocket 实时出价、Redis 排行榜/倒计时状态、PostgreSQL 订单与历史数据持久化等功能。

## 项目功能

- 买家/卖家游客身份登录，无需预置账号即可体验。
- 卖家可创建、编辑、取消拍卖，并查看自己的拍卖和订单。
- 买家可浏览拍卖列表、进入直播竞拍房间、实时出价和查看排行榜。
- 房间内通过 WebSocket 同步当前价格、倒计时、排行榜、观看人数和拍卖结束状态。
- 支持一口价、自动延时、竞拍结束通知、出价被超越通知。
- 中拍用户可进入支付页完成模拟支付，支付成功后顶部提示并返回拍卖列表。
- 商品图片/视频支持上传，本地上传目录默认为 `backend/uploads`。

## 技术栈

### 前端

- React 19
- TypeScript
- Vite
- Mantine UI
- TanStack Query
- Zustand
- React Router
- Sonner
- WebSocket

### 后端

- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- Redis
- Uvicorn

## 目录结构

```text
.
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── api/             # REST API、WebSocket、上传接口
│   │   ├── core/            # Redis、Lua 出价脚本等核心能力
│   │   ├── db/              # 数据库连接
│   │   ├── models/          # SQLAlchemy 模型
│   │   ├── schemas/         # Pydantic 请求/响应模型
│   │   └── main.py          # FastAPI 应用入口
│   ├── alembic/             # 数据库迁移
│   ├── docker-compose.yml   # PostgreSQL 和 Redis
│   └── requirements.txt
├── frontend/                # React 前端
│   ├── src/
│   │   ├── features/        # 业务模块
│   │   ├── layouts/         # 页面布局
│   │   ├── pages/           # 页面
│   │   └── shared/          # 公共组件、配置、状态、API
│   └── package.json
└── README.md
```

## 环境要求

- Node.js 20+，建议使用当前 LTS 版本。
- Python 3.11+。
- Docker Desktop，用于启动 PostgreSQL 和 Redis。
- PowerShell、Git Bash 或其他终端。

## 本地启动

以下命令默认从项目根目录执行。

### 1. 启动数据库和 Redis

```powershell
cd backend
docker compose up -d
```

`backend/docker-compose.yml` 会启动：

- PostgreSQL：`localhost:5432`
- Redis：`localhost:6379`

### 2. 配置后端环境变量

在 `backend/.env` 中写入：

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/postgres
REDIS_URL=redis://localhost:6379/0
FRONTEND_URL=http://localhost:5173
PUBLIC_BASE_URL=http://localhost:8000
```

说明：

- `DATABASE_URL` 使用 `postgres` 数据库名，是为了匹配当前 `docker-compose.yml`。
- `REDIS_URL` 指向本地 Redis。
- `FRONTEND_URL` 用于后端 CORS。
- `PUBLIC_BASE_URL` 用于本地上传文件生成可访问地址。

### 3. 安装并启动后端

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端启动后可访问：

- API 根路径：`http://localhost:8000`
- Swagger 文档：`http://localhost:8000/docs`
- Redis 健康检查：`http://localhost:8000/health/redis`

### 4. 配置前端环境变量

在 `frontend/.env.local` 中写入：

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WEBSOCKET_API_BASE_URL=ws://localhost:8000
```

### 5. 安装并启动前端

打开新的终端：

```powershell
cd frontend
npm install
npm run dev
```

前端默认访问地址：

```text
http://localhost:5173
```

## 基本使用流程

1. 打开 `http://localhost:5173`。
2. 点击 `以卖家身份登录` 进入卖家后台。
3. 在卖家后台创建拍卖，填写商品名称、图片/视频、加价幅度、一口价、竞拍时长等信息。
4. 回到首页或另开一个浏览器窗口，点击 `以买家身份登录`。
5. 买家进入拍卖列表，选择拍卖并进入直播竞拍房间。
6. 买家点击出价，房间内价格、排行榜和倒计时会通过 WebSocket 实时更新。
7. 竞拍结束后，中拍用户会收到通知并进入支付页。
8. 点击 `确认支付` 后，页面顶部提示 `已支付成功`，随后返回拍卖列表。
9. 卖家可在后台订单页查看成交订单。

## 常用命令

### 后端

```powershell
cd backend

# 启动依赖服务
docker compose up -d

# 执行数据库迁移
alembic upgrade head

# 启动 API 服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 前端

```powershell
cd frontend

# 启动开发环境
npm run dev

# 生产构建
npm run build

# 本地预览构建产物
npm run preview
```

## 关键配置

### 后端环境变量

| 变量名 | 示例 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql+psycopg://postgres:postgres@localhost:5432/postgres` | PostgreSQL 连接地址 |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis 连接地址 |
| `FRONTEND_URL` | `http://localhost:5173` | 允许跨域访问的前端地址 |
| `PUBLIC_BASE_URL` | `http://localhost:8000` | 本地上传文件的公开访问地址 |
| `LOCAL_UPLOAD_DIR` | `uploads` | 本地上传目录，可选 |
| `SUPABASE_URL` | - | 使用 Supabase 上传时配置，可选 |
| `SUPABASE_KEY` | - | 使用 Supabase 上传时配置，可选 |

### 前端环境变量

| 变量名 | 示例 | 说明 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8000` | REST API 基础地址 |
| `VITE_WEBSOCKET_API_BASE_URL` | `ws://localhost:8000` | WebSocket 基础地址 |

## API 与页面入口

### 后端常用接口

- `POST /users/guest`：创建买家或卖家游客用户。
- `GET /auctions`：获取拍卖列表。
- `POST /auctions`：创建拍卖。
- `PUT /auctions/{auction_id}`：编辑未开始的拍卖。
- `PATCH /auctions/{auction_id}/status`：取消拍卖。
- `GET /auctions/{auction_id}/order`：获取拍卖订单。
- `POST /orders/{order_id}/pay`：模拟支付订单。
- `GET /sellers/{seller_id}/orders`：获取卖家订单。
- `WS /ws/auctions/{auction_id}`：直播竞拍房间 WebSocket。

### 前端主要页面

- `/`：身份选择页。
- `/auctions`：买家拍卖列表。
- `/auctions/:auction_id/live-room`：直播竞拍房间。
- `/auctions/:auctionId/payment`：支付页。
- `/buyer/bids`：买家参与记录。
- `/seller/auctions`：卖家拍卖管理。
- `/seller/orders`：卖家订单列表。

## 数据与实时性说明

- PostgreSQL 保存用户、拍卖、出价、通知、订单等持久数据。
- Redis 保存实时竞拍状态，包括当前价、排行榜、倒计时、活跃拍卖集合等。
- 出价通过 Redis Lua 脚本处理，保证当前价递增、排行榜更新和一口价判断的原子性。
- WebSocket 用于房间内实时广播新出价、倒计时延长、排行榜变化和拍卖结束。
- 后端定时任务会处理拍卖倒计时结束、预约拍卖自动开始和 WebSocket 心跳清理。

## 排查建议

- 前端无法请求接口：确认 `frontend/.env.local` 中的 `VITE_API_BASE_URL` 指向 `http://localhost:8000`。
- WebSocket 无法连接：确认 `VITE_WEBSOCKET_API_BASE_URL=ws://localhost:8000`，并且后端正在运行。
- 后端启动失败：确认 PostgreSQL 和 Redis 已通过 `docker compose up -d` 启动。
- 数据库连接失败：确认 `DATABASE_URL` 的数据库名与 `docker-compose.yml` 一致。
- 上传图片无法展示：确认 `PUBLIC_BASE_URL` 指向当前后端地址，且 `backend/uploads` 可写。

