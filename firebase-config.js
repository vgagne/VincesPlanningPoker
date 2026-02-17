// Firebase Configuration
// Replace with your actual Firebase config after setting up project
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Real-time session management
class FirebaseSessionManager {
    constructor(sessionId) {
        this.sessionId = sessionId;
        this.sessionRef = database.ref(`sessions/${sessionId}`);
        this.participantsRef = database.ref(`sessions/${sessionId}/participants`);
        this.itemsRef = database.ref(`sessions/${sessionId}/items`);
        this.votesRef = database.ref(`sessions/${sessionId}/votes`);
        this.currentItemRef = database.ref(`sessions/${sessionId}/currentItem`);
        this.votesRevealedRef = database.ref(`sessions/${sessionId}/votesRevealed`);
        
        this.listeners = [];
    }
    
    // Listen to real-time changes
    onSessionChange(callback) {
        this.sessionRef.on('value', callback);
        this.listeners.push(this.sessionRef);
    }
    
    onParticipantsChange(callback) {
        this.participantsRef.on('value', callback);
        this.listeners.push(this.participantsRef);
    }
    
    onItemsChange(callback) {
        this.itemsRef.on('value', callback);
        this.listeners.push(this.itemsRef);
    }
    
    onVotesChange(callback) {
        this.votesRef.on('value', callback);
        this.listeners.push(this.votesRef);
    }
    
    onCurrentItemChange(callback) {
        this.currentItemRef.on('value', callback);
        this.listeners.push(this.currentItemRef);
    }
    
    onVotesRevealedChange(callback) {
        this.votesRevealedRef.on('value', callback);
        this.listeners.push(this.votesRevealedRef);
    }
    
    // Update session data
    updateSession(data) {
        return this.sessionRef.update(data);
    }
    
    addParticipant(name, isAdmin = false) {
        return this.participantsRef.child(name).set({
            name: name,
            isAdmin: isAdmin,
            hasVoted: false,
            joinedAt: firebase.database.ServerValue.TIMESTAMP
        });
    }
    
    updateParticipant(name, data) {
        return this.participantsRef.child(name).update(data);
    }
    
    removeParticipant(name) {
        return this.participantsRef.child(name).remove();
    }
    
    addItem(item) {
        return this.itemsRef.push(item);
    }
    
    updateItem(itemId, data) {
        return this.itemsRef.child(itemId).update(data);
    }
    
    removeItem(itemId) {
        return this.itemsRef.child(itemId).remove();
    }
    
    setVote(userName, voteValue) {
        return this.votesRef.child(userName).set(voteValue);
    }
    
    removeVote(userName) {
        return this.votesRef.child(userName).remove();
    }
    
    setCurrentItem(item) {
        return this.currentItemRef.set(item);
    }
    
    setVotesRevealed(revealed) {
        return this.votesRevealedRef.set(revealed);
    }
    
    // Clean up listeners
    cleanup() {
        this.listeners.forEach(ref => ref.off());
        this.listeners = [];
    }
}
