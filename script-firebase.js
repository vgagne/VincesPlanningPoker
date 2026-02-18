// Vince's Planning Poker - Firebase-enabled JavaScript

class PlanningPokerApp {
    constructor() {
        this.sessionId = null;
        this.isAdmin = false;
        this.userName = '';
        this.currentItem = null;
        this.participants = new Map();
        this.items = [];
        this.votes = new Map();
        this.deckType = 'modified';
        this.selectedCard = null;
        this.votesRevealed = false;
        this.firebaseManager = null;
        
        this.cardDecks = {
            modified: ['0', '½', '1', '2', '3', '5', '8', '13', '20', '40', '100'],
            fibonacci: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89'],
            tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            sequential: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
        };
        
        this.initializeEventListeners();
        this.restoreSessionFromStorage();
        this.checkUrlForSession();
    }
    
    // Session Persistence: Save session data to localStorage
    saveSessionToStorage() {
        if (this.sessionId && this.userName) {
            const sessionData = {
                sessionId: this.sessionId,
                userName: this.userName,
                isAdmin: this.isAdmin,
                deckType: this.deckType,
                timestamp: Date.now()
            };
            localStorage.setItem('planningPokerSession', JSON.stringify(sessionData));
            console.log('💾 Session saved to localStorage:', sessionData);
        }
    }
    
    // Session Persistence: Restore session from localStorage
    restoreSessionFromStorage() {
        try {
            const saved = localStorage.getItem('planningPokerSession');
            if (saved) {
                const sessionData = JSON.parse(saved);
                
                // Check if session is less than 24 hours old
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
                const isValid = (Date.now() - sessionData.timestamp) < maxAge;
                
                if (isValid && sessionData.sessionId && sessionData.userName) {
                    console.log('🔄 Restoring session from localStorage:', sessionData);
                    this.sessionId = sessionData.sessionId;
                    this.userName = sessionData.userName;
                    this.isAdmin = sessionData.isAdmin;
                    this.deckType = sessionData.deckType || 'modified';
                    
                    // Reconnect to Firebase
                    this.reconnectToSession();
                    return true;
                } else {
                    // Session expired, clear it
                    localStorage.removeItem('planningPokerSession');
                    console.log('🗑️ Expired session cleared from localStorage');
                }
            }
        } catch (e) {
            console.error('❌ Error restoring session from localStorage:', e);
            localStorage.removeItem('planningPokerSession');
        }
        return false;
    }
    
    // Session Persistence: Clear saved session
    clearSessionFromStorage() {
        localStorage.removeItem('planningPokerSession');
        console.log('🗑️ Session cleared from localStorage');
    }
    
    // Reconnect to existing session after page refresh
    reconnectToSession() {
        if (typeof FirebaseSessionManager !== 'undefined' && this.sessionId) {
            this.firebaseManager = new FirebaseSessionManager(this.sessionId);
            
            // Verify session still exists in Firebase
            this.firebaseManager.sessionRef.once('value', (snapshot) => {
                if (snapshot.exists()) {
                    // Update URL
                    const url = `${window.location.origin}${window.location.pathname}?session=${this.sessionId}`;
                    window.history.pushState({}, '', url);
                    
                    // Re-add participant to session
                    this.addParticipantToFirebase(this.userName, this.isAdmin);
                    
                    // Start the session UI
                    this.startSession();
                    this.showToast('Welcome back! Reconnected to session.', 'success');
                } else {
                    // Session no longer exists
                    this.showToast('Session has ended. Starting fresh.', 'info');
                    this.clearSessionFromStorage();
                    this.sessionId = null;
                    this.userName = '';
                    this.isAdmin = false;
                }
            });
        }
    }
    
