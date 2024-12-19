import React, { useContext, useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

import * as Pages from "./pages";
import Layout from "./components/Layout";
import AuthProvider, { AuthContext } from "./contexts/auth";
import SelectedSemesterProvider from "./contexts/selectedClassroom";
import "./global.css";

// If not logged in, route to login
const PrivateRoute = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const location = useLocation();

  useEffect(() => {
    if (!isLoggedIn) {
      const currentUrl = location.pathname + location.search + location.hash;
      localStorage.setItem("redirectAfterLogin", currentUrl); // store the current url to redirect to after login
    }
  }, [isLoggedIn, location]);

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnMount: 'always',
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
      <AuthProvider>
        <SelectedSemesterProvider>
          <Router>
            <Routes>
              {/******* LANDING PAGE & OAUTH CALLBACK *******/}
              <Route path="" element={<Pages.Login />} />
              <Route path="oauth/callback" element={<Pages.Callback />} />

              {/******* APP ROUTES: AUTHENTICATED USER *******/}
              <Route path="/app" element={<PrivateRoute />}>
                {/******* CLASS SELECTION: PRE-APP ACCESS STEP *******/}

                <Route path="classroom">
                  <Route path="select" element={<Pages.ClassroomSelectPage />} />
                  <Route path="create" element={<Pages.ClassroomCreatePage />} />
                  <Route path="invite-tas" element={<Pages.InviteTAs />} />
                  <Route
                    path="invite-students"
                    element={<Pages.InviteStudents />}
                  />
                  <Route path="success" element={<Pages.Success />} />
                  <Route path="landing" element={<Pages.Landing />} />
                </Route>
                <Route path="organization" element={<PrivateRoute />}>
                  <Route
                    path="select"
                    element={<Pages.OrganizationSelectPage />}
                  />
                </Route>

                <Route path="token" element={<PrivateRoute />}>
                  <Route
                    path="classroom/join"
                    element={<Pages.JoinClassroom />}
                  />
                  <Route
                    path="assignment/accept"
                    element={<Pages.AcceptAssignment />}
                  />
                </Route>
                {/******* CLASS SELECTED: INNER APP *******/}
                <Route path="" element={<Layout />}>
                  <Route path="assignments" element={<Pages.Assignments />} />
                  <Route
                    path="assignments/create"
                    element={<Pages.CreateAssignment />}
                  />
                  <Route path="assignments/:id" element={<Pages.Assignment />} />
                  <Route path="submissions/:id" element={<Pages.StudentSubmission />} />
                  <Route
                    path="assignments/:id/rubric"
                    element={<Pages.AssignmentRubric />}
                  />
                  <Route path="grading" element={<Pages.Grading />} />
                  <Route path="settings" element={<Pages.Settings />} />
                  <Route path="students" element={<Pages.StudentListPage />} />
                  <Route path="tas" element={<Pages.TAListPage />} />
                  <Route
                    path="professors"
                    element={<Pages.ProfessorListPage />}
                  />
                  <Route
                    path="grading/assignment/:assignmentID/student/:studentWorkID"
                    element={<Pages.Grader />}
                  />
                  <Route path="rubrics" element={<Pages.Rubrics />} />
                  <Route path="rubrics/new" element={<Pages.RubricEditor />} />
                  <Route path="settings" element={<Pages.Settings />} />
                  <Route path="dashboard" element={<Pages.Dashboard />} />
                </Route>
              </Route>

              <Route path="access-denied" element={<Pages.AccessDenied />} />

              {/******* 404 CATCH ALL *******/}
              <Route path="404" element={<Pages.PageNotFound />} />
            </Routes>
          </Router>
        </SelectedSemesterProvider>
      </AuthProvider>
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
