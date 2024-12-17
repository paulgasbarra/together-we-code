import { useState } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { Question } from "./QuestionCard";

interface SessionFormProps {
  questions: Question[];
  isPending: boolean;
  onSubmit: (data: {
    title: string;
    description: string;
    questionId: number;
  }) => void;
}

export function SessionForm({ questions, isPending, onSubmit }: SessionFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    questionId: 0,
  });
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);

  return (
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
            onSubmit(formData);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Session Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Session Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
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
                    setFormData({ ...formData, questionId: question.id });
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
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create Session"
            )}
          </Button>
        </form>
      </ScrollArea>
    </DialogContent>
  );
}
