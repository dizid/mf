# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Title** - # Short Description

## Build and Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production (type-check + build)
npm run build

# Preview production build
npm run preview
```

## Architecture


## Tech Stack

## Conventions


## Data Safety (Production)

- **No data deletion** - we are in production, never delete ANY data
- **No database schema changes** - existing schema is locked
- **Existing data untouched** - do not modify production records

## Design Guidelines
## Preferences
- Act like a senior developer
- Write complete, working code - no mocks, stubs, or TODOs
- Use clear comments in code
- Keep existing working code intact when adding features
- Modular, maintainable structure
**Target users:**  # fill in 
**Primary device:** Mobile phone (design mobile-first, desktop is secondary)

### Core Principles

1. **Mobile-first** - design for 375px portrait, desktop is afterthought
2. **Big touch targets** (56px minimum) - users wear gloves
3. **High contrast** - visible in direct sunlight
4. **Obvious navigation** - no hidden menus, no swipe gestures
5. **One action per screen** - don't make users think
6. **Icons + labels** - never icons alone

### Don'ts

- No hover states (touch only)
- No subtle colors or thin fonts
- No nested navigation deeper than 2 levels
- No animations that delay interaction
- No small text (16px minimum body, 14px minimum labels)
- No landscape-only layouts

### Component Patterns

- Buttons: Full-width, tall (56px), bold labels, thumb-reachable
- Forms: Large inputs (48px height), one field visible at a time
- Lists: Generous row height (64px+), clear tap targets
- Feedback: Obvious success/error states that persist until dismissed
- Navigation: Bottom tab bar for primary nav (thumb zone)