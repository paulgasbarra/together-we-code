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

interface Question {
  id: number;
  title: string;
  description: string;
  testCases: any[];
}

interface Session {
  id: number;
  title: string;
  description: string | null;
}

export default function CodeSession() {
  const { id } = useParams();
  const sessionId = parseInt(id);
  const { user } = useUser();
  const { toast } = useToast();
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [code, setCode] = useState("");
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

  const { data: questions, isLoading: isLoadingQuestions } = useQuery<Question[]>({
    queryKey: [`/api/sessions/${sessionId}/questions`],
  });

  useEffect(() => {
    if (sessionId) {
      joinSession(sessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    if (questions?.length) {
      setActiveQuestion(questions[0]);
    }
  }, [questions]);

  useEffect(() => {
    const handleCodeChange = (data: {
      questionId: number;
      code: string;
      userId: number;
    }) => {
      if (
        data.questionId === activeQuestion?.id &&
        data.userId !== user?.id
      ) {
        setCode(data.code);
      }
    };

    const handleSubmissionResult = (data: {
      questionId: number;
      status: string;
    }) => {
      if (data.questionId === activeQuestion?.id) {
        toast({
          title: "Test Results",
          description: `Tests ${data.status}`,
          variant: data.status === "passed" ? "default" : "destructive",
        });
      }
    };

    onCodeChange(handleCodeChange);
    onSubmissionResult(handleSubmissionResult);
  }, [activeQuestion?.id, user?.id]);

  const handleCodeChange = (value: string = "") => {
    setCode(value);
    if (activeQuestion) {
      updateCode({
        sessionId,
        questionId: activeQuestion.id,
        code: value,
      });
    }
  };

  const handleRunTests = () => {
    if (activeQuestion) {
      submitAnswer({
        sessionId,
        questionId: activeQuestion.id,
        code,
      });
    }
  };

  if (isLoadingSession || isLoadingQuestions) {
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
                    Questions
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex-1">
                    Chat
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="questions" className="h-[calc(100%-40px)]">
                  <ScrollArea className="h-full">
                    {questions?.map((question) => (
                      <Card
                        key={question.id}
                        className={`m-2 cursor-pointer transition-colors ${
                          activeQuestion?.id === question.id
                            ? "border-primary"
                            : ""
                        }`}
                        onClick={() => setActiveQuestion(question)}
                      >
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {question.title}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    ))}
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
              <ResizablePanel defaultSize={50}>
                <Card className="h-full rounded-none border-0">
                  <CardHeader>
                    <CardTitle>{activeQuestion?.title}</CardTitle>
                    <CardDescription>
                      {activeQuestion?.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg">
                      {JSON.stringify(activeQuestion?.testCases, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={50}>
                <div className="h-full flex flex-col">
                  <div className="border-b p-2 flex justify-between items-center">
                    <h3 className="font-semibold">Code Editor</h3>
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
                      defaultLanguage="javascript"
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
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
