# Requirements Analysis Document: Real-Time Auction System
## 0. Desafio de IA Full-Stack do E-commerce Douyin - DEMO de Apresentação de Resultados

1. **Nome do Projeto**: Mantenha consistente com a página de envio final; o nome deve ser de fácil e rápida identificação pela banca avaliadora.
2. **Nome da Equipe e Lista de Membros**: Liste o nome de cada membro, instituição/escola, especialização/curso e função no projeto.
3. **Descrição da Divisão de Trabalho (Se realizado em equipe)**: Escreva claramente os módulos pelos quais cada membro é responsável, tais como: Front-end, Back-end, Modelo, Dados, Implantação (Deployment), Design de Produto, etc.
4. **Lista de Funcionalidades Principais**: Sugere-se de 3 a 6 itens, divididos de acordo com a jornada do usuário ou as capacidades do sistema.
5. **Fluxo de Uso Ponta a Ponta (End-to-End)**: Use de 5 a 8 frases para descrever de forma clara o fluxo completo, desde a entrada do usuário no sistema até a obtenção dos resultados.
6. **Link da Demo Online**: Deve-se priorizar o fornecimento de links de acesso direto; caso seja necessário login, favor fornecer uma conta de teste ou substituir por uma gravação de tela.
7. **Link do Vídeo de Demonstração**: Sugere-se a duração de 3 minutos (pode ser acelerado), demonstrando os cenários principais, funcionalidades essenciais, destaques e resultados; links de vídeos públicos são preferíveis.
8. **Link do Repositório de Código-Fonte**: GitHub / GitLab são aceitos; sugere-se fornecer o link do repositório principal, descrição das ramificações (branches) e o histórico do último envio (commit).
9. **README / Instruções de Execução**: Deve conter, no mínimo: introdução do projeto, ambiente de dependências, etapas de inicialização, estrutura de diretórios e instruções de configuração.
10. **Diagrama de Arquitetura do Sistema**: Sugere-se demonstrar o Front-end, Back-end, Camada de Modelo, Camada de Dados, Serviços Externos e as relações de chamada (invocação).
11. **Descrição do Uso de Grandes Modelos / Recursos de IA**: Escreva claramente quais modelos, APIs, Agents, RAG, Bancos de Dados Vetoriais / Estratégias de Prompt foram utilizados, bem como a localização deles dentro do sistema.
12. **Dificuldades de Engenharia Críticas e Soluções**: Escreva de 2 a 3 pontos no mínimo, tais como: concorrência, latência, limpeza de dados, gerenciamento de contexto, integração Front-end/Back-end, problemas de implantação, etc.
13. **Destaques do Projeto / Pontos de Inovação**: Sugere-se até 3 itens, destacando a diferenciação em comparação com soluções similares.
14. **Materiais Adicionais (Preenchimento Opcional)**:
    a. **Métricas de Desempenho / Resultados de Teste de Carga**: Tais como latência de resposta, QPS, custo, taxa de sucesso de chamada de modelo, taxa de recall, etc.
    b. **Estratégia de Prompt / Fluxograma do Agent**: Sugere-se complementar com templates de Prompt fundamentais, descrição do fluxo de trabalho e mecanismos de contingência em caso de falhas (fallback).
    c. **Esquema de Avaliação e Resultados de Amostragem**: Pode-se fornecer amostras de entrada, amostras de saída, avaliação humana ou métodos de avaliação automatizada.
    d. **Feedback dos Usuários / Registro de Testes Internos**: Caso já existam feedbacks de colegas, professores ou usuários de teste, as principais conclusões podem ser extraídas.
## 1. System Overview
The system is a dual-channel real-time auction platform (REST + WebSocket), composed of an Admin Panel (Web/PC) for the shopkeeper to manage products and rules, and a user interface (Mobile H5) for participating in live auction rooms. The core flow demands extremely high data consistency (preventing duplicate bids) and minimal latency.

## 2. Functional Requirements (FR)

