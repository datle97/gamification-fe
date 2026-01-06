# Gamification Admin FE - Implementation Plan

## Overview
Xây dựng standalone admin dashboard để tạo và config các game trong hệ thống gamification.

### Tech Stack (react-vibe-stack)
| Category | Technology |
|----------|------------|
| Framework | React 19 + Vite + TypeScript |
| Styling | TailwindCSS v4 + shadcn/ui (Claude theme) |
| Animation | Motion (Framer Motion) |
| Icons | Lucide React |
| Data Fetching | TanStack Query v5 + Ky |
| Forms | React Hook Form + Zod |
| State | Zustand |
| Routing | React Router v7 |
| Linting | ESLint |

## Scope
- **Project**: Standalone admin app (tạo mới)
- **Phase 1 Priority**: Game & AppGame CRUD
- **UI Approach**: Full visual builder (không cần JSON knowledge)
- **Analytics**: Không cần trong scope này
- **Auth**: Không cần (internal tool, access control ở tầng network)
- **Backend API**: Missions/Rewards CRUD sẽ làm song song với FE

---

## Data Model Summary (từ Backend)

### Core Entities
```
App (1) ──── (M) AppGame (M) ──── (1) Game
                    │
                    ├─── (M) Mission
                    └─── (M) Reward
```

### 1. Game (Template)
- `gameId` (UUID, auto)
- `code` (unique identifier, e.g., "golden-horse")
- `name`, `type`, `description`
- `templateUrl` (URL to render file)
- `metadata` (JSONB - shared config)

### 2. App
- `appId` (unique, e.g., "ggg-ma-dao")
- `portalId`, `name`, `description`
- `config`, `metadata` (JSONB)
- `isActive`

### 3. AppGame (Link App ↔ Game)
- Composite key: `(appId, gameId)`
- `status`: draft | active | paused | ended
- `startAt`, `endAt` (campaign dates)
- `timezone`
- `config`, `metadata` (JSONB - app-specific)

### 4. Mission
- `missionId`, `appId`, `gameId`
- `code`, `name`, `description`, `imageUrl`
- `triggerEvent` (e.g., user:login, bill:payment)
- `missionType`: SINGLE | COUNT | STREAK | CUMULATIVE
- `missionPeriod`: DAILY | WEEKLY_MON | WEEKLY_SUN | PROGRAM
- `targetValue`, `maxCompletions`
- `rewardType`: turns | score
- `rewardValue`, `rewardExpirationConfig`
- `conditions` (JSONB)
- `isActive`, `allowFeTrigger`
- `displayOrder`, `startDate`, `endDate`

### 5. Reward
- `rewardId`, `appId`, `gameId`
- `name`, `imageUrl`, `description`
- `rewardType` (category): voucher | collectable | coins | points | turn | physical | no_reward
- `handlerType`: API | SYSTEM | TURN | NO_REWARD | COLLECTION
- `config` (JSONB - handler-specific)
- `probability` (0-100%)
- `quota`, `quotaUsed`
- `fallbackRewardId` (chain)
- `conditions`, `shareConfig`, `expirationConfig` (JSONB)
- `isActive`, `displayOrder`, `metadata`

---

## Backend API Endpoints (Internal)

Base: `internal/gamification`

### Games
- `GET /games` - List all
- `GET /games/:id` - Get one
- `POST /games` - Create
- `PUT /games/:id` - Update
- `DELETE /games/:id` - Delete

### Apps
- `GET /apps` - List all
- `GET /apps/:id` - Get one
- `POST /apps` - Create
- `PUT /apps/:id` - Update
- `DELETE /apps/:id` - Delete

### AppGames (Links)
- `GET /links` - List all (filter by appId/gameId)
- `POST /links` - Create link
- `PUT /links/update` - Update link
- `POST /links/delete` - Delete link

### Missions (cần bổ sung - làm song song với FE)
- `GET /missions?appId=&gameId=` - List missions by app-game
- `GET /missions/:id` - Get one
- `POST /missions` - Create
- `PUT /missions/:id` - Update
- `DELETE /missions/:id` - Delete

### Rewards (cần bổ sung - làm song song với FE)
- `GET /rewards?appId=&gameId=` - List rewards by app-game
- `GET /rewards/:id` - Get one
- `POST /rewards` - Create
- `PUT /rewards/:id` - Update
- `DELETE /rewards/:id` - Delete

