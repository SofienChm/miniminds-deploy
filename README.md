# MiniMinds - Deployment Version

This is the deployment version of MiniMinds app configured for:
- **Frontend**: Vercel (Angular)
- **Backend**: Render (.NET API + PostgreSQL)

## Deploy Instructions

### Backend (Render)
1. Go to render.com
2. New Web Service → Connect this repo
3. Root Directory: `miniminds-api`
4. Runtime: Docker
5. Add environment variables:
   - `ASPNETCORE_ENVIRONMENT=Production`
   - `JWT_SECRET_KEY=your-secret-key`
   - `STRIPE_SECRET_KEY=your-stripe-secret`
   - `STRIPE_PUBLISHABLE_KEY=your-stripe-publishable`
   - `STRIPE_WEBHOOK_SECRET=your-stripe-webhook`

### Frontend (Vercel)
1. Go to vercel.com
2. New Project → Import this repo
3. Root Directory: `miniminds-web`
4. Framework: Angular
5. Update `environment.prod.ts` with your Render API URL

## Project Structure
```
miniminds-deploy/
├── miniminds-api/     # .NET API (PostgreSQL)
├── miniminds-web/     # Angular Frontend
└── README.md
```