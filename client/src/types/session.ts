export interface Session {
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
