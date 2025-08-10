# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Test Survey Tool (TST) is a Next.js React application that converts structured text files into interactive survey questionnaires. Users upload or paste text files with a specific format, and the app renders them as dynamic surveys with conditional logic, computed variables, and multi-page navigation.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Architecture Overview

### Core Structure
- **Next.js 15** with App Router (`app/` directory)
- **TypeScript** with strict configuration
- **React 19** with experimental React Compiler
- **Tailwind CSS** for styling with Radix UI components
- **shadcn/ui** component library

### Key Application Flow
1. **Text Parsing** (`lib/parser.ts`): Converts structured text into questionnaire objects
2. **Condition System** (`lib/conditions/`): Handles dynamic show/hide logic and computed variables
3. **State Management**: Custom hooks manage responses, navigation, and visibility
4. **Rendering**: Component hierarchy renders questions with conditional logic

### Core Data Types (`lib/types.ts`)
- `Block`: Top-level container with pages and computed variables
- `Page`: Contains questions, sections, and content
- `Question`: Individual survey questions with various types
- `Section`: Groups questions within pages
- `ComputedVariable`: Dynamic calculations based on responses

### Text Format Parser (`lib/parser.ts`)
The parser converts structured text using these patterns:
- `#` or `# Title` - Page headers
- `## Section` - Section headers
- `Q:` or `Q1:` - Questions
- `HINT:` - Question subtexts
- `- Option` - Multiple choice options
- `TEXT`, `ESSAY`, `NUMBER`, `CHECKBOX` - Input types
- `VARIABLE:` - Assigns variables to questions
- `SHOW_IF:` - Conditional display logic
- `COMPUTE:` - Variable calculations
- `BLOCK:` - Groups pages together

### Condition System (`lib/conditions/`)
Sophisticated conditional logic supporting:
- Simple comparisons (`Q1 == yes` or `Q1 == "yes"`)
- Logical operators (`AND`, `OR`, `NOT`)
- Arithmetic expressions
- Wildcard matching
- Computed variable evaluation

### Component Architecture
- **Question Renderers** (`components/questions/`): Type-specific question components
- **Navigation** (`components/questionnaire/`): Page navigation and progress
- **Hooks** (`hooks/`): State management for responses, visibility, navigation
- **Context** (`contexts/`): Language provider for i18n

### State Management Pattern
Custom hooks manage questionnaire state:
- `use-questionnaire-responses`: Response data management
- `use-questionnaire-navigation`: Page navigation logic  
- `use-visible-pages`: Conditional page visibility
- `use-page-completion`: Track completion status

### Styling System
- **Tailwind CSS** with custom configuration
- **Radix UI** primitives for accessible components
- **shadcn/ui** component variants using class-variance-authority
- **Responsive design** with mobile-first approach

### Type Safety
Strong TypeScript usage throughout:
- Discriminated unions for parser types
- Comprehensive type definitions in `lib/types.ts`
- Strict compiler settings in `tsconfig.json`

## Development Notes

- The parser is the core of the application - changes here affect the entire text format
- Condition evaluation is performance-critical and heavily tested
- Components follow a consistent pattern with shared wrapper components
- State management is deliberately kept simple with React hooks rather than external libraries
- The app is designed to work entirely client-side with no backend requirements