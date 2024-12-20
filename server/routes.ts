import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./socket";
import { db } from "@db";
import { sessions, questions, sessionParticipants, submissions } from "@db/schema";
import { eq, and } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Middleware to check auth
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    next();
  };

  // Sessions
  app.post("/api/sessions", requireAuth, async (req, res) => {
    try {
      if (req.user?.role !== "teacher") {
        return res.status(403).send("Only teachers can create sessions");
      }

      const { title, description, questionId } = req.body;

      if (!title || !questionId) {
        return res.status(400).send("Title and question selection are required");
      }

      // Verify question exists
      const [question] = await db
        .select()
        .from(questions)
        .where(eq(questions.id, questionId))
        .limit(1);

      if (!question) {
        return res.status(404).send("Selected question not found");
      }

      const [session] = await db.insert(sessions)
        .values({
          title,
          description: description || null,
          teacherId: req.user.id,
          questionId,
          isActive: true
        })
        .returning();

      res.json(session);
    } catch (error) {
      console.error("Session creation error:", error);
      res.status(500).send(error instanceof Error ? error.message : "Failed to create session");
    }
  });

  // Questions API
  app.get("/api/questions", requireAuth, async (req, res) => {
    try {
      const questionsList = await db
        .select()
        .from(questions)
        .orderBy(questions.createdAt);

      res.json(questionsList);
    } catch (error) {
      res.status(500).send("Failed to fetch questions");
    }
  });

  app.delete("/api/questions/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user || req.user.role !== "teacher") {
        return res.status(403).send("Only teachers can delete questions");
      }

      const questionId = parseInt(req.params.id);
      const [question] = await db
        .select()
        .from(questions)
        .where(eq(questions.id, questionId))
        .limit(1);

      if (!question) {
        return res.status(404).send("Question not found");
      }

      await db.delete(questions).where(eq(questions.id, questionId));

      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).send(error instanceof Error ? error.message : "Failed to delete question");
    }
  });

  app.post("/api/questions", requireAuth, async (req, res) => {
    try {
      if (!req.user || req.user.role !== "teacher") {
        return res.status(403).send("Only teachers can create questions");
      }

      const { title, description, functionName, testCases } = req.body;
      
      if (!title || !description || !functionName || !Array.isArray(testCases)) {
        console.error("Invalid request body:", req.body);
        return res.status(400).send("Invalid question data. Title, description, function name and test cases are required.");
      }

      const [question] = await db.insert(questions)
        .values({
          title,
          description,
          functionName,
          testCases
        })
        .returning();

      console.log("Question created successfully:", question);
      res.json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).send(error instanceof Error ? error.message : "Failed to create question");
    }
  });

  app.get("/api/sessions", requireAuth, async (req, res) => {
    try {
      let query = db.query.sessions.findMany({
        with: {
          question: true
        }
      });
      
      if (req.user?.role === "student") {
        query = db.query.sessions.findMany({
          with: {
            question: true,
            participants: {
              where: eq(sessionParticipants.userId, req.user.id)
            }
          }
        });
      } else if (req.user?.role === "teacher") {
        query = db.query.sessions.findMany({
          with: {
            question: true
          },
          where: eq(sessions.teacherId, req.user.id)
        });
      }

      const result = await query;
      res.json(result);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).send("Failed to fetch sessions");
    }
  });

  // Questions
  app.post("/api/sessions/:sessionId/questions", requireAuth, async (req, res) => {
    try {
      if (req.user.role !== "teacher") {
        return res.status(403).send("Only teachers can create questions");
      }

      const [question] = await db.insert(questions)
        .values({
          sessionId: parseInt(req.params.sessionId),
          title: req.body.title,
          description: req.body.description,
          testCases: req.body.testCases
        })
        .returning();

      res.json(question);
    } catch (error) {
      res.status(500).send("Failed to create question");
    }
  });

  app.get("/api/sessions/:sessionId", requireAuth, async (req, res) => {
    try {
      const result = await db.query.sessions.findFirst({
        where: eq(sessions.id, parseInt(req.params.sessionId)),
        with: {
          question: true
        }
      });

      if (!result) {
        return res.status(404).send("Session not found");
      }

      res.json(result);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).send("Failed to fetch session");
    }
  });

  app.get("/api/sessions/:sessionId/questions", requireAuth, async (req, res) => {
    try {
      const sessionQuestions = await db
        .select()
        .from(questions)
        .where(eq(questions.sessionId, parseInt(req.params.sessionId)));

      res.json(sessionQuestions);
    } catch (error) {
      res.status(500).send("Failed to fetch questions");
    }
  });

  // Session participants
  app.post("/api/sessions/:sessionId/join", requireAuth, async (req, res) => {
    try {
      const [participant] = await db.insert(sessionParticipants)
        .values({
          sessionId: parseInt(req.params.sessionId),
          userId: req.user.id
        })
        .returning();

      res.json(participant);
    } catch (error) {
      res.status(500).send("Failed to join session");
    }
  });

  const httpServer = createServer(app);
  setupWebSocket(httpServer);

  return httpServer;
}