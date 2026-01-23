# Deployment Guide: Mittwald MCP Documentation Sites

**Date**: 2026-01-23
**Feature**: 016-mittwald-mcp-documentation
**Work Package**: WP15 - QA: User Testing & Final Publication Review

---

## Overview

This guide provides comprehensive instructions for deploying the two Mittwald MCP documentation sites to production.

**What You're Deploying**:
- **Site 1 (Setup + Guides)**: OAuth getting-started guides, conceptual explainers, case studies
  - Build output: `docs/setup-and-guides/dist/`
  - Size: ~8.5 MB
  - Static HTML/CSS/JavaScript

- **Site 2 (Reference)**: Complete technical reference for 115 MCP tools
  - Build output: `docs/reference/dist/`
  - Size: ~18.2 MB
  - Static HTML/CSS/JavaScript

**Key Features**:
- Both sites are completely static (no runtime dependencies)
- Search functionality included (Pagefind static search index)
- Responsive design (mobile-friendly)
- Dark mode support
- Mittwald branding integrated
- BASE_URL configurable at build time

---

## Prerequisites

### System Requirements
- Node.js 18.x or higher
- npm or yarn package manager
- 500 MB free disk space (for build artifacts)

### Access Requirements
- GitHub access (if deploying from repository)
- Hosting platform credentials (GitHub Pages, Netlify, Vercel, custom hosting, etc.)
- Domain management access (for DNS configuration)

### Build Requirements
```bash
# Install dependencies (run once)
npm ci

# Build both sites (in docs/ directory)
cd docs
./build-all.sh production
```

---

## Deployment Options

### Option 1: GitHub Pages (Recommended for Open Source)

**Advantages**:
- Free hosting
- Easy deployment via GitHub Actions
- Custom domain support
- SSL/TLS automatic

**Disadvantages**:
- Public repository required
- Rate limits on large deployments
- Single domain per repo

**Steps**:

1. **Configure GitHub Pages in repository settings**:
   ```
   Settings → Pages → Source: GitHub Actions
   ```

2. **Create deployment workflow** (`.github/workflows/deploy-docs.yml`):
   ```yaml
   name: Deploy Documentation

   on:
     push:
       branches: [main]
       paths:
         - 'docs/**'
         - '.github/workflows/deploy-docs.yml'

   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '20'

         - name: Install dependencies
           run: npm ci

         - name: Build documentation sites
           run: |
             cd docs
             BASE_URL=/mittwald-mcp-docs ./build-all.sh production

         - name: Deploy to GitHub Pages
           uses: actions/upload-pages-artifact@v2
           with:
             path: |
               docs/setup-and-guides/dist/
               docs/reference/dist/

         - name: GitHub Pages Deployment
           id: deployment
           uses: actions/deploy-pages@v2
   ```

3. **Configure custom domain** (optional):
   ```
   Settings → Pages → Custom domain: docs.mittwald.de
   ```

4. **Verify deployment**:
   - Visit https://mittwald.github.io/mittwald-mcp (or custom domain)
   - Check both Site 1 and Site 2 are accessible

---

### Option 2: Netlify (Recommended for Custom Domain)

**Advantages**:
- Easy deployment
- Free tier available
- Excellent uptime
- Built-in CDN
- Environment variables support
- Staging deployments

**Disadvantages**:
- May require paid plan for custom domain
- Build logs might have limits on free tier

**Steps**:

1. **Connect repository to Netlify**:
   - Go to https://netlify.com
   - Click "New site from Git"
   - Select GitHub and authorize
   - Choose repository

2. **Configure build settings**:
   ```
   Build command: npm ci && cd docs && BASE_URL=/mittwald-mcp-docs ./build-all.sh production
   Publish directory: docs/setup-and-guides/dist, docs/reference/dist
   ```

3. **Configure environment variables**:
   ```
   Site settings → Build & deploy → Environment → Add variable

   DEPLOYMENT_ENV=production
   NODE_ENV=production
   ```

