src/
├── features/                     # modules (Business Logic)
│   └── [feature-name]/        
│       ├── api/                  # Only api calls using apiClient...
│       ├── components/           # UI components exclusive to this feature
│       ├── hooks/                # Business logic encapsulated in React Hooks, React query get and mutations...
│       ├── store/                # Local state management strictly for this feature
│       ├── types/                # TypeScript interfaces, types, and DTOs
│       ├── utils/                # Helper functions specific to this feature
│       └── index.ts              # 🚪 PUBLIC API: Exports ONLY what the app needs
│
├── layouts/                      # Structural page wrappers
│   └── [LayoutName].tsx          # e.g., AdminLayout.tsx, MobileLayout.tsx
│
├── pages/                        # Route Entry Points (Aggregates Features & Layouts)
│   └── [route-group]/            # Grouped by application section (e.g., seller/, public/, /buyer)
│       └── [PageName].tsx        # Renders the final screen tying layouts and features together
│
├── shared/                       # 🛠️ Cross-Domain Toolkit (NO business logic allowed)
│   ├── assets/                   # Global styles, fonts, SVGs, static images
│   ├── components/               # Dumb/Reusable UI (Buttons, Inputs, Modals, Spinners)
│   ├── config/                   # Global environment variables and system constants
│   ├── hooks/                    # Generic hooks (useWindowSize, useDebounce, useClickOutside)
│   ├── services/                 # Core instances ( apiClient...)
│   ├── store/                    # Global application state (Auth, UserSession, Theme)
│   ├── types/                    # Global contracts (API DTOs, generic event payloads)
│   └── utils/                    # Generic helpers (formatCurrency, formatDate, validators)
│
├── App.tsx                       # Global Providers (Theme, QueryClient) and Router setup
└── main.tsx                      # Main React DOM mounting point