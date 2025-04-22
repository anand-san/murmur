# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands
- `npm run dev` - Start Vite development server
- `npm run build` - Build the app (TypeScript + Vite)
- `npm run tauri` - Run Tauri commands
- `npm run backend:dev` - Start backend development server
- `npm run backend:build` - Build the backend

## Code Style Guidelines
- **TypeScript**: Strict mode, use proper type annotations
- **React**: Functional components with hooks, typed props (React.FC)
- **Imports**: Group imports by origin (React, libraries, components, utils)
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Formatting**: 2-space indentation, semicolons required
- **Error Handling**: Try/catch blocks with proper error logging
- **State Management**: Use React hooks (useState, useEffect, useContext)
- **Tailwind**: Use `cn()` utility for conditional class merging
- **File Structure**: Components in folders with related utils/hooks/context
- **Pattern**: Use async/await for promises, early returns for conditionals