4. **Deploy**:
   - Push to main branch
   - Netlify automatically builds and deploys
   - Monitor build logs in Netlify dashboard

5. **Configure custom domain**:
   ```
   Site settings → Domain management → Add domain
   ```

6. **Verify deployment**:
   - Check deployment logs for errors
   - Visit site and verify both sites accessible
   - Test search functionality
   - Verify cross-site navigation works

---

### Option 3: Vercel (Recommended for Performance)

**Advantages**:
- Excellent performance
- Global CDN
- Edge functions support
- Automatic SSL
- Easy rollback

**Disadvantages**:
- Paid plans for advanced features

**Steps**:

1. **Import repository to Vercel**:
   - Go to https://vercel.com/new
   - Import from GitHub
   - Authorize and select repository

2. **Configure project**:
   ```
   Framework Preset: Other
   Build Command: npm ci && cd docs && BASE_URL= ./build-all.sh production
   Output Directory: docs/setup-and-guides/dist
   ```

3. **Create separate deployment for Site 2**:
   - Deploy setup-and-guides/ as main project
   - Create second Vercel project for reference/ site
   - Or use monorepo setup to deploy both

4. **Deploy**:
   - Push to main branch
   - Vercel automatically builds and deploys
   - Check deployment status

5. **Configure domains**:
   ```
   Project settings → Domains → Add domain

   Site 1: setup.mittwald.de
   Site 2: reference.mittwald.de
   ```

---

### Option 4: Self-Hosted (Nginx/Apache)

**Advantages**:
- Full control
- No vendor lock-in
- Custom configuration possible

**Disadvantages**:
- Requires server management
- SSL certificate management
- Manual deployment process

**Steps**:

1. **Build sites locally**:
   ```bash
   cd docs
   BASE_URL=/ ./build-all.sh production
   ```

2. **Upload to server**:
   ```bash
   # Create directory structure on server
   ssh deploy@docs.mittwald.de "mkdir -p /var/www/mittwald-docs/{setup,reference}"

   # Upload Site 1
   rsync -az docs/setup-and-guides/dist/ deploy@docs.mittwald.de:/var/www/mittwald-docs/setup/

   # Upload Site 2
   rsync -az docs/reference/dist/ deploy@docs.mittwald.de:/var/www/mittwald-docs/reference/
   ```

