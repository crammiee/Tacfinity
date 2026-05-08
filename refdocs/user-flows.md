# Tacfinity — UI Screens & User Flows

## Routes

| Route          | Page                           | Auth     |
| -------------- | ------------------------------ | -------- |
| `/`            | Home — Unauthorized            | No       |
| `/`            | Home — Authorized              | Yes      |
| `/login`       | Login                          | No       |
| `/register`    | Register                       | No       |
| `/play/online` | Game Room — Online Matchmaking | Yes      |
| `/play/bot`    | Game Room — vs Bot             | Optional |

> Play a Friend and User Profile screens are deferred to Phase 3. The leaderboard lives on the homepage, not a separate route.
>
> **Fixed game mode (Phase 2):** all games are 11×11 board, 5-in-a-row win condition. No settings UI. Room customization is deferred.

---

## Shared Layout — Sidebar

The sidebar is persistent across all pages. It has two states depending on auth.

### Unauthorized

```
┌─────────────┐
│   [Logo]    │  → /
├─────────────┤
│  Play       │
│  Watch      │
│  Community  │
│  Others...  │
│             │
│             │
│  [Search]   │
│  [Login]    │
│  [Sign Up]  │
└─────────────┘
```

### Authorized

```
┌─────────────┐
│   [Logo]    │  → /
├─────────────┤
│  Play       │
│  Watch      │
│  Community  │
│  Others...  │
│             │
│             │
│  [Username] │  → /profile/:id
└─────────────┘
```

---

## Screens

### Home — Unauthorized

**Layout:** Sidebar (unauthorized) + main content area

**Main content:**

```
┌──────────────────────────────────────────────┐
│                                              │
│    Play Tic Tac Toe Online on the #1 Site!  │
│                                              │
│    Join other players in this growing        │
│    community                                 │
│                                              │
│              [ Get Started ]                 │
│                                              │
└──────────────────────────────────────────────┘
```

**Below the hero — Leaderboard section:**

```
┌──────────────────────────────────────────────┐
│  Top Players                                 │
│                                              │
│  #1  playerA          2 341 ELO              │
│  #2  playerB          2 180 ELO              │
│  #3  playerC          2 054 ELO              │
│  ...                                         │
└──────────────────────────────────────────────┘
```

Visible to everyone. No row highlighted (no authenticated user).

**CTA actions:**

- "Get Started" → `/register`
- Sidebar "Login" → `/login`
- Sidebar "Sign Up" → `/register`

---

### Home — Authorized

**Layout:** Sidebar (authorized) + top bar + main content

**Top bar** (across the top of the body, not the sidebar):

```
┌──────────────────────────────────────────────┐
│  [Avatar]  username            ♟ 1 024 ELO   │
└──────────────────────────────────────────────┘
```

Username and avatar are clickable → `/profile/:id`

**Main content — Play section:**

```
┌──────────────────────────────────────────────┐
│                                              │
│         [ Play Online ]                      │
│         [ Play Bots   ]                      │
│                                              │
└──────────────────────────────────────────────┘
```

**Button actions:**

- "Play Online" → `/play/online`
- "Play Bots" → `/play/bot`

**Below the play section — Leaderboard section:**

```
┌──────────────────────────────────────────────┐
│  Top Players                                 │
│                                              │
│  #1  playerA          2 341 ELO              │
│  #2  playerB          2 180 ELO              │
│  ►#8  username        1 024 ELO  ← you       │
│  ...                                         │
└──────────────────────────────────────────────┘
```

Same leaderboard as the unauthorized view, but the authenticated user's row is highlighted with their current rank.

---

### Register

Standard form. No sidebar needed (or minimal sidebar with logo only).

**Fields:** Email, Username, Password, Confirm Password  
**Submit** → `/` (authorized home)

**Links:**

- "Already have an account? Log in" → `/login`

---

### Login

**Fields:** Email, Password  
**Submit** → `/` (authorized home)

**Links:**

- "Don't have an account? Sign up" → `/register`

---

### Game Room — Online (`/play/online`)

**Game mode:** 11×11 board, 5-in-a-row win condition. Fixed — no controls to change this in Phase 2.

**Layout:** Sidebar (authorized) + board area (center) + right panel

```
┌──────────┬─────────────────────────────┬───────────────────┐
│          │  [Opponent username] ♟1200  │                   │
│ Sidebar  │                             │   Right Panel     │
│          │   ┌─────────────────┐       │                   │
│          │   │                 │       │  [Start Game]     │
│          │   │   Game Board    │       │                   │
│          │   │                 │       │                   │
│          │   └─────────────────┘       │                   │
│          │                             │                   │
│          │  [My username] ♟1024        │                   │
└──────────┴─────────────────────────────┴───────────────────┘
```

**Right panel — state machine:**

| State (`matchStatus`) | Content                                                   |
| --------------------- | --------------------------------------------------------- |
| `idle`                | "Find Match" button                                       |
| `searching`           | `MatchmakingTimer` (elapsed MM:SS) + "Cancel" button      |
| `playing`             | `RightPanel` — player labels (active ring) + move history |
| `ended`               | `GameResultOverlay` (fixed overlay) — result + ELO delta  |

**Board header/footer:**

