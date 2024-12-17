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