### 2.1. Shopkeeper Module (Web Panel)
* **FR01:** The system must allow the shopkeeper to register a product with a name, image, and description.
* **FR02:** The system must allow configuration of auction rules at the time of creation:
    * Starting bid fixed at 0.
    * Bid increment value (e.g., R$ 10.00).
    * Base auction duration.
    * Buy-out price (ceiling price).
    * Activation and rules for automatic time extension (time trigger and additional seconds added, between 10s and 30s).
* **FR03:** The system must allow the shopkeeper to edit the rules of an auction *only* if it has not yet started.
* **FR04:** The system must allow the shopkeeper to cancel an auction at any time due to an "anomaly."
* **FR05:** The system must list all of the shopkeeper's auctions, displaying status (Not started, In progress, Completed, Cancelled), progress, and result.
* **FR06:** The system must automatically generate an order upon the successful closure of an auction and display it to the shopkeeper.

### 2.2. User Module (Mobile H5 – Live Room)
* **FR07:** The system must display a list of products available for auction.
* **FR08:** The system must display auction details in the room: video (mock/fixed player), description, rules, current bid, and participant count.
* **FR09:** The system must allow the user to place a bid. The bid value must *always* be calculated by the backend as `Current Bid + Fixed Increment`.
* **FR10:** The system must instantly notify all clients in the room when a new bid is accepted.
* **FR11:** The system must display and update the bid ranking in real time.
* **FR12:** The system must send critical individual or broadcast notifications ("You have been outbid," "Time extended," "Auction ended").
* **FR13:** The system must immediately end the auction if the buy-out price (ceiling) is reached by a bid.
* **FR14:** The system must present a results screen at the end of the auction and allow the winner to simulate the payment flow.
* **FR15:** The system must allow the user to view the history of auctions in which they participated.

## 3. Non-Functional Requirements (NFR)

* **NFR01 (Architecture):** The frontend will be built with React + TypeScript. The backend must use FastAPI.
* **NFR02 (Communication):** The system must use a hybrid architecture: REST API for standard transactional operations and asynchronous requests (via Ajax/Fetch), and WebSocket for the live room (bids, timer, ranking).
* **NFR03 (Persistence):** MySQL or PostgreSQL for permanent storage (users, orders, products, bid logs).
* **NFR04 (Performance/Cache):** Redis must be used mandatorily to handle high-frequency operations (current bid, countdown, dynamic ranking).
* **NFR05 (WS Stability):** WebSocket connections must implement *Heartbeat* and guarantee automatic reconnection in case of disconnection (client-side).
* **NFR06 (Isolation):** Each auction must operate on an isolated WebSocket channel/room. One room must not impact the traffic or processing of another.
* **NFR07 (Time Precision):** The timer must be calculated via *Server-Time* (backend) and synchronized with the frontend in milliseconds to avoid drift caused by slowness on the user's device.

## 4. User Stories & Scenarios (BDD)

### US01: Placing a Bid in the Auction
**As** a live participant, **I want** to click the bid button **in order to** attempt to win the product.

* **Scenario: Valid Bid (Happy Path)**
  * **Given that** the auction is in progress and active on screen
  * **When** I confirm a bid
  * **Then** the current auction value must be updated by adding the fixed increment
  * **And** my position in the participant ranking must rise to 1st place
  * **And** all users in the room must see the new bid and the updated timer almost instantly

* **Scenario: Bid attempt after auction has ended (Bad Path)**
  * **Given that** the auction timer has run out
  * **When** I try to place a bid
  * **Then** the system must reject my action
  * **And** I must receive a visual warning indicating "Auction already ended"

* **Scenario: Bid attempt after cancellation (Bad Path)**
  * **Given that** the presenter/shopkeeper cancelled the auction due to an anomaly
  * **When** I try to place a bid
  * **Then** the system must reject the action
  * **And** I must be notified that the auction has been suspended

* **Scenario: Exact simultaneous bids (Edge Case)**
  * **Given that** I and another user click the bid button at the exact same instant
  * **When** the system receives both actions simultaneously
  * **Then** only the first bid recognized by the system must be recorded for that specific value
  * **And** the other user must be notified that there was an error placing the bid and should try again

