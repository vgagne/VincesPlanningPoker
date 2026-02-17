# Testing Guide for Vince's Planning Poker

## Current Limitation
The app currently stores data in browser memory, so each window/tab has its own independent session. No real-time sync between windows.

## Quick Testing Method (Same Computer)

### Method 1: Single Window Simulation
1. Open `start.html` in one browser window
2. Create a session as admin
3. Use browser dev tools to simulate participants:
   - Open DevTools (F12)
   - Go to Console
   - Run: `app.participants.set('TestUser1', {name: 'TestUser1', isAdmin: false, hasVoted: false})`
   - Run: `app.updateParticipantsList()`

### Method 2: Multiple Windows (Manual Coordination)
1. **Window 1 (Admin)**:
   - Open `start.html`
   - Create session
   - Note the session ID shown

2. **Window 2 (Participant)**:
   - Open `start.html` in new window
   - Enter same session ID manually
   - Join session

3. **Manual Sync Issues**:
   - Each window maintains separate state
   - Participants won't appear in admin view
   - Votes won't sync between windows

## Real Solutions

### Option A: Local Server with WebSocket (Recommended)
- Add WebSocket server for real-time communication
- Participants sync automatically
- Full multi-user functionality

### Option B: GitHub Pages with LocalStorage
- Use localStorage for basic persistence
- Windows can share data on same computer
- Limited but better than current state

### Option C: Firebase Integration
- Add Firebase for real-time database
- Works across different computers
- Professional solution

## Which Solution Do You Prefer?

1. **Quick Fix**: I can implement localStorage for same-computer testing
2. **Full Solution**: I can add WebSocket server for real-time multi-user
3. **Cloud Solution**: I can integrate Firebase for cross-computer functionality

Let me know which approach you'd like, and I'll implement it immediately!
