# Deployment Guide for Vercel

This guide will help you deploy your Vivid Valid email validator application to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your project code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. Node.js installed on your local machine

## Deployment Options

### Option 1: Deploy Frontend Only (Recommended)

Since your application has a backend that requires Node.js and specific ports, you'll need to deploy the backend separately and the frontend to Vercel.

#### Step 1: Deploy Backend to a Hosting Service

You have several options for hosting your backend:

1. **Render.com** (Recommended for Node.js apps)
2. **Heroku**
3. **Railway**
4. **DigitalOcean App Platform**
5. **AWS Elastic Beanstalk**

For this example, we'll use Render.com:

1. Sign up at [render.com](https://render.com)
2. Create a new Node.js service
3. Connect your Git repository
4. Configure the service:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && node server.js`
   - Port: 3001
5. Add environment variables if needed

#### Step 2: Update Frontend API URL

In your frontend code, update the API URL to point to your deployed backend:

```typescript
// src/lib/emailValidation.ts
const API_BASE_URL = "https://your-backend-url.onrender.com/api";
```

#### Step 3: Deploy Frontend to Vercel

1. Push your code to a Git repository
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project"
4. Import your Git repository
5. Configure the project:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
6. Add environment variables if needed
7. Click "Deploy"

### Option 2: Full Stack Deployment with Serverless Functions

If you want to deploy everything to Vercel, you'll need to refactor your backend to use Vercel Serverless Functions.

#### Step 1: Restructure Your Project

1. Move your backend API routes to the `api` directory:

   ```
   api/
     email/
       validate.js
       validate-bulk.js
       suggest.js
       domain/
         [domain]/
           health.js
   ```

2. Convert your Express routes to Vercel Serverless Functions

Example for `api/email/validate.js`:

```javascript
const EmailValidator = require("../../backend/src/validators/emailValidator");

module.exports = async (req, res) => {
  try {
    const { email, options = {} } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email address is required",
        code: "MISSING_EMAIL",
      });
    }

    const validator = new EmailValidator(options);
    const result = await validator.validate(email);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Validation error:", error);
    res.status(500).json({
      error: "Validation failed",
      message: error.message,
      code: "VALIDATION_ERROR",
    });
  }
};
```

#### Step 2: Update vercel.json Configuration

Create a `vercel.json` file in your project root:

```json
{
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    }
  ]
}
```

#### Step 3: Update Frontend API URL

Since both frontend and backend will be on the same domain, update the API URL:

```typescript
// src/lib/emailValidation.ts
const API_BASE_URL = "/api";
```

#### Step 4: Deploy to Vercel

1. Push your restructured code to Git
2. Deploy to Vercel as described in Option 1

## Environment Variables

You may need to add environment variables in Vercel:

1. Go to your Vercel project dashboard
2. Click on "Settings" > "Environment Variables"
3. Add any required environment variables

Common variables for this project:

- `NODE_ENV=production`
- Any API keys for external services

## Post-Deployment Steps

1. **Test Your Application**

   - Visit your deployed URL
   - Test the email validation functionality
   - Verify that the backend connection is working

2. **Set Up Custom Domain** (Optional)

   - In Vercel dashboard, go to "Settings" > "Domains"
   - Add your custom domain and follow the DNS instructions

3. **Monitor Your Application**
   - Set up Vercel Analytics for performance monitoring
   - Configure error tracking if needed

## Troubleshooting

### Common Issues

1. **Backend Connection Errors**

   - Verify your backend is deployed and running
   - Check that the API URL is correct
   - Ensure CORS is properly configured

2. **Build Failures**

   - Check the build logs in Vercel dashboard
   - Ensure all dependencies are properly listed in package.json
   - Verify the build command is correct

3. **Serverless Function Timeouts**
   - Vercel has a 10-second timeout for serverless functions
   - If your email validation takes longer, consider optimizing or using a different approach

### Debugging

1. Use Vercel's built-in logging to debug issues
2. Test locally with `vercel dev` command
3. Check the Network tab in browser dev tools for API errors

## Cost Considerations

- Vercel offers a generous free tier for hobby projects
- Backend hosting costs will depend on the service you choose
- Consider the number of API calls and resource usage for pricing

## Alternative Deployment

If you prefer a simpler setup, consider using:

1. **Netlify** for frontend with Netlify Functions for backend
2. **Railway** for full-stack deployment
3. **Render.com** for full-stack deployment

Each platform has its own strengths and pricing model, so choose based on your specific needs.
