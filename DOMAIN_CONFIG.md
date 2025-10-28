# Domain Configuration Guide for resusync.me

## Namecheap DNS Configuration

### Step 1: Access Domain Management
1. Login to Namecheap account
2. Go to Domain List
3. Click "Manage" next to resusync.me
4. Go to "Advanced DNS" tab

### Step 2: Add DNS Records
Delete existing records and add these:

#### For Vercel (Recommended)
```
Type: A Record
Host: @
Value: 76.76.19.61
TTL: Automatic

Type: CNAME
Host: www
Value: cname.vercel-dns.com
TTL: Automatic
```

#### Alternative: Using Cloudflare (More Features)
```
Type: CNAME
Host: @
Value: your-vercel-url.vercel.app
TTL: Auto (or 300)

Type: CNAME
Host: www
Value: your-vercel-url.vercel.app
TTL: Auto (or 300)
```

### Step 3: Verification
- DNS propagation can take 24-48 hours
- Check status at: https://www.whatsmydns.net
- Test your domain: https://resusync.me

### Step 4: SSL Certificate
- Vercel automatically provides SSL
- Your site will be accessible via HTTPS
- HTTP will redirect to HTTPS automatically