# Agents.md - AI Agent Instructions for Node-FlyFF

This document provides comprehensive instructions for AI agents working on the Node-FlyFF project, a Fly For Fun V19 emulator built with TypeScript and Node.js.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Useful Commands](#useful-commands)
- [Technologies](#technologies)
- [Best Practices](#best-practices)
- [Guidelines](#guidelines)
- [Development Workflow](#development-workflow)
- [Code Style & Standards](#code-style--standards)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

Node-FlyFF is a comprehensive, open-source Fly For Fun (FlyFF) V19 emulator built with modern TypeScript and Node.js. The project follows a distributed server architecture with three main servers:

- **Login Server**: Handles client authentication and server list distribution
- **Cluster Server**: Manages character operations (creation, deletion, selection)
- **World Server**: Core game logic, entity management, and gameplay systems

### Key Architecture Components

- **Entity Component System (ECS)**: Efficient entity management and component-based architecture
- **Redis Caching**: Fast inter-server communication and data caching
- **TypeORM**: Database abstraction layer supporting SQLite, MySQL, and PostgreSQL
- **Packet Handler Infrastructure**: Network protocol handling for client-server communication

---

## 🚀 Useful Commands

### Development Commands

```bash
# Start development servers
bun dev                    # Start with watch mode
bun dev login              # Start login server
bun dev cluster            # Start cluster server
bun dev world              # Start world server

# Build commands
bun build                  # Build for production
bun build:watch            # Build with watch mode
bun build:release          # Build with minification

# TypeScript compilation
tsc -p tsconfig.json --noEmit              # Type check only
tsc -p tsconfig.json                       # Compile TypeScript
tsc -p web-client/tsconfig.json --noEmit   # Type check web-client

# Linting and formatting
npx eslint "**/*.{ts,tsx,js,jsx}" --fix   # Auto-fix ESLint issues
npm run lint                                # Run ESLint
npm run prettier                            # Format with Prettier

# Testing
npm run test-client         # Run test client
bun run src/testClient.ts   # Alternative test client command

# Tools
bun run src/tools/wsTcpProxy.ts    # Start WebSocket proxy
npm --prefix web-client run generate-sheets -- <packName>  # Generate sprite sheets
```

### Quick Start Scripts

```bash
# Unix/macOS - Start all servers with Postgres
./scripts/start-all.sh

# Windows (PowerShell) - Start all servers with Postgres
./scripts/start-all.ps1
```

### Web Client Commands

```bash
cd web-client
npm install              # Install dependencies
npm run dev              # Start development server (http://localhost:5173)
npm run build            # Build for production
```

### Database Commands

```bash
# The project uses TypeORM for database operations
# Database configuration is in src/configs/
# Supports: SQLite (development), MySQL, PostgreSQL
```

---

## 🛠️ Technologies

### Core Technologies

- **Runtime**: Node.js 22+ and Bun 1.0+
- **Language**: TypeScript 5.6+ with strict mode enabled
- **Database**:
  - SQLite (development)
  - MySQL (production ready)
  - PostgreSQL (recommended for Bun runtime)
- **Caching**: Redis
- **ORM**: TypeORM 0.3.20

### Key Dependencies

```json
{
  "better-sqlite3": "^8.2.0", // SQLite database
  "cli-color": "^2.0.4", // Terminal colors
  "crypto-js": "^4.2.0", // Cryptography
  "fs-extra": "^11.2.0", // File system utilities
  "js-yaml": "^4.1.0", // YAML parsing
  "lodash": "^4.17.21", // Utility library
  "moment": "^2.30.1", // Date/time handling
  "node-cron": "^3.0.3", // Scheduled tasks
  "pg": "^8.11.0", // PostgreSQL client
  "reflect-metadata": "^0.2.1", // Decorator metadata
  "typeorm": "^0.3.20", // ORM
  "ws": "^8.13.0" // WebSocket
}
```

### Web Client Technologies

- **Framework**: React
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: CSS (can be extended with Tailwind or other solutions)

### Development Tools

- **Package Manager**: Bun (preferred), npm, yarn
- **Linting**: ESLint 8+ with TypeScript support
- **Formatting**: Prettier
- **Type Checking**: TypeScript 5.6+
- **Version Control**: Git

---

## ✅ Best Practices

### Code Organization

1. **Follow the established directory structure**:

   ```
   src/
   ├── abstract/          # Base classes and interfaces
   ├── builders/          # Builder patterns
   ├── common/            # Shared enums and constants
   ├── configs/           # Server configuration files
   ├── database/          # Database models and connections
   ├── decorators/        # TypeScript decorators
   ├── entities/          # Game entities (Player, Monster, NPC)
   ├── helpers/           # Utility functions
   ├── interfaces/        # TypeScript interfaces
   ├── libraries/         # Core libraries (packets, networking)
   ├── protocol/          # Network protocol definitions
   ├── resources/         # Game data and resource loaders
   ├── servers/           # Server implementations
   ├── tools/             # Development tools
   └── types/             # Type definitions
   ```

2. **Use TypeScript interfaces for contracts**: Define clear interfaces for all public APIs and data structures.

3. **Separate concerns**: Keep business logic separate from networking, database, and UI code.

4. **Use dependency injection**: Leverage TypeORM's dependency injection for services and repositories.

### TypeScript Best Practices

1. **Enable strict mode**: The project uses strict TypeScript configuration with:
   - `strictNullChecks: true`
   - `noEmit: true` (for type checking)
   - `forceConsistentCasingInFileNames: true`

2. **Use type annotations**: Always provide explicit type annotations for function parameters and return types.

3. **Avoid `any` type**: Use `unknown` or proper type definitions instead of `any`.

4. **Use enums for constants**: Define game constants as enums in the `common/` directory.

5. **Leverage decorators**: Use TypeORM decorators for entity definitions and custom decorators for game-specific metadata.

### Database Best Practices

1. **Use TypeORM entities**: Define all database models using TypeORM decorators.

2. **Use migrations**: Create and use TypeORM migrations for schema changes.

3. **Index properly**: Add database indexes for frequently queried fields.

4. **Use transactions**: Wrap related database operations in transactions.

5. **Connection pooling**: Configure appropriate connection pool settings for production.

### Performance Best Practices

1. **Use async/await**: All I/O operations should be asynchronous and use async/await.

2. **Cache frequently accessed data**: Use Redis for caching session data, player information, and other frequently accessed data.

3. **Optimize database queries**: Use TypeORM's query builder for complex queries and avoid N+1 problems.

4. **Use streams for large data**: Process large files or data streams using Node.js streams.

5. **Implement rate limiting**: Add rate limiting for network operations and API endpoints.

### Security Best Practices

1. **Validate all inputs**: Validate and sanitize all user inputs, especially from network packets.

2. **Use prepared statements**: Always use parameterized queries to prevent SQL injection.

3. **Implement authentication**: Use secure authentication mechanisms with proper password hashing.

4. **Encrypt sensitive data**: Use encryption for sensitive data stored in databases or transmitted over the network.

5. **Keep dependencies updated**: Regularly update dependencies to patch security vulnerabilities.

### Error Handling

1. **Use try-catch blocks**: Wrap all async operations in try-catch blocks.

2. **Log errors appropriately**: Use the logger system to log errors with appropriate severity levels.

3. **Provide meaningful error messages**: Return clear, actionable error messages to users and developers.

4. **Don't expose sensitive information**: Avoid exposing stack traces or sensitive data in error messages.

5. **Implement graceful degradation**: Design systems to handle failures gracefully without crashing.

---

## 📖 Guidelines

### Development Guidelines

1. **Follow the existing code style**: Match the existing code style in the project, including:
   - Double quotes for strings
   - Semicolons at end of statements
   - 2-space indentation
   - No trailing commas

2. **Write descriptive commit messages**: Use conventional commit format:

   ```
   feat: add new feature
   fix: fix bug description
   docs: update documentation
   refactor: code refactoring
   test: add tests
   chore: maintenance tasks
   ```

3. **Keep functions small and focused**: Functions should do one thing and do it well.

4. **Add comments for complex logic**: Explain complex algorithms or business logic with clear comments.

5. **Use meaningful names**: Choose descriptive names for variables, functions, and classes.

### Testing Guidelines

1. **Write unit tests**: Test individual functions and classes in isolation.

2. **Write integration tests**: Test interactions between components and systems.

3. **Test edge cases**: Include tests for boundary conditions and error scenarios.

4. **Mock external dependencies**: Use mocks for databases, network calls, and other external services.

5. **Maintain test coverage**: Aim for high test coverage, especially for critical game systems.

### Documentation Guidelines

1. **Document public APIs**: Add JSDoc comments for all public functions and classes.

2. **Update README files**: Keep README files up to date with project changes.

3. **Document configuration**: Explain all configuration options and their purposes.

4. **Provide examples**: Include code examples for complex features or APIs.

5. **Keep documentation in sync**: Update documentation when code changes.

### Code Review Guidelines

1. **Review your own code**: Self-review your code before submitting for review.

2. **Be thorough**: Check for bugs, performance issues, and security vulnerabilities.

3. **Be constructive**: Provide helpful feedback and suggestions for improvement.

4. **Test changes**: Ensure all tests pass and the code works as expected.

5. **Follow the project's coding standards**: Adhere to the established coding standards.

### Git Workflow Guidelines

1. **Use feature branches**: Create a new branch for each feature or bug fix.

2. **Keep commits atomic**: Make small, focused commits that can be easily understood.

3. **Write good commit messages**: Follow the conventional commit format.

4. **Squash related commits**: Combine related commits before merging.

5. **Resolve conflicts early**: Resolve merge conflicts as soon as they occur.

---

## 🔄 Development Workflow

### Setting Up the Development Environment

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-repo/nodejs-flyff.git
   cd nodejs-flyff
   ```

2. **Install dependencies**:

   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up Redis Server**:
   - Windows: Follow the WSL Redis installation guide
   - Linux/macOS: `sudo apt-get install redis-server` or `brew install redis`

4. **Configure the database**:
   - SQLite is configured by default for development
   - For MySQL or PostgreSQL, update configuration files in `src/configs/`

5. **Start the servers**:
   ```bash
   bun dev login    # Login server
   bun dev cluster  # Cluster server
   bun dev world    # World server
   ```

### Making Changes

1. **Create a feature branch**:

   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes** following the best practices and guidelines.

3. **Run type checking**:

   ```bash
   npx tsc -p tsconfig.json --noEmit
   ```

4. **Run linting**:

   ```bash
   npx eslint "**/*.{ts,tsx,js,jsx}" --fix
   ```

5. **Test your changes**:

   ```bash
   npm run test-client
   ```

6. **Commit your changes**:

   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

7. **Push to the branch**:

   ```bash
   git push origin feature/amazing-feature
   ```

8. **Open a Pull Request** and follow the code review guidelines.

---

## 🎨 Code Style & Standards

### ESLint Configuration

The project uses ESLint with the following rules:

- **Quotes**: Double quotes (`"error", "double"`)
- **Semicolons**: Required (`"error", "always"`)
- **Comma dangle**: No trailing commas (`"error", "never"`)
- **Space before function paren**: No space (`"error", "never"`)

### TypeScript Configuration

The project uses strict TypeScript configuration:

- **Target**: ES2022
- **Module**: esnext
- **Module Resolution**: bundler
- **Strict Null Checks**: Enabled
- **Decorators**: Enabled
- **No Emit**: Enabled (for type checking only)

### Naming Conventions

- **Classes**: PascalCase (e.g., `PlayerEntity`)
- **Functions/Methods**: camelCase (e.g., `getPlayerById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_PLAYERS`)
- **Interfaces**: PascalCase with `I` prefix (e.g., `IPlayer`)
- **Enums**: PascalCase (e.g., `PlayerState`)

### File Naming

- **TypeScript files**: `.ts` extension
- **React components**: `.tsx` extension
- **Test files**: `.test.ts` or `.spec.ts` extension
- **Configuration files**: `.config.ts` or `.config.js` extension

---

## 🧪 Testing & Quality Assurance

### Type Checking

Always run type checking before committing changes:

```bash
# Root project
npx tsc -p tsconfig.json --noEmit

# Web client
npx tsc -p web-client/tsconfig.json --noEmit
```

### Linting

Run ESLint to check for code quality issues:

```bash
npx eslint "**/*.{ts,tsx,js,jsx}" --fix
```

### Building

Build the project to ensure it compiles correctly:

```bash
bun build
```

### Testing

Run the test client to verify functionality:

```bash
npm run test-client
```

---

## 🔧 Common Patterns

### Entity Component System (ECS)

The project uses an ECS architecture for game entities:

```typescript
// Define an entity
class PlayerEntity extends MoverEntity {
  // Player-specific properties and methods
}

// Use components to add functionality
class InventoryComponent {
  // Inventory management
}

class CombatComponent {
  // Combat mechanics
}
```

### Database Operations

Use TypeORM for database operations:

```typescript
// Define an entity
@Entity("players")
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  level: number;
}

// Query the database
const player = await dataSource.getRepository(Player).findOne({
  where: { id: playerId },
});
```

### Packet Handling

Use the packet handler infrastructure for network communication:

```typescript
// Define a packet handler
@PacketHandler(PacketType.CERTIFY)
export class CertifyHandler implements IPacketHandler {
  async handle(packet: Packet, client: Client): Promise<void> {
    // Handle the packet
  }
}
```

### Error Handling

Use try-catch blocks for error handling:

```typescript
try {
  const player = await this.getPlayerById(playerId);
  return player;
} catch (error) {
  this.logger.error(`Failed to get player: ${error.message}`);
  throw new Error("Player not found");
}
```

### Async/Await

Use async/await for asynchronous operations:

```typescript
async function getPlayerData(playerId: number): Promise<PlayerData> {
  const player = await this.playerRepository.findOne({
    where: { id: playerId },
  });

  if (!player) {
    throw new Error("Player not found");
  }

  return player;
}
```

---

## 🐛 Troubleshooting

### Common Issues

1. **TypeScript compilation errors**:
   - Run `npx tsc -p tsconfig.json --noEmit` to see all type errors
   - Check for missing type definitions
   - Ensure all dependencies are installed

2. **ESLint errors**:
   - Run `npx eslint "**/*.{ts,tsx,js,jsx}" --fix` to auto-fix issues
   - Check the `.eslintrc.cjs` file for rule configuration
   - Ensure all dependencies are installed

3. **Database connection errors**:
   - Check database configuration in `src/configs/`
   - Ensure the database server is running
   - Verify connection credentials

4. **Redis connection errors**:
   - Ensure Redis server is running
   - Check Redis configuration
   - Verify Redis is accessible from the application

5. **Build errors**:
   - Ensure all dependencies are installed
   - Check TypeScript configuration
   - Verify Node.js version (22+)

### Getting Help

- Check the [README.md](README.md) for general information
- Review the [web-client README](web-client/README.md) for web client specific information
- Look at existing code for examples
- Check the project's GitHub Issues for known issues

---

## 📝 Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Bun Documentation](https://bun.sh/docs)
- [TypeORM Documentation](https://typeorm.io/)
- [Redis Documentation](https://redis.io/docs/)
- [ESLint Documentation](https://eslint.org/docs/latest/)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on how to get started.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and ensure TypeScript compilation passes
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## 📄 License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

---

**Note**: This is an educational and research project. Please respect the intellectual property rights of the original game creators.

---

## 📞 Contact

For questions or support, please open an issue on the [GitHub Issues](https://github.com/your-repo/nodejs-flyff/issues) page.

---

**Last Updated**: 2026-05-08