---

## Phase 1: Game & AppGame CRUD

### Pages Structure

```
/
├── /games                    # Game Templates List
│   ├── /games/new           # Create Game
│   └── /games/:id           # Edit Game
│
├── /apps                     # Apps List
│   ├── /apps/new            # Create App
│   └── /apps/:id            # Edit App
│
└── /app-games               # App-Game Links (Campaign Management)
    ├── /app-games/new       # Link Game to App
    └── /app-games/:appId/:gameId  # Edit Link (status, dates, config)
```

### Features

#### 1. Games Management
- **List View**: Table với columns (code, name, type, createdAt, actions)
- **Create/Edit Form**:
  - `code` (text, unique, lowercase-hyphen)
  - `name` (text)
  - `type` (select: spin, scratch, quiz, lottery, collection, gacha, other)
  - `description` (textarea)
  - `templateUrl` (text)
  - `metadata` (visual key-value editor)

#### 2. Apps Management
- **List View**: Table với columns (appId, name, portalId, isActive, actions)
- **Create/Edit Form**:
  - `appId` (text, unique)
  - `portalId` (number)
  - `name` (text)
  - `description` (textarea)
  - `isActive` (toggle)
  - `config` (visual key-value editor)
  - `metadata` (visual key-value editor)

#### 3. AppGame Links (Campaigns)
- **List View**: Table với columns (appId, gameId, status, startAt, endAt, actions)
- **Create Form**:
  - `appId` (select from existing apps)
  - `gameId` (select from existing games)
  - `status` (select: draft, active, paused, ended)
  - `startAt`, `endAt` (datetime picker)
  - `timezone` (select, default: Asia/Ho_Chi_Minh)
  - `config` (visual editor for leaderboard settings, etc.)
  - `metadata` (visual editor for FE display data)
- **Edit Form**: Same but appId/gameId readonly

---

## Phase 2: Mission Builder (Future)

### Mission Form Fields
- Basic info: code, name, description, imageUrl
- Trigger: triggerEvent (select + custom input)
- Type & Period: missionType, missionPeriod
- Completion: targetValue, maxCompletions
- Reward: rewardType (turns/score), rewardValue
- Expiration: visual expiration config builder
- Scheduling: startDate, endDate
- Flags: isActive, allowFeTrigger
- Display: displayOrder
- Conditions: visual condition builder (optional)

### Mission Condition Builder (Advanced)
```
Field: [input]
Operator: [eq | ne | gt | gte | lt | lte | in]
Value: [input or array]
```

---

## Phase 3: Reward Builder (Future)

### Reward Form Fields
- Basic info: name, imageUrl, description
- Category: rewardType (voucher, collectable, coins, etc.)
- Handler: handlerType (API, SYSTEM, TURN, NO_REWARD, COLLECTION)
- Probability: probability (0-100, decimal)
- Quota: quota (number or null for unlimited)
- Fallback: fallbackRewardId (select from existing rewards)
- Flags: isActive
- Display: displayOrder

### Handler Config Builders (based on handlerType)

#### API Config Builder
- Provider (text)
- PersistTo (select)
- API URL, Method, Headers, Data
- Response Mapping
- Retry settings

#### Turn Config Builder
- Amount (number)
- Expiration config

#### System Config Builder
- Extra metadata

#### No Reward Config
- Message (text)

### Condition Builder
- requiresRewards (multi-select existing rewards)
- timeWindow (date range, days of week, hours)
- uniqueness (maxPerUser)
- userSegment (include/exclude userIds, phones)

### Share Config Builder
- enabled (toggle)
- allowedTypes (multi-select: phone, public)
- preventIfOwns conditions
- uniqueness (maxPerUser)

### Expiration Config Builder
- mode (select: permanent, ttl, fixed, anchor)
- value, unit (for ttl/anchor)
- date (for fixed)

---

## UI Components Needed

### Common
- [ ] DataTable (sortable, filterable, pagination)
- [ ] Form components (Input, Select, Textarea, Toggle, DateTimePicker)
- [ ] Modal / Dialog
- [ ] Toast notifications
- [ ] Loading states
- [ ] Breadcrumb navigation

