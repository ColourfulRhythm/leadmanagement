# School of Self-Discovery

A modern, responsive website built with Next.js and Tailwind CSS, following Figma design principles for a clean, professional user experience.

## Features

- **Modern Design System**: Built with Figma-inspired design principles including:
  - Consistent color palette (dark blue primary, golden yellow accent)
  - Typography hierarchy with Inter font family
  - Proper spacing and layout grids
  - Component-based architecture

- **Responsive Design**: Fully responsive across all device sizes
- **Smooth Navigation**: Fixed navigation with smooth scrolling
- **Age Group Sections**: Comprehensive information for:
  - Children (Ages 6–12)
  - Teens (Ages 13–17)
  - Young Adults (Ages 18–25)
  - Adults (Ages 26+)

## Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Inter Font**: Modern, clean typography

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── globals.css      # Global styles and Tailwind imports
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Homepage
├── components/
│   ├── Navigation.tsx   # Navigation component
│   ├── Hero.tsx         # Hero section
│   └── AgeGroupSection.tsx # Reusable age group section
├── public/
│   └── logo/            # Logo assets
└── tailwind.config.js   # Tailwind configuration
```

## Design Principles Applied

1. **Visual Hierarchy**: Clear typography scale and spacing
2. **Consistency**: Unified color system and component patterns
3. **Whitespace**: Generous spacing for readability
4. **Grid System**: Structured layouts using CSS Grid and Flexbox
5. **Component Reusability**: Modular, reusable components
6. **Accessibility**: Semantic HTML and proper contrast ratios

## Deployment

This project is ready to deploy on Vercel:

1. Push your code to GitHub
2. Import your repository in Vercel
3. In Vercel project settings, ensure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (default)
   - **Install Command**: `npm install` (default)
   - **Skip Git Submodules**: **IMPORTANT** - Enable this option in Settings → Git to avoid submodule warnings
4. Deploy automatically

**Note**: The submodule warning is harmless but can be disabled in Vercel Settings → Git → "Skip Git Submodules"

## License

© 2024 School of Self-Discovery. All rights reserved.


