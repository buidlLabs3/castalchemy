# Making Frames Viewable in Farcaster (Like WhatsApp/Telegram Apps)

## 🎯 Goal
Make your Frame appear directly in Farcaster feeds, just like how mini-apps work in WhatsApp/Telegram.

## ✅ How Farcaster Frames Work

Frames are **automatically viewable** in Farcaster when:
1. You share a Frame URL in a cast
2. Farcaster detects the Frame metadata
3. The Frame renders inline in the feed

## 🚀 Steps to Make Your Frame Viewable

### Step 1: Deploy Your Frame (REQUIRED)
Frames must be publicly accessible. Localhost won't work for others.

**Deploy to Vercel** (Free & Easy):
1. Push code to GitHub (✅ Already done)
2. Go to https://vercel.com
3. Import your repo: `buidlLabs3/castalchemy`
4. Add environment variables from `.env.local`
5. Deploy

**Your Frame URL will be**:
```
https://castalchemy.vercel.app/api/frames
```

### Step 2: Create a Cast with Your Frame
1. Open **Warpcast** (Farcaster app)
2. Create a new cast
3. Add your Frame URL: `https://your-domain.vercel.app/api/frames`
4. Farcaster will automatically detect and render the Frame
5. Post the cast

### Step 3: Users See Frame in Feed
- Frame appears inline in the feed
- Users can interact directly
- No need to leave Farcaster
- Just like WhatsApp/Telegram mini-apps!

## 📱 Frame Features That Work In-Feed

✅ **Image Display** - Shows your Frame image
✅ **Buttons** - Users can click buttons
✅ **Transactions** - Users can sign transactions
✅ **Navigation** - Frame can change states
✅ **Input Fields** - Users can enter data

## 🔧 Current Setup

Your Frame is configured to work in Farcaster:
- ✅ Frame metadata (og:image, fc:frame tags)
- ✅ Button actions
- ✅ Transaction support
- ⏳ Needs public deployment

## 🎬 Quick Test (Before Deployment)

1. **Frame Validator**: https://warpcast.com/~/developers/frames
2. Enter: `http://localhost:3000/api/frames` (for local testing)
3. See how it will look in Farcaster

## 📋 Deployment Checklist

- [ ] Deploy to Vercel
- [ ] Add environment variables in Vercel
- [ ] Test Frame URL works publicly
- [ ] Create cast with Frame URL
- [ ] Verify Frame appears in feed
- [ ] Test transactions work

## 💡 Pro Tips

1. **Frame Image**: Make it eye-catching (600x600px recommended)
2. **Button Labels**: Keep them short and clear
3. **Loading Speed**: Keep responses <2s (M1 KPI)
4. **Mobile**: Test on mobile Farcaster apps

## 🎯 Example Cast

When you post in Farcaster:
```
⚗️ Try CastAlchemy - Deposit to Alchemix directly from Farcaster!

https://your-domain.vercel.app/api/frames
```

Farcaster will automatically render your Frame below the text!




