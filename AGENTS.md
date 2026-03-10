# AGENTS.md — Inventory Count Module

## Project Overview
独立仓库库存盘点模块 (Inventory Count Module)
A standalone inventory counting/cycle count module with web management and mobile PWA interfaces.

## Quick Map
- **Specs & PRD**: `.kiro/specs/inventory-count/` — requirements, design, domain analysis, tasks
- **Source Code**: `src/` — React + TypeScript + Vite
- **Architecture**: See `.kiro/specs/inventory-count/design.md` §1

## Tech Stack
- React 18 + TypeScript + Vite
- Ant Design (web) + Ant Design Mobile (mobile PWA)
- Zustand (state management)
- Dexie.js (IndexedDB wrapper)
- html5-qrcode (barcode scanning)
- vite-plugin-pwa (PWA/offline support)

## Architecture Rules
1. **Layered architecture**: domain → providers → services → stores → UI
2. **Dependency direction**: Types → Config → Providers → Services → Stores → Components (one-way only)
3. **Provider pattern**: All external data access through Provider interfaces (IInventoryProvider, ILocationProvider, IProductProvider, IAuthProvider, IAdjustmentPublisher)
4. **Mock-first**: V1 uses mock providers. Real API integration in v2.
5. **Web vs Mobile**: Web routes under `/`, Mobile routes under `/m/`. Shared services layer.

## Coding Conventions
- Use TypeScript strict mode
- All entities and interfaces in `src/domain/`
- All provider interfaces in `src/providers/interfaces/`, mocks in `src/providers/mock/`
- Use path aliases: @domain, @providers, @services, @stores, @web, @mobile, @shared
- Chinese comments for business logic, English for technical comments
- Every component file < 300 lines; extract sub-components if longer

## Testing
- Unit tests with Vitest for services and domain logic
- Component tests for critical UI flows
- Test files co-located: `*.test.ts` / `*.test.tsx`

## Deployment
- GitHub Pages via gh-pages branch
- Base path: `/inventory-count/`
