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
      if (req.user.role !== "teacher") {
        return res.status(403).send("Only teachers can create sessions");
      }

      const [session] = await db.insert(sessions)
        .values({
          title: req.body.title,
          description: req.body.description,
          teacherId: req.user.id,
          questionId: req.body.questionId
        })
        .returning();

      res.json(session);
    } catch (error) {
      res.status(500).send("Failed to create session");
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

  app.post("/api/questions", requireAuth, async (req, res) => {
    try {
      if (req.user.role !== "teacher") {
        return res.status(403).send("Only teachers can create questions");
      }

      const [question] = await db.insert(questions)
        .values({
          title: req.body.title,
          description: req.body.description,
          testCases: req.body.testCases,
          sessionId: null // Questions are now created independently of sessions
        })
        .returning();

      res.json(question);
    } catch (error) {
      res.status(500).send("Failed to create question");
    }
  });

  app.get("/api/sessions", requireAuth, async (req, res) => {
    try {
      let query = db.select().from(sessions);
      
      if (req.user.role === "student") {
        query = query.innerJoin(
          sessionParticipants,
          and(
            eq(sessions.id, sessionParticipants.sessionId),
            eq(sessionParticipants.userId, req.user.id)
          )
        );
      } else if (req.user.role === "teacher") {
        query = query.where(eq(sessions.teacherId, req.user.id));
      }

      const result = await query;
      res.json(result);
    } catch (error) {
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