* **Scenario: Click spamming on the button (Edge Case)**
  * **Given that** I click the bid button repeatedly and frantically in a very short interval
  * **When** the system processes my actions
  * **Then** it must accept and process all clicks and increments

---

### US02: Automatic Time Extension
**As** the system, **I want** to extend the auction's closing time when a bid is placed in the last few seconds **in order to** give other participants a fair chance to respond and prevent wins based solely on connection speed (sniper bidding).

* **Scenario: Standard time extension (Happy Path)**
  * **Given that** the auction countdown shows only a few seconds remaining (within the configured extension window)
  * **When** a new valid bid is accepted by the system
  * **Then** the timer must be increased by the extra time defined by the shopkeeper (e.g., +10 seconds)
  * **And** all users in the room must be notified that the time has been extended

* **Scenario: Bid processed at the edge of closing (Edge Case)**
  * **Given that** the visual countdown has reached zero for some users due to internet latency
  * **When** a valid bid is validated by the system in the last millisecond before the official closing
  * **Then** the system must not declare the auction as ended
  * **And** the time must be extended normally, visually reopening the dispute for all users in the room

---

### US03: Buy-out Price (Ceiling)
**As** a shopkeeper, **I want** to set a maximum price (ceiling) in the auction **in order to** sell the product immediately, ensuring my expected profit if a participant decides to cover that maximum value.

* **Scenario: Bid reaches the ceiling value exactly (Happy Path)**
  * **Given that** the auction has a defined ceiling price (e.g., R$ 100)
  * **And** the current bid plus the increment results in exactly R$ 100
  * **When** a user places that bid
  * **Then** the system must accept the bid
  * **And** immediately end the auction, blocking new participations
  * **And** declare this user as the official winner

* **Scenario: Calculated bid would exceed the ceiling value (Edge Case)**
  * **Given that** the auction has a defined ceiling price (e.g., R$ 100)
  * **And** the current bid (e.g., R$ 95) plus the fixed increment (e.g., R$ 10) would result in a value above the ceiling (R$ 105)
  * **When** the user attempts to place that bid
  * **Then** the system must adjust and cap the bid value to close at exactly R$ 100
  * **And** immediately end the auction
  * **And** the user wins the product paying only the ceiling value, never above it

## 5. Global Acceptance Criteria (Definition of Done)

1. **Closed End-to-End Cycle:** It is possible to create, configure, start, participate (bids via WS), view the winner, simulate checkout, and generate an order without interruptions or manual page refreshes.
2. **Strict Mathematical Consistency:** No race condition allows two bids to be recorded with the same monetary value for the same auction.
3. **Connection Resilience:** Client internet drops trigger the *heartbeat* and reconnect, perfectly syncing room state upon return.
4. **Rendering Performance:** The massive flow of events via WebSocket does not cause bottlenecks on the browser's main thread.
5. **Code Quality:** Business logic kept purely in the backend. Well-defined cache patterns (Redis for fast reads, Relational Database for order/history persistence).

---

## 6. Selected Differentiator (To be discussed later if time permits)

> **Note (Backend):** Choose only ONE track to pursue to technical exhaustion, aiming to achieve the extra evaluation criteria.

* **[  ] Backend-Heavy (High Concurrency):** Layered caching, perfect distributed locks, and guaranteed support for 1,000+ simultaneous isolated requests.
* **[  ] Frontend-Heavy (Immersive Experience):** Micro-interactions, animated ranking swaps, haptic/audio feedback for being outbid.
* **[  ] GenAI-Heavy (Traceable AI):** Core coding (State Machine/Locks) guided and reviewed through documented Prompt Engineering.

这是一份关于**实时竞拍系统**的需求分析文档的中文翻译，保留了原始文档的专业结构、术语和排版格式：

---

# 需求分析文档：实时竞拍系统

## ‼️成果演示 DEMO

