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
import { Loader2, Plus, Users, Code, Book } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Session {
  id: number;
  title: string;
  description: string | null;
  questionId: number;
  isActive: boolean;
  createdAt: string;
}

interface Question {
  id: number;
  title: string;
  description: string;
  testCases: any[];
  createdAt: string;
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
  interface TestCase {
    input: string;
    expected: string;
  }

  const [newQuestion, setNewQuestion] = useState({
    title: "",
    description: "",
    testCases: [{ input: "", expected: "" }] as TestCase[],
  });

  const { data: sessions, isLoading: isLoadingSessions } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
  });

  const { data: questions, isLoading: isLoadingQuestions } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });

  const createQuestion = useMutation({
    mutationFn: async (questionData: typeof newQuestion) => {
      const formattedTestCases = questionData.testCases.map(tc => ({
        input: tc.input.trim(),
        expected: tc.expected.trim()
      }));

      console.log("Sending question data:", {
        ...questionData,
        testCases: formattedTestCases
      });

      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: questionData.title.trim(),
          description: questionData.description.trim(),
          testCases: formattedTestCases,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Question creation failed:", errorText);
        throw new Error(errorText);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      setIsCreateQuestionOpen(false);
      setNewQuestion({
        title: "",
        description: "",
        testCases: [{ input: "", expected: "" }]
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

        <TabsContent value="sessions" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isCreateSessionOpen} onOpenChange={setIsCreateSessionOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Session
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Session</DialogTitle>
                  <DialogDescription>
                    Create a new coding session and select a question to use.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createSession.mutate(newSession);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="title">Session Title</Label>
                    <Input
                      id="title"
                      value={newSession.title}
                      onChange={(e) =>
                        setNewSession({ ...newSession, title: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Session Description</Label>
                    <Textarea
                      id="description"
                      value={newSession.description}
                      onChange={(e) =>
                        setNewSession({ ...newSession, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Select Question</Label>
                    <div className="grid grid-cols-1 gap-4">
                      {questions?.map((question) => (
                        <Card
                          key={question.id}
                          className={`cursor-pointer transition-colors ${
                            selectedQuestionId === question.id
                              ? "border-primary"
                              : ""
                          }`}
                          onClick={() => {
                            setSelectedQuestionId(question.id);
                            setNewSession({ ...newSession, questionId: question.id });
                          }}
                        >
                          <CardHeader>
                            <CardTitle className="text-base">{question.title}</CardTitle>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={!selectedQuestionId}>
                    {createSession.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Create Session"
                    )}
                  </Button>
                </form>
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
                      <p className="text-sm text-muted-foreground">{session.question.title}</p>
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
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isCreateQuestionOpen} onOpenChange={setIsCreateQuestionOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Question
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Question</DialogTitle>
                  <DialogDescription>
                    Create a new coding question with test cases for your sessions.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createQuestion.mutate(newQuestion);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="questionTitle">Question Title</Label>
                    <Input
                      id="questionTitle"
                      value={newQuestion.title}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, title: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="questionDescription">Question Description</Label>
                    <Textarea
                      id="questionDescription"
                      value={newQuestion.description}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, description: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-4">
                    <Label>Test Cases</Label>
                    {newQuestion.testCases.map((testCase, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label htmlFor={`input-${index}`}>Input</Label>
                            <Input
                              id={`input-${index}`}
                              value={testCase.input}
                              onChange={(e) => {
                                const updatedTestCases = [...newQuestion.testCases];
                                updatedTestCases[index] = {
                                  ...testCase,
                                  input: e.target.value,
                                };
                                setNewQuestion({
                                  ...newQuestion,
                                  testCases: updatedTestCases,
                                });
                              }}
                              placeholder="Example: 5"
                              required
                            />
                          </div>
                          <div className="flex-1">
                            <Label htmlFor={`expected-${index}`}>Expected Output</Label>
                            <Input
                              id={`expected-${index}`}
                              value={testCase.expected}
                              onChange={(e) => {
                                const updatedTestCases = [...newQuestion.testCases];
                                updatedTestCases[index] = {
                                  ...testCase,
                                  expected: e.target.value,
                                };
                                setNewQuestion({
                                  ...newQuestion,
                                  testCases: updatedTestCases,
                                });
                              }}
                              placeholder="Example: 120"
                              required
                            />
                          </div>
                          {newQuestion.testCases.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              className="self-end"
                              onClick={() => {
                                setNewQuestion({
                                  ...newQuestion,
                                  testCases: newQuestion.testCases.filter((_, i) => i !== index),
                                });
                              }}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setNewQuestion({
                          ...newQuestion,
                          testCases: [...newQuestion.testCases, { input: "", expected: "" }],
                        });
                      }}
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
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {questions?.map((question) => (
              <Card key={question.id}>
                <CardHeader>
                  <CardTitle>{question.title}</CardTitle>
                  <CardDescription>
                    Created on {new Date(question.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {question.description}
                  </p>
                  <div className="bg-muted rounded-lg p-4">
                    <Label>Test Cases:</Label>
                    <pre className="text-xs mt-2 overflow-auto">
                      {JSON.stringify(question.testCases, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}