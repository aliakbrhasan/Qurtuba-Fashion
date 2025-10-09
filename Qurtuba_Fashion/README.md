
  # ازياء قرطبة

A modern fashion management application built with React, TypeScript, and Supabase, designed to be Electron-ready.

## Architecture

This project follows a clean architecture pattern with clear separation of concerns:

### Project Structure

```
src/
├── app/                 # Application-level providers and routing
│   ├── AppProviders.tsx # React Query and other providers
│   └── queryClient.ts   # React Query configuration
├── components/          # Reusable UI components
│   ├── ui/             # UI primitives (Button, Input, Modal, etc.)
│   └── ...             # Feature-specific components
├── features/           # Feature slices (e.g., orders/)
│   └── orders/         # Orders feature implementation
├── db/                 # Database access layer
│   ├── client.ts       # Supabase client configuration
│   └── *.repo.ts       # Repository functions
├── ports/              # Interface definitions
│   ├── orders.ts       # Orders domain interface
│   └── ipc.ts          # Electron IPC interface
├── adapters/           # Concrete implementations
│   └── *.adapter.ts    # Adapters implementing ports
├── lib/                # Utilities and helpers
└── test/               # Test files
```

### Data Flow

1. **UI Components** → **React Query Hooks** → **Adapters** → **Repositories** → **Supabase**
2. No direct Supabase calls from React components
3. All data access goes through the repository layer
4. Clear separation between domain logic and infrastructure

### Key Patterns

- **Ports & Adapters**: Clean interfaces for data access
- **Repository Pattern**: Database operations abstracted behind repositories
- **React Query**: Server state management and caching
- **Feature Slices**: Organized by business domain
- **TypeScript Strict**: Full type safety throughout

## Environment Setup

### Required Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup

1. Create a new Supabase project
2. Create the `orders` table with the following schema:

```sql
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

3. Enable Row Level Security (RLS) if needed
4. Copy the project URL and anon key to your `.env` file

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Running Locally

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run typecheck` - Run TypeScript type checking

## Adding New Features

To add a new feature slice (e.g., `products`):

1. **Create the port interface** in `src/ports/products.ts`
2. **Implement the repository** in `src/db/products.repo.ts`
3. **Create the adapter** in `src/adapters/products.adapter.ts`
4. **Build the feature** in `src/features/products/`
5. **Add React Query hooks** for data fetching
6. **Create UI components** using the established patterns

Example:

```typescript
// src/ports/products.ts
export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface ProductsPort {
  list(): Promise<Product[]>;
  create(product: Omit<Product, 'id'>): Promise<Product>;
}
```

## Electron Integration

The application is fully integrated with Electron:

- **Main Process**: `electron/main.ts` - Handles window management and native APIs
- **Preload Script**: `electron/preload.ts` - Secure bridge between main and renderer
- **IPC Interface**: `src/ports/ipc.ts` - Type-safe communication layer
- **Electron Adapter**: `src/adapters/electron.adapter.ts` - React integration

### Running Electron

```bash
# Development mode (with hot reload)
npm run electron:dev

# Build for production
npm run electron:build

# Build for specific platforms
npm run electron:build:win    # Windows
npm run electron:build:mac    # macOS
npm run electron:build:linux  # Linux
```

### Electron Features

- **Native Dialogs**: File open/save dialogs
- **App Information**: Version, platform details
- **File Operations**: Save/export functionality
- **Print Support**: Document printing (ready for implementation)
- **Security**: Context isolation and secure IPC

### Development Workflow

1. **Web Development**: Use `npm run dev` for browser development
2. **Electron Development**: Use `npm run electron:dev` for desktop app
3. **Testing**: All existing tests work in both environments
4. **Building**: Use `npm run electron:build` for distribution

## Testing

Tests are organized by layer:

- **Repository tests**: Test database operations with mocked Supabase
- **Adapter tests**: Test port implementations
- **Component tests**: Test UI components (when needed)

Run tests with `npm test` or `npm run test:ui` for the visual interface.

## Contributing

1. Follow the established architecture patterns
2. Keep components under 300 lines
3. Use TypeScript strict mode
4. Write tests for new repositories and adapters
5. Follow the existing code style (Prettier + ESLint)
  