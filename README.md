# Commet AI - Professional Logo Generation Platform

A modern, minimalist web application for AI-powered logo generation built with React, TypeScript, and Lovable Cloud.

## Features

- **AI Logo Generation**: Create professional logos from text descriptions
- **Style Selection**: Choose from multiple design styles (Minimal, Luxury, Futuristic, Retro, Playful)
- **File Upload**: Upload reference images for inspiration
- **Real-time Progress**: Track generation progress with visual feedback
- **Result Gallery**: View, compare, and download multiple logo variations
- **Download Options**: Export logos in PNG and SVG formats

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Shadcn/ui
- **Animations**: Framer Motion
- **Backend**: Lovable Cloud (Supabase Edge Functions)
- **Deployment**: Vercel

## Architecture

### Frontend Structure

```
src/
├── components/
│   ├── Hero.tsx           # Landing section
│   ├── LogoForm.tsx       # Generation form
│   ├── ProgressBar.tsx    # Progress tracking
│   ├── Gallery.tsx        # Results display
│   └── Layout.tsx         # App layout wrapper
├── lib/
│   └── api.ts             # API client
└── pages/
    └── Index.tsx          # Main page
```

### Backend Endpoints

#### POST `/functions/v1/generate`

Accepts logo generation request and returns job ID.

**Request Body:**

```json
{
  "description": "Minimal geometric logo for NovaTech",
  "style": "futuristic",
  "colors": ["#00BFFF", "#000000"],
  "files": ["base64_encoded_image"]
}
```

**Response:**

```json
{
  "job_id": "uuid",
  "status": "queued"
}
```

#### POST `/functions/v1/result`

Fetches generation result by job ID.

**Request Body:**

```json
{
  "job_id": "uuid"
}
```

**Response:**

```json
{
  "status": "completed",
  "variants": [
    {
      "id": "1",
      "url": "https://...",
      "score": 0.92,
      "metadata": {
        "model": "sdxl-lora-v1",
        "prompt": "Generated prompt"
      }
    }
  ]
}
```

## Environment Variables

Required secrets (configured in Lovable Cloud):

- `N8N_WEBHOOK_URL` - n8n webhook endpoint for AI pipeline
- `RESULT_BASE_URL` - Base URL for result storage

Auto-configured by Lovable Cloud:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard:
   - Add all Supabase variables from Lovable Cloud
3. Deploy

### Backend Configuration

Edge functions are automatically deployed with Lovable Cloud. No manual deployment needed.

## Integration with n8n Workflow

The app is designed to integrate with an n8n workflow:

1. User submits logo generation request
2. Frontend calls `/generate` edge function
3. Edge function forwards request to n8n webhook (`N8N_WEBHOOK_URL`)
4. n8n workflow processes request:
   - LLM extracts brand identity
   - Generates prompts
   - Creates logo with SDXL + LoRA
   - Upscales with Real-ESRGAN
   - Vectorizes with DeepSVG
   - Scores with CLIP
   - Uploads to storage
5. Frontend polls `/result` until completion
6. Results displayed in gallery

## Customization

### Design System

All colors and styles are defined in:

- `src/index.css` - CSS variables
- `tailwind.config.ts` - Tailwind configuration

### Mock vs Production

The app currently returns mock data when `RESULT_BASE_URL` is not configured or fetch fails. This allows full development and testing without a live AI backend.

## Roadmap

- [ ] User authentication and saved projects
- [ ] Payment integration with Stripe
- [ ] Advanced customization tools
- [ ] Brand kit export
- [ ] Team collaboration features

## License

MIT

## Support

For questions or support, visit [Lovable Documentation](https://docs.lovable.dev)
