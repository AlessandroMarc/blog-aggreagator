# Blog Aggregator CLI

A CLI tool for aggregating RSS/Atom blog feeds.

## Prerequisites

- **Node.js** (v18+)
- **PostgreSQL** database
- **npm** or **pnpm**

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up the database by running migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

## Configuration

The CLI uses a config file located at `~/.gatorconfig.json`. Create it with the following structure:

```json
{
  "db_url": "postgresql://user:password@localhost:5432/blog_aggregator",
  "current_user_name": ""
}
```

- **db_url**: Your PostgreSQL connection string
- **current_user_name**: Will be set automatically when you log in

## Commands

### User Management

| Command | Description |
|---------|-------------|
| `npm run start register <username>` | Register a new user |
| `npm run start login <username>` | Log in as an existing user |
| `npm run start users` | List all users (shows current user) |
| `npm run start reset` | Delete all users (dangerous!) |

### Feed Management

| Command | Description |
|---------|-------------|
| `npm run start addfeed <name> <url>` | Add a new RSS feed to follow |
| `npm run start feeds` | List all feeds |
| `npm run start follow <url>` | Follow an existing feed |
| `npm run start following` | Show feeds you're following |
| `npm run start unfollow <url>` | Unfollow a feed |

### Aggregation

| Command | Description |
|---------|-------------|
| `npm run start agg <duration>` | Start continuous feed aggregation |

The `agg` command fetches feeds in a round-robin fashion. Duration format: `<number><unit>` where unit is `ms`, `s`, `m`, or `h`.

Examples:
```bash
npm run start agg 30s    # Fetch every 30 seconds
npm run start agg 1m     # Fetch every minute
npm run start agg 5m     # Fetch every 5 minutes
```

## Example Workflow

```bash
# 1. Register and log in
npm run start register alice
npm run start login alice

# 2. Add some feeds
npm run start addfeed "My Blog" https://myblog.com/rss
npm run start addfeed "Tech News" https://technews.com/feed.xml

# 3. Start aggregating
npm run start agg 1m
```
