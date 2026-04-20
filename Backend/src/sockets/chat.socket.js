const messageService = require("../services/message.service");

const SOCKET_EVENTS = {
  JOIN_SESSION: "join_session",
  SEND_MESSAGE: "send_message",
  RECEIVE_MESSAGE: "receive_message",
  ERROR: "socket_error",
};

const buildRoomName = (sessionId) => `session:${sessionId}`;

const registerChatSocketHandlers = (io, socket) => {
  socket.on(SOCKET_EVENTS.JOIN_SESSION, async (payload = {}) => {
    try {
      const { sessionId } = payload;

      if (!sessionId) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: "sessionId is required for join_session",
        });
        return;
      }

      const session = await messageService.findSessionById(sessionId);
      if (!session) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: "Interview session not found",
        });
        return;
      }

      socket.join(buildRoomName(sessionId));
      socket.emit("joined_session", { sessionId });
    } catch (error) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: "Unable to join session" });
    }
  });

  socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (payload = {}) => {
    try {
      const { sessionId, role, content } = payload;

      if (!sessionId || !role || !content) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: "sessionId, role, and content are required for send_message",
        });
        return;
      }

      const session = await messageService.findSessionById(sessionId);
      if (!session) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: "Interview session not found",
        });
        return;
      }

      const savedMessage = await messageService.createMessage({
        interviewSessionId: sessionId,
        role,
        content,
      });

      io.to(buildRoomName(sessionId)).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, {
        id: savedMessage.id,
        sessionId: savedMessage.interviewSessionId,
        role: savedMessage.role,
        content: savedMessage.content,
        createdAt: savedMessage.createdAt,
      });
    } catch (error) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: "Unable to send message" });
    }
  });
};

module.exports = {
  registerChatSocketHandlers,
};
