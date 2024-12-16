import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import Editor from "@monaco-editor/react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, Users } from "lucide-react";
import { useSocket } from "@/hooks/use-socket";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/hooks/use-user";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TestCase {
  input: Record<string, any>;
  output: string;
}

interface Question {
  id: number;
  title: string;
  description: string;
  testCases: TestCase[];
}

interface Session {
  id: number;
  title: string;
  description: string | null;
  question: Question;
}

export default function CodeSession() {
  const { id } = useParams<{ id: string }>();
  const sessionId = parseInt(id || "0");
  const { user } = useUser();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [editorLanguage, setEditorLanguage] = useState("javascript");
  const {
    joinSession,
    updateCode,
    submitAnswer,
    onCodeChange,
    onSubmissionResult,
  } = useSocket();

  const { data: session, isLoading: isLoadingSession } = useQuery<Session>({
    queryKey: [`/api/sessions/${sessionId}`],
  });

  useEffect(() => {
    if (sessionId) {
      joinSession(sessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    const handleCodeChange = (data: {
      questionId: number;
      code: string;
      userId: number;
    }) => {
      if (
        session?.question &&
        data.questionId === session.question.id &&
        data.userId !== user?.id
      ) {
        setCode(data.code);
      }
    };

    const handleSubmissionResult = (data: {
      questionId: number;
      status: string;
    }) => {
      if (session?.question && data.questionId === session.question.id) {
        toast({
          title: "Test Results",
          description: `Tests ${data.status}`,
          variant: data.status === "passed" ? "default" : "destructive",
        });
      }
    };

    onCodeChange(handleCodeChange);
    onSubmissionResult(handleSubmissionResult);
  }, [session?.question?.id, user?.id]);

  const handleCodeChange = (value: string = "") => {
    setCode(value);
    if (session?.question) {
      updateCode({
        sessionId,
        questionId: session.question.id,
        code: value,
      });
    }
  };

  const handleRunTests = () => {
    if (session?.question) {
      submitAnswer({
        sessionId,
        questionId: session.question.id,
        code,
      });
    }
  };

  if (isLoadingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{session?.title}</h1>
            <p className="text-sm text-muted-foreground">
              {session?.description}
            </p>
          </div>
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Participants
          </Button>
        </div>
      </div>

      <div className="flex-1">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="h-full border-r">
              <Tabs defaultValue="questions" className="h-full">
                <TabsList className="w-full">
                  <TabsTrigger value="questions" className="flex-1">
                    Question
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex-1">
                    Chat
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="questions" className="h-[calc(100%-40px)]">
                  <ScrollArea className="h-[calc(100vh-10rem)]">
                    {session?.question && (
                      <Card className="m-2">
                        <CardHeader>
                          <CardTitle>{session.question.title}</CardTitle>
                          <CardDescription>
                            {session.question.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    )}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="chat" className="p-4">
                  <p className="text-center text-muted-foreground">
                    Chat coming soon...
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={75}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={60}>
                <div className="h-full flex flex-col">
                  <div className="border-b p-2 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <h3 className="font-semibold">Code Editor</h3>
                      <Select
                        defaultValue="javascript"
                        onValueChange={(value) => setEditorLanguage(value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select Language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="typescript">TypeScript</SelectItem>
                          <SelectItem value="python">Python</SelectItem>
                          <SelectItem value="swift">Swift</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleRunTests}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Run Tests
                    </Button>
                  </div>
                  <div className="flex-1">
                    <Editor
                      height="100%"
                      language={editorLanguage}
                      value={code}
                      onChange={handleCodeChange}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                      }}
                    />
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={40}>
                <Card className="h-full rounded-none border-0">
                  <CardHeader>
                    <CardTitle>Test Results</CardTitle>
                    <CardDescription>
                      Run your code to see test results
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Question</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {session?.question?.description}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Test Cases</h4>
                        <pre className="bg-muted p-4 rounded-lg text-sm">
                          {JSON.stringify(session?.question?.testCases, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}