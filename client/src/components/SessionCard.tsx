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
import { Code, Users } from "lucide-react";

import { Session } from "@/types";

interface SessionCardProps {
  session: Session;
}

export function SessionCard({ session }: SessionCardProps) {
  const [, setLocation] = useLocation();

  return (
    <Card className="hover:shadow-lg transition-shadow">
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
  );
}
