# 🎯 Testing Guide for Vince's Planning Poker

## ✅ **NEW: LocalStorage Sync Implemented**

The application now uses localStorage to sync data between browser windows/tabs on the same computer. This means you can now test multi-user functionality!

## 🧪 **How to Test Multi-User Functionality**

### **Step 1: Create Admin Session**
1. Open `start.html` in your browser
2. Enter your name (e.g., "Admin")
3. Select "Modified Fibonacci" deck
4. Click **"Create Session"**
5. Note the Session ID displayed (e.g., "ABC123")

### **Step 2: Add Participant Window**
1. **Keep the admin window open**
2. Open a **new browser window** (File → New Window)
3. Open `start.html` in the new window
4. Enter participant name (e.g., "John")
5. Click **"Join Session"**
6. Enter the same Session ID from Step 1
7. Click **"Join Session"**

### **Step 3: Verify Sync**
✅ **In Admin Window**: You should see "John" appear in participants list  
✅ **In Participant Window**: You should see "Admin" in participants list  
✅ **Both windows**: Should show the same items and current item

### **Step 4: Test Voting**
1. **Admin**: Add an item if needed, select it for voting
2. **Participant**: Click a card to vote
3. **Admin**: See participant's card turn green with "?"
4. **Admin**: Click "Reveal Votes"
5. **Both windows**: Should see the actual vote value and statistics

### **Step 5: Add More Participants**
Repeat Step 2 with new names to test multiple participants simultaneously.

## 🔍 **What to Test**

### ✅ **Working Features**
- [ ] Participants appear in each other's views
- [ ] Items sync between all windows
- [ ] Voting status updates in real-time
- [ ] Vote reveal works across all windows
- [ ] Statistics calculation displays correctly
- [ ] Admin controls work from admin window only

### 🐛 **Troubleshooting**

#### **Issue: Participants don't appear**
**Solution**: 
- Make sure both windows have the same Session ID
- Check that participant name is different from admin name
- Wait 1-2 seconds for localStorage sync

#### **Issue: Votes don't sync**
**Solution**:
- Ensure both windows are on the same item
- Check that voting hasn't been revealed yet
- Try refreshing both windows

#### **Issue: Items don't appear**
**Solution**:
- Admin must add items first
- Participants may need to wait 1-2 seconds for sync
- Check browser console for errors

## 🌐 **Cross-Computer Testing**

**Current Limitation**: LocalStorage only works on the same computer/browser.

**For cross-computer testing**, you have options:
1. **GitHub Pages** + Manual coordination
2. **WebSocket Server** (I can implement)
3. **Firebase Integration** (I can implement)

## 📱 **Mobile Testing**

1. Open `start.html` on mobile browser
2. Use same Session ID as desktop
3. Test responsive design and functionality

## 🎮 **Advanced Testing Scenarios**

### **Scenario 1: Consensus Voting**
- 3 participants all vote "8"
- Verify mode shows "8"
- Verify consensus message

### **Scenario 2: Tie Resolution**
- 2 participants vote "5", 2 vote "8"
- Verify median calculation (6.5)
- Verify tie handling

### **Scenario 3: Pass Votes**
- Participants vote "Pass"
- Verify Pass appears in results
- Verify mode calculation excludes Pass

### **Scenario 4: Admin Controls**
- Test reveal/reset/next item functions
- Verify only admin can use these controls
- Verify participants see results immediately

## 🚀 **Ready for Production?**

If testing works well, you can deploy to:
- **GitHub Pages** (Free, static hosting)
- **Netlify** (Free, static hosting)
- **Custom server** (With WebSocket for real-time)

## 📞 **Need Help?**

If something doesn't work:
1. Check browser console (F12) for errors
2. Ensure both windows have same Session ID
3. Try refreshing both windows
4. Contact me for assistance!

---

**Happy Testing! 🎯**
