const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("./modules/users/user.model");
const Conversation = require("./modules/conversations/conversation.model");
const Message = require("./modules/messages/message.model");
const { sendMessageSchema } = require("./modules/messages/message.validation");

function getCookie(cookieHeader, name) {
  if (!cookieHeader) return null;

  const item = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!item) return null;

  try {
    return decodeURIComponent(item.slice(name.length + 1));
  } catch {
    return null;
  }
}


async function getAuthorizedConversation(conversationId, userId) {
  if (!mongoose.isValidObjectId(conversationId)) {
    return null;
  }

  return Conversation.findOne({
    _id: conversationId,
    $or: [
      { clientId: userId },
      { professionalId: userId },
    ],
  });
}


function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        getCookie(socket.handshake.headers.cookie, "accessToken");

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.sub);

      if (!user || user.status !== "active") {
        return next(new Error("User is not authorized"));
      }

      socket.user = user;
      return next();
    } catch {
      return next(new Error("Invalid or expired authentication token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("conversation:join", async (data = {}, ack) => {
      try {
        const { conversationId } = data;

        if (!mongoose.isValidObjectId(conversationId)) {
          return ack?.({
            success: false,
            message: "Invalid conversation ID",
          });
        }

        const conversation = await Conversation.findOne({
          _id: conversationId,
          $or: [
            { clientId: socket.user._id },
            { professionalId: socket.user._id },
          ],
        });

        if (!conversation) {
          return ack?.({
            success: false,
            message: "Conversation not found or access denied",
          });
        }

        const room = `conversation:${conversation._id}`;
        await socket.join(room);

        return ack?.({
          success: true,
          message: "Joined conversation",
          conversationId: conversation._id.toString(),
        });
      } catch (error) {
        console.error("Conversation join error:", error.message);

        return ack?.({
          success: false,
          message: "Unable to join conversation",
        });
      }
    });

    socket.on("message:send", async (data = {}, ack) => {
      try {
        const { conversationId } = data;

        if (!mongoose.isValidObjectId(conversationId)) {
          return ack?.({
            success: false,
            message: "Invalid conversation ID",
          });
        }

        const result = sendMessageSchema.safeParse({
          content: data.content,
        });

        if (!result.success) {
          return ack?.({
            success: false,
            message: "Message content must be between 1 and 5000 characters",
          });
        }

        const conversation = await Conversation.findOne({
          _id: conversationId,
          $or: [
            { clientId: socket.user._id },
            { professionalId: socket.user._id },
          ],
        });

        if (!conversation) {
          return ack?.({
            success: false,
            message: "Conversation not found or access denied",
          });
        }

        const room = `conversation:${conversation._id}`;

        if (!socket.rooms.has(room)) {
          return ack?.({
            success: false,
            message: "Join the conversation before sending messages",
          });
        }

        const message = await Message.create({
          conversationId: conversation._id,
          senderId: socket.user._id,
          content: result.data.content,
          readBy: [socket.user._id],
        });

        await Conversation.updateOne(
          { _id: conversation._id },
          { $set: { lastMessageAt: message.createdAt } }
        );

        const populatedMessage = await Message.findById(message._id)
          .populate("senderId", "name username");

        io.to(room).emit("message:new", populatedMessage);

        return ack?.({
          success: true,
          message: "Message sent",
          data: populatedMessage,
        });
      } catch (error) {
        console.error("Message send error:", error.message);

        return ack?.({
          success: false,
          message: "Unable to send message",
        });
      }
    });


    // ---------------- VIDEO CALL SIGNALING ----------------

    // Invite the other participant to a call.
    socket.on("call:invite", async (data = {}, ack) => {
      try {
        const { conversationId } = data;

        const conversation = await getAuthorizedConversation(
          conversationId,
          socket.user._id
        );

        if (!conversation) {
          return ack?.({
            success: false,
            message: "Conversation not found or access denied",
          });
        }

        const room = `conversation:${conversation._id}`;

        if (!socket.rooms.has(room)) {
          return ack?.({
            success: false,
            message: "Join the conversation before starting a call",
          });
        }

        const recipientId =
          String(conversation.clientId) === String(socket.user._id)
            ? conversation.professionalId
            : conversation.clientId;

        io.to(room).emit("call:incoming", {
          conversationId: String(conversation._id),
          callerId: String(socket.user._id),
          callerName: socket.user.name || socket.user.username || "SkillConnect user",
          recipientId: String(recipientId),
        });

        return ack?.({ success: true, message: "Call invitation sent" });
      } catch (error) {
        console.error("Call invitation error:", error.message);
        return ack?.({ success: false, message: "Unable to start call" });
      }
    });

    // The recipient accepts the invitation.
    socket.on("call:accept", async (data = {}, ack) => {
      try {
        const { conversationId, callerId } = data;

        const conversation = await getAuthorizedConversation(
          conversationId,
          socket.user._id
        );

        if (!conversation) {
          return ack?.({ success: false, message: "Access denied" });
        }

        const room = `conversation:${conversation._id}`;

        if (!socket.rooms.has(room)) {
          return ack?.({ success: false, message: "Join the conversation first" });
        }

        const isOtherParticipant =
          String(callerId) !== String(socket.user._id) &&
          [String(conversation.clientId), String(conversation.professionalId)]
            .includes(String(callerId));

        if (!isOtherParticipant) {
          return ack?.({ success: false, message: "Invalid caller" });
        }

        io.to(room).emit("call:accepted", {
          conversationId: String(conversation._id),
          callerId: String(callerId),
          acceptedBy: String(socket.user._id),
        });

        return ack?.({ success: true });
      } catch (error) {
        console.error("Call accept error:", error.message);
        return ack?.({ success: false, message: "Unable to accept call" });
      }
    });

    // The recipient rejects the invitation.
    socket.on("call:reject", async (data = {}, ack) => {
      try {
        const { conversationId, callerId } = data;

        const conversation = await getAuthorizedConversation(
          conversationId,
          socket.user._id
        );

        if (!conversation) {
          return ack?.({ success: false, message: "Access denied" });
        }

        const room = `conversation:${conversation._id}`;

        if (!socket.rooms.has(room)) {
          return ack?.({ success: false, message: "Join the conversation first" });
        }

        const isOtherParticipant =
          String(callerId) !== String(socket.user._id) &&
          [String(conversation.clientId), String(conversation.professionalId)]
            .includes(String(callerId));

        if (!isOtherParticipant) {
          return ack?.({ success: false, message: "Invalid caller" });
        }

        io.to(room).emit("call:rejected", {
          conversationId: String(conversation._id),
          rejectedBy: String(socket.user._id),
          callerId: String(callerId),
        });

        return ack?.({ success: true });
      } catch (error) {
        console.error("Call reject error:", error.message);
        return ack?.({ success: false, message: "Unable to reject call" });
      }
    });

    // Relay WebRTC signaling only between the two participants.
    async function relayCallSignal(eventName, data = {}, ack) {
      try {
        const { conversationId, targetUserId, signal } = data;

        const conversation = await getAuthorizedConversation(
          conversationId,
          socket.user._id
        );

        if (!conversation) {
          return ack?.({ success: false, message: "Access denied" });
        }

        const room = `conversation:${conversation._id}`;

        if (!socket.rooms.has(room)) {
          return ack?.({ success: false, message: "Join the conversation first" });
        }

        const participantIds = [
          String(conversation.clientId),
          String(conversation.professionalId),
        ];

        if (
          !targetUserId ||
          String(targetUserId) === String(socket.user._id) ||
          !participantIds.includes(String(targetUserId))
        ) {
          return ack?.({ success: false, message: "Invalid call recipient" });
        }

        if (!signal || typeof signal !== "object") {
          return ack?.({ success: false, message: "Invalid signaling data" });
        }

        // Forward only to the intended participant's sockets in this room.
        const recipientSockets = await io
          .in(room)
          .fetchSockets();

        const recipientExists = recipientSockets.some(
          (recipientSocket) =>
            String(recipientSocket.user?._id) === String(targetUserId)
        );

        if (!recipientExists) {
          return ack?.({
            success: false,
            message: "The other participant is not connected",
          });
        }

        recipientSockets
          .filter(
            (recipientSocket) =>
              String(recipientSocket.user?._id) === String(targetUserId)
          )
          .forEach((recipientSocket) => {
            recipientSocket.emit(eventName, {
              conversationId: String(conversation._id),
              senderId: String(socket.user._id),
              signal,
            });
          });

        return ack?.({ success: true });
      } catch (error) {
        console.error(`${eventName} relay error:`, error.message);
        return ack?.({ success: false, message: "Unable to relay call signal" });
      }
    }

    socket.on("call:offer", (data, ack) =>
      relayCallSignal("call:offer", data, ack)
    );

    socket.on("call:answer", (data, ack) =>
      relayCallSignal("call:answer", data, ack)
    );

    socket.on("call:ice-candidate", (data, ack) =>
      relayCallSignal("call:ice-candidate", data, ack)
    );

    // Either participant can end the call.
    socket.on("call:end", async (data = {}, ack) => {
      try {
        const { conversationId } = data;

        const conversation = await getAuthorizedConversation(
          conversationId,
          socket.user._id
        );

        if (!conversation) {
          return ack?.({ success: false, message: "Access denied" });
        }

        const room = `conversation:${conversation._id}`;

        if (!socket.rooms.has(room)) {
          return ack?.({ success: false, message: "Join the conversation first" });
        }

        socket.to(room).emit("call:ended", {
          conversationId: String(conversation._id),
          userId: String(socket.user._id),
        });

        return ack?.({ success: true });
      } catch (error) {
        console.error("Call end error:", error.message);
        return ack?.({ success: false, message: "Unable to end call" });
      }
    });


    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  return io;
}

module.exports = initializeSocket;
