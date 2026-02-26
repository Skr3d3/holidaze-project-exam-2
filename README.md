# Holidaze

![image](https://skr3d3.com/images/screenshot-holidaze.png)

Project Exam 2 for Noroff — a front-end application for the Holidaze accommodation booking platform.

## Description

Holidaze is a booking platform UI where users can browse venues, view details and availability, and manage bookings. Authenticated users can register/login, maintain a profile, and (if they are Venue Managers) create and manage venues.

Key features include:

- Browse venues with search and filtering
- View venue details (amenities, location, availability)
- User authentication (register/login)
- Booking management
- Venue CRUD for Venue Managers
- Profile management (avatar + stats)

## Built With

- [React](https://react.dev/) (v19)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

## Getting Started

### Installing

1. Clone the repository:

```bash
git clone <repository_url>
cd holidaze-project-exam-2
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root and add the required variables:

```env
REACT_APP_API_AUTH=https://v2.api.noroff.dev
REACT_APP_API_BASE=https://v2.api.noroff.dev/holidaze
REACT_APP_API_KEY=your_api_key_here
```

### Running

To run the app in development mode:

```bash
npm start
```

To build for production:

```bash
npm run build
```

To run tests:

```bash
npm test
```

## Contributing

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## Contact

- GitHub: https://github.com/Skr3d3

## License

- TBA

## Acknowledgments

- Noroff — Project Exam 2 brief and API resources.