### 1. 课题名称
* **要求：** 保持与最终提交页一致；名称应可被评委快速识别。

### 2. 团队名称与成员名单
* **要求：** 列出成员姓名、学校、专业、角色。

### 3. 分工说明（如小队完成）
* **要求：** 写清每位成员负责的模块，如前端、后端、模型、数据、部署、产品设计等。

### 4. 核心功能清单
* **要求：** 建议 3-6 条，按用户路径或系统能力拆分。

### 5. 端到端使用流程
* **要求：** 用 5-8 句写清用户从进入系统到拿到结果的完整流程。

### 6. 在线 Demo 链接
* **要求：** 应尽量提供可直接访问链接；若需登录，请提供体验账号或录屏替代。

### 7. 演示视频链接
* **要求：** 建议 3 分钟（可加速），展示核心场景、关键功能、亮点与结果；优先公开视频链接。

### 8. 源代码仓库链接
* **要求：** GitHub / GitLab 均可；建议提供主仓库链接、分支说明与最后提交记录。

### 9. README / 运行说明
* **要求：** 至少包含项目简介、依赖环境、启动步骤、目录结构、配置说明。

### 10. 系统架构图
* **要求：** 建议展示前端、后端、模型层、数据层、外部服务与调用关系。

### 11. 大模型 / AI 能力使用说明
* **要求：** 写清使用了哪些模型、API、Agent、RAG、向量库、Prompt 方案，以及在系统中的位置。

### 12. 关键工程难点与解决方案
* **要求：** 至少写 2-3 个，如并发、延迟、数据清洗、上下文管理、前后端联调、部署问题等。

### 13. 项目亮点 / 创新点
* **要求：** 建议 3 条以内，突出与同类方案相比的差异化。

---

## 其余材料（可选择性填写）

* **a. 性能指标 / 压测结果：** 如响应时延、QPS、成本、模型调用成功率、召回率等。
* **b. Prompt 策略 / Agent 流程图：** 建议补充关键 Prompt 模板、工作流说明、失败兜底机制。
* **c. 评测方案与样例结果：** 可给出输入样例、输出样例、人工评估或自动评估方法。
* **d. 用户反馈 / 内测记录：** 若已有同学、老师、用户试用反馈，可摘录关键结论。
## 1. 系统概述

本系统是一个双通道实时竞拍平台（REST + WebSocket），由供商家管理商品和规则的**管理后台（PC Web端）**，以及供用户参与直播竞拍房间的**用户界面（移动端 H5）**组成。其核心业务流程对**数据高一致性**（防止重复出价）和**极低延迟**有着极高的要求。

## 2. 功能需求 (FR)

### 2.1. 商家模块 (Web 管理后台)

* **FR01：** 系统必须允许商家通过填写名称、图片和描述来注册/上架商品。
* **FR02：** 系统必须允许在创建竞拍时配置竞拍规则：
* 起拍价固定为 0。
* 加价幅度（例如：R$ 10.00）。
* 竞拍基础基础时长。
* 一口价（封顶价）。
* 自动延时功能的启用及其规则（触发延时的剩余时间以及单次延时的秒数，介于 10s 到 30s 之间）。


* **FR03：** 系统必须允许商家修改竞拍规则，但**仅限**在竞拍尚未开始前。
* **FR04：** 商家可在任何时候因出现“异常情况”而取消竞拍。
* **FR05：** 系统必须列出该商家的所有竞拍活动，并显示其状态（未开始、进行中、已结束、已取消）、进度和结果。
* **FR06：** 竞拍成功结束后，系统必须自动生成订单并展示给商家。

### 2.2. 用户模块 (移动端 H5 – 直播房间)

