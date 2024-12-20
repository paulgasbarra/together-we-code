// React and routing
import { useState } from "react";
import { useLocation } from "wouter";

// Query management
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessionForm } from "@/components/SessionForm";

// Custom Components
import { QuestionCard } from "@/components/QuestionCard";
import { QuestionForm } from "@/components/QuestionForm";
import { SessionCard } from "@/components/SessionCard";

// Icons
import { Plus, Loader2 } from "lucide-react";

// Hooks
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";

// Types
import {TestCase} from "@/types/question";

export default function TeacherDashboard() {
  const [setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [isCreateQuestionOpen, setIsCreateQuestionOpen] = useState(false);
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
    testCases: [{ input: { "": "" }, output: "" }],
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
          functionName: questionData.functionName.trim(),
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
                <SessionForm
                  questions={questions || []}
                  isPending={createSession.isPending}
                  onSubmit={(data) => createSession.mutate(data)}
                />
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions?.map((session) => (
                <SessionCard key={session.id} session={session} />
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
                  initialData={selectedQuestionForEdit ? questions?.find(q => q.id === selectedQuestionForEdit) : undefined}
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