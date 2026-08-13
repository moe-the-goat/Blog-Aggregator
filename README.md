# gator

`gator` is a CLI blog aggregator written in TypeScript and backed by PostgreSQL.

## Prerequisites
- Node.js (v22.15.0 or later)
- PostgreSQL database server running locally

## Configuration
Create a `~/.gatorconfig.json` file with your DB URL.

## Setup & Commands
- `register <username>`
- `login <username>`
- `users`
- `addfeed <name> <url>`
- `feeds`
- `follow <url>`
- `following`
- `unfollow <url>`
- `agg <time>`
- `browse [limit]`
- `reset`
