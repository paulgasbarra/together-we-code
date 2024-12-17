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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import type { TestCase } from "@/types";

interface QuestionFormProps {
  initialData?: {
    title: string;
    description: string;
    functionName: string;
    testCases: TestCase[];
  };
  isEdit: boolean;
  isPending: boolean;
  onSubmit: (data: {
    title: string;
    description: string;
    functionName: string;
    testCases: TestCase[];
  }) => void;
}

export function QuestionForm({ initialData, isEdit, isPending, onSubmit }: QuestionFormProps) {
  const [formData, setFormData] = useState(() => ({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    functionName: initialData?.functionName ?? "",
    testCases: initialData?.testCases ?? [{ input: { "parameter1": "" }, output: "" }],
  }));

  const addTestCaseParameter = (testCaseIndex: number) => {
    const updatedTestCases = [...formData.testCases];
    const currentInput = updatedTestCases[testCaseIndex].input;
    updatedTestCases[testCaseIndex] = {
      ...updatedTestCases[testCaseIndex],
      input: { ...currentInput, "": "" }
    };
    setFormData({
      ...formData,
      testCases: updatedTestCases
    });
  };

  const removeTestCaseParameter = (testCaseIndex: number, paramName: string) => {
    const updatedTestCases = [...formData.testCases];
    const newInput = { ...updatedTestCases[testCaseIndex].input };
    delete newInput[paramName];
    updatedTestCases[testCaseIndex] = {
      ...updatedTestCases[testCaseIndex],
      input: newInput
    };
    setFormData({
      ...formData,
      testCases: updatedTestCases
    });
  };

  const addTestCase = () => {
    setFormData({
      ...formData,
      testCases: [...formData.testCases, { input: {}, output: "" }]
    });
  };

  const removeTestCase = (index: number) => {
    if (formData.testCases.length > 1) {
      setFormData({
        ...formData,
        testCases: formData.testCases.filter((_, i) => i !== index)
      });
    }
  };

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "Edit Question" : "Create New Question"}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Edit the existing question and its test cases."
            : "Create a new coding question with test cases for your sessions."}
        </DialogDescription>
      </DialogHeader>
      <ScrollArea className="h-[60vh] p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formData);
          }}
          className="space-y-4"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="questionTitle">Question Title</Label>
              <Input
                id="questionTitle"
                value={formData.title}
                className="ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="functionName">Function Name</Label>
              <Input
                id="functionName"
                value={formData.functionName}
                className="ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onChange={(e) =>
                  setFormData({ ...formData, functionName: e.target.value })
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
                value={formData.description}
                className="ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Test Cases</Label>
            {formData.testCases.map((testCase, testCaseIndex) => (
              <div key={testCaseIndex} className="space-y-4 p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Test Case {testCaseIndex + 1}</h4>
                  {formData.testCases.length > 1 && (
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

                              const updatedTestCases = [...formData.testCases];
                              updatedTestCases[testCaseIndex] = {
                                ...testCase,
                                input: newInput
                              };
                              setFormData({
                                ...formData,
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

                              const updatedTestCases = [...formData.testCases];
                              updatedTestCases[testCaseIndex] = {
                                ...testCase,
                                input: newInput
                              };
                              setFormData({
                                ...formData,
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
                        const updatedTestCases = [...formData.testCases];
                        updatedTestCases[testCaseIndex] = {
                          ...testCase,
                          output: e.target.value
                        };
                        setFormData({
                          ...formData,
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
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Create Question"
            )}
          </Button>
        </form>
      </ScrollArea>
    </DialogContent>
  );
}
