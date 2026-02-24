# Components Documentation

This document defines the reusable UI components for the BlueWork MVP.
All components must follow consistency, accessibility, and reusability
principles.

------------------------------------------------------------------------

## 1. Core UI Components

### Button

**Purpose:** Trigger actions (submit, confirm, navigate)

**Variants:** - primary - secondary - outline - danger

**Props:** - type (button \| submit \| reset) - disabled (boolean) -
loading (boolean) - onClick (function)

------------------------------------------------------------------------

### Input

**Purpose:** Capture user text input

**Types:** - text - email - password - number

**Props:** - label (string) - placeholder (string) - required
(boolean) - error (string) - value (string) - onChange (function)

------------------------------------------------------------------------

### Textarea

**Purpose:** Capture multi-line input (job descriptions, notes)

**Props:** - label - placeholder - rows - required - error - value -
onChange

------------------------------------------------------------------------

### Select / Dropdown

**Purpose:** Select one option from multiple choices

**Props:** - label - options (array) - value - onChange

------------------------------------------------------------------------

### Modal

**Purpose:** Display overlays (confirmations, forms)

**Props:** - isOpen (boolean) - title (string) - onClose (function)

------------------------------------------------------------------------

### Card

**Purpose:** Display structured content blocks

Used for: - Job cards - Worker profiles - Dashboard summaries

------------------------------------------------------------------------

### Badge

**Purpose:** Status indicators

Examples: - Open - Assigned - Completed - Cancelled

------------------------------------------------------------------------

## 2. Domain Components

### JobCard

Displays: - Job title - Budget - Location - Status - Action buttons

------------------------------------------------------------------------

### WorkerCard

Displays: - Name - Skills - Rating - Availability

------------------------------------------------------------------------

### Navbar

Contains: - Logo - Navigation links - User profile dropdown

------------------------------------------------------------------------

## 3. Form Patterns

All forms must: - Use controlled components - Include validation -
Display error messages clearly - Disable submit while loading

------------------------------------------------------------------------

## 4. Design Rules

-   Use consistent spacing (8px system)
-   Use accessible color contrast
-   Buttons must show loading state
-   Inputs must show validation state
-   Mobile-first responsive design

------------------------------------------------------------------------

## 5. Future Components (Post-MVP)

-   Pagination
-   Data Table
-   Toast Notifications
-   Skeleton Loaders
-   File Upload
-   Rating Component

------------------------------------------------------------------------

End of components.md