* **FR07：** 系统必须展示可供竞拍的商品列表。
* **FR08：** 系统必须在房间内展示竞拍详情：视频直播（Mock模拟/固定播放器）、描述、规则、当前出价和参与人数。
* **FR09：** 系统必须允许用户进行出价。出价金额必须**完全由后端计算**，公式为：`当前出价 + 固定加价幅度`。
* **FR10：** 当新出价被接受时，系统必须立即通知房间内的所有客户端。
* **FR11：** 系统必须实时显示并更新出价排行榜。
* **FR12：** 系统必须发送关键的个人或广播通知（如：“您的出价已被超越”、“竞拍时间已延长”、“竞拍已结束”）。
* **FR13：** 如果出价达到了封顶价（一口价），系统必须立即结束该场竞拍。
* **FR14：** 竞拍结束时，系统必须展示结果页面，并允许中拍者模拟整个支付流程。
* **FR15：** 系统必须允许用户查看自己参与过的历史竞拍记录。

## 3. 非功能需求 (NFR)

* **NFR01 (架构)：** 前端必须使用 React + TypeScript 构建；后端必须使用 FastAPI。
* **NFR02 (通信)：** 系统必须采用混合架构：标准事务操作和异步请求（通过 Ajax/Fetch）使用 REST API；直播间交互（出价、倒计时、排行榜）使用 WebSocket。
* **NFR03 (持久化)：** 使用 MySQL 或 PostgreSQL 进行持久化存储（用户、订单、商品、出价日志）。
* **NFR04 (性能/缓存)：** **必须**使用 Redis 来处理高频操作（当前出价、倒计时、动态排行榜）。
* **NFR05 (WS 稳定性)：** WebSocket 连接必须实现**心跳机制（Heartbeat）**，并保证在断开连接时能够自动重连（客户端实现）。
* **NFR06 (隔离性)：** 每个竞拍活动必须在隔离的 WebSocket 频道/房间中运行。单个房间的流量和处理不能影响其他房间。
* **NFR07 (时间精度)：** 倒计时必须通过服务器时间（Server-Time，即后端时间）进行计算，并以毫秒级同步至前端，以避免由于用户设备卡顿而导致的时间漂移。

## 4. 用户故事与场景 (BDD)

### US01: 在竞拍中出价

**作为** 一名直播间参与者，**我希望** 点击出价按钮，**以便于** 尝试竞拍并赢得该商品。

* **场景：有效出价（正常流程 / Happy Path）**
* **假设 (Given)** 竞拍正在进行中，且屏幕显示为活跃状态
* **当 (When)** 我确认出价
* **那么 (Then)** 当前竞拍金额必须加上固定的加价幅度进行更新
* **并且 (And)** 我在参与者排行榜中的位置必须升至第 1 名
* **并且 (And)** 房间内的所有用户必须几乎实时看到新的出价和更新后的倒计时


* **场景：竞拍结束后尝试出价（异常流程 / Bad Path）**
* **假设 (Given)** 竞拍倒计时已经结束
* **当 (When)** 我尝试点击出价
* **那么 (Then)** 系统必须拒绝我的操作
* **并且 (And)** 我必须收到一个视觉提示，显示“竞拍已结束”


* **场景：竞拍取消后尝试出价（异常流程 / Bad Path）**
* **假设 (Given)** 主持人/商家因异常情况取消了该场竞拍
* **当 (When)** 我尝试点击出价
* **那么 (Then)** 系统必须拒绝该操作
* **并且 (And)** 我必须收到竞拍已被中止的通知


* **场景：完全同时出价（边界情况 / Edge Case）**
* **假设 (Given)** 我和另一名用户在完全相同的瞬间点击了出价按钮
* **当 (When)** 系统同时收到这两次操作
* **那么 (Then)** 针对该特定出价金额，系统必须仅记录其最先识别到的那次出价
* **并且 (And)** 另一名用户必须收到出价失败的提示通知，并被引导重新尝试


* **场景：疯狂连续点击出价按钮（边界情况 / Edge Case）**
* **假设 (Given)** 我在极短的时间间隔内疯狂且重复地连击出价按钮
* **当 (When)** 系统处理我的这些操作时
* **那么 (Then)** 系统必须接受并处理所有的点击和金额递增



---

### US02: 自动延时功能