- Top of board: Opponent username + rating (populated after match found, placeholder "Searching..." during queue)
- Bottom of board: My username + my current rating (always shown)

---

### Game Room — Bot (`/play/bot`)

**Game mode:** same fixed 11×11 / 5-in-a-row. The only choice the player makes is AI difficulty.

Same layout as the online game room with one difference in the right panel.

```
┌──────────┬─────────────────────────────┬───────────────────┐
│          │  [Bot Name] ♟ ~600 ELO      │                   │
│ Sidebar  │                             │  Difficulty       │
│          │   ┌─────────────────┐       │  ○ Easy  ~500     │
│          │   │                 │       │  ○ Medium ~800     │
│          │   │   Game Board    │       │  ○ Hard  ~1200    │
│          │   │                 │       │                   │
│          │   └─────────────────┘       │  [Start Game]     │
│          │                             │                   │
│          │  [My username] ♟1024        │                   │
└──────────┴─────────────────────────────┴───────────────────┘
```

**Difficulty → bot identity:**

| Difficulty | Bot name  | Estimated ELO |
| ---------- | --------- | ------------- |
| Easy       | EasyBot   | ~500          |
| Medium     | MediumBot | ~800          |
| Hard       | HardBot   | ~1200         |

**Right panel — state machine:**

| State     | Content                                   |
| --------- | ----------------------------------------- |
| Pre-match | Difficulty selector + "Start Game" button |
| In-game   | (TBD — no matchmaking timer needed)       |

---

## User Flows

### Flow 1 — New visitor → Register

```
/ (Unauthorized Home)
  → "Get Started" or sidebar "Sign Up"
  → /register
      fill email, username, password, confirm password
  → / (Authorized Home)
```

---

### Flow 2 — Returning player → Login

```
/ (Unauthorized Home)
  → sidebar "Login"
  → /login
      fill email + password
  → / (Authorized Home)
```

---

### Flow 3 — Authorized home → Online matchmaking

```
/ (Authorized Home)
  → "Play Online"
  → /play/online
      board visible, opponent slot shows "Searching..."
      right panel: "Start Game" button
  → click "Find Match"
      matchStatus → searching
      MatchmakingTimer starts, "Cancel" button shown
      socket connects + emits queue:join
  → server emits queue:matched
      matchStatus → playing
      board initialised (121 nulls), players populated
      RightPanel shows player labels + move history
  → moves played via board clicks
      each click: socket game:move { gameId, row, col }
      server broadcasts game:update (tgnToken) to both
      board updates, move appended to history
  → server emits game:end
      matchStatus → ended
      GameResultOverlay appears with result + ELO delta
  → "Play Again" → re-enters queue (joinQueue)
```

**Cancel path:**

```
  → click "Cancel"
      socket.disconnect() → server removes from queue on disconnect
      matchStatus → idle, back to "Find Match" button
```

---

### Flow 4 — Authorized home → Play vs Bot

```
/ (Authorized Home)
  → "Play Bots"
  → /play/bot
      right panel: difficulty selector (Easy default) + "Start Game"
      top of board: bot name + estimated ELO shown immediately
  → select difficulty (updates bot name + ELO in top bar)
  → click "Start Game"
      game begins immediately (no matchmaking)
      AI moves computed client-side via shared AI engine
  → game ends (win/draw/loss)
  → Result screen (no rating change)
```

---

### Flow 4 — Profile navigation

```
From anywhere (authorized):
  → click username in top bar  OR  click username in sidebar bottom
  → /profile/:id
```

---

### Flow 5 — Offline detection

```
Browser goes offline
  → PWA service worker detects
  → "Play Online" button disabled + tooltip "You're offline"
  → "Play Bots" remains enabled (fully client-side)
  → banner shown: "You're offline — only bot play is available"
```

---

## Component Inventory

| Component           | Used on            | Notes                                      |
| ------------------- | ------------------ | ------------------------------------------ |
| `Sidebar`           | All pages          | Two states: auth / unauth                  |
| `TopBar`            | Authorized pages   | Username + rating                          |
| `HeroSection`       | Unauth home        | Headline + CTA                             |
| `PlayMenu`          | Auth home          | Play Online + Play Bots buttons            |
| `Leaderboard`       | Both home versions | Public; highlights own row when authorized |
| `GameBoard`         | Game rooms         | 11×11 CSS grid, 121 `Cell[]` buttons       |
| `PlayerLabel`       | Game rooms         | Name + rating + symbol badge + active ring |
| `RightPanel`        | Online game room   | Player labels + scrollable move history    |
| `DifficultyPicker`  | Bot game room      | Easy / Medium / Hard radio                 |
| `MatchmakingTimer`  | Online game room   | Elapsed time (`setInterval`) + cancel      |
| `GameResultOverlay` | Online game room   | Fixed overlay — result heading + ELO delta |

---

## State Ownership per Page

| Page               | TanStack Query (server)                          | Zustand / useState (client)                     |
| ------------------ | ------------------------------------------------ | ----------------------------------------------- |
| Unauth Home        | top players (leaderboard)                        | —                                               |
| Auth Home          | current user + rating, top players (leaderboard) | —                                               |
| Game Room (online) | —                                                | all in `useGameSocket` hook (useState + useRef) |
| Game Room (bot)    | —                                                | board state, difficulty, AI turn                |
