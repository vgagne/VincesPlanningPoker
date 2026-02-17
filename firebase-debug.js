// Firebase Debug Version
console.log('🔥 Firebase Debug Version Loading...');

// Check if Firebase is loaded
if (typeof firebase === 'undefined') {
    console.error('❌ Firebase not loaded - check script tags');
    alert('Firebase not loaded. Check browser console for errors.');
} else {
    console.log('✅ Firebase loaded successfully');
}

// Check if config is already available
if (typeof firebaseConfig !== 'undefined') {
    console.log('✅ Firebase config already available');
} else {
    console.error('❌ Firebase config not available');
}

try {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized');
    
    const database = firebase.database();
    console.log('✅ Firebase database reference created');
    
    // Test database connection
    database.ref('.info/connected').on('value', (snapshot) => {
        const connected = snapshot.val();
        console.log('🔗 Firebase connection status:', connected ? 'Connected' : 'Disconnected');
        
        if (!connected) {
            console.warn('⚠️ Firebase disconnected - check network or database rules');
        }
    });
    
    // Test write permission
    const testRef = database.ref('test');
    testRef.set({ timestamp: Date.now() })
        .then(() => {
            console.log('✅ Firebase write permission OK');
            testRef.remove(); // Clean up
        })
        .catch((error) => {
            console.error('❌ Firebase write permission error:', error);
            alert('Firebase write permission denied. Check database rules.');
        });
    
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
    alert('Firebase initialization failed: ' + error.message);
}

// Simplified Firebase Session Manager for debugging
class DebugFirebaseSessionManager {
    constructor(sessionId) {
        console.log('🎯 Creating Firebase session manager for:', sessionId);
        this.sessionId = sessionId;
        
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase not initialized');
        }
        
        const database = firebase.database();
        this.sessionRef = database.ref(`sessions/${sessionId}`);
        this.participantsRef = database.ref(`sessions/${sessionId}/participants`);
        this.itemsRef = database.ref(`sessions/${sessionId}/items`);
        this.votesRef = database.ref(`sessions/${sessionId}/votes`);
        this.currentItemRef = database.ref(`sessions/${sessionId}/currentItem`);
        this.votesRevealedRef = database.ref(`sessions/${sessionId}/votesRevealed`);
        
        this.listeners = [];
        
        console.log('✅ Firebase session manager created');
    }
    
    // Test basic operations
    testConnection() {
        console.log('🧪 Testing Firebase connection...');
        
        // Test write
        this.sessionRef.set({
            test: true,
            timestamp: Date.now(),
            sessionId: this.sessionId
        }).then(() => {
            console.log('✅ Firebase write test passed');
        }).catch((error) => {
            console.error('❌ Firebase write test failed:', error);
        });
        
        // Test read
        this.sessionRef.on('value', (snapshot) => {
            const data = snapshot.val();
            console.log('📖 Firebase read test:', data);
        });
    }
    
    // Simplified methods with error handling
    addParticipant(name, isAdmin = false) {
        console.log('👤 Adding participant:', name, isAdmin);
        return this.participantsRef.child(name).set({
            name: name,
            isAdmin: isAdmin,
            hasVoted: false,
            joinedAt: firebase.database.ServerValue.TIMESTAMP
        }).catch((error) => {
            console.error('❌ Add participant error:', error);
        });
    }
    
    addItem(item) {
        console.log('📝 Adding item:', item);
        return this.itemsRef.push(item).catch((error) => {
            console.error('❌ Add item error:', error);
        });
    }
    
    setVote(userName, voteValue) {
        console.log('🗳️ Setting vote:', userName, voteValue);
        return this.votesRef.child(userName).set(voteValue).catch((error) => {
            console.error('❌ Set vote error:', error);
        });
    }
    
    onParticipantsChange(callback) {
        console.log('👥 Setting participants listener');
        this.participantsRef.on('value', (snapshot) => {
            const participants = snapshot.val() || {};
            console.log('👥 Participants changed:', participants);
            callback(snapshot);
        });
        this.listeners.push(this.participantsRef);
    }
    
    onItemsChange(callback) {
        console.log('📋 Setting items listener');
        this.itemsRef.on('value', (snapshot) => {
            const items = snapshot.val() || {};
            console.log('📋 Items changed:', items);
            callback(snapshot);
        });
        this.listeners.push(this.itemsRef);
    }
    
    onVotesChange(callback) {
        console.log('🗳️ Setting votes listener');
        this.votesRef.on('value', (snapshot) => {
            const votes = snapshot.val() || {};
            console.log('🗳️ Votes changed:', votes);
            callback(snapshot);
        });
        this.listeners.push(this.votesRef);
    }
    
    cleanup() {
        console.log('🧹 Cleaning up Firebase listeners');
        this.listeners.forEach(ref => ref.off());
        this.listeners = [];
    }
}

// Export for debugging
window.DebugFirebaseSessionManager = DebugFirebaseSessionManager;
window.firebaseConfig = firebaseConfig;

console.log('🔥 Firebase Debug Version Loaded');
