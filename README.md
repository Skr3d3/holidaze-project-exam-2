# Holidaze

Project Exam 2 for Noroff. A front-end application for the Holidaze accommodation booking platform.

## Features

- **Venue Browsing:** Search and filter available venues.
- **Venue Details:** View venue amenities, location, and availability.
- **Authentication:** User login and registration.
- **Booking System:** View and manage bookings.
- **Venue Management:** Create, update, and delete venues (for Venue Managers).
- **Profile:** Update avatar and view profile statistics.

## Tech Stack

- React (v19)
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query (React Query)
- React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd holidaze-project-exam-2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

Create a `.env` file in the root directory.

Supported variables:

```env
REACT_APP_API_AUTH=https://v2.api.noroff.dev
REACT_APP_API_BASE=https://v2.api.noroff.dev/holidaze
REACT_APP_API_KEY=your_api_key_here
```

### Scripts

**Development**
Runs the app in development mode at [http://localhost:3000](http://localhost:3000).
```bash
npm start
```

**Build**
Builds the app for production to the `build` folder.
```bash
npm run build
```

**Test**
Launches the test runner.
```bash
npm test
```

## Project Structure

```
src/
├── app/            # Providers and routing
├── components/     # UI components
├── lib/            # API clients and utilities
├── pages/          # Page views
└── types/          # Type definitions
```

## Contributing

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.