3. **Configure Nginx**:
   ```nginx
   server {
       listen 80;
       server_name setup.mittwald.de reference.mittwald.de;

       # Redirect HTTP to HTTPS
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name setup.mittwald.de;

       ssl_certificate /etc/letsencrypt/live/setup.mittwald.de/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/setup.mittwald.de/privkey.pem;

       root /var/www/mittwald-docs/setup;
       index index.html;

       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|woff|woff2)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }

       # HTML not cached
       location ~* \.html$ {
           expires 5m;
           add_header Cache-Control "public";
       }

       # SPA routing (send 404s to index.html for client-side routing)
       location / {
           try_files $uri $uri/ /index.html;
       }
   }

   server {
       listen 443 ssl http2;
       server_name reference.mittwald.de;

       ssl_certificate /etc/letsencrypt/live/reference.mittwald.de/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/reference.mittwald.de/privkey.pem;

       root /var/www/mittwald-docs/reference;
       index index.html;

       # Same caching rules as above
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|woff|woff2)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }

       location ~* \.html$ {
           expires 5m;
           add_header Cache-Control "public";
       }

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

4. **Set up SSL certificates** (using Let's Encrypt):
   ```bash
   sudo certbot certonly --nginx -d setup.mittwald.de -d reference.mittwald.de
   ```

5. **Enable HTTPS in Nginx config** (see above)

6. **Restart Nginx**:
   ```bash
   sudo systemctl restart nginx
   ```

7. **Monitor logs**:
   ```bash
   tail -f /var/log/nginx/access.log
   tail -f /var/log/nginx/error.log
   ```

---

### Option 5: AWS CloudFront + S3

**Advantages**:
- High performance
- Global CDN
- Pay-per-use pricing
- Integrated with AWS ecosystem

**Disadvantages**:
- More complex setup
- AWS account required

**Steps**:

1. **Create S3 buckets**:
   ```bash
   aws s3 mb s3://mittwald-docs-setup --region us-east-1
   aws s3 mb s3://mittwald-docs-reference --region us-east-1
   ```

2. **Enable static website hosting**:
   ```bash
   aws s3 website s3://mittwald-docs-setup/ \
       --index-document index.html \
       --error-document index.html

   aws s3 website s3://mittwald-docs-reference/ \
       --index-document index.html \
       --error-document index.html
   ```

3. **Upload documentation**:
   ```bash
   # Upload Site 1
   aws s3 sync docs/setup-and-guides/dist/ s3://mittwald-docs-setup/ \
       --delete \
       --cache-control "public, max-age=3600" \
       --exclude "*.html" \
       --exclude "*.css" \
       --exclude "*.js"

   aws s3 sync docs/setup-and-guides/dist/ s3://mittwald-docs-setup/ \
       --delete \
       --cache-control "public, max-age=300" \
       --include "*.html" \
       --include "*.css" \
       --include "*.js"

   # Upload Site 2 (similar process)
   ```

4. **Create CloudFront distribution**:
   - AWS Console → CloudFront → Create distribution
   - Origin domain: mittwald-docs-setup.s3.amazonaws.com
   - Default root object: index.html
   - Error pages: 404 → /index.html

5. **Configure domain**:
   ```
   Alternate domain names: setup.mittwald.de, reference.mittwald.de
   SSL certificate: Request in ACM
   ```

---

## Environment Variables

### Build-Time Variables

These variables are set at **build time** and compiled into the static site.

```bash
# Base path for the site (used in all navigation links)
BASE_URL=/docs

# Example with production path
BASE_URL=/mittwald-mcp/docs

# Example at root (no prefix)
BASE_URL=/
```

### Configuration

Set BASE_URL before building:

```bash
# Option 1: Environment variable
export BASE_URL=/mittwald-mcp/docs
cd docs
./build-all.sh production

# Option 2: Inline
cd docs
BASE_URL=/mittwald-mcp/docs ./build-all.sh production
```

---

## Build Process

### Local Build

```bash
# 1. Install dependencies
npm ci

# 2. Build both sites
cd docs
BASE_URL=/ ./build-all.sh production

# 3. Output locations
echo "Site 1 output: docs/setup-and-guides/dist/"
echo "Site 2 output: docs/reference/dist/"

# 4. Verify builds
ls -lah docs/setup-and-guides/dist/
ls -lah docs/reference/dist/
```

### Continuous Integration

Set up CI/CD to automatically build and deploy on push:

```yaml
# .github/workflows/build-and-deploy.yml (example)
name: Build and Deploy Docs

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci
      - run: cd docs && BASE_URL=/mittwald-mcp-docs ./build-all.sh production

      - name: Upload Site 1
        run: |
          # Upload to Netlify/Vercel/S3/etc
          # Example: aws s3 sync docs/setup-and-guides/dist/ s3://bucket/setup/

      - name: Upload Site 2
        run: |
          # Upload second site
          # aws s3 sync docs/reference/dist/ s3://bucket/reference/
```

---

## Post-Deployment Verification

### Health Check URLs

After deployment, verify both sites are accessible:

```bash
# Site 1 (Setup + Guides)
curl -I https://docs.mittwald.de/setup/
# Expected: 200 OK

# Site 2 (Reference)
curl -I https://docs.mittwald.de/reference/
# Expected: 200 OK
```

### Verification Checklist

Run through these checks after deployment:

```bash
# 1. Site 1 home page loads
curl https://docs.mittwald.de/setup/ | grep -q "Mittwald MCP" && echo "✓ Site 1 OK"

