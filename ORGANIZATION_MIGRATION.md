# Organization Migration Guide

## Current Status

The Docker containerization setup is complete and working. The GitHub Actions workflow has been simplified to focus on container publishing without the problematic update-compose job.

## Migration Steps for Aexawareinfotech-Pvt-Ltd Organization

### 1. Repository Setup Options

#### Option A: Fork from Current Repository (Recommended)

1. **Fork the repository** from `https://github.com/jaainil/vivid-valid` to `Aexawareinfotech-Pvt-Ltd/vivid-valid`
2. **Enable GitHub Actions** in the forked repository
3. **Update package visibility** to public in the organization settings

#### Option B: Manual Repository Creation

1. **Create new repository** under Aexawareinfotech-Pvt-Ltd organization
2. **Clone and push** the code to the new repository
3. **Configure GitHub Actions** and package settings

### 2. Package Visibility Configuration

#### Making Packages Public

1. Go to **Organization Settings** → **Packages**
2. Find the packages:
   - `vivid-valid/frontend`
   - `vivid-valid/backend`
3. **Change visibility** from private to public
4. **Set package permissions** to allow public access

#### Alternative: Keep Private with Access

If keeping packages private:

1. **Add organization members** to package access
2. **Configure authentication** for private registry access
3. **Update deployment documentation** for private registry usage

### 3. Configuration Updates for Organization

#### Files to Update After Migration:

1. **`docker-compose.prod.yml`**:

   ```yaml
   # Update image references
   frontend:
     image: ghcr.io/aexawareinfotech-pvt-ltd/vivid-valid/frontend:latest

   backend:
     image: ghcr.io/aexawareinfotech-pvt-ltd/vivid-valid/backend:latest
   ```

2. **Documentation files**:
   - Update all references from `jaainil/vivid-valid` to `Aexawareinfotech-Pvt-Ltd/vivid-valid`
   - Update GitHub Container Registry URLs

### 4. GitHub Actions Workflow Verification

The workflow is now simplified and will:

- ✅ Build and publish containers on push to main/develop
- ✅ Support semantic versioning with tags
- ✅ Work with both private and public repositories
- ✅ No longer attempt to push to upstream (removed update-compose job)

### 5. Testing the Setup

#### After Migration:

1. **Push to main branch** to trigger GitHub Actions
2. **Check GitHub Container Registry** for published images
3. **Verify deployment** using docker-compose.prod.yml
4. **Test health endpoints**:
   - Frontend: `http://localhost:8080`
   - Backend: `http://localhost:3012/health`

### 6. Package URLs After Migration

#### Public Packages:

```
Frontend: ghcr.io/aexawareinfotech-pvt-ltd/vivid-valid/frontend:latest
Backend:  ghcr.io/aexawareinfotech-pvt-ltd/vivid-valid/backend:latest
```

#### Private Packages (if kept private):

```
# Requires authentication
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

### 7. Quick Migration Commands

```bash
# Clone the current repository
git clone https://github.com/jaainil/vivid-valid.git
cd vivid-valid

# Add organization remote (after creating repository)
git remote add org https://github.com/Aexawareinfotech-Pvt-Ltd/vivid-valid.git
git push org main
```

### 8. Verification Checklist

- [ ] Repository forked/created under organization
- [ ] GitHub Actions enabled
- [ ] Package visibility set to public (or configured for private)
- [ ] Images published to GitHub Container Registry
- [ ] Deployment tested with docker-compose.prod.yml
- [ ] Documentation updated with correct URLs

## Current Working Setup

The Docker containerization is fully functional and will work with:

- **Current repository**: `jaainil/vivid-valid`
- **Organization repository**: `Aexawareinfotech-Pvt-Ltd/vivid-valid` (after migration)

## Summary

The Docker containerization setup is complete and ready for organization migration. The GitHub Actions workflow has been simplified to avoid permission issues and will successfully publish containers to GitHub Container Registry once the repository is under the organization and packages are made public.
