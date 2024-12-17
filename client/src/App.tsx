import { Switch, Route, Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import AuthPage from "./pages/AuthPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import CodeSession from "./pages/CodeSession";
import QuestionEditor from "./pages/QuestionEditor";
import { useUser } from "./hooks/use-user";

function App() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Teacher-only route guard
  const TeacherRoute = ({ component: Component }: { component: React.ComponentType }) => {
    if (user.role !== "teacher") {
      return <Redirect to="/" />;
    }
    return <Component />;
  };

  return (
    <Switch>
      <Route 
        path="/" 
        component={() => 
          user.role === "teacher" ? <TeacherDashboard /> : <StudentDashboard />
        } 
      />
      <Route path="/session/:id" component={CodeSession} />
      <Route 
        path="/question/new" 
        component={() => <TeacherRoute component={QuestionEditor} />} 
      />
      <Route 
        path="/question/edit" 
        component={() => <TeacherRoute component={QuestionEditor} />} 
      />
      <Route>
        <div className="flex items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
        </div>
      </Route>
    </Switch>
  );
}

export default App;
