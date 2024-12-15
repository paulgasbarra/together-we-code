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
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Session {
  id: number;
  title: string;
  description: string | null;
  teacherId: number;
  isActive: boolean;
  createdAt: string;
}

export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
  });

  const joinSession = useMutation({
    mutationFn: async (sessionId: number) => {
      const res = await fetch(`/api/sessions/${sessionId}/join`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      setLocation(`/session/${sessionId}`);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.username}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Sessions</CardTitle>
          <CardDescription>
            Join active coding sessions to start learning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions?.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">
                    {session.title}
                    {session.description && (
                      <p className="text-sm text-muted-foreground">
                        {session.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(session.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        session.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {session.isActive ? "Active" : "Completed"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => joinSession.mutate(session.id)}
                      disabled={!session.isActive}
                    >
                      Join
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
