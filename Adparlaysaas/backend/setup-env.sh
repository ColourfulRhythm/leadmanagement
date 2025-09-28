#!/bin/bash

echo "🔧 Setting up environment variables in Vercel..."

# Check if vercel is installed
if ! command -v npx vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please run: npm install -g vercel"
    exit 1
fi

echo "📝 Adding environment variables..."

# Add FIREBASE_PROJECT_ID
echo "Adding FIREBASE_PROJECT_ID..."
npx vercel env add FIREBASE_PROJECT_ID production <<< "adparlaysaas"
npx vercel env add FIREBASE_PROJECT_ID preview <<< "adparlaysaas"
npx vercel env add FIREBASE_PROJECT_ID development <<< "adparlaysaas"

# Add FIREBASE_CLIENT_EMAIL
echo "Adding FIREBASE_CLIENT_EMAIL..."
npx vercel env add FIREBASE_CLIENT_EMAIL production <<< "firebase-adminsdk-fbsvc@adparlaysaas.iam.gserviceaccount.com"
npx vercel env add FIREBASE_CLIENT_EMAIL preview <<< "firebase-adminsdk-fbsvc@adparlaysaas.iam.gserviceaccount.com"
npx vercel env add FIREBASE_CLIENT_EMAIL development <<< "firebase-adminsdk-fbsvc@adparlaysaas.iam.gserviceaccount.com"

# Add FIREBASE_PRIVATE_KEY
echo "Adding FIREBASE_PRIVATE_KEY..."
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCdMfcCN3x5iB1L
BSHM+3PlAhE/cGsupd+JVgV2Epd8hFTJoYzRf9E48/Pjs9kDc1yeZVlDtOCBA0EM
i88w3FifIDLUz4aAqBzFDMwZTCCD/+ud1Tlpr47qJa21t1i/8TFu6zNRNQTXUySV
NMEPkmX9568L4afvJClhri/PaptcUIu43RlTShQJnNoghtCMss8ne/o02zdcPRuB
3/vj0gjs5KvYdWwMfu0DOzWJCuGjWyZvOP5Zp9TaQhgAdK4H/6aU+zjzLJx/dxy9
U6MtDdNRMSGq+qEy1Rn89TpDwfrPgvJTat3IeZa34LRJFmG/CjQAkwRavUx6ATWb
YfOYGBClAgMBAAECggEAOmscrHa5bCLxG/Wyy45xUhy0EzrwojvjuJK+4dPj91Lo
faxrfFn/g6Zpr2ghkL45H+ZzR427V0bB0GtO2w4wYyagrWTYTAzt8C8i1I3tkZC0
3AmnVgb32j2ZcmxKb76vi9Sd1CKbg3gzIr4ht2tFOxh0fbplYiKyvEnzG6a3SRVS
ZB/qE44jp7h39Bg82BZThJ2ATov2r/dU7HFmjLqcDD2kv9wfAFxL5DFVxV9kbX6g
1FNHYsOmmB0uQYU9uot98TPlKbeNVIL9SHSgIacUJ0C7+W8TEn9G532Ph+XzshaS
YvVsnIgvoewBiKW7ermUXeiPRjXJMANXjYTnkZwdSwKBgQDYp7Ekn6PvsULXN/2n
qdfarcc28nNRasYatWce+nDh03AnYU1AYT2AkLuNPGrTx9SKMJrqyZaU1DlXA1eA
qb7z7rk8STKE4ZGm4kuJMElFBjCcgYtMjJy77TyPXhu9fYsi9XJfvkifSffdhlad
abmlncX1RBMoxZxUUKkkGBeJXwKBgQC5vfq5waxyQ7I9F1bRa8JI3QYqcJqfKGZ3
G3rNYrS7qxkyvht64+7PWwqB/BFBEBs7aan+X0fC8LGr/FYQs6WVEcwXkM0GpWnf
4AZ7Xl1/bqazlkk3wlav9yGdOQRwGSic3I0RyFI2BAqjLTDfydKrqhT6dTnXYEeZ
3bPajADwewKBgF6MD8ojwK8BdGHnlVJt1D0iSSW5eIm3Ruyw7Wefc1OZqgAFfmjy
BpzsjGx+SUBSnHYR8Ak2H/ijBMLsOmtzqFlbfIrKhrlmluF1L/GWmOL+aIhkIB4v
3tZEGYGXWBPBjc6bvmX57EdXSEvsLDBVyyZzS8hVBOduFWLWMHoH6X2RAoGASRH5
7tXIN3N2TR4/Y0eXOP7qjAucaHyGQtkmqGHqY+Hdmd68BM5ihmR0b8pwJz5k2Cyr
WYy2OHRkERrF6PAjdc94kNTAM5sjWZVSN3paIeWv4vp+d1cWr0bzjFx/6HGdTohd
Xt+FqAZTAPqoPYGyRSI1+onfZWFVCaz0Mkfdnr0CgYAWHYfhmxvyDyq2c0m1PAgQ
xmFKZMyOw2Q2IRScB8MbLY4oCxRQkJZhr2h6WOaEcK5YzTh1tjFmnblvtxpWBeEh
kd4rKr2IKOxc0uSM2X2MptqVcn90pEzlke96BNSoHMR4c4OzuW1gpaws5hULXw4y
h6iw1zuOBDHAT+/eG9EOyA==
-----END PRIVATE KEY-----"

npx vercel env add FIREBASE_PRIVATE_KEY production <<< "$PRIVATE_KEY"
npx vercel env add FIREBASE_PRIVATE_KEY preview <<< "$PRIVATE_KEY"
npx vercel env add FIREBASE_PRIVATE_KEY development <<< "$PRIVATE_KEY"

echo "✅ Environment variables set successfully!"
echo "🚀 Now you can deploy with: ./deploy.sh" 