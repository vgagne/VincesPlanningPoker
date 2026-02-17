// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBXx7EgHFlNp5GDJniLb9M9PQP3NeKdRgo",
    authDomain: "vincesplanningpoker.firebaseapp.com",
    databaseURL: "https://vincesplanningpoker-default-rtdb.firebaseio.com",
    projectId: "vincesplanningpoker",
    storageBucket: "vincesplanningpoker.firebasestorage.app",
    messagingSenderId: "643490045734",
    appId: "1:643490045734:web:63b08352e7c82a0d3eabe7",
    measurementId: "G-HFZ56ZN4ET"
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
