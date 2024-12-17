import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Check } from "lucide-react";

export interface TestCase {
  input: Record<string, string>;
  output: string;
}

export interface Question {
  id: number;
  title: string;
  description: string;
  functionName: string;
  testCases: TestCase[];
  createdAt?: string;
}

export interface QuestionCardProps {
  question: Question;
  selectedQuestionForDelete: number | null;
  onEdit: (question: Question) => void;
  onDelete: (questionId: number) => void;
  onDeleteConfirm: (questionId: number) => void;
}

export function QuestionCard({
  question,
  selectedQuestionForDelete,
  onEdit,
  onDelete,
  onDeleteConfirm,
}: QuestionCardProps) {
  return (
    <Card className="transition-all duration-200 hover:shadow-md border hover:border-primary/50">
      <CardHeader>
        <CardTitle>{question.title}</CardTitle>
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
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(question)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (selectedQuestionForDelete === question.id) {
                onDeleteConfirm(question.id);
              } else {
                onDelete(question.id);
              }
            }}
          >
            {selectedQuestionForDelete === question.id ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirm Delete
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
