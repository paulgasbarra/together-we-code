import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import { db } from "@db";
import { sessions, questions, submissions } from "@db/schema";
import { eq } from "drizzle-orm";

export function setupWebSocket(server: HttpServer) {
  const io = new SocketServer(server, {
    cors: {
      origin: true,
      credentials: true,
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    let currentRoom: string | null = null;

    socket.on("join-session", async (sessionId: number) => {
      if (currentRoom) {
        socket.leave(currentRoom);
      }
      
      const roomId = `session-${sessionId}`;
      await socket.join(roomId);
      currentRoom = roomId;

      // Notify others in the room
      socket.to(roomId).emit("user-joined", {
        userId: socket.handshake.auth.userId,
        username: socket.handshake.auth.username
      });
    });

    socket.on("code-update", (data: { 
      sessionId: number,
      questionId: number,
      code: string,
      userId: number
    }) => {
      const roomId = `session-${data.sessionId}`;
      socket.to(roomId).emit("code-changed", {
        questionId: data.questionId,
        code: data.code,
        userId: data.userId
      });
    });

    socket.on("submit-answer", async (data: {
      sessionId: number,
      questionId: number,
      code: string,
      userId: number
    }) => {
      try {
        const [submission] = await db.insert(submissions)
          .values({
            questionId: data.questionId,
            studentId: data.userId,
            code: data.code,
            status: "pending"
          })
          .returning();

        // TODO: Run tests and update submission status
        // For now, we'll just mark it as passed
        await db
          .update(submissions)
          .set({ status: "passed", results: { passed: true } })
          .where(eq(submissions.id, submission.id));

        const roomId = `session-${data.sessionId}`;
        io.to(roomId).emit("submission-result", {
          submissionId: submission.id,
          questionId: data.questionId,
          userId: data.userId,
          status: "passed"
        });
      } catch (error) {
        console.error("Submission error:", error);
        socket.emit("error", "Failed to submit answer");
      }
    });

    socket.on("disconnect", () => {
      if (currentRoom) {
        socket.to(currentRoom).emit("user-left", {
          userId: socket.handshake.auth.userId,
          username: socket.handshake.auth.username
        });
      }
    });
  });

  return io;
}
