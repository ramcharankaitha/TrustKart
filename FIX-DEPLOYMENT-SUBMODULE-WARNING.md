# Fix: "Failed to fetch one or more git submodules" Warning

This warning appears during deployment but **doesn't affect functionality**. Here's how to fix it:

## Quick Fix (Choose Your Platform)

### For Vercel

1. Go to your project settings in Vercel
2. Navigate to **Settings** → **Git**
3. Under **Build & Development Settings**, find **Install Command**
4. Add this to ignore submodules:
```bash
git config --global url."https://".insteadOf git:// && npm install
```

Or create a `vercel.json` file:

```json
{
  "buildCommand": "git config --global url.\"https://\".insteadOf git:// && npm run build",
  "installCommand": "git config --global url.\"https://\".insteadOf git:// && npm install"
}
```

### For Netlify

1. Go to **Site settings** → **Build & deploy** → **Build settings**
2. In **Build command**, add:
```bash
git config --global url."https://".insteadOf git:// && npm run build
```

Or create `netlify.toml`:

```toml
[build]
  command = "git config --global url.\"https://\".insteadOf git:// && npm run build"
  publish = ".next"
```

### For Railway/Render/Other Platforms

Add to your build command:
```bash
git config --global url."https://".insteadOf git:// && npm install && npm run build
```

## Alternative: Disable Submodule Check

### Option 1: Create `.gitmodules` (Empty)

Create an empty `.gitmodules` file in your root directory:

```bash
# This tells git there are no submodules
```

### Option 2: Update `.gitignore`

Add to `.gitignore`:
```
.gitmodules
```

## Option 3: Fix Nested Directory Issue

If you have a nested `tk-main` directory, this might be causing the issue. 

**Recommended:** Deploy from the `tk-main` directory directly, not from the parent directory.

## Quick Solution (Recommended)

Create a `vercel.json` or platform-specific config file to suppress the warning:

**For Vercel - Create `vercel.json` in root:**
```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "git": {
    "deploymentEnabled": {
      "all": true
    }
  }
}
```

## Verify Fix

After updating:
1. Commit the changes
2. Push to your repository
3. Redeploy
4. The warning should be gone

---

**Note:** This warning is harmless and doesn't affect your app's functionality. It's just git trying to fetch submodules that don't exist.

