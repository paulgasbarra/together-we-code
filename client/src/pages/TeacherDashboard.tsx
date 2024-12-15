import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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

interface Session {
  id: number;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function TeacherDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    title: "",
    description: "",
  });

  const { data: sessions, isLoading } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
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
      setIsCreateOpen(false);
      setNewSession({ title: "", description: "" });
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

  if (isLoading) {
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
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Session</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createSession.mutate(newSession);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newSession.description}
                  onChange={(e) =>
                    setNewSession({ ...newSession, description: e.target.value })
                  }
                />
              </div>
              <Button type="submit" className="w-full">
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
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setLocation(`/session/${session.id}`)}
                >
                  <Code className="h-4 w-4 mr-2" />
                  View Session
                </Button>
                <Button variant="secondary">
                  <Users className="h-4 w-4 mr-2" />
                  Participants
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
