const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const roomManager = require("./src/managers/RoomManager");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Helper to extract YouTube video ID from URL or return raw ID
function extractVideoId(input) {
    if (!input) return "dQw4w9WgXcQ";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = input.match(regExp);
    return (match && match[2].length === 11) ? match[2] : input.trim();
}

// Health Check Endpoint
app.get("/", (req, res) => {
    res.json({
        status: "online",
        system: "YouTube Watch Party Backend",
        activeRooms: roomManager.rooms.size
    });
});

io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // 1. CREATE ROOM
    socket.on("create_room", ({ username, videoUrl }) => {
        const videoId = extractVideoId(videoUrl);
        const { room, participant } = roomManager.createRoom(socket.id, username, videoId);

        socket.join(room.roomId);

        // System notification message
        const sysMsg = room.addChatMessage("System", "system", `${participant.username} created the watch room!`, "system");

        socket.emit("room_created", {
            roomId: room.roomId,
            participant,
            roomState: room.getSyncState(),
            participants: room.getParticipantsList(),
            chatHistory: room.chatMessages
        });

        console.log(`[Room Created] ID: ${room.roomId} by Host: ${username}`);
    });

    // 2. JOIN ROOM
    socket.on("join_room", ({ roomId, username }) => {
        const result = roomManager.joinRoom(roomId, socket.id, username);

        if (result.error) {
            socket.emit("error_message", { message: result.error });
            return;
        }

        const { room, participant } = result;
        socket.join(room.roomId);

        const sysMsg = room.addChatMessage("System", "system", `${participant.username} joined the party!`, "system");

        // Send confirmation to joining user
        socket.emit("room_joined", {
            roomId: room.roomId,
            participant,
            roomState: room.getSyncState(),
            participants: room.getParticipantsList(),
            chatHistory: room.chatMessages
        });

        // Broadcast updated participants list and new chat message to room
        io.to(room.roomId).emit("user_joined", {
            username: participant.username,
            userId: participant.userId,
            role: participant.role,
            participants: room.getParticipantsList()
        });

        io.to(room.roomId).emit("chat_message", sysMsg);

        console.log(`[Room Joined] User ${username} joined ${room.roomId}`);
    });

    // 3. PLAY EVENT
    socket.on("play", ({ currentTime }) => {
        const session = roomManager.getRoomBySocketId(socket.id);
        if (!session) return;

        const { room, userId } = session;
        const participant = room.getParticipant(userId);

        if (!participant || !participant.canControlPlayback()) {
            socket.emit("error_message", { message: "Permission Denied: Only Host or Moderator can control playback." });
            return;
        }

        room.updatePlaybackState({
            playState: "playing",
            currentTime: currentTime !== undefined ? currentTime : room.currentTime
        });

        io.to(room.roomId).emit("sync_state", {
            ...room.getSyncState(),
            action: "play",
            triggeredBy: participant.username
        });
    });

    // 4. PAUSE EVENT
    socket.on("pause", ({ currentTime }) => {
        const session = roomManager.getRoomBySocketId(socket.id);
        if (!session) return;

        const { room, userId } = session;
        const participant = room.getParticipant(userId);

        if (!participant || !participant.canControlPlayback()) {
            socket.emit("error_message", { message: "Permission Denied: Only Host or Moderator can control playback." });
            return;
        }

        room.updatePlaybackState({
            playState: "paused",
            currentTime: currentTime !== undefined ? currentTime : room.currentTime
        });

        io.to(room.roomId).emit("sync_state", {
            ...room.getSyncState(),
            action: "pause",
            triggeredBy: participant.username
        });
    });

    // 5. SEEK EVENT
    socket.on("seek", ({ time }) => {
        const session = roomManager.getRoomBySocketId(socket.id);
        if (!session) return;

        const { room, userId } = session;
        const participant = room.getParticipant(userId);

        if (!participant || !participant.canControlPlayback()) {
            socket.emit("error_message", { message: "Permission Denied: Only Host or Moderator can scrub video position." });
            return;
        }

        room.updatePlaybackState({
            currentTime: time
        });

        io.to(room.roomId).emit("sync_state", {
            ...room.getSyncState(),
            action: "seek",
            triggeredBy: participant.username
        });
    });

    // 6. CHANGE VIDEO
    socket.on("change_video", ({ videoId }) => {
        const session = roomManager.getRoomBySocketId(socket.id);
        if (!session) return;

        const { room, userId } = session;
        const participant = room.getParticipant(userId);

        if (!participant || !participant.canControlPlayback()) {
            socket.emit("error_message", { message: "Permission Denied: Only Host or Moderator can change video." });
            return;
        }

        const cleanVideoId = extractVideoId(videoId);
        room.updatePlaybackState({
            videoId: cleanVideoId,
            currentTime: 0,
            playState: "playing"
        });

        const sysMsg = room.addChatMessage("System", "system", `${participant.username} changed the video!`, "system");

        io.to(room.roomId).emit("sync_state", {
            ...room.getSyncState(),
            action: "change_video",
            triggeredBy: participant.username
        });

        io.to(room.roomId).emit("chat_message", sysMsg);
    });

    // 7. ASSIGN ROLE (Host Only)
    socket.on("assign_role", ({ targetUserId, newRole }) => {
        const session = roomManager.getRoomBySocketId(socket.id);
        if (!session) return;

        const { room, userId } = session;
        const hostParticipant = room.getParticipant(userId);

        if (!hostParticipant || !hostParticipant.canManageRoles()) {
            socket.emit("error_message", { message: "Permission Denied: Only the Host can change user roles." });
            return;
        }

        const success = room.setRole(targetUserId, newRole);
        if (success) {
            const target = room.getParticipant(targetUserId);
            const sysMsg = room.addChatMessage("System", "system", `${target.username}'s role was updated to ${newRole}`, "system");

            io.to(room.roomId).emit("role_assigned", {
                targetUserId,
                targetUsername: target.username,
                newRole,
                participants: room.getParticipantsList()
            });

            io.to(room.roomId).emit("chat_message", sysMsg);
        }
    });

    // 8. REMOVE PARTICIPANT (Host Only)
    socket.on("remove_participant", ({ targetUserId }) => {
        const session = roomManager.getRoomBySocketId(socket.id);
        if (!session) return;

        const { room, userId } = session;
        const hostParticipant = room.getParticipant(userId);

        if (!hostParticipant || !hostParticipant.canManageRoles()) {
            socket.emit("error_message", { message: "Permission Denied: Only Host can remove participants." });
            return;
        }

        const removedUser = room.getParticipant(targetUserId);
        if (removedUser) {
            // Find target socket
            const targetSocket = io.sockets.sockets.get(removedUser.socketId);
            if (targetSocket) {
                targetSocket.emit("kicked", { message: "You were removed from the watch party by the host." });
                targetSocket.leave(room.roomId);
            }

            room.removeParticipant(targetUserId);
            const sysMsg = room.addChatMessage("System", "system", `${removedUser.username} was removed from the party.`, "system");

            io.to(room.roomId).emit("participant_removed", {
                userId: targetUserId,
                username: removedUser.username,
                participants: room.getParticipantsList()
            });

            io.to(room.roomId).emit("chat_message", sysMsg);
        }
    });

    // 9. TRANSFER HOST (Host Only)
    socket.on("transfer_host", ({ targetUserId }) => {
        const session = roomManager.getRoomBySocketId(socket.id);
        if (!session) return;

        const { room, userId } = session;
        const currentHost = room.getParticipant(userId);

        if (!currentHost || !currentHost.canManageRoles()) {
            socket.emit("error_message", { message: "Permission Denied: Only Host can transfer ownership." });
            return;
        }

        const targetUser = room.getParticipant(targetUserId);
        if (targetUser && room.transferHost(targetUserId)) {
            const sysMsg = room.addChatMessage("System", "system", `👑 Host authority transferred to ${targetUser.username}!`, "system");

            io.to(room.roomId).emit("host_transferred", {
                newHostUserId: targetUserId,
                newHostUsername: targetUser.username,
                participants: room.getParticipantsList()
            });

            io.to(room.roomId).emit("chat_message", sysMsg);
        }
    });

    // 10. CHAT MESSAGES
    socket.on("send_message", ({ message }) => {
        const session = roomManager.getRoomBySocketId(socket.id);
        if (!session) return;

        const { room, userId } = session;
        const participant = room.getParticipant(userId);

        if (participant && message && message.trim().length > 0) {
            const chatObj = room.addChatMessage(participant.username, participant.userId, message.trim(), "user");
            io.to(room.roomId).emit("chat_message", chatObj);
        }
    });

    // 11. LIVE REACTION BURST
    socket.on("send_reaction", ({ emoji }) => {
        const session = roomManager.getRoomBySocketId(socket.id);
        if (!session) return;

        const { room, userId } = session;
        const participant = room.getParticipant(userId);

        if (participant) {
            io.to(room.roomId).emit("reaction_triggered", {
                username: participant.username,
                emoji,
                id: Math.random().toString(36).substring(2, 9)
            });
        }
    });

    // 12. LEAVE / DISCONNECT
    socket.on("leave_room", () => {
        handleUserExit(socket);
    });

    socket.on("disconnect", () => {
        console.log(`[Socket] Disconnected: ${socket.id}`);
        handleUserExit(socket);
    });

    function handleUserExit(sock) {
        const exitResult = roomManager.leaveRoom(sock.id);
        if (exitResult) {
            const { room, removedParticipant, roomId, isRoomEmpty, newHostAssigned, nextHost } = exitResult;
            sock.leave(roomId);

            if (!isRoomEmpty && removedParticipant) {
                const sysMsg = room.addChatMessage("System", "system", `${removedParticipant.username} left the room.`, "system");

                io.to(roomId).emit("user_left", {
                    username: removedParticipant.username,
                    userId: removedParticipant.userId,
                    participants: room.getParticipantsList()
                });

                if (newHostAssigned && nextHost) {
                    const hostSysMsg = room.addChatMessage("System", "system", `👑 ${nextHost.username} is now the new Host!`, "system");
                    io.to(roomId).emit("host_transferred", {
                        newHostUserId: nextHost.userId,
                        newHostUsername: nextHost.username,
                        participants: room.getParticipantsList()
                    });
                    io.to(roomId).emit("chat_message", hostSysMsg);
                }

                io.to(roomId).emit("chat_message", sysMsg);
            }
        }
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Watch Party WebSocket Server running on http://localhost:${PORT}`);
});