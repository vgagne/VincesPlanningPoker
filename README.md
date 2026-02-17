# Vince's Planning Poker

A modern, web-based planning poker application for agile teams to estimate story points collaboratively.

## Features

### Core Functionality
- **Session Management**: Create new sessions or join existing ones with unique session IDs
- **Multiple Card Decks**: Support for different estimation scales:
  - Fibonacci (0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89) - *Default*
  - Modified Fibonacci (0, ½, 1, 2, 3, 5, 8, 13, 20, 40, 100)
  - T-Shirt Sizes (XS, S, M, L, XL, XXL)
  - Sequential (1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
- **Real-time Voting**: Participants can vote on items with visual feedback
- **Vote Reveal**: Admin can reveal all votes simultaneously to avoid bias
- **Item Management**: Add, select, and manage voting items
- **URL Sharing**: Easy session sharing via unique URLs

### User Experience
- **No Authentication Required**: Start using immediately without login
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Clean, intuitive interface inspired by planningpoker.com
- **Real-time Updates**: See participant status and voting progress
- **Visual Feedback**: Animations and transitions for better user experience

## How to Use

### For Session Administrators

1. **Create a Session**:
   - Enter your name
   - Select your preferred card deck type
   - Click "Create Session"

2. **Manage Items**:
   - Add new items using the "Add New Item" input
   - Click on items to select them for voting
   - Use "Next Item" to move through the list

3. **Control Voting**:
   - "Reveal Votes" - Shows all participants' votes
   - "Reset Votes" - Clears votes for the current item
   - "Copy Link" - Share the session URL with participants

### For Participants

1. **Join a Session**:
   - Enter your name
   - Click "Join Session"
   - Enter the session ID provided by your admin
   - Or click the shared URL directly

2. **Vote on Items**:
   - Wait for the admin to select an item
   - Click on a card to cast your vote
   - Your selection will be highlighted
   - Wait for the admin to reveal all votes

## Technical Details

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS with custom animations
- **Icons**: Font Awesome
- **Architecture**: Single-page application with client-side state management

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Data Storage
- **No Persistent Storage**: All data is stored in memory during the session
- **Session-based**: Information is not saved between sessions
- **Client-side Only**: No server backend required

## File Structure

```
Vince_Planning_Poker/
├── index.html          # Main HTML structure
├── styles.css          # Custom CSS styles and animations
├── script.js           # Main application logic
└── README.md           # This documentation file
```

## Getting Started

1. **Download the Files**: Save all files to a local directory
2. **Open in Browser**: Open `index.html` in your preferred web browser
3. **Start Using**: No installation or setup required!

## Session URL Format

Sessions use URL parameters for easy sharing:
```
https://your-domain.com/path/to/index.html?session=ABC123
```

## Features Inspired by PlanningPoker.com

- Clean, card-based interface
- Simultaneous vote reveal to prevent bias
- Multiple estimation scales
- Real-time participant status
- Admin controls for session management
- Mobile-responsive design

## Limitations

- **No Real-time Sync**: Multiple browser tabs don't automatically sync (requires manual refresh)
- **No Persistent Storage**: Sessions are lost when the page is refreshed
- **Single Admin**: Only one admin per session
- **No User Authentication**: Anyone with the session ID can join

## Future Enhancements

Potential improvements for future versions:
- WebSocket integration for real-time synchronization
- Local storage for session persistence
- Multiple admin support
- Voting history and statistics
- Custom card deck creation
- Timer functionality for voting rounds
- Export results to CSV/JSON

## License

This project is open source and available under the MIT License.

---

**Enjoy using Vince's Planning Poker!** 🎯
