import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Users, Code } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Session {
  id: number;
  title: string;
  description: string | null;
  teacherId: number;
  isActive: boolean;
  createdAt: string;
  question: {
    id: number;
    title: string;
  };
}

interface TestCase {
  input: Record<string, string>;
  output: string;
}

interface Question {
  id: number;
  title: string;
  description: string;
  testCases: TestCase[];
}

export default function TeacherDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [isCreateQuestionOpen, setIsCreateQuestionOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  
  const [newSession, setNewSession] = useState({
    title: "",
    description: "",
    questionId: 0,
  });

  const [newQuestion, setNewQuestion] = useState<{
    title: string;
    description: string;
    testCases: TestCase[];
  }>({
    title: "",
    description: "",
    testCases: [{ input: { "parameter": "" }, output: "" }],
  });

  const { data: sessions, isLoading: isLoadingSessions } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
  });

  const { data: questions, isLoading: isLoadingQuestions } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });

  const createQuestion = useMutation({
    mutationFn: async (questionData: typeof newQuestion) => {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: questionData.title.trim(),
          description: questionData.description.trim(),
          testCases: questionData.testCases,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      setIsCreateQuestionOpen(false);
      setNewQuestion({
        title: "",
        description: "",
        testCases: [{ input: { "parameter": "" }, output: "" }],
      });
      toast({
        title: "Success",
        description: "Question created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createSession = useMutation({
    mutationFn: async (sessionData: typeof newSession) => {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(sessionData),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      setIsCreateSessionOpen(false);
      setNewSession({ title: "", description: "", questionId: 0 });
      toast({
        title: "Success",
        description: "Session created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoadingSessions || isLoadingQuestions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const addTestCaseParameter = (testCaseIndex: number) => {
    const updatedTestCases = [...newQuestion.testCases];
    const currentInput = updatedTestCases[testCaseIndex].input;
    updatedTestCases[testCaseIndex] = {
      ...updatedTestCases[testCaseIndex],
      input: { ...currentInput, "": "" }
    };
    setNewQuestion({
      ...newQuestion,
      testCases: updatedTestCases
    });
  };

  const removeTestCaseParameter = (testCaseIndex: number, paramName: string) => {
    const updatedTestCases = [...newQuestion.testCases];
    const newInput = { ...updatedTestCases[testCaseIndex].input };
    delete newInput[paramName];
    updatedTestCases[testCaseIndex] = {
      ...updatedTestCases[testCaseIndex],
      input: newInput
    };
    setNewQuestion({
      ...newQuestion,
      testCases: updatedTestCases
    });
  };

  const addTestCase = () => {
    setNewQuestion({
      ...newQuestion,
      testCases: [...newQuestion.testCases, { input: { "parameter": "" }, output: "" }]
    });
  };

  const removeTestCase = (index: number) => {
    if (newQuestion.testCases.length > 1) {
      setNewQuestion({
        ...newQuestion,
        testCases: newQuestion.testCases.filter((_, i) => i !== index)
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.username}
          </p>
        </div>
      </div>

      <Tabs defaultValue="sessions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isCreateSessionOpen} onOpenChange={setIsCreateSessionOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Session
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Create New Session</DialogTitle>
                    <DialogDescription>
                      Create a new coding session and select a question to use.
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-[60vh] px-4">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        createSession.mutate(newSession);
                      }}
                      className="space-y-6"
                    >
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">Session Title</Label>
                          <Input
                            id="title"
                            value={newSession.title}
                            onChange={(e) =>
                              setNewSession({ ...newSession, title: e.target.value })
                            }
                            className="mt-1.5"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Session Description</Label>
                          <Textarea
                            id="description"
                            value={newSession.description}
                            onChange={(e) =>
                              setNewSession({ ...newSession, description: e.target.value })
                            }
                            className="mt-1.5"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Select Question</Label>
                        <Select
                          value={selectedQuestionId?.toString()}
                          onValueChange={(value) => {
                            const id = parseInt(value);
                            setSelectedQuestionId(id);
                            setNewSession({ ...newSession, questionId: id });
                          }}
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Choose a question" />
                          </SelectTrigger>
                          <SelectContent>
                            {questions?.map((question) => (
                              <SelectItem key={question.id} value={question.id.toString()}>
                                {question.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedQuestionId && questions?.find(q => q.id === selectedQuestionId) && (
                        <div className="rounded-lg border bg-card p-4 text-card-foreground">
                          <h4 className="font-medium mb-2">Question Preview</h4>
                          <p className="text-sm text-muted-foreground">
                            {questions.find(q => q.id === selectedQuestionId)?.description}
                          </p>
                        </div>
                      )}

                      <Button type="submit" className="w-full" disabled={!selectedQuestionId}>
                        {createSession.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Create Session"
                        )}
                      </Button>
                    </form>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions?.map((session) => (
                <Card key={session.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{session.title}</CardTitle>
                    <CardDescription>
                      Created on {new Date(session.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {session.description || "No description provided"}
                    </p>
                    {session.question && (
                      <div className="bg-muted rounded p-2">
                        <p className="font-medium">Selected Question:</p>
                        <p className="text-sm text-muted-foreground">
                          {session.question.title}
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setLocation(`/session/${session.id}`)}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      View Session
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => setLocation(`/session/${session.id}`)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Enter Session
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="questions">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isCreateQuestionOpen} onOpenChange={setIsCreateQuestionOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Question
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Create New Question</DialogTitle>
                    <DialogDescription>
                      Create a new coding question with test cases for your sessions.
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-[60vh] px-4">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        createQuestion.mutate(newQuestion);
                      }}
                      className="space-y-6"
                    >
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="questionTitle">Question Title</Label>
                          <Input
                            id="questionTitle"
                            value={newQuestion.title}
                            onChange={(e) =>
                              setNewQuestion({ ...newQuestion, title: e.target.value })
                            }
                            className="mt-1.5"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="questionDescription">Question Description</Label>
                          <Textarea
                            id="questionDescription"
                            value={newQuestion.description}
                            onChange={(e) =>
                              setNewQuestion({ ...newQuestion, description: e.target.value })
                            }
                            className="mt-1.5"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label>Test Cases</Label>
                        {newQuestion.testCases.map((testCase, testCaseIndex) => (
                          <div key={testCaseIndex} className="rounded-lg border bg-card p-4 text-card-foreground">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-medium">Test Case {testCaseIndex + 1}</h4>
                              {newQuestion.testCases.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeTestCase(testCaseIndex)}
                                >
                                  Remove Test Case
                                </Button>
                              )}
                            </div>

                            <div className="space-y-4">
                              <div>
                                <Label className="mb-2 block">Input Parameters</Label>
                                {Object.entries(testCase.input).map(([paramName, paramValue], paramIndex) => (
                                  <div key={paramIndex} className="flex gap-2 items-center mt-2">
                                    <Input
                                      placeholder="Parameter name"
                                      value={paramName}
                                      onChange={(e) => {
                                        const newInput = { ...testCase.input };
                                        const value = newInput[paramName];
                                        delete newInput[paramName];
                                        newInput[e.target.value] = value;
                                        
                                        const updatedTestCases = [...newQuestion.testCases];
                                        updatedTestCases[testCaseIndex] = {
                                          ...testCase,
                                          input: newInput
                                        };
                                        setNewQuestion({
                                          ...newQuestion,
                                          testCases: updatedTestCases
                                        });
                                      }}
                                      className="flex-1"
                                    />
                                    <Input
                                      placeholder="Value"
                                      value={paramValue}
                                      onChange={(e) => {
                                        const newInput = { ...testCase.input };
                                        newInput[paramName] = e.target.value;
                                        
                                        const updatedTestCases = [...newQuestion.testCases];
                                        updatedTestCases[testCaseIndex] = {
                                          ...testCase,
                                          input: newInput
                                        };
                                        setNewQuestion({
                                          ...newQuestion,
                                          testCases: updatedTestCases
                                        });
                                      }}
                                      className="flex-1"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => removeTestCaseParameter(testCaseIndex, paramName)}
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addTestCaseParameter(testCaseIndex)}
                                  className="mt-2"
                                >
                                  Add Parameter
                                </Button>
                              </div>
                              
                              <div>
                                <Label htmlFor={`output-${testCaseIndex}`}>Expected Output</Label>
                                <Input
                                  id={`output-${testCaseIndex}`}
                                  value={testCase.output}
                                  onChange={(e) => {
                                    const updatedTestCases = [...newQuestion.testCases];
                                    updatedTestCases[testCaseIndex] = {
                                      ...testCase,
                                      output: e.target.value
                                    };
                                    setNewQuestion({
                                      ...newQuestion,
                                      testCases: updatedTestCases
                                    });
                                  }}
                                  className="mt-1.5"
                                  placeholder="Expected output value"
                                />
                              </div>
                            </div>

                            <div className="mt-4 p-3 bg-muted rounded-md">
                              <Label className="mb-2 block">Preview</Label>
                              <pre className="text-sm whitespace-pre-wrap">
                                {JSON.stringify({
                                  input: testCase.input,
                                  output: testCase.output
                                }, null, 2)}
                              </pre>
                            </div>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addTestCase}
                          className="w-full"
                        >
                          Add Test Case
                        </Button>
                      </div>

                      <Button type="submit" className="w-full">
                        {createQuestion.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Create Question"
                        )}
                      </Button>
                    </form>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {questions?.map((question) => (
                <Card key={question.id}>
                  <CardHeader>
                    <CardTitle>{question.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {question.description}
                    </p>
                    <div className="bg-muted rounded-lg p-4">
                      <Label className="mb-2 block">Test Cases</Label>
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(question.testCases, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
