import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

interface TestCase {
  input: Record<string, string>;
  output: string;
}

interface Question {
  id?: number;
  title: string;
  description: string;
  functionName: string;
  testCases: TestCase[];
}

export default function QuestionEditor() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchParams = new URLSearchParams(window.location.search);
  const questionId = searchParams.get('id');

  const [question, setQuestion] = useState<Question>({
    title: "",
    description: "",
    functionName: "",
    testCases: [{ input: { "parameter1": "" }, output: "" }],
  });

  const { data: existingQuestion, isLoading: isLoadingQuestion } = useQuery<Question>({
    queryKey: [`/api/questions/${questionId}`],
    enabled: !!questionId,
  });

  useEffect(() => {
    if (existingQuestion) {
      setQuestion(existingQuestion);
    }
  }, [existingQuestion]);

  const createQuestion = useMutation({
    mutationFn: async (questionData: Question) => {
      const res = await fetch("/api/questions", {
        method: questionId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(questionData),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Success",
        description: `Question ${questionId ? "updated" : "created"} successfully`,
      });
      setLocation("/teacher");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addTestCaseParameter = (testCaseIndex: number) => {
    const updatedTestCases = [...question.testCases];
    const currentInput = updatedTestCases[testCaseIndex].input;
    updatedTestCases[testCaseIndex] = {
      ...updatedTestCases[testCaseIndex],
      input: { ...currentInput, "": "" }
    };
    setQuestion({
      ...question,
      testCases: updatedTestCases
    });
  };

  const removeTestCaseParameter = (testCaseIndex: number, paramName: string) => {
    const updatedTestCases = [...question.testCases];
    const newInput = { ...updatedTestCases[testCaseIndex].input };
    delete newInput[paramName];
    updatedTestCases[testCaseIndex] = {
      ...updatedTestCases[testCaseIndex],
      input: newInput
    };
    
    setQuestion({
      ...question,
      testCases: updatedTestCases
    });
  };

  const addTestCase = () => {
    setQuestion({
      ...question,
      testCases: [...question.testCases, { input: {}, output: "" }]
    });
  };

  const removeTestCase = (index: number) => {
    if (question.testCases.length > 1) {
      setQuestion({
        ...question,
        testCases: question.testCases.filter((_, i) => i !== index)
      });
    }
  };

  if (isLoadingQuestion) {
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
          <h1 className="text-3xl font-bold">
            {questionId ? "Edit Question" : "Create New Question"}
          </h1>
          <p className="text-muted-foreground">
            {questionId ? "Update the existing question" : "Create a new coding question"}
          </p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/teacher")}>
          Cancel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
          <CardDescription>
            Fill in the details for your coding question
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createQuestion.mutate(question);
              }}
              className="space-y-4"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="questionTitle">Question Title</Label>
                  <Input
                    id="questionTitle"
                    value={question.title}
                    onChange={(e) =>
                      setQuestion({ ...question, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="functionName">Function Name</Label>
                  <Input
                    id="functionName"
                    value={question.functionName}
                    onChange={(e) =>
                      setQuestion({ ...question, functionName: e.target.value })
                    }
                    placeholder="e.g. calculateSum"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    The name of the function that students will implement
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="questionDescription">Question Description</Label>
                  <Textarea
                    id="questionDescription"
                    value={question.description}
                    onChange={(e) =>
                      setQuestion({ ...question, description: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Test Cases</Label>
                {question.testCases.map((testCase, testCaseIndex) => (
                  <div key={testCaseIndex} className="space-y-4 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Test Case {testCaseIndex + 1}</h4>
                      {question.testCases.length > 1 && (
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
                        <Label>Input Parameters</Label>
                        {Object.entries(testCase.input).map(([paramName, paramValue], paramIndex) => (
                          <div key={paramIndex} className="mt-2 flex gap-2 items-start">
                            <div className="flex-1">
                              <Input
                                placeholder="Parameter name"
                                value={paramName}
                                onChange={(e) => {
                                  const newInput = { ...testCase.input };
                                  const value = newInput[paramName];
                                  delete newInput[paramName];
                                  newInput[e.target.value] = value;

                                  const updatedTestCases = [...question.testCases];
                                  updatedTestCases[testCaseIndex] = {
                                    ...testCase,
                                    input: newInput
                                  };
                                  setQuestion({
                                    ...question,
                                    testCases: updatedTestCases
                                  });
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <Input
                                placeholder="Value"
                                value={paramValue}
                                onChange={(e) => {
                                  const newInput = { ...testCase.input };
                                  newInput[paramName] = e.target.value;

                                  const updatedTestCases = [...question.testCases];
                                  updatedTestCases[testCaseIndex] = {
                                    ...testCase,
                                    input: newInput
                                  };
                                  setQuestion({
                                    ...question,
                                    testCases: updatedTestCases
                                  });
                                }}
                              />
                            </div>
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
                          className="mt-2"
                          onClick={() => addTestCaseParameter(testCaseIndex)}
                        >
                          + Add Parameter
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`output-${testCaseIndex}`}>Expected Output</Label>
                        <Input
                          id={`output-${testCaseIndex}`}
                          value={testCase.output}
                          onChange={(e) => {
                            const updatedTestCases = [...question.testCases];
                            updatedTestCases[testCaseIndex] = {
                              ...testCase,
                              output: e.target.value
                            };
                            setQuestion({
                              ...question,
                              testCases: updatedTestCases
                            });
                          }}
                          placeholder="Example: 3"
                        />
                      </div>

                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <Label>Preview:</Label>
                        <pre className="mt-2 text-sm">
                          {JSON.stringify({
                            input: testCase.input,
                            output: testCase.output
                          }, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTestCase}
                  className="mt-4"
                >
                  Add Test Case
                </Button>
              </div>

              <Button type="submit" className="w-full">
                {createQuestion.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : questionId ? (
                  'Save Changes'
                ) : (
                  'Create Question'
                )}
              </Button>
            </form>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
