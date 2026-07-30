const messageService = require("../services/message.service");
const interviewService = require("../services/interview.service");
const aiInterviewService = require("../services/aiInterview.service");
const { SESSION_STATUS } = require("../constants/interview.constants");

const SOCKET_EVENTS = {
  JOIN_SESSION: "join_session",
  SEND_MESSAGE: "send_message",
  RECEIVE_MESSAGE: "receive_message",
  AI_RESPONSE: "ai_response",
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

      await interviewService.getSessionById({
        sessionId,
        userId: socket.user.id,
      });

      socket.join(buildRoomName(sessionId));
      socket.emit("joined_session", { sessionId });
    } catch (error) {
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: error.message || "Unable to join session",
      });
    }
  });

  socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (payload = {}) => {
    try {
      const { sessionId, message } = payload;

      if (!sessionId || !message) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: "sessionId and message are required for send_message",
        });
        return;
      }

      const session = await messageService.findSessionById(sessionId);
      if (!session || session.userId !== socket.user.id) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: "Interview session not found",
        });
        return;
      }

      if (session.status !== SESSION_STATUS.ACTIVE) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: "This interview session is no longer active.",
        });
        return;
      }

      const result = await aiInterviewService.processCandidateMessage({
        sessionId,
        userId: socket.user.id,
        message,
      });

      io.to(buildRoomName(sessionId)).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, {
        id: result.userMessage.id,
        sessionId: result.userMessage.interviewSessionId,
        role: result.userMessage.role,
        content: result.userMessage.content,
        createdAt: result.userMessage.createdAt,
      });

      io.to(buildRoomName(sessionId)).emit(SOCKET_EVENTS.AI_RESPONSE, {
        userMessage: result.userMessage,
        assistantMessage: result.assistantMessage,
        aiResponse: result.aiResponse,
      });
    } catch (error) {
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: error.message || "Unable to send message",
      });
    }
  });
};

module.exports = {
  registerChatSocketHandlers,
  SOCKET_EVENTS,
};
