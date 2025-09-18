# The Daily Pause

A contemplative journaling application inspired by Richard Rohr's spiritual wisdom, combining the structure of the Five Minute Journal with deep spiritual reflection.

## Features

- **Morning Contemplation**: Start your day with gratitude, intention setting, and prayer
- **Evening Reflection**: End your day by recognizing the sacred in everyday moments
- **Beautiful Backgrounds**: Calming nature images from Unsplash
- **Secure Authentication**: User accounts with encrypted passwords
- **Daily Entries**: One journal entry per day with morning and evening sections

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd the-daily-pause
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```
DATABASE_URL="postgresql://username:password@localhost:5432/daily_pause"
JWT_SECRET="your-secure-jwt-secret-key"
```

4. Set up the database:
```bash
npx prisma migrate dev
```

5. Generate Prisma client:
```bash
npx prisma generate
```

### Development

Run the development server:
```bash
npm run dev
```

This starts the React development server on `http://localhost:3000`.

### Production

Build and start the production server:
```bash
npm run build
npm start
```

## Deployment on Railway

1. Connect your GitHub repository to Railway
2. Add a PostgreSQL service to your Railway project
3. Set the following environment variables in Railway:
   - `JWT_SECRET`: A secure secret key for JWT tokens
4. The `DATABASE_URL` will be automatically set by Railway's PostgreSQL service
5. Deploy!

## Spiritual Prompts

### Morning Practice
- Three gratitudes to begin the day
- Setting a daily intention
- A prayer or sacred word to carry forward

### Evening Practice
- Recognizing where the Divine appeared in your day
- Reflecting on life's teachings
- Gratitude for the day's gifts

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcrypt
- **Images**: Unsplash API
- **Deployment**: Railway

## License

This project is licensed under the MIT License.

## Inspiration

"We do not think ourselves into new ways of living, we live ourselves into new ways of thinking." - Richard Rohr

This application is designed to help users cultivate a daily practice of noticing the sacred in ordinary moments, drawing from the contemplative tradition that Richard Rohr teaches.