### Visual Builders
- [ ] KeyValueEditor (for metadata/config JSONB fields)
- [ ] ExpirationConfigBuilder
- [ ] ConditionBuilder (for mission/reward conditions)
- [ ] ShareConfigBuilder
- [ ] ApiConfigBuilder (for reward handler)

---

## Technical Decisions

> **Coding Patterns**: Xem `CLAUDE.md` cho coding guidelines và patterns chi tiết

---

## Implementation Order

### Phase 1 (Current Focus)
1. ~~Project setup (Vite + React 19 + TypeScript + TailwindCSS v4 + shadcn/ui)~~ ✅
2. API client setup
3. Layout (sidebar, header, main content)
4. Games CRUD (list, create, edit, delete)
5. Apps CRUD (list, create, edit, delete)
6. AppGames CRUD (list, create, edit, delete)
7. KeyValueEditor component

### Phase 2
8. Mission list view
9. Mission form (basic fields)
10. Mission condition builder
11. Expiration config builder

### Phase 3
12. Reward list view
13. Reward form (basic fields)
14. Handler config builders (API, Turn, System, NoReward)
15. Reward condition builder
16. Share config builder

---

## Backend Project Reference

### Project Path
```
/Users/datle/ghq/bitbucket.org/git-vn/at.zdx.api
```

### Gamification Module Structure
```
src/modules/gamification/
├── gamification.module.ts
├── gamification.controller.ts              # User-facing APIs
├── gamification-internal.controller.ts     # Admin APIs (internal/)
├── gamification-s2s.controller.ts          # Server-to-server APIs
├── gamification.service.ts                 # Main orchestration
│
├── apps/
│   ├── apps.service.ts
│   └── entities/
│       ├── app.entity.ts
│       └── app-game.entity.ts
│
├── games/
│   ├── games.service.ts
│   └── entities/
│       ├── game.entity.ts
│       └── game-session.entity.ts
│
├── missions/
│   ├── missions.service.ts
│   └── entities/
│       ├── mission.entity.ts
│       └── user-mission-progress.entity.ts
│
├── rewards/
│   ├── rewards.service.ts
│   ├── rewards.types.ts                    # RewardConfig, ShareConfig, Conditions types
│   └── entities/
│       ├── reward.entity.ts
│       ├── user-reward.entity.ts
│       └── reward-share.entity.ts
│
├── turns/
│   ├── turns.service.ts
│   └── entities/
│       └── user-turn.entity.ts
│
├── users/
│   ├── users.service.ts
│   └── entities/
│       └── user.entity.ts
│
├── leaderboards/
│   ├── leaderboards.service.ts
│   └── entities/
│       └── leaderboard-score.entity.ts
│
├── transactions/
│   └── entities/
│       └── transaction-log.entity.ts
│
├── engine/
│   └── engine.service.ts                   # Game play logic, reward selection
│
├── common/
│   └── enums/
│       └── gamification.enums.ts           # All enums (MissionType, HandlerType, etc.)
│
└── dto/
    ├── game-detail.dto.ts
    ├── mission.dto.ts
    ├── reward.dto.ts
    ├── play.dto.ts
    ├── can-play.dto.ts
    ├── leaderboard.dto.ts
    └── user-stats.dto.ts
```

### Key Files to Modify (for adding Missions/Rewards CRUD API)
1. `src/modules/gamification/gamification-internal.controller.ts` - Add endpoints
2. `src/modules/gamification/missions/missions.service.ts` - Add CRUD methods
3. `src/modules/gamification/rewards/rewards.service.ts` - Add CRUD methods

### Scripts
```
scripts/
└── init-ggg-ma-dao-game.ts                 # Example: 16 missions, 41 rewards
```

### Config
```
config/
├── development.yaml
├── production.yaml
└── test.yaml
```

---

## Notes

- Game script example: `scripts/init-ggg-ma-dao-game.ts` (16 missions, 41 rewards)
- Các game thông thường sẽ đơn giản hơn (ít missions/rewards, config đơn giản hơn)
- Full visual builder approach sẽ tốn thời gian hơn nhưng phù hợp cho non-technical admin
- Có thể bổ sung "Advanced Mode" (JSON editor) cho power users sau này
