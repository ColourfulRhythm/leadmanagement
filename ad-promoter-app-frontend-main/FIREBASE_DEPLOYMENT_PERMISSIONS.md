# Firebase Deployment Permission Error Fix

## Error Message
```
Error: Missing permissions required for functions deploy. You must have permission iam.serviceAccounts.ActAs on service account ad-promoter-36ef7@appspot.gserviceaccount.com.
```

## Solution

You need to assign yourself the **"Service Account User"** role in Google Cloud Console.

### Step 1: Open Google Cloud IAM Console

Visit this URL:
```
https://console.cloud.google.com/iam-admin/iam?project=ad-promoter-36ef7
```

### Step 2: Find Your Account

1. Look for your email address in the IAM members list
2. If you don't see your account, click **"+ GRANT ACCESS"** button

### Step 3: Add Service Account User Role

**Option A: If your account is already listed:**
1. Click the **pencil icon** (Edit) next to your account
2. Click **"+ ADD ANOTHER ROLE"**
3. Search for: `Service Account User`
4. Select **"Service Account User"** role
5. Click **"SAVE"**

**Option B: If your account is not listed:**
1. Click **"+ GRANT ACCESS"** button
2. In "New principals", enter your email address
3. Click **"Select a role"** dropdown
4. Search for: `Service Account User`
5. Select **"Service Account User"** role
6. Click **"SAVE"**

### Step 4: Wait for Permissions to Propagate

Permissions can take 1-2 minutes to propagate. Wait a moment before trying again.

### Step 5: Retry Deployment

After permissions are updated, run:
```bash
cd ADD-PROMOTER-BACKEND-main/ADD-PROMOTER-BACKEND-main
npm run firebase:deploy
```

## Alternative: Ask Project Owner

If you don't have access to the IAM console, ask the project owner to:
1. Go to: https://console.cloud.google.com/iam-admin/iam?project=ad-promoter-36ef7
2. Find your email address
3. Add the **"Service Account User"** role to your account

## Required Roles for Firebase Deployment

For full Firebase deployment capabilities, you may also need:
- **Firebase Admin** (in Firebase Console)
- **Cloud Functions Admin** (in Google Cloud Console)
- **Service Account User** (in Google Cloud Console) ← **This is what's missing**

## Verify Permissions

After adding the role, you can verify by:
1. Going to: https://console.cloud.google.com/iam-admin/iam?project=ad-promoter-36ef7
2. Finding your account
3. Checking that "Service Account User" appears in your roles list

## Next Steps

Once permissions are fixed:
1. ✅ Retry deployment: `npm run firebase:deploy`
2. ✅ Configure environment variables in Firebase Console
3. ✅ Update frontend to use Firebase Functions URL
4. ✅ Test the deployed API

---

**Note:** This is a one-time setup. Once permissions are granted, future deployments should work without issues.