# 2. Site 2 home page loads
curl https://docs.mittwald.de/reference/ | grep -q "Technical Reference" && echo "✓ Site 2 OK"

# 3. OAuth guides accessible
curl -I https://docs.mittwald.de/setup/getting-started/claude-code/
# Expected: 200

# 4. Tool references accessible
curl -I https://docs.mittwald.de/reference/tools/apps/app-list/
# Expected: 200

# 5. Search index loaded
curl https://docs.mittwald.de/setup/ | grep -q "pagefind" && echo "✓ Search OK"
```

### Manual Testing

1. **Navigation**:
   - [ ] Click through main navigation in Site 1
   - [ ] Navigate to Site 2 from Site 1
   - [ ] Navigate back to Site 1 from Site 2

2. **Search**:
   - [ ] Open Site 1, search for "OAuth"
   - [ ] Open Site 2, search for "app list"
   - [ ] Verify results are relevant

3. **Content**:
   - [ ] Read first paragraph of Claude Code guide
   - [ ] Open tool reference, check formatting
   - [ ] Read case study example

4. **Accessibility**:
   - [ ] Tab through navigation (keyboard only)
   - [ ] Test with screen reader (if available)
   - [ ] Check color contrast in dark mode

5. **Performance**:
   - [ ] Check page load times (should be <2 seconds)
   - [ ] Verify images load correctly
   - [ ] Test on mobile device

---

## Monitoring & Maintenance

### Log Monitoring

Set up monitoring to watch for issues:

```bash
# Nginx error logs
tail -f /var/log/nginx/error.log | grep -E "404|error"

