# Bookings - Embassy Appointment Scheduling System

A modern appointment scheduling application built with Next.js, TypeScript, and Convex for embassy services.

## Features

### For Users
- 🔐 Secure registration and authentication
- 📅 Book appointments with embassy representatives
- 📄 Upload and manage documents (passport, visa, profile photo)
- 📊 Track appointment status (pending, accepted, rejected, completed)
- 🗓️ View appointment history
- ❌ Cancel appointments

### For Embassy Representatives
- 👤 Separate login portal
- 📋 Manage appointment requests
- ✅ Accept or reject appointments with reasons
- 📝 Add notes to appointments
- ⏰ Set availability schedule
- 🔧 Configure working hours and break times
- 📈 View daily appointment schedule

## Tech Stack

- **Frontend**: Next.js 15.4, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui
- **Backend**: Convex (serverless backend)
- **Authentication**: Custom JWT-based auth with bcrypt
- **File Storage**: Convex file storage
- **Forms**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. Clone the repository
```bash
git clone git@github.com:Stoops0311/booking-ntt.git
cd booking-ntt
```

2. Install dependencies
```bash
npm install
```

3. Set up Convex
```bash
npx convex dev
```
This will create a new Convex project and add the necessary environment variables to `.env.local`.

4. Start the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Creating Embassy Representative Accounts

Representatives cannot register through the public form. Use one of these methods:

### Method 1: Convex Dashboard
1. Go to your Convex dashboard
2. Navigate to Functions
3. Find `representativeActions:createRepresentative`
4. Run with sample data:
```json
{
  "fullName": "John Smith",
  "email": "john.smith@embassy.gov",
  "phone": "+1234567890",
  "dateOfBirth": "1985-03-15",
  "nationality": "American",
  "passportId": "A12345678",
  "password": "SecurePass123!",
  "department": "Visa Services",
  "title": "Senior Visa Officer",
  "specializations": ["Tourist Visas", "Business Visas"],
  "maxAppointmentsPerDay": 20
}
```

### Method 2: CLI Script
```bash
npm run create-representative
```

## Project Structure

```
booking-ntt/
├── app/                    # Next.js app directory
│   ├── dashboard/         # User dashboard pages
│   ├── representative/    # Representative pages
│   └── (auth)/           # Authentication pages
├── components/            # React components
│   ├── auth/             # Authentication components
│   └── ui/               # Shadcn UI components
├── convex/               # Convex backend
│   ├── schema.ts         # Database schema
│   ├── auth*.ts          # Authentication functions
│   ├── appointments.ts   # Appointment logic
│   └── availability.ts   # Availability management
├── lib/                  # Utility functions
└── scripts/              # CLI scripts
```

## Database Schema

- **users**: User accounts (both regular users and representatives)
- **representatives**: Additional data for embassy representatives
- **appointments**: Appointment requests and their status
- **availability**: Representative working hours and schedules
- **sessions**: Authentication sessions

## Environment Variables

The following environment variables are automatically set by Convex in `.env.local`:

- `CONVEX_DEPLOYMENT`: Your Convex deployment identifier
- `NEXT_PUBLIC_CONVEX_URL`: Your Convex backend URL

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run create-representative` - Create representative account

## Security Notes

- Passwords are hashed using bcrypt
- Sessions expire after 7 days
- File uploads are validated for type and size
- Representatives are pre-verified and can only be created through admin tools

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Backend powered by [Convex](https://www.convex.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)