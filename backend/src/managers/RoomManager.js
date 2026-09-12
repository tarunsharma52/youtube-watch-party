const Room = require('../models/Room');
const Participant = require('../models/Participant');

class RoomManager {
    constructor() {
        this.rooms = new Map(); // roomId -> Room
        this.socketToRoom = new Map(); // socketId -> { roomId, userId }
    }

    generateRoomId() {
        let code = "";
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return this.rooms.has(code) ? this.generateRoomId() : code;
    }

    createRoom(socketId, username, initialVideoId = "dQw4w9WgXcQ") {
        const roomId = this.generateRoomId();
        const userId = `usr_${socketId.substring(0, 6)}_${Math.random().toString(36).substring(2, 6)}`;
        
        const hostParticipant = new Participant(userId, socketId, username, "Host");
        const newRoom = new Room(roomId, hostParticipant, initialVideoId);

        this.rooms.set(roomId, newRoom);
        this.socketToRoom.set(socketId, { roomId, userId });

        return { room: newRoom, participant: hostParticipant };
    }

    joinRoom(roomId, socketId, username) {
        const upperRoomId = roomId.trim().toUpperCase();
        const room = this.rooms.get(upperRoomId);

        if (!room) {
            return { error: "Room not found. Please verify room code." };
        }

        const userId = `usr_${socketId.substring(0, 6)}_${Math.random().toString(36).substring(2, 6)}`;
        const participant = new Participant(userId, socketId, username, "Participant");

        room.addParticipant(participant);
        this.socketToRoom.set(socketId, { roomId: upperRoomId, userId });

        return { room, participant };
    }

    getRoom(roomId) {
        return this.rooms.get(roomId?.toUpperCase());
    }

    getRoomBySocketId(socketId) {
        const mapping = this.socketToRoom.get(socketId);
        if (!mapping) return null;
        return {
            room: this.rooms.get(mapping.roomId),
            userId: mapping.userId,
            roomId: mapping.roomId
        };
    }

    leaveRoom(socketId) {
        const mapping = this.socketToRoom.get(socketId);
        if (!mapping) return null;

        const { roomId, userId } = mapping;
        const room = this.rooms.get(roomId);

        this.socketToRoom.delete(socketId);

        if (room) {
            const removedParticipant = room.removeParticipant(userId);

            // Handle host dynamic transfer or room cleanup
            let newHostAssigned = false;
            let nextHost = null;

            if (room.hostId === userId && !room.isEmpty()) {
                // Promote first available participant to Host automatically
                const remaining = Array.from(room.participants.values());
                if (remaining.length > 0) {
                    nextHost = remaining[0];
                    room.transferHost(nextHost.userId);
                    newHostAssigned = true;
                }
            }

            if (room.isEmpty()) {
                this.rooms.delete(roomId);
            }

            return {
                room,
                removedParticipant,
                roomId,
                isRoomEmpty: room.isEmpty(),
                newHostAssigned,
                nextHost
            };
        }

        return null;
    }
}

module.exports = new RoomManager();
