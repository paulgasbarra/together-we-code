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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Users, Code } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuestionCard } from "@/components/QuestionCard";
import { QuestionForm } from "@/components/QuestionForm";

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

import type { Question, TestCase } from "@/components/QuestionCard";

export default function TeacherDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [isCreateQuestionOpen, setIsCreateQuestionOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [selectedQuestionForDelete, setSelectedQuestionForDelete] = useState<number | null>(null);
  const [selectedQuestionForEdit, setSelectedQuestionForEdit] = useState<number | null>(null);
  const [newSession, setNewSession] = useState({
    title: "",
    description: "",
    questionId: 0,
  });

  const [newQuestion, setNewQuestion] = useState<{
    title: string;
    description: string;
    functionName: string;
    testCases: TestCase[];
  }>({
    title: "",
    description: "",
    functionName: "",
    testCases: [{ input: { "parameter1": "" }, output: "" }],
  });

  const { data: sessions, isLoading: isLoadingSessions } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
  });

  const { data: questions, isLoading: isLoadingQuestions } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });

  const deleteQuestion = useMutation({
    mutationFn: async (questionId: number) => {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      setSelectedQuestionForDelete(null);
      toast({
        title: "Success",
        description: "Question deleted successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
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

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      setIsCreateQuestionOpen(false);
      setNewQuestion({
        title: "",
        description: "",
        functionName: "",
        testCases: [{ input: {}, output: "" }],
      });
      setSelectedQuestionForEdit(null);
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
      testCases: [...newQuestion.testCases, { input: {}, output: "" }]
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
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Session</DialogTitle>
                    <DialogDescription>
                      Create a new coding session and select a question to use.
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-[60vh]">
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
                              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                                selectedQuestionId === question.id
                                  ? "ring-2 ring-primary ring-offset-2 border-primary"
                                  : "border hover:border-primary/50"
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
                <QuestionForm
                  initialData={selectedQuestionForEdit ? {
                    title: newQuestion.title,
                    description: newQuestion.description,
                    functionName: newQuestion.functionName,
                    testCases: newQuestion.testCases,
                  } : undefined}
                  isEdit={selectedQuestionForEdit !== null}
                  isPending={createQuestion.isPending}
                  onSubmit={(data) => {
                    createQuestion.mutate(data);
                  }}
                />
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {questions?.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  selectedQuestionForDelete={selectedQuestionForDelete}
                  onEdit={(question) => {
                    setNewQuestion({
                      title: question.title,
                      description: question.description,
                      functionName: question.functionName,
                      testCases: question.testCases,
                    });
                    setSelectedQuestionForEdit(question.id);
                    setIsCreateQuestionOpen(true);
                  }}
                  onDelete={(questionId) => setSelectedQuestionForDelete(questionId)}
                  onDeleteConfirm={(questionId) => deleteQuestion.mutate(questionId)}
                />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}