# 🛠️ Development Setup Guide

## Quick Start

### Option 1: Client-Only Development (Recommended for Local Development)
```bash
npm run dev
# or
npm run dev:client-only
```
This runs the app without Netlify Functions, using only client-side processing.

### Option 2: Full Netlify Development (For Testing Server Functions)
```bash
npm run dev:netlify
```
⚠️ **Note**: This requires Sharp.js to be installed, which may not work in all development environments.

## Development vs Production

### Local Development
- **Processing**: Client-side only (Canvas API)
- **Analytics**: Client-side calculations
- **Performance**: Good for testing and development
- **Dependencies**: No native dependencies required

### Production (Netlify)
- **Processing**: Hybrid (server-side with Sharp.js + client fallback)
- **Analytics**: Server-side advanced analytics
- **Performance**: Optimized for production workloads
- **Dependencies**: Sharp.js available in serverless environment

## Troubleshooting

### "Could not resolve 'sharp'" Error

This error occurs when trying to run Netlify Functions locally without Sharp.js installed. 

**Solutions:**

1. **Use client-only development** (recommended):
   ```bash
   npm run dev:client-only
   ```

2. **Install Sharp.js** (may not work on all systems):
   ```bash
   cd netlify/functions
   npm install
   cd ../..
   npm run dev:netlify
   ```

3. **Skip functions during development**:
   The app automatically detects when server functions are unavailable and falls back to client processing.

### Development Notice

When running locally, you'll see a blue notice banner explaining that server functions are not available. This is normal and expected behavior.

### Testing Server Functions

To test server functions:

1. **Deploy to Netlify** (recommended):
   ```bash
   git push origin main
   ```

2. **Use Netlify CLI with proper setup**:
   ```bash
   # Install Sharp in functions directory
   cd netlify/functions
   npm install sharp
   cd ../..
   
   # Run with Netlify CLI
   netlify dev
   ```

## Architecture Overview

### Hybrid Processing System

The app uses an intelligent system that automatically chooses between:

- **Server Processing**: For large batches, complex operations, high-quality outputs
- **Client Processing**: For small batches, simple operations, when server unavailable

### Automatic Fallback

```javascript
// The system automatically handles fallbacks:
try {
  // Attempt server processing
  result = await processImagesHybrid(files, options);
} catch (error) {
  // Automatically falls back to client processing
  result = await batchProcessImages(files, options);
}
```

## Development Features

### Smart Processing Selection

The app automatically detects:
- Server availability
- Network conditions  
- File size and complexity
- Device capabilities

### Development Indicators

- **Blue dot**: Client-side processing
- **Green dot**: Server-side processing
- **Orange warning**: Fallback mode
- **Loading spinner**: Server analytics loading

## Performance Comparison

| Scenario | Client Processing | Server Processing | 
|----------|------------------|-------------------|
| **Small files (< 2MB)** | Fast | Slower (network overhead) |
| **Large files (> 5MB)** | Slow | Fast |
| **Large batches (10+ files)** | Very slow | Fast |
| **Complex algorithms** | Slow | Fast |
| **Mobile devices** | Battery drain | Efficient |

## Best Practices

### For Development

1. **Use client-only mode** for most development work
2. **Test with small file sets** to avoid long processing times
3. **Use the development notice** to understand current mode
4. **Check browser console** for processing method logs

### For Production Testing

1. **Deploy to Netlify** to test full functionality
2. **Test with various file sizes** and batch sizes
3. **Monitor function logs** in Netlify dashboard
4. **Verify fallback behavior** by temporarily disabling functions

## Environment Variables

```bash
# Optional: Custom limits
VITE_MAX_FILE_SIZE=52428800  # 50MB
VITE_MAX_FILES=100           # Maximum files per batch
```

## Deployment

### Netlify Deployment

1. **Push to repository**:
   ```bash
   git add .
   git commit -m "Deploy with server optimization"
   git push origin main
   ```

2. **Netlify automatically**:
   - Installs Sharp.js in serverless environment
   - Builds and deploys functions
   - Configures CORS and routing
   - Enables hybrid processing

### Manual Function Testing

```bash
# Test function endpoints directly
curl -X OPTIONS https://your-app.netlify.app/.netlify/functions/image-processor

# Should return CORS headers if working correctly
```

## Common Issues

### 1. Functions Not Loading
- Check `netlify.toml` configuration
- Verify function file structure
- Check Netlify build logs

### 2. CORS Errors
- Verify headers in `netlify.toml`
- Check function response headers
- Test with OPTIONS requests

### 3. Sharp.js Issues
- Use client-only development mode
- Deploy to Netlify for server functions
- Check Node.js version compatibility

### 4. Processing Timeouts
- Reduce batch sizes for testing
- Check network connectivity
- Monitor function execution time

## Support

For development issues:

1. **Check this guide** for common solutions
2. **Use client-only mode** for most development
3. **Deploy to Netlify** for full testing
4. **Check browser console** for detailed logs

---

**Remember**: The hybrid system is designed to work seamlessly in both development and production environments. Local development focuses on functionality, while production deployment provides optimal performance.
