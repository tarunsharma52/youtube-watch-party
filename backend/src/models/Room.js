const Participant = require('./Participant');

class Room {
    constructor(roomId, hostParticipant, defaultVideoId = "dQw4w9WgXcQ") {
        this.roomId = roomId;
        this.hostId = hostParticipant.userId;
        this.videoId = defaultVideoId;
        this.currentTime = 0;
        this.playState = "paused"; // "playing" | "paused"
        this.lastStateUpdate = Date.now();
        this.participants = new Map(); // userId -> Participant
        this.chatMessages = [];
        
        // Add host
        this.addParticipant(hostParticipant);
    }

    addParticipant(participant) {
        this.participants.set(participant.userId, participant);
    }

    removeParticipant(userId) {
        const participant = this.participants.get(userId);
        if (participant) {
            this.participants.delete(userId);
        }
        return participant;
    }

    getParticipant(userId) {
        return this.participants.get(userId);
    }

    getParticipantBySocketId(socketId) {
        for (const p of this.participants.values()) {
            if (p.socketId === socketId) return p;
        }
        return null;
    }

    getParticipantsList() {
        return Array.from(this.participants.values()).map(p => p.toJSON());
    }

    setRole(userId, newRole) {
        const participant = this.participants.get(userId);
        if (participant) {
            participant.role = newRole;
            return true;
        }
        return false;
    }

    transferHost(newHostUserId) {
        const currentHost = this.participants.get(this.hostId);
        const targetUser = this.participants.get(newHostUserId);

        if (!targetUser) return false;

        if (currentHost) {
            currentHost.role = "Moderator";
        }
        targetUser.role = "Host";
        this.hostId = targetUser.userId;
        return true;
    }

    updatePlaybackState({ playState, currentTime, videoId }) {
        if (videoId !== undefined) {
            this.videoId = videoId;
        }
        if (currentTime !== undefined) {
            this.currentTime = currentTime;
        }
        if (playState !== undefined) {
            this.playState = playState;
        }
        this.lastStateUpdate = Date.now();
    }

    getSyncState() {
        let currentCalculatedTime = this.currentTime;
        if (this.playState === "playing") {
            const elapsed = (Date.now() - this.lastStateUpdate) / 1000;
            currentCalculatedTime += elapsed;
        }
        return {
            videoId: this.videoId,
            currentTime: currentCalculatedTime,
            playState: this.playState,
            lastStateUpdate: this.lastStateUpdate
        };
    }

    addChatMessage(senderUsername, senderUserId, message, type = "user") {
        const msg = {
            id: Math.random().toString(36).substring(2, 9),
            senderUsername,
            senderUserId,
            message,
            type, // "user" | "system"
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        this.chatMessages.push(msg);
        if (this.chatMessages.length > 100) {
            this.chatMessages.shift();
        }
        return msg;
    }

    isEmpty() {
        return this.participants.size === 0;
    }
}

module.exports = Room;
