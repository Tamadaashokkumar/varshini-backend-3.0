# 🚀 Deployment Guide

Complete guide for deploying the Hyundai Spares E-Commerce Backend

## 📋 Pre-Deployment Checklist

- [ ] MongoDB Atlas account created
- [ ] Cloudinary account created
- [ ] Razorpay account created and verified
- [ ] Environment variables configured
- [ ] SSL certificate obtained (for production)
- [ ] Domain name configured (optional)

---

## 🗄️ MongoDB Atlas Setup

### 1. Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new project

### 2. Create Database Cluster
1. Click "Build a Database"
2. Choose "M0 Sandbox" (Free tier)
3. Select your preferred cloud provider and region
4. Click "Create Cluster"

### 3. Configure Database Access
1. Go to "Database Access"
2. Click "Add New Database User"
3. Create username and password
4. Grant "Read and write to any database" privilege

### 4. Configure Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0) for development
4. For production, add specific IP addresses

### 5. Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `myFirstDatabase` with your database name (e.g., `hyundai_spares`)

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/hyundai_spares?retryWrites=true&w=majority
```

---

## ☁️ Cloudinary Setup

### 1. Create Cloudinary Account
1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for a free account

### 2. Get API Credentials
1. Go to Dashboard
2. Find your credentials:
   - Cloud Name
   - API Key
   - API Secret

### 3. Configure Upload Preset (Optional)
1. Go to Settings → Upload
2. Create an unsigned upload preset
3. Note the preset name

---

## 💳 Razorpay Setup

### 1. Create Razorpay Account
1. Go to [Razorpay](https://razorpay.com/)
2. Sign up and complete KYC verification

### 2. Get API Keys
1. Go to Settings → API Keys
2. Generate API keys (Test Mode)
3. Note down:
   - Key ID (starts with `rzp_test_`)
   - Key Secret

### 3. Enable Payment Methods
1. Go to Settings → Payment Methods
2. Enable required payment methods:
   - Cards
   - UPI
   - Netbanking
   - Wallets

### 4. Webhooks (Optional)
1. Go to Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
3. Select events to track

---

## 🌐 Deployment Options

### Option 1: Heroku

#### 1. Install Heroku CLI
```bash
npm install -g heroku
```

#### 2. Login to Heroku
```bash
heroku login
```

#### 3. Create Heroku App
```bash
heroku create hyundai-spares-backend
```

#### 4. Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI=your_mongodb_uri
heroku config:set JWT_ACCESS_SECRET=your_secret
heroku config:set JWT_REFRESH_SECRET=your_secret
heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name
heroku config:set CLOUDINARY_API_KEY=your_api_key
heroku config:set CLOUDINARY_API_SECRET=your_api_secret
heroku config:set RAZORPAY_KEY_ID=your_key_id
heroku config:set RAZORPAY_KEY_SECRET=your_key_secret
heroku config:set FRONTEND_URL=your_frontend_url
```

#### 5. Deploy
```bash
git push heroku main
```

#### 6. Check Logs
```bash
heroku logs --tail
```

---

### Option 2: DigitalOcean App Platform

#### 1. Create DigitalOcean Account
1. Go to [DigitalOcean](https://www.digitalocean.com/)
2. Sign up for an account

#### 2. Create New App
1. Click "Create" → "Apps"
2. Connect your GitHub repository
3. Select the repository and branch

#### 3. Configure App
1. Set build command: `npm install`
2. Set run command: `npm start`
3. Add environment variables
4. Choose plan (Basic - $5/month)

#### 4. Deploy
1. Click "Create Resources"
2. Wait for deployment to complete

---

### Option 3: AWS EC2

#### 1. Launch EC2 Instance
1. Choose Ubuntu Server 20.04 LTS
2. Choose t2.micro (Free tier eligible)
3. Configure security groups:
   - SSH (22)
   - HTTP (80)
   - HTTPS (443)
   - Custom TCP (5000)

#### 2. Connect to Instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

#### 3. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 4. Install MongoDB (Optional - if not using Atlas)
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### 5. Clone Repository
```bash
git clone https://github.com/yourusername/hyundai-spares-backend.git
cd hyundai-spares-backend
```

#### 6. Install Dependencies
```bash
npm install
```

#### 7. Create .env File
```bash
nano .env
# Add all environment variables
```

#### 8. Install PM2
```bash
sudo npm install -g pm2
```

#### 9. Start Application
```bash
pm2 start server.js --name hyundai-spares
pm2 startup
pm2 save
```

#### 10. Configure Nginx (Optional)
```bash
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/default
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

### Option 4: Vercel

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Login
```bash
vercel login
```

#### 3. Deploy
```bash
vercel
```

#### 4. Set Environment Variables
```bash
vercel env add MONGO_URI production
vercel env add JWT_ACCESS_SECRET production
# Add all other variables
```

#### 5. Deploy to Production
```bash
vercel --prod
```

---

## 🔒 Security Best Practices

### 1. Environment Variables
- Never commit `.env` file to Git
- Use different credentials for development and production
- Rotate secrets regularly

### 2. HTTPS
- Always use HTTPS in production
- Get free SSL certificate from Let's Encrypt
- Force HTTPS redirects

### 3. MongoDB Security
- Use strong passwords
- Enable IP whitelisting
- Regular backups
- Enable MongoDB authentication

### 4. API Security
- Keep rate limiting enabled
- Monitor for suspicious activity
- Regular security audits
- Keep dependencies updated

### 5. JWT Tokens
- Use strong, random secrets
- Short expiration time for access tokens
- Secure token storage on client

---

## 📊 Monitoring & Maintenance

### 1. Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# Check logs
pm2 logs hyundai-spares
```

### 2. Database Monitoring
- Monitor connection pool size
- Track query performance
- Set up alerts for high CPU/Memory usage

### 3. Regular Maintenance
- Update dependencies: `npm update`
- Security audits: `npm audit`
- Database backups: Daily automated backups
- Log rotation: Configure log rotation

---

## 🔄 Continuous Integration/Deployment

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/app
            git pull
            npm install
            pm2 restart hyundai-spares
```

---

## 📱 Mobile App Integration

### Socket.io Connection
```javascript
// React Native example
import io from 'socket.io-client';

const socket = io('https://your-api-domain.com', {
  auth: {
    token: userToken
  },
  transports: ['websocket'],
  reconnection: true
});
```

### API Base URL
```javascript
const API_BASE_URL = 'https://your-api-domain.com/api';
```

---

## 🆘 Troubleshooting

### Common Issues

**1. MongoDB Connection Failed**
- Check connection string format
- Verify IP whitelist in MongoDB Atlas
- Ensure database user has correct permissions

**2. Cloudinary Upload Failed**
- Verify API credentials
- Check file size limits
- Ensure allowed formats are correct

**3. Razorpay Payment Failed**
- Use test credentials in test mode
- Verify webhook URL is accessible
- Check signature verification

**4. Socket.io Not Connecting**
- Verify CORS settings
- Check firewall rules
- Ensure WebSocket support on server

**5. High Memory Usage**
- Increase server RAM
- Optimize database queries
- Implement caching

---

## 📞 Support

For deployment issues, contact:
- Email: support@hyundaispares.com
- GitHub Issues: [Repository Issues](https://github.com/yourusername/hyundai-spares-backend/issues)

---

**Happy Deploying! 🚀**
