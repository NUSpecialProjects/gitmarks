import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

import * as Pages from "./pages";
import Layout from "./components/Layout";
import { AuthState, useAuth } from "./contexts/auth";
import { SelectedClassroomProvider } from "./contexts/selectedClassroom";
import "./global.css";  
import { AuthProvider } from "./contexts/auth";

/**
 * PrivateRoute is a wrapper that redirects to the login page if the user is not logged in
 * Should not be used for routes that need more nuanced handling of auth states
 */
const PrivateRoute = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { // If not logged in, route to login
    if (authState === AuthState.LOGGED_OUT) {
      navigate("/");
    }
  }, [authState]);

  return <Outlet />;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 1000, // 5 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnMount: 'always',
      retry: 3,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

export default function App(): React.JSX.Element {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <Router>
        <AuthProvider>
          <SelectedClassroomProvider>
            <Routes>
              {/******* LANDING PAGE & OAUTH CALLBACK *******/}
              <Route path="" element={<Pages.Login />} />
              <Route path="oauth/callback" element={<Pages.Callback />} />

              {/******* TOKEN ROUTES *******/}
              <Route path="token">
                <Route path="classroom/join" element={<Pages.JoinClassroom />} />
                <Route path="assignment/accept" element={<Pages.AcceptAssignment />} />
              </Route>

              {/******* APP ROUTES: AUTHENTICATED USER *******/}
              <Route path="app" element={<PrivateRoute />}>

                {/******* ACCESS DENIED *******/}
                <Route path="access-denied" element={<Pages.AccessDenied />} />

                {/******* CLASS SELECTION: PRE-APP ACCESS STEP *******/}
                <Route path="classroom">
                  <Route path="select" element={<Pages.ClassroomSelectPage />} />
                  <Route path="create" element={<Pages.ClassroomCreatePage />} />
                  <Route path="invite-tas" element={<Pages.InviteTAs />} />
                  <Route path="invite-students" element={<Pages.InviteStudents />} />
                  <Route path="success" element={<Pages.Success />} />
                  <Route path="landing" element={<Pages.Landing />} />
                </Route>
                <Route path="organization">
                  <Route path="select" element={<Pages.OrganizationSelectPage />} />
                </Route>

                {/******* CLASS SELECTED: INNER APP *******/}
                <Route path="" element={<Layout />}>
                <Route path="about-us" element={<Pages.AboutUs />} />
                <Route path="assignments" element={<Pages.Assignments />} />
                <Route path="assignments/create" element={<Pages.CreateAssignment />} />
                <Route path="assignments/:id" element={<Pages.Assignment />} />
                <Route path="submissions/:id" element={<Pages.StudentSubmission />} />
                <Route path="assignments/:id/rubric" element={<Pages.AssignmentRubric />} />
                <Route path="grading" element={<Pages.Grading />} />
                <Route path="settings" element={<Pages.Settings />} />
                <Route path="students" element={<Pages.StudentListPage />} />
                <Route path="tas" element={<Pages.TAListPage />} />
                <Route path="professors" element={<Pages.ProfessorListPage />} />
                <Route path="grading/assignment/:assignmentID/student/:studentWorkID" element={<Pages.Grader />} />
                <Route path="rubrics" element={<Pages.Rubrics />} />
                <Route path="rubrics/new" element={<Pages.RubricEditor />} />
                <Route path="settings" element={<Pages.Settings />} />
                <Route path="dashboard" element={<Pages.Dashboard />} />
              </Route>

            </Route>
              {/******* 404 CATCH ALL *******/}
              <Route path="404" element={<Pages.PageNotFound />} />
            </Routes>
          </SelectedClassroomProvider>
        </AuthProvider>
      </Router>
    </PersistQueryClientProvider>
  );
}

let container: HTMLElement | null = null;
let root: ReactDOM.Root | null = null;

document.addEventListener("DOMContentLoaded", function () {
  if (!container) {
    container = document.getElementById("root");
    if (!container) {
      throw new Error("Root element not found. Unable to render React app.");
    }

    root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
});
