# BookReader

An Apple Books-style e-book reader desktop application built with Tauri, React, and TypeScript.

## Features

### Library Management
- Grid and list view for your book collection
- Import EPUB and PDF files via file picker
- Automatic metadata extraction from EPUB files
- Reading progress tracking
- Collections: Currently Reading, Want to Read, Finished

### Reader View
- Paginated reading experience with smooth navigation
- Keyboard navigation (Arrow keys, Space, Page Up/Down)
- Click zones for page navigation (left/right to navigate, center to toggle UI)
- Table of contents navigation
- Progress bar showing reading position
- Auto-hiding UI for immersive reading

### Customization
- **Themes**: Light, Sepia, Dark, and True Black (OLED)
- **Typography**: Multiple font families (serif, sans-serif, monospace)
- **Font Size**: Adjustable from 12px to 32px
- **Line Height**: Customizable spacing
- **Text Alignment**: Left or justified
- **Margins**: Adjustable padding

### Bookmarks & Annotations
- Add bookmarks to save your position
- Color-coded highlights (yellow, green, blue, pink, purple)
- Notes attached to highlights

## Tech Stack

- **Framework**: [Tauri](https://tauri.app/) v2
- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand with persistence
- **EPUB Parsing**: epub.js
- **Routing**: React Router v7

## Development

### Prerequisites

- Node.js 18+
- Rust (for Tauri)
- Platform-specific dependencies for Tauri

### Setup

\`\`\`bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
\`\`\`

### Project Structure

\`\`\`
src/
  components/
    common/       # Reusable UI components
    library/      # Library view components
    reader/       # Reader view components
    settings/     # Settings view
  stores/         # Zustand state stores
  utils/          # Utility functions
  types/          # TypeScript types
  styles/         # CSS and theme definitions
src-tauri/        # Tauri backend (Rust)
\`\`\`

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Arrow Right / Space / Page Down | Next page |
| Arrow Left / Page Up | Previous page |
| Escape | Close current panel |

## License

MIT
