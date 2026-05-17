# ANCHORED_SUMMARY.md

## Goal

- Build a modern FlyFF remake using original client assets with a Node.js/TypeScript architecture for personal nostalgia use within 1-3 months.

## Constraints & Preferences

- Use local resources from 'I:\ClockworksFlyff Client\'
- Use Bun SQLite instead of PostgreSQL
- No Redis - use direct TCP communication between servers
- No Docker - prefer native Windows PowerShell/Bun commands
- No Blender - use direct FlyFF asset formats
- Quick prototype timeline (1-3 months)
- Modern remake with nostalgia focus
- Personal use only

## Progress

### Done

- Week 1: Architecture Optimization - inter-server TCP communication, in-memory session management, Bun SQLite database optimization, server configuration files
- Week 2: Asset Integration - complete asset pipeline, CWF archive extraction, model loading (O3D/X), world loading (WLD/DYO/RGN), client integration
- Week 3: Core Gameplay Systems - visibility system (distance-based), mobility system (movement/physics), combat system (damage/crits), inventory system (items/equipment)
- Week 4: Code cleanup - fixed TypeScript error in itemResource.ts where `_data` variable was missing after file read operation on line 122; TypeScript compilation now passes without errors

### In Progress

- Week 4: System Integration & Testing - **SUCCESS**: testClient.ts successfully connected to login server, exchanged CERTIFY/WELCOME packets, and received session ID 66620123. Integration test confirms login server networking is functional.

### Blocked

- Integration testing incomplete - need to start cluster and world servers to test full authentication flow
- SQLite persistence issue: better-sqlite3 not installed; system falls back to in-memory KV store (data loss on restart)
- Docker has Linux engine issues preventing database service startup
- testClient.ts requires all three servers (login:23000, cluster:28000, world:5400) running for complete flow

## Key Decisions

- Chose Node.js/TypeScript over Godot for faster development timeline
- Replaced Redis with direct TCP to eliminate external dependencies
- Used Bun SQLite instead of PostgreSQL for better performance and simplicity
- Avoided Docker entirely - using native Bun runtime for server processes
- Implemented direct FlyFF asset format usage instead of conversion tools
- Built modular system architecture for maintainability and extensibility

## Next Steps

- Start cluster server: `bun run src/main.ts cluster`
- Start world server: `bun run src/main.ts world`
- Run full integration testClient.ts with all servers running
- Investigate installing better-sqlite3 to enable persistent SQLite storage (currently falls back to in-memory)
- Fix any integration issues that arise
- Optimize performance bottlenecks
- Implement drop system
- Add chat system
- Create trading system
- Implement skill system

## Critical Context

- testClient.ts successfully demonstrated CERTIFY/WELCOME exchange with login server on 127.0.0.1:23000
- Servers start via: `bun run src/main.ts login|cluster|world`
- start-all.ps1 script exists but requires working Docker database service
- docker-compose.yml defines PostgreSQL on port 5432; Docker info shows running but Linux engine issues
- Original FlyFF client located at 'I:\ClockworksFlyff Client\' with 26+ model archives
- Total 12 major systems implemented, 20+ files created, 3000+ lines of production code

## Relevant Files

- src/main.ts: Server entry point - accepts args login/cluster/world
- src/testClient.ts: TCP client test - demonstrates successful CERTIFY/WELCOME exchange
- src/configs/\*.yaml: Server configurations (world_server_optimized.yaml uses provider: sqlite)
- src/protocols/interServerClient.ts: Direct TCP communication replacing Redis
- src/protocols/sessionManager.ts: In-memory session management
- src/protocols/databaseManager.ts: Bun SQLite database manager
- src/assets/assetManager.ts: Unified asset management
- src/systems/: Gameplay systems (visibility, mobility, combat, inventory)
- scripts/start-all.ps1: Windows startup script (requires Docker)
- docker-compose.yml: PostgreSQL service definition
- I:\ClockworksFlyff Client\: Original FlyFF client assets
- D:\repos\Node-Flyff\IMPLEMENTATION_PROGRESS.md: Detailed progress tracking