**作为** 系统，**我希望** 在倒计时最后几秒有新出价时延长竞拍的截标时间，**以便于** 给其他参与者提供公平的响应机会，防止单靠网速秒杀（狙击出价 / Sniper Bidding）。

* **场景：标准时间延长（正常流程 / Happy Path）**
* **假设 (Given)** 竞拍倒计时显示仅剩最后几秒（在商家配置的触发延时窗口内）
* **当 (When)** 系统接受了一个新的有效出价
* **那么 (Then)** 倒计时必须加上商家定义的额外秒数（例如：+10 秒）
* **并且 (And)** 房间内的所有用户必须收到时间已延长的通知


* **场景：在临界结束点处理的出价（边界情况 / Edge Case）**
* **假设 (Given)** 由于网络延迟，部分用户的屏幕倒计时已经显示为零
* **当 (When)** 在官方正式关闭前的最后一毫秒，系统验证并通过了一个有效出价
* **那么 (Then)** 系统绝不能宣布竞拍结束
* **并且 (And)** 时间必须正常延长，在视觉上为房间内的所有用户重新开启竞拍争夺



---

### US03: 一口价（封顶价）

**作为** 一名商家，**我希望** 为竞拍设置一个最高价格（封顶价），**以便于** 能够立即售出商品，确保在有参与者愿意支付该最高金额时锁定我的预期利润。

* **场景：出价刚好达到封顶价（正常流程 / Happy Path）**
* **假设 (Given)** 竞拍设定了封顶价（例如：R$ 100）
* **并且 (And)** 当前出价加上固定加价后的金额刚好是 R$ 100
* **当 (When)** 用户按下出价
* **那么 (Then)** 系统必须接受该出价
* **并且 (And)** 立即结束竞拍，阻止新的出价参与
* **并且 (And)** 宣布该用户为最终中拍者


* **场景：计算后的出价将超过封顶价（边界情况 / Edge Case）**
* **假设 (Given)** 竞拍设定了封顶价（例如：R$ 100）
* **并且 (And)** 当前出价（例如：R$ 95）加上固定加价（例如：R$ 10）后的金额会超过封顶价（变为 R$ 105）
* **当 (When)** 用户尝试点击出价
* **那么 (Then)** 系统必须自动调整并截断出价金额，使其刚好在 R$ 100 结标
* **并且 (And)** 立即结束竞拍
* **并且 (And)** 该用户赢得商品，且只需支付封顶价（R$ 100），绝不超过该上限



## 5. 全局验收标准 (Definition of Done)

1. **闭环端到端流程：** 用户能够无缝完成创建、配置、开始、参与（通过 WS 出价）、查看赢家、模拟结账并生成订单的完整生命周期，中途无需任何手动页面刷新。
2. **严格的数学一致性：** 绝不允许因并发竞争条件（Race Condition）导致在同一场竞拍中记录两个相同金额的出价。
3. **连接韧性/稳定性：** 客户端网络掉线会触发心跳机制并在恢复时自动重连，重连后能够完美同步房间的最新状态。
4. **渲染性能：** WebSocket 带来的海量高频事件流不会造成浏览器主线程的卡顿或性能瓶颈。
5. **代码质量：** 核心业务逻辑纯粹保留在后端。具备定义清晰的缓存模式（Redis 用于快速读取，关系型数据库用于订单/历史记录的持久化）。

---

## 6. 特色亮点选择（后续有时间再进行讨论）

> **注意（后端）：** 仅选择以下一个方向进行深度技术挖掘，以达到额外的评估标准。

* **[  ] 重后端（高并发）：** 多层缓存、完美的分布式锁，并确保支持 1,000+ 瞬间并发隔离请求。
* **[  ] 重前端（沉浸式体验）：** 微交互、排行榜丝滑动画切换、被超越时的触觉/声音反馈。
* **[  ] 重生成式AI（可追溯AI）：** 在有文档记录的提示词工程（Prompt Engineering）引导和审查下，完成核心代码（状态机/锁机制）的编写。
