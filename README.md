# Multi-Sport Club Booking App

Quick start:

## Server
```
cd server
npm i
npm run init:db
npm start
```

## Client
```
cd client
npm i
npm run dev
```

Open http://localhost:5173

Dev (single command)
```
# from repository root
npm install
npm run dev

# this runs the server (port 5051) and the client (Vite on 5173) concurrently
```

Applying DB migrations
```
# inside server/
npm run init:db
# or apply new SQL files in server/migrations/ with psql against your DATABASE_URL
```
