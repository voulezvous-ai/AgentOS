# AgentOS Frontend Deployment Guide

This guide outlines the process for deploying the AgentOS frontend to Vercel, following the enterprise architecture standards established for the AgentOS platform.

## Project Structure

The frontend is organized in a standard React/Vite project structure:

```
frontend-vercel/
├── public/              # Static assets
├── src/                 # Source code
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── styles/          # SCSS and CSS files
│   ├── utils/           # Utility functions
│   ├── services/        # API and service integrations
│   ├── App.jsx          # Main application component
│   └── main.jsx         # Application entry point
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
└── vercel.json          # Vercel deployment configuration
```

## Deployment Process

### Automatic Deployment (CI/CD)

The frontend is automatically deployed to Vercel when changes are pushed to the `main` branch, specifically to files in the `frontend-vercel/` directory.

1. The GitHub Actions workflow (`.github/workflows/vercel-frontend-deploy.yml`) is triggered
2. Node.js is set up and dependencies are installed
3. The application is built
4. The Vercel CLI deploys the built application to production

### Manual Deployment

To deploy the frontend manually:

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Navigate to the frontend directory:
   ```
   cd frontend-vercel
   ```

3. Log in to Vercel:
   ```
   vercel login
   ```

4. Deploy to production:
   ```
   vercel --prod
   ```

## Configuration

### Environment Variables

The following environment variables are used in the frontend deployment:

- `VITE_API_URL`: URL of the backend API (default: https://agentos-api.railway.app)

These can be configured in the Vercel dashboard or in the `vercel.json` file.

### Vercel Project Settings

For optimal deployment, the following settings are recommended in the Vercel dashboard:

1. **Framework Preset**: Vite
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Install Command**: `npm install`

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are correctly listed in `package.json`
   - Ensure that the build script is correctly configured
   - Verify that environment variables are properly set

2. **Routing Issues**
   - Ensure that the `rewrites` configuration in `vercel.json` is correct
   - Check that the application is using client-side routing correctly

3. **Missing Assets**
   - Verify that assets are being referenced with the correct paths
   - Check that the `public` directory contains all necessary static files

### Deployment Logs

Deployment logs can be accessed in the Vercel dashboard. These logs provide detailed information about the build and deployment process, which can be helpful for diagnosing issues.

## Integration with Other Services

The frontend integrates with the following AgentOS microservices:

1. **AgentOS-API**: Gateway and authentication
2. **AgentOS-Vox**: AI assistant integration
3. **AgentOS-WebSocket**: Real-time communication
4. **AgentOS-Metrics**: Monitoring and dashboards

## Security Considerations

1. **Environment Variables**: Sensitive information should be stored as environment variables and not committed to the repository
2. **API Access**: All API requests should be authenticated and authorized
3. **CORS Configuration**: Ensure that CORS is properly configured to allow only necessary origins

## Performance Optimization

The following performance optimizations are implemented:

1. **Code Splitting**: Components are loaded only when needed
2. **Asset Optimization**: Images and other assets are optimized during the build process
3. **Caching**: Proper cache headers are set for static assets

---

*This document is part of the AgentOS enterprise software architecture documentation.*
