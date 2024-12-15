import { pgTable, text, serial, timestamp, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  questionId: integer("question_id").references(() => questions.id).notNull(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  testCases: json("test_cases").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").references(() => questions.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  code: text("code").notNull(),
  status: text("status").notNull(), // "pending", "passed", "failed"
  results: json("results"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow()
});

export const sessionParticipants = pgTable("session_participants", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  joinedAt: timestamp("joined_at").notNull().defaultNow()
});

// Relations
export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  teacher: one(users, {
    fields: [sessions.teacherId],
    references: [users.id]
  }),
  question: one(questions, {
    fields: [sessions.questionId],
    references: [questions.id]
  }),
  participants: many(sessionParticipants)
}));

export const questionsRelations = relations(questions, ({ many }) => ({
  submissions: many(submissions)
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  student: one(users, {
    fields: [submissions.studentId],
    references: [users.id]
  }),
  question: one(questions, {
    fields: [submissions.questionId],
    references: [questions.id]
  })
}));

export const sessionParticipantsRelations = relations(sessionParticipants, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionParticipants.sessionId],
    references: [sessions.id]
  }),
  user: one(users, {
    fields: [sessionParticipants.userId],
    references: [users.id]
  })
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertSessionSchema = createInsertSchema(sessions);
export const selectSessionSchema = createSelectSchema(sessions);
export const insertQuestionSchema = createInsertSchema(questions);
export const selectQuestionSchema = createSelectSchema(questions);

// Types
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type SessionParticipant = typeof sessionParticipants.$inferSelect;
