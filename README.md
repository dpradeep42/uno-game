# UNO Online — Real-time Multiplayer

A full-stack multiplayer UNO card game built with **React + TypeScript + Vite** (frontend) and **Node.js + Express + Socket.IO** (backend).

## Quick Start

### 1. Install dependencies

```bash
npm run install:all
```

This installs server dependencies at the root and client dependencies in `client/`.

### 2. Run in development

```bash
npm run dev
```

This starts both the server (port 3001) and the client dev server (port 5173) concurrently.

Open **http://localhost:5173** in your browser.

---

## Play with friends

### Same network (LAN)

Find your local IP:

```bash
# macOS / Linux
ipconfig getifaddr en0   # or: hostname -I

# Windows
ipconfig | findstr IPv4
```

Share `http://<your-ip>:5173` with friends on the same WiFi.

> **Note:** The Vite dev server binds to `localhost` by default. To expose it, edit `client/vite.config.ts` and add `host: true` to the `server` block.

### Over the internet (ngrok)

```bash
# Install ngrok once: https://ngrok.com/download
ngrok http 5173
```

Share the `https://xxxx.ngrok.io` URL — works from any device, anywhere.

---

## How to play

1. One player clicks **Create Game** → shares the 6-character room code
2. Other players click **Join Game** and enter the code
3. Host clicks **Start Game** (requires 2+ players)
4. Take turns playing cards — green glow means a card is playable
5. Click the draw pile to draw a card
6. Click **UNO!** when you have 2 cards and it's your turn (before playing down to 1)
7. First player to empty their hand wins!

### Rules enforced

- Match card by colour or value
- Wild cards are always playable (unless a draw is stacking)
- Draw stacking: +2 must be countered by +2, Wild +4 by Wild +4
- Reverse acts as Skip in 2-player games
- Drawing a playable card lets you optionally play it immediately

---

## Project structure

```
uno/
├── server/
│   ├── index.ts          # Express + Socket.IO server + event handlers
│   ├── gameEngine.ts     # Pure game logic (deck, rules, state machine)
│   └── roomManager.ts    # Room lifecycle and per-socket state views
├── client/
│   └── src/
│       ├── App.tsx
│       ├── socket.ts
│       ├── pages/
│       │   ├── Lobby.tsx
│       │   └── Game.tsx
│       ├── components/
│       │   ├── Card.tsx
│       │   ├── OpponentPanel.tsx
│       │   ├── HandArea.tsx
│       │   ├── DiscardPile.tsx
│       │   └── ColorPicker.tsx
│       └── utils/
│           └── canPlay.ts
├── shared/
│   └── types.ts          # TypeScript interfaces shared by client + server
└── package.json
```
