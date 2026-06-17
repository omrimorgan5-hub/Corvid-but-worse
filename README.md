# Corvid but worse

A Discord moderation bot using the `!` prefix. Built with Node.js, TypeScript, and discord.js.

## Commands

| Command | Usage | Description |
|---|---|---|
| `!ban` | `!ban @user [reason]` | Permanently bans a member from the server |
| `!unban` | `!unban <userID> [reason]` | Unbans a previously banned user by their ID |
| `!kick` | `!kick @user [reason]` | Kicks a member from the server |
| `!mute` | `!mute @user <minutes> [reason]` | Times out a member for the given number of minutes (max 40320 = 28 days) |
| `!unmute` | `!unmute @user` | Removes an active timeout from a member |

### Notes

- All commands require the invoking user to have the relevant Discord permission (Ban Members, Kick Members, or Moderate Members).
- The bot must also have those same permissions and its role must be **above** the target member's highest role.
- `!unban` requires the target's **user ID** (not a mention) since banned users are no longer in the server. Find IDs under Server Settings → Bans.
- `!mute` uses Discord's built-in **Timeout** feature — no Muted role required.

## Setup

### Prerequisites

- Node.js 24+
- pnpm
- A Discord bot token ([Discord Developer Portal](https://discord.com/developers/applications))

### Installation

```bash
pnpm install
```

### Environment variables

| Variable | Description |
|---|---|
| `DISCORD_BOT_TOKEN` | Your Discord bot token |
| `PORT` | Port for the API server (set automatically by Replit) |
| `DATABASE_URL` | PostgreSQL connection string |

### Running locally

```bash
pnpm --filter @workspace/api-server run dev
```

### Discord bot permissions

When adding the bot to your server, make sure it has these permissions:

- **Ban Members** — for `!ban` and `!unban`
- **Kick Members** — for `!kick`
- **Moderate Members** — for `!mute` and `!unmute`

## Stack

- **Runtime**: Node.js 24, TypeScript 5.9
- **Bot library**: discord.js
- **API server**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Package manager**: pnpm workspaces
- **Build**: esbuild

## Project structure

```
artifacts/
└── api-server/
    └── src/
        ├── index.ts      # Entry point — starts HTTP server and bot
        ├── app.ts        # Express app setup
        ├── bot.ts        # Discord bot logic (all commands)
        ├── routes/       # API routes
        └── lib/
            └── logger.ts # Pino logger singleton
```
