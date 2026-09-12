class Participant {
    constructor(userId, socketId, username, role = "Participant") {
        this.userId = userId;
        this.socketId = socketId;
        this.username = username;
        this.role = role; // "Host" | "Moderator" | "Participant" | "Viewer"
        this.joinedAt = new Date();
    }

    canControlPlayback() {
        return this.role === "Host" || this.role === "Moderator";
    }

    canManageRoles() {
        return this.role === "Host";
    }

    toJSON() {
        return {
            userId: this.userId,
            socketId: this.socketId,
            username: this.username,
            role: this.role,
            joinedAt: this.joinedAt
        };
    }
}

module.exports = Participant;