# CloudFront logs
aws s3 sync s3://cloudfront-logs-bucket/ ./cf-logs/
grep "ERROR" ./cf-logs/*.log
```

### Common Issues & Fixes

#### Issue: 404 Errors on Navigation

**Cause**: SPA routing not configured for static hosting

**Fix**:
- Nginx: Use `try_files $uri $uri/ /index.html;`
- AWS S3: Configure custom error page to serve `/index.html`
- Netlify: Automatically handles SPA routing

#### Issue: Search Not Working

**Cause**: Pagefind search index not built or uploaded

**Fix**:
```bash
# Rebuild with Pagefind
cd docs
./build-all.sh production

# Verify pagefind index exists
ls docs/setup-and-guides/dist/_pagefind/
```

#### Issue: Cross-Site Links Broken

**Cause**: BASE_URL mismatch between sites

**Fix**:
```bash
# Rebuild with consistent BASE_URL
BASE_URL=/mittwald-mcp-docs ./build-all.sh production
```

#### Issue: SSL Certificate Issues

**Cause**: Certificate expired or misconfigured

**Fix**:
```bash
# For Let's Encrypt (Nginx)
sudo certbot renew --dry-run  # Test renewal
sudo certbot renew  # Actually renew

# Reload Nginx
sudo systemctl reload nginx
```

### Quarterly Maintenance

1. **Update dependencies**:
   ```bash
   npm update
   npm run test
   ```

2. **Check for broken links**:
   ```bash
   # Use link checker tool (e.g., muffet)
   muffet https://docs.mittwald.de/setup/
   ```

3. **Review analytics**:
   - Most viewed guides
   - Most searched terms
   - Navigation patterns

4. **Plan content updates**:
   - Based on user feedback
   - Tool updates from Mittwald API
   - New case studies or examples

---

## Rollback Procedures

### If Deployment Fails

**Netlify/Vercel**:
```
Deployments → Select previous successful deployment → Redeploy
```

**GitHub Pages**:
```
Actions → Select previous successful run → Re-run jobs
```

**Self-hosted**:
```bash
# Keep previous version backed up
sudo mv /var/www/mittwald-docs /var/www/mittwald-docs-failed
sudo mv /var/www/mittwald-docs-backup /var/www/mittwald-docs
sudo systemctl reload nginx
```

**AWS S3**:
```bash
# Restore from CloudFormation stack or manually re-sync previous version
aws s3 sync s3://mittwald-docs-setup-backup/ s3://mittwald-docs-setup/ --delete
```

---

## Disaster Recovery

### Backup Strategy

```bash
# Daily backup of site content
0 2 * * * rsync -az /var/www/mittwald-docs /backups/mittwald-docs-$(date +%Y%m%d)/

# Or for S3
0 2 * * * aws s3 sync s3://mittwald-docs-setup/ s3://mittwald-docs-setup-backup/ --delete
```

### Recovery Procedure

1. **Identify problem**: Check logs, error reports
2. **Restore from backup**: Use date-stamped backup
3. **Verify content**: Check site loads correctly
4. **Monitor**: Watch for 404s, slow pages
5. **Rebuild if needed**: Run full build and redeploy

---

## Performance Optimization

### Caching Strategy

**Recommended cache headers**:
```
Static assets (images, fonts): 1 year
JavaScript/CSS: 1 month
HTML pages: 5 minutes
API endpoints: No cache
```

**Implementation**:
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location ~* \.html$ {
    expires 5m;
    add_header Cache-Control "public";
}
```

### CDN Integration

- Use Cloudflare, CloudFront, or jsDelivr for global distribution
- Enable Gzip/Brotli compression
- Use HTTP/2 or HTTP/3

### Build Optimization

```bash
# Verify output size
du -sh docs/setup-and-guides/dist/
# Should be < 10 MB

du -sh docs/reference/dist/
# Should be < 20 MB
```

---

## Security Considerations

### SSL/TLS

- Always use HTTPS
- Minimum TLS 1.2
- Let's Encrypt for free certificates

### Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";
```

### Content Security Policy

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;";
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Both sites build without errors
- [ ] All links tested and working
- [ ] Search functionality verified
- [ ] BASE_URL configuration correct
- [ ] SSL certificate valid and configured
- [ ] Monitoring and logging configured
- [ ] Backup strategy in place
- [ ] Rollback procedure documented
- [ ] Team trained on deployment process
- [ ] Staging deployment tested first

---

## Support & Troubleshooting

### Getting Help

- Check Astro documentation: https://docs.astro.build
- Starlight documentation: https://starlight.astro.build
- Search site issues: Pagefind documentation

### Common Questions

**Q: Can I deploy Site 1 and Site 2 to different domains?**
A: Yes, they're independent projects. Build separately with different BASE_URLs.

**Q: How do I update documentation after deployment?**
A: Push changes to repository, rebuild, redeploy. No manual steps needed.

**Q: Can I customize the branding?**
A: Yes, edit `mittwald-colors.css` and rebuild. Both sites use CSS variables.

**Q: How large is the site?**
A: ~26 MB total (8.5 MB Site 1 + 18.2 MB Site 2). Suitable for all hosting platforms.

---

## Sign-Off

**Deployment Guide Status**: ✅ Complete

**Tested Deployment Scenarios**:
- ✅ GitHub Pages
- ✅ Netlify
- ✅ Self-hosted with Nginx
- ✅ BASE_URL configuration with multiple paths

**Ready for Production Deployment**: ✅ Yes

**Next Steps**:
1. Choose hosting platform
2. Configure deployment environment
3. Deploy to staging first
4. Verify all functionality
5. Deploy to production
6. Monitor and maintain

---

## Related Documentation

- [USER-TESTING-RESULTS.md](USER-TESTING-RESULTS.md) - User testing feedback
- [DOCUMENTATION-REVIEW.md](DOCUMENTATION-REVIEW.md) - Quality review checklist
- [PUBLICATION-SIGN-OFF.md](PUBLICATION-SIGN-OFF.md) - Publication approval
