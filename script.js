// Vince's Planning Poker - Main JavaScript

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
        
        // Initialize localStorage sync
        this.storageKey = 'planning_poker_session';
        this.syncInterval = null;
        
        this.cardDecks = {
            modified: ['0', '½', '1', '2', '3', '5', '8', '13', '20', '40', '100'],
            fibonacci: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89'],
            tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            sequential: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
        };
        
        this.initializeEventListeners();
        this.checkUrlForSession();
        this.startStorageSync();
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
    
    // LocalStorage sync methods
    startStorageSync() {
        // Listen for storage events from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey && e.newValue) {
                this.loadFromStorage();
            }
        });
        
        // Periodic sync every 1 second
        this.syncInterval = setInterval(() => {
            this.saveToStorage();
        }, 1000);
    }
    
    saveToStorage() {
        if (!this.sessionId) return;
        
        const sessionData = {
            sessionId: this.sessionId,
            participants: Array.from(this.participants.entries()),
            items: this.items,
            votes: Array.from(this.votes.entries()),
            deckType: this.deckType,
            currentItem: this.currentItem,
            votesRevealed: this.votesRevealed,
            lastUpdated: Date.now()
        };
        
        localStorage.setItem(this.storageKey, JSON.stringify(sessionData));
    }
    
    loadFromStorage() {
        const storedData = localStorage.getItem(this.storageKey);
        if (!storedData) return;
        
        try {
            const sessionData = JSON.parse(storedData);
            
            // Only load if it's the same session
            if (sessionData.sessionId !== this.sessionId) return;
            
            // Update local data
            this.participants = new Map(sessionData.participants || []);
            this.items = sessionData.items || [];
            this.votes = new Map(sessionData.votes || []);
            this.deckType = sessionData.deckType || 'modified';
            this.currentItem = sessionData.currentItem;
            this.votesRevealed = sessionData.votesRevealed || false;
            
            // Update UI
            this.updateParticipantsList();
            this.updateItemsList();
            
            if (this.currentItem) {
                document.getElementById('votingItemDisplay').innerHTML = `
                    <p class="text-lg font-semibold text-red-800">${this.currentItem.description}</p>
                    <p class="text-sm text-red-600 mt-1">Status: ${this.getItemStatusText(this.currentItem.status)}</p>
                `;
            }
            
            if (this.votesRevealed) {
                this.calculateAndDisplayMode();
            }
            
        } catch (error) {
            console.error('Error loading from storage:', error);
        }
    }
    
    stopStorageSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
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
        
        // Add admin as first participant
        this.participants.set(userName, { name: userName, isAdmin: true, hasVoted: false });
        
        // Update URL
        const url = `${window.location.origin}${window.location.pathname}?session=${this.sessionId}`;
        window.history.pushState({}, '', url);
        
        this.startSession();
        this.saveToStorage(); // Save new session
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
        
        // Try to load existing session data
        this.loadFromStorage();
        
        // Add participant if not already in session
        if (!this.participants.has(userName)) {
            this.participants.set(userName, { name: userName, isAdmin: false, hasVoted: false });
        }
        
        // Update URL
        const url = `${window.location.origin}${window.location.pathname}?session=${this.sessionId}`;
        window.history.pushState({}, '', url);
        
        this.startSession();
        this.saveToStorage(); // Save the new participant
        this.showToast('Joined session successfully!', 'success');
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
        
        // Initialize cards
        this.generateCards();
        
        // Update displays
        this.updateParticipantsList();
        this.updateItemsList();
        
        // Allow participants to see and select items
        if (!this.isAdmin && this.items.length > 0) {
            this.selectItem(this.items[0]);
        }
    }
    
    addSampleItems() {
        const sampleItems = [
            'User login functionality',
            'Database optimization',
            'Mobile responsive design',
            'API integration',
            'Security improvements'
        ];
        
        sampleItems.forEach(item => {
            this.items.push({
                id: Date.now() + Math.random(),
                description: item,
                status: 'pending'
            });
        });
        
        // Select first item
        if (this.items.length > 0) {
            this.selectItem(this.items[0]);
        }
        
        this.updateItemsList();
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
        
        // Record vote
        this.votes.set(this.userName, value);
        this.participants.get(this.userName).hasVoted = true;
        
        this.updateParticipantsList();
        this.saveToStorage(); // Save the vote
        this.showToast('Vote recorded!', 'success');
    }
    
    addItem() {
        const itemDescription = document.getElementById('newItemInput').value.trim();
        
        if (!itemDescription) {
            this.showToast('Please enter an item description', 'error');
            return;
        }
        
        const newItem = {
            id: Date.now(),
            description: itemDescription,
            status: 'pending'
        };
        
        this.items.push(newItem);
        this.updateItemsList();
        this.saveToStorage(); // Save the new item
        
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
        
        this.currentItem = item;
        this.selectedCard = null;
        this.votesRevealed = false;
        
        // Clear votes
        this.votes.clear();
        this.participants.forEach(participant => {
            participant.hasVoted = false;
        });
        
        // Update UI
        document.getElementById('votingItemDisplay').innerHTML = `
            <p class="text-lg font-semibold text-red-800">${item.description}</p>
            <p class="text-sm text-red-600 mt-1">Status: ${this.getItemStatusText(item.status)}</p>
        `;
        
        // Update items list to show active item
        this.updateItemsList();
        
        // Reset cards
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('selected', 'disabled');
        });
        
        // Hide selected card display and stats
        document.getElementById('selectedCardDisplay').classList.add('hidden');
        document.getElementById('voteStats').classList.add('hidden');
        
        // Update participants
        this.updateParticipantsList();
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
                <div class="item-title text-ellipsis">${item.description}</div>
                <div class="item-status">${this.getItemStatusText(item.status)}</div>
            `;
            
            itemElement.addEventListener('click', () => this.selectItem(item));
            itemsList.appendChild(itemElement);
        });
    }
    
    updateParticipantsList() {
        const participantsGrid = document.getElementById('participantsGrid');
        participantsGrid.innerHTML = '';
        
        this.participants.forEach((participant, name) => {
            const participantElement = document.createElement('div');
            participantElement.className = 'participant-card';
            
            if (participant.hasVoted) {
                participantElement.classList.add('has-voted');
            }
            
            let voteCardHtml = '';
            if (this.votesRevealed && this.votes.has(name)) {
                const voteValue = this.votes.get(name);
                voteCardHtml = `<div class="vote-card">${voteValue}</div>`;
            } else if (participant.hasVoted) {
                voteCardHtml = `<div class="vote-card hidden">?</div>`;
            } else {
                voteCardHtml = `<div class="vote-card empty">-</div>`;
            }
            
            participantElement.innerHTML = `
                <div class="participant-name">${name}</div>
                ${participant.isAdmin ? '<div class="participant-role">Admin</div>' : ''}
                ${voteCardHtml}
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
        
        this.votesRevealed = true;
        
        // Add flip animation to cards
        document.querySelectorAll('.card').forEach(card => {
            card.classList.add('card-flip');
        });
        
        // Update current item status
        if (this.currentItem) {
            this.currentItem.status = 'completed';
        }
        
        // Calculate and display mode
        this.calculateAndDisplayMode();
        
        this.updateParticipantsList();
        this.updateItemsList();
        this.saveToStorage(); // Save the revealed state
        
        // Calculate statistics
        const voteValues = Array.from(this.votes.values());
        const uniqueVotes = [...new Set(voteValues)];
        
        let message = `Votes revealed! `;
        if (uniqueVotes.length === 1) {
            message += `Consensus: ${uniqueVotes[0]}`;
        } else {
            message += `Votes: ${voteValues.join(', ')}`;
        }
        
        this.showToast(message, 'success');
    }
    
    calculateAndDisplayMode() {
        const voteValues = Array.from(this.votes.values());
        
        if (voteValues.length === 0) {
            document.getElementById('voteStats').classList.add('hidden');
            return;
        }
        
        // Count frequency of each vote
        const frequency = {};
        voteValues.forEach(vote => {
            frequency[vote] = (frequency[vote] || 0) + 1;
        });
        
        // Find the mode(s)
        let maxCount = 0;
        let modes = [];
        
        for (const [vote, count] of Object.entries(frequency)) {
            if (count > maxCount) {
                maxCount = count;
                modes = [vote];
            } else if (count === maxCount) {
                modes.push(vote);
            }
        }
        
        // Display result
        const voteStatsElement = document.getElementById('voteStats');
        const modeValueElement = document.getElementById('modeValue');
        
        voteStatsElement.classList.remove('hidden');
        
        if (modes.length === 1) {
            modeValueElement.textContent = modes[0];
        } else {
            // Multiple modes - calculate median
            const numericModes = modes
                .filter(mode => mode !== 'Pass' && !isNaN(parseFloat(mode)))
                .map(mode => parseFloat(mode))
                .sort((a, b) => a - b);
            
            if (numericModes.length > 0) {
                const mid = Math.floor(numericModes.length / 2);
                const median = numericModes.length % 2 === 0
                    ? (numericModes[mid - 1] + numericModes[mid]) / 2
                    : numericModes[mid];
                modeValueElement.textContent = median;
            } else {
                modeValueElement.textContent = 'Tie: ' + modes.join(', ');
            }
        }
    }
    
    toggleAdminPanel() {
        const content = document.getElementById('adminPanelContent');
        const toggle = document.getElementById('toggleAdminPanel');
        const icon = toggle.querySelector('i');
        
        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            icon.className = 'fas fa-chevron-down';
        } else {
            content.classList.add('collapsed');
            icon.className = 'fas fa-chevron-up';
        }
    }
    
    resetVotes() {
        if (!this.isAdmin) {
            this.showToast('Only admin can reset votes', 'error');
            return;
        }
        
        if (!this.currentItem) {
            this.showToast('No item selected', 'error');
            return;
        }
        
        this.votes.clear();
        this.votesRevealed = false;
        this.selectedCard = null;
        
        this.participants.forEach(participant => {
            participant.hasVoted = false;
        });
        
        // Reset UI
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('selected', 'card-flip');
        });
        
        document.getElementById('selectedCardDisplay').classList.add('hidden');
        document.getElementById('voteStats').classList.add('hidden');
        
        // Update current item status
        if (this.currentItem) {
            this.currentItem.status = 'voting';
        }
        
        this.updateParticipantsList();
        this.updateItemsList();
        this.saveToStorage(); // Save the reset state
        
        this.showToast('Votes reset!', 'success');
    }
    
    nextItem() {
        if (!this.isAdmin) {
            this.showToast('Only admin can move to next item', 'error');
            return;
        }
        
        const currentIndex = this.items.findIndex(item => item.id === this.currentItem?.id);
        
        if (currentIndex < this.items.length - 1) {
            this.selectItem(this.items[currentIndex + 1]);
            this.showToast('Moved to next item', 'success');
        } else {
            this.showToast('This is the last item', 'info');
        }
    }
    
    copySessionLink() {
        const url = `${window.location.origin}${window.location.pathname}?session=${this.sessionId}`;
        
        navigator.clipboard.writeText(url).then(() => {
            this.showToast('Session link copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            this.showToast('Session link copied to clipboard!', 'success');
        });
    }
    
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        
        // Update toast styling based on type
        const toastDiv = toast.querySelector('div');
        toastDiv.className = 'px-6 py-3 rounded-lg shadow-lg flex items-center text-white';
        
        switch (type) {
            case 'success':
                toastDiv.classList.add('bg-green-600');
                toastDiv.querySelector('i').className = 'fas fa-check-circle mr-2';
                break;
            case 'error':
                toastDiv.classList.add('bg-red-600');
                toastDiv.querySelector('i').className = 'fas fa-exclamation-circle mr-2';
                break;
            case 'info':
            default:
                toastDiv.classList.add('bg-gray-800');
                toastDiv.querySelector('i').className = 'fas fa-info-circle mr-2';
                break;
        }
        
        toast.classList.remove('hidden');
        toast.classList.add('toast-enter');
        
        setTimeout(() => {
            toast.classList.remove('toast-enter');
            toast.classList.add('toast-exit');
            
            setTimeout(() => {
                toast.classList.add('hidden');
                toast.classList.remove('toast-exit');
            }, 300);
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PlanningPokerApp();
});