    // XSS Protection: Sanitize user input to prevent HTML injection
    sanitizeHTML(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#x27;')
                  .replace(/\//g, '&#x2F;');
    }
    
    initializeEventListeners() {
        // Start view buttons
        document.getElementById('createSessionBtn').addEventListener('click', () => this.createSession());
        document.getElementById('joinBtn').addEventListener('click', () => this.joinSession());
        document.getElementById('toggleModeBtn').addEventListener('click', () => this.toggleMode());
        document.getElementById('copyLinkBtn').addEventListener('click', () => this.copySessionLink());
        
        // Admin panel buttons
        document.getElementById('addItemBtn').addEventListener('click', () => this.addItem());
        document.getElementById('revealVotesBtn').addEventListener('click', () => this.revealVotes());
        document.getElementById('resetVotesBtn').addEventListener('click', () => this.resetVotes());
        document.getElementById('nextItemBtn').addEventListener('click', () => this.nextItem());
        document.getElementById('toggleAdminPanel').addEventListener('click', () => this.toggleAdminPanel());
        
        // Enter key support
        document.getElementById('userName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinSession();
        });
        
        document.getElementById('userNameCreate').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createSession();
        });
        
        document.getElementById('sessionIdInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinSession();
        });
        
        document.getElementById('newItemInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addItem();
        });
    }
    
    toggleMode() {
        const joinSection = document.getElementById('joinSectionDefault');
        const createSection = document.getElementById('createSection');
        const toggleBtn = document.getElementById('toggleModeBtn');
        
        if (joinSection.classList.contains('hidden')) {
            // Show join, hide create
            joinSection.classList.remove('hidden');
            createSection.classList.add('hidden');
            toggleBtn.innerHTML = '<i class="fas fa-exchange-alt mr-2"></i>Want to create a session instead?';
        } else {
            // Show create, hide join
            joinSection.classList.add('hidden');
            createSection.classList.remove('hidden');
            toggleBtn.innerHTML = '<i class="fas fa-exchange-alt mr-2"></i>Want to join a session instead?';
        }
    }
    
    checkUrlForSession() {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session');
        
        if (sessionId) {
            // If session ID in URL, show join section and populate it
            document.getElementById('sessionIdInput').value = sessionId;
            // Make sure join section is visible
            document.getElementById('joinSectionDefault').classList.remove('hidden');
            document.getElementById('createSection').classList.add('hidden');
            document.getElementById('toggleModeBtn').innerHTML = '<i class="fas fa-exchange-alt mr-2"></i>Want to create a session instead?';
        }
    }
    
    generateSessionId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    createSession() {
        const userName = document.getElementById('userNameCreate').value.trim();
        const deckType = document.getElementById('deckType').value;
        
        if (!userName) {
            this.showToast('Please enter your name', 'error');
            return;
        }
        
        this.sessionId = this.generateSessionId();
        this.userName = userName;
        this.isAdmin = true;
        this.deckType = deckType;
        
        // Initialize Firebase manager
        if (typeof FirebaseSessionManager !== 'undefined') {
            this.firebaseManager = new FirebaseSessionManager(this.sessionId);
        } else {
            console.error('❌ FirebaseSessionManager not defined - check firebase-config.js');
            this.showToast('Firebase not properly initialized', 'error');
            return;
        }
        
        // Add admin as first participant
        this.addParticipantToFirebase(userName, true);
        
        // Update URL
        const url = `${window.location.origin}${window.location.pathname}?session=${this.sessionId}`;
        window.history.pushState({}, '', url);
        
        this.startSession();
        this.saveSessionToStorage();
        this.showToast('Session created successfully!', 'success');
    }
    
    joinSession() {
        const userName = document.getElementById('userName').value.trim();
        const sessionId = document.getElementById('sessionIdInput').value.trim().toUpperCase();
        
        if (!userName) {
            this.showToast('Please enter your name', 'error');
            return;
        }
        
        if (!sessionId) {
            this.showToast('Please enter a session ID', 'error');
            return;
        }
        
        this.sessionId = sessionId;
        this.userName = userName;
        this.isAdmin = false;
        
        // Initialize Firebase manager
        if (typeof FirebaseSessionManager !== 'undefined') {
            this.firebaseManager = new FirebaseSessionManager(this.sessionId);
        } else {
            console.error('❌ FirebaseSessionManager not defined - check firebase-config.js');
            this.showToast('Firebase not properly initialized', 'error');
            return;
        }
        
        // Add participant to Firebase
        this.addParticipantToFirebase(userName, false);
        
        // Update URL
        const url = `${window.location.origin}${window.location.pathname}?session=${this.sessionId}`;
        window.history.pushState({}, '', url);
        
        this.startSession();
        this.saveSessionToStorage();
        this.showToast('Joined session successfully!', 'success');
    }
    
    addParticipantToFirebase(name, isAdmin = false) {
        if (this.firebaseManager) {
            this.firebaseManager.addParticipant(name, isAdmin);
        }
    }
    
    startSession() {
        // Hide start view, show game view
        document.getElementById('startView').classList.add('hidden');
        document.getElementById('gameView').classList.remove('hidden');
        document.getElementById('sessionInfo').classList.remove('hidden');
        document.getElementById('sessionId').textContent = this.sessionId;
        
        // Show/hide admin panel
        if (this.isAdmin) {
            document.getElementById('adminPanel').classList.remove('hidden');
        } else {
            document.getElementById('adminPanel').classList.add('hidden');
        }
        
        // Initialize Firebase listeners
        this.setupFirebaseListeners();
        
        // Initialize cards
        this.generateCards();
        
        // Update displays
        this.updateParticipantsList();
        this.updateItemsList();
    }
    
    setupFirebaseListeners() {
        if (!this.firebaseManager) return;
        
        // Load initial data first
        this.firebaseManager.participantsRef.once('value', (snapshot) => {
            const participants = snapshot.val() || {};
            this.participants = new Map();
            
            Object.entries(participants).forEach(([name, data]) => {
                this.participants.set(name, data);
            });
            
            this.updateParticipantsList();
            console.log('📥 Initial participants loaded:', this.participants);
        });
        
        this.firebaseManager.itemsRef.once('value', (snapshot) => {
            const items = snapshot.val() || {};
            this.items = [];
            
            Object.entries(items).forEach(([id, data]) => {
                this.items.push({ id, ...data });
            });
            
            this.updateItemsList();
            console.log('📋 Initial items loaded:', this.items);
        });
        
        this.firebaseManager.votesRef.once('value', (snapshot) => {
            const votes = snapshot.val() || {};
            this.votes = new Map();
            
            Object.entries(votes).forEach(([userName, voteValue]) => {
                this.votes.set(userName, voteValue);
            });
            
            this.updateParticipantsList();
            console.log('🗳️ Initial votes loaded:', this.votes);
        });
        
        this.firebaseManager.currentItemRef.once('value', (snapshot) => {
            this.currentItem = snapshot.val();
            
            if (this.currentItem) {
                const safeDescription = this.sanitizeHTML(this.currentItem.description);
                document.getElementById('votingItemDisplay').innerHTML = `
                    <p class="text-lg font-semibold text-red-800">${safeDescription}</p>
                    <p class="text-sm text-red-600 mt-1">Status: ${this.getItemStatusText(this.currentItem.status)}</p>
                `;
            }
            
            this.updateItemsList();
            console.log('🎯 Initial current item loaded:', this.currentItem);
        });
        
        this.firebaseManager.votesRevealedRef.once('value', (snapshot) => {
            this.votesRevealed = snapshot.val() || false;
            
            if (this.votesRevealed) {
                this.calculateAndDisplayMode();
            }
            
            // CRITICAL: Update participant cards to show/hide votes
            this.updateParticipantsList();
            
            console.log('👁️ Initial votes revealed:', this.votesRevealed);
        });
        
        // Now set up real-time listeners
        setTimeout(() => {
            this.setupRealtimeListeners();
        }, 1000);
    }
    
    setupRealtimeListeners() {
        console.log('🔄 Setting up real-time listeners...');
        
        // Listen to participants changes
        this.firebaseManager.onParticipantsChange((snapshot) => {
            const participants = snapshot.val() || {};
            this.participants = new Map();
            
            Object.entries(participants).forEach(([name, data]) => {
                this.participants.set(name, data);
            });
            
            this.updateParticipantsList();
            console.log('👥 Participants updated:', this.participants);
        });
        
        // Listen to items changes
        this.firebaseManager.onItemsChange((snapshot) => {
            const items = snapshot.val() || {};
            this.items = [];
            
            Object.entries(items).forEach(([id, data]) => {
                this.items.push({ id, ...data });
            });
            
            this.updateItemsList();
            console.log('📋 Items updated:', this.items);
        });
        
        // Listen to votes changes
        this.firebaseManager.onVotesChange((snapshot) => {
            const votes = snapshot.val() || {};
            this.votes = new Map();
            
            Object.entries(votes).forEach(([userName, voteValue]) => {
                this.votes.set(userName, voteValue);
            });
            
            this.updateParticipantsList();
            console.log('🗳️ Votes updated:', this.votes);
        });
        
        // Listen to current item changes
        this.firebaseManager.onCurrentItemChange((snapshot) => {
            this.currentItem = snapshot.val();
            
            if (this.currentItem) {
                const safeDescription = this.sanitizeHTML(this.currentItem.description);
                document.getElementById('votingItemDisplay').innerHTML = `
                    <p class="text-lg font-semibold text-red-800">${safeDescription}</p>
                    <p class="text-sm text-red-600 mt-1">Status: ${this.getItemStatusText(this.currentItem.status)}</p>
                `;
            }
            
            this.updateItemsList();
            console.log('🎯 Current item updated:', this.currentItem);
        });
        
        // Listen to votes revealed changes
        this.firebaseManager.onVotesRevealedChange((snapshot) => {
            this.votesRevealed = snapshot.val() || false;
            
            if (this.votesRevealed) {
                this.calculateAndDisplayMode();
            }
            
            // CRITICAL: Update participant cards to show/hide votes
            this.updateParticipantsList();
            
            console.log('👁️ Votes revealed updated:', this.votesRevealed);
        });
    }
    
    generateCards() {
        const cardsGrid = document.getElementById('cardsGrid');
        cardsGrid.innerHTML = '';
        
        const cards = [...this.cardDecks[this.deckType], 'Pass'];
        
        cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            if (card === 'Pass') {
                cardElement.classList.add('pass');
            }
            cardElement.dataset.value = card;
            cardElement.innerHTML = `
                <div class="card-value">${card}</div>
            `;
            
            cardElement.addEventListener('click', () => this.selectCard(card, cardElement));
            cardsGrid.appendChild(cardElement);
        });
    }
    
    selectCard(value, element) {
        if (this.votesRevealed) {
            this.showToast('Voting has ended for this item', 'error');
            return;
        }
        
        if (!this.currentItem) {
            this.showToast('Please select an item first', 'error');
            return;
        }
        
        // Remove previous selection
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Add selection to clicked card
        element.classList.add('selected');
        this.selectedCard = value;
        
        // Show selected card display
        document.getElementById('selectedCardDisplay').classList.remove('hidden');
        document.getElementById('selectedCard').textContent = value;
        
        // Record vote in Firebase
        if (this.firebaseManager) {
            this.firebaseManager.setVote(this.userName, value);
            this.firebaseManager.updateParticipant(this.userName, { hasVoted: true });
        }
        
        this.showToast('Vote recorded!', 'success');
    }
    
    addItem() {
        const itemDescription = document.getElementById('newItemInput').value.trim();
        
        if (!itemDescription) {
            this.showToast('Please enter an item description', 'error');
            return;
        }
        
        const newItem = {
            description: itemDescription,
            status: 'pending'
        };
        
        if (this.firebaseManager) {
            this.firebaseManager.addItem(newItem);
        }
        
        // Clear input
        document.getElementById('newItemInput').value = '';
        
        this.showToast('Item added successfully!', 'success');
    }
    
    selectItem(item) {
        // Only admins can change items, but participants can see them
        if (!this.isAdmin && this.currentItem && this.currentItem.id === item.id) {
            return; // Already selected this item
        }
        
        if (!this.isAdmin && this.currentItem && this.currentItem.id !== item.id) {
            this.showToast('Only admin can change items', 'info');
            return;
        }
        
        // Update Firebase
        if (this.firebaseManager) {
            this.firebaseManager.setCurrentItem(item);
            this.firebaseManager.setVotesRevealed(false);
            
            // Clear all votes
            this.participants.forEach((participant, name) => {
                this.firebaseManager.updateParticipant(name, { hasVoted: false });
                this.firebaseManager.removeVote(name);
            });
        }
        
        // Reset local state
        this.selectedCard = null;
        this.votesRevealed = false;
        
        // Reset cards
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('selected', 'disabled');
        });
        
        // Hide selected card display and stats
        document.getElementById('selectedCardDisplay').classList.add('hidden');
        document.getElementById('voteStats').classList.add('hidden');
    }
    
    getItemStatusText(status) {
        switch (status) {
            case 'pending': return 'Pending';
            case 'voting': return 'Voting in progress';
            case 'completed': return 'Completed';
            default: return 'Unknown';
        }
    }
    
    updateItemsList() {
        const itemsList = document.getElementById('itemsList');
        itemsList.innerHTML = '';
        
        this.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item-card';
            if (this.currentItem && this.currentItem.id === item.id) {
                itemElement.classList.add('active');
            }
            
            itemElement.innerHTML = `
                <div class="item-title text-ellipsis">${this.sanitizeHTML(item.description)}</div>
                <div class="item-status">${this.getItemStatusText(item.status)}</div>
            `;
            
            itemElement.addEventListener('click', () => this.selectItem(item));
            itemsList.appendChild(itemElement);
        });
    }
    
    updateParticipantsList() {
        const participantsGrid = document.getElementById('participantsGrid');
        participantsGrid.innerHTML = '';
        
        console.log('🔄 Updating participants list:', {
            votesRevealed: this.votesRevealed,
            votes: Array.from(this.votes.entries()),
            participants: Array.from(this.participants.entries())
        });
        
        this.participants.forEach((participant, name) => {
            const participantElement = document.createElement('div');
            participantElement.className = 'participant-card';
            
            // Get vote value
            const voteValue = this.votes.has(name) ? this.votes.get(name) : null;
            const hasVoted = participant.hasVoted || voteValue !== null;
            
            // Simple card HTML with inline styles
            let cardStyle = '';
            let cardContent = '';
            
            if (this.votesRevealed && voteValue) {
                // REVEALED STATE: Light grey background, green text
                const isPass = voteValue === 'Pass';
                cardStyle = `background: linear-gradient(145deg, #e9ecef, #dee2e6); border: 2px solid #6c757d; color: ${isPass ? '#6c757d' : '#28a745'}; font-size: 1.5rem; font-weight: 900; width: 80px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); margin: 0 auto; font-style: ${isPass ? 'italic' : 'normal'};`;
                cardContent = voteValue;
                console.log(`✅ REVEALED: ${name} = ${voteValue}`);
            } else if (hasVoted) {
                // VOTED (hidden): Dark grey with green checkmark
                cardStyle = `background: linear-gradient(145deg, #6c757d, #495057); border: 2px solid #495057; color: #28a745; width: 80px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.15); margin: 0 auto; font-size: 1.5rem; font-weight: 900;`;
                cardContent = '✓';
                console.log(`🔒 HIDDEN: ${name} has voted`);
            } else {
                // NOT VOTED: White with dash
                cardStyle = `background: linear-gradient(145deg, #ffffff, #f0f0f0); border: 2px solid #dee2e6; color: #6c757d; width: 80px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.15); margin: 0 auto; font-size: 1.25rem; font-weight: 700;`;
                cardContent = '-';
                console.log(`⭕ EMPTY: ${name} has not voted`);
            }
            
            participantElement.innerHTML = `
                <div class="participant-name">${this.sanitizeHTML(name)}</div>
                ${participant.isAdmin ? '<div class="participant-role">Admin</div>' : ''}
                <div class="vote-card" style="${cardStyle}">${cardContent}</div>
            `;
            
            participantsGrid.appendChild(participantElement);
        });
    }
    
    revealVotes() {
        if (!this.isAdmin) {
            this.showToast('Only admin can reveal votes', 'error');
            return;
        }
        
        if (!this.currentItem) {
            this.showToast('No item selected', 'error');
            return;
        }
        
        // Update Firebase
        if (this.firebaseManager) {
            this.firebaseManager.setVotesRevealed(true);
            
            // Update item status
            const updatedItem = { ...this.currentItem, status: 'completed' };
            this.firebaseManager.updateItem(this.currentItem.id, updatedItem);
        }
        
        // Add flip animation to cards
        document.querySelectorAll('.card').forEach(card => {
            card.classList.add('card-flip');
        });
        
        this.showToast('Votes revealed!', 'success');
    }
    
    calculateAndDisplayMode() {
        const voteValues = Array.from(this.votes.values());
        const validVotes = voteValues.filter(vote => vote !== 'Pass');
        
        if (validVotes.length === 0) {
            document.getElementById('voteStats').classList.add('hidden');
            return;
        }
        
        // Convert votes to numbers for calculation
        const numericVotes = validVotes.map(vote => {
            if (vote === '½') return 0.5;
            const num = parseFloat(vote);
            return isNaN(num) ? 0 : num;
        });
        
        // Calculate Mean
        const mean = numericVotes.reduce((sum, val) => sum + val, 0) / numericVotes.length;
        
        // Calculate Median
        const sortedVotes = [...numericVotes].sort((a, b) => a - b);
        const mid = Math.floor(sortedVotes.length / 2);
        let median;
        if (sortedVotes.length % 2 === 0) {
            median = (sortedVotes[mid - 1] + sortedVotes[mid]) / 2;
        } else {
            median = sortedVotes[mid];
        }
        
        // Calculate Mode
        const voteCounts = {};
        validVotes.forEach(vote => {
            voteCounts[vote] = (voteCounts[vote] || 0) + 1;
        });
        
        let modes = [];
        let maxCount = 0;
        Object.entries(voteCounts).forEach(([vote, count]) => {
            if (count > maxCount) {
                maxCount = count;
                modes = [vote];
            } else if (count === maxCount) {
                modes.push(vote);
            }
        });
        
        // Display statistics
        document.getElementById('voteStats').classList.remove('hidden');
        document.getElementById('statsContent').innerHTML = `
            <div class="stats-content">
                <div class="stat-item mb-2">
                    <div class="text-sm text-gray-600">Mean:</div>
                    <div class="text-lg font-bold text-red-700">${mean.toFixed(2)}</div>
                </div>
                <div class="stat-item mb-2">
                    <div class="text-sm text-gray-600">Median:</div>
                    <div class="text-lg font-bold text-red-700">${median.toFixed(2)}</div>
                </div>
                <div class="stat-item mb-2">
                    <div class="text-sm text-gray-600">Mode:</div>
                    <div class="text-lg font-bold text-red-700">${modes.join(', ')}</div>
                </div>
                <div class="stat-item mb-2">
                    <div class="text-sm text-gray-600">Votes:</div>
                    <div class="text-lg font-bold text-red-700">${validVotes.length}</div>
                </div>
                <div class="stat-item">
                    <div class="text-sm text-gray-600">Pass:</div>
                    <div class="text-lg font-bold text-red-700">${voteValues.length - validVotes.length}</div>
                </div>
            </div>
        `;
    }
    
    resetVotes() {
        if (!this.isAdmin) {
            this.showToast('Only admin can reset votes', 'error');
            return;
        }
        
        // Update Firebase
        if (this.firebaseManager) {
            this.firebaseManager.setVotesRevealed(false);
            
            // Update item status
            if (this.currentItem) {
                const updatedItem = { ...this.currentItem, status: 'voting' };
                this.firebaseManager.updateItem(this.currentItem.id, updatedItem);
            }
            
            // Clear all votes
            this.participants.forEach((participant, name) => {
                this.firebaseManager.updateParticipant(name, { hasVoted: false });
                this.firebaseManager.removeVote(name);
            });
        }
        
        // Reset local state
        this.votesRevealed = false;
        this.selectedCard = null;
        
        // Reset cards
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('selected', 'disabled', 'card-flip');
        });
        
        // Hide selected card display and stats
        document.getElementById('selectedCardDisplay').classList.add('hidden');
        document.getElementById('voteStats').classList.add('hidden');
        
        this.showToast('Votes reset!', 'success');
    }
    
    nextItem() {
        if (!this.isAdmin) {
            this.showToast('Only admin can move to next item', 'error');
            return;
        }
        
        const currentIndex = this.items.findIndex(item => item.id === this.currentItem?.id);
        const nextIndex = currentIndex + 1;
        
        if (nextIndex < this.items.length) {
            this.selectItem(this.items[nextIndex]);
        } else {
            this.showToast('No more items', 'info');
        }
    }
    
    toggleAdminPanel() {
        const adminPanel = document.getElementById('adminPanel');
        const toggleBtn = document.getElementById('toggleAdminPanel');
        
        if (adminPanel.classList.contains('collapsed')) {
            adminPanel.classList.remove('collapsed');
            toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        } else {
            adminPanel.classList.add('collapsed');
            toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        }
    }
    
    copySessionLink() {
        const url = `${window.location.origin}${window.location.pathname}?session=${this.sessionId}`;
        navigator.clipboard.writeText(url).then(() => {
            this.showToast('Session link copied to clipboard!', 'success');
        }).catch(() => {
            this.showToast('Failed to copy link', 'error');
        });
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    // Clean up Firebase listeners when leaving
    cleanup() {
        if (this.firebaseManager) {
            this.firebaseManager.cleanup();
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PlanningPokerApp();
});

// Clean up when page is unloaded
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.cleanup();
    }
});
