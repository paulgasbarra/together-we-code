import { exec } from 'child_process';
import { writeFile } from 'fs/promises';
import { promisify } from 'util';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

async function executeJavaScript(code: string, functionName: string, input: string): Promise<string> {
  const wrappedCode = `
    ${code}
    console.log(${functionName}(${input}));
  `;
  
  const result = await execAsync(`node -e "${wrappedCode}"`);
  return result.stdout;
}

async function executePython(code: string, functionName: string, input: string): Promise<string> {
  const wrappedCode = `
${code}
print(${functionName}(${input}))
`;
  
  const tempFile = join(tmpdir(), `${Date.now()}.py`);
  await writeFile(tempFile, wrappedCode);
  
  const result = await execAsync(`python3 ${tempFile}`);
  return result.stdout;
}

async function executeTypeScript(code: string, functionName: string, input: string): Promise<string> {
  const wrappedCode = `
    ${code}
    console.log(${functionName}(${input}));
  `;
  
  const tempFile = join(tmpdir(), `${Date.now()}.ts`);
  await writeFile(tempFile, wrappedCode);
  
  await execAsync(`tsc ${tempFile} --esModuleInterop`);
  const jsFile = tempFile.replace('.ts', '.js');
  const result = await execAsync(`node ${jsFile}`);
  return result.stdout;
}

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

        // Get question details to run tests
        const [question] = await db
          .select()
          .from(questions)
          .where(eq(questions.id, data.questionId))
          .limit(1);

        if (!question) {
          throw new Error("Question not found");
        }

        let testResults = [];
        let allPassed = true;

        // Run each test case
        for (const testCase of question.testCases) {
          try {
            let result;
            const inputParams = Object.values(testCase.input).join(', ');
            
            // Execute code based on language
            switch(data.language) {
              case 'javascript':
                result = await executeJavaScript(data.code, inputParams);
                break;
              case 'python':
                result = await executePython(data.code, inputParams);
                break;
              case 'typescript':
                result = await executeTypeScript(data.code, inputParams);
                break;
              default:
                throw new Error(`Unsupported language: ${data.language}`);
            }

            const passed = result.trim() === testCase.output.trim();
            if (!passed) allPassed = false;

            testResults.push({
              input: testCase.input,
              expectedOutput: testCase.output,
              actualOutput: result,
              passed
            });
          } catch (error) {
            allPassed = false;
            testResults.push({
              input: testCase.input,
              expectedOutput: testCase.output,
              error: error.message,
              passed: false
            });
          }
        }

        // Update submission status
        await db
          .update(submissions)
          .set({ 
            status: allPassed ? "passed" : "failed", 
            results: { testResults } 
          })
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
