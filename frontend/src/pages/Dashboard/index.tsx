import "./styles.css";
import UserGroupCard from "@/components/UserGroupCard";
import { Table, TableRow, TableCell } from "@/components/Table";
import { MdAdd } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { useContext, useEffect } from "react";
import { getAssignments } from "@/api/assignments";
import { formatDateTime, formatDate } from "@/utils/date";
import { useClassroomUser } from "@/hooks/useClassroomUser";
import { useQuery } from "@tanstack/react-query";
import BreadcrumbPageHeader from "@/components/PageHeader/BreadcrumbPageHeader";
import Button from "@/components/Button";
import MetricPanel from "@/components/Metrics/MetricPanel";
import { getClassroomUsers } from "@/api/classrooms";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyDataBanner from "@/components/EmptyDataBanner";
import Metric from "@/components/Metrics";
import { ClassroomRole, requireAtLeastClassroomRole } from "@/types/enums";

const Dashboard: React.FC = () => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const {
    classroomUser,
    error: classroomUserError,
    loading: loadingCurrentClassroomUser,
  } = useClassroomUser(selectedClassroom?.id, ClassroomRole.TA, "/access-denied");

  const {
    data: classroomUsersList = [],
    error: classroomUsersError,
    isLoading: classroomUsersLoading
  } = useQuery({
    queryKey: ['classroomUsers', selectedClassroom?.id],
    queryFn: () => {
      if (!selectedClassroom?.id) {
        throw new Error('No classroom selected');
      }
      return getClassroomUsers(selectedClassroom.id);
    },
    enabled: !!selectedClassroom?.id,
  });

  const {
    data: assignments = [],
    error: assignmentsError,
    isLoading: assignmentsLoading
  } = useQuery({
    queryKey: ['assignments', selectedClassroom?.id],
    queryFn: () => {
      if (!selectedClassroom?.id) {
        throw new Error('No classroom selected');
      }
      return getAssignments(selectedClassroom.id);
    },
    enabled: !!selectedClassroom?.id,
  });

  const navigate = useNavigate();

  const getGCD = (a: number, b: number): number => {
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  };

  const getTaToStudentRatio = (users: IClassroomUser[]): string => {
    if (!users || users.length === 0) {
      return "N/A";
    }

    const tas = users.filter((user) => user.classroom_role === ClassroomRole.TA);

    const students = users.filter((user) => user.classroom_role === ClassroomRole.STUDENT);

    if (tas.length === 0 || students.length === 0) {
      return "N/A";
    }

    const taCount = tas.length;
    const studentCount = students.length;
    const gcd = getGCD(taCount, studentCount);

    const reducedTaCount = taCount / gcd;
    const reducedStudentCount = studentCount / gcd;

    return `${reducedTaCount} : ${reducedStudentCount}`;
  };

  useEffect(() => {
    if (
      !loadingCurrentClassroomUser &&
      (classroomUserError || !classroomUser)
    ) {
      console.log(
        "Attempted to view a classroom without access. Redirecting to classroom select."
      );
      navigate(`/app/organization/select`);
    }
  }, [
    loadingCurrentClassroomUser,
    classroomUserError,
    classroomUser,
    selectedClassroom?.org_id,
    navigate,
  ]);

  const handleUserGroupClick = (group: string, users: IClassroomUser[]) => {
    if (group === "Professor") {
      navigate("/app/professors", { state: { users } });
    }
    if (group === "TA") {
      navigate("/app/tas", { state: { users } });
    }
    if (group === "Student") {
      navigate("/app/students", { state: { users } });
    }
  };

  if (classroomUser?.classroom_role === ClassroomRole.STUDENT) {
    return (
      <div className="Dashboard__unauthorized">
        <h2>Access Denied</h2>
        <p>
          You do not have permission to view the classroom management dashboard.
        </p>
        <p>Please contact your professor if you believe this is an error.</p>
        <Button variant="primary" onClick={() => navigate("/app/classroom/select", { state: { orgID: selectedClassroom?.org_id } })}>
          Return to Classroom Selection
        </Button>
      </div>
    );
  }

  if (!selectedClassroom) {
    return (
      <div className="Dashboard__error">
        <h2>No Classroom Selected</h2>
        <p>Please select a classroom to continue.</p>
        <Button variant="primary" onClick={() => navigate("/app/classroom/select")}>
          Select Classroom
        </Button>
      </div>
    );
  }

  if (classroomUsersError || assignmentsError) {
    return (
      <div className="Dashboard__error">
        <h2>Error Loading Dashboard</h2>
        <p>There was an error loading the dashboard data. Please try again later.</p>
        {classroomUsersError && <p>Error loading users: {classroomUsersError.message}</p>}
        {assignmentsError && <p>Error loading assignments: {assignmentsError.message}</p>}
        <div className="Dashboard__horizontalButtons">
          <Button variant="primary" onClick={() => navigate("/app/classroom/select", { state: { orgID: selectedClassroom?.org_id } })}>
            Return to Classroom Selection
          </Button>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  if (classroomUsersLoading) {
    return (
      <div className="Dashboard__loading">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="Dashboard">
      <BreadcrumbPageHeader
        pageTitle={selectedClassroom.org_name}
        breadcrumbItems={[selectedClassroom.name]}
      />

      <div className="Dashboard__sectionWrapper">
        <MetricPanel>
          <div className="Dashboard__classroomDetailsWrapper">
            <UserGroupCard
              label="Students"
              givenUsersList={classroomUsersList.filter(
                (user) => user.classroom_role === ClassroomRole.STUDENT
              )}
              onClick={() =>
                handleUserGroupClick(
                  "Student",
                  classroomUsersList.filter(
                    (user) => user.classroom_role === ClassroomRole.STUDENT
                  )
                )
              }
            />

            <UserGroupCard
              label="TAs"
              givenUsersList={classroomUsersList.filter(
                (user) => user.classroom_role === ClassroomRole.TA
              )}
              onClick={() =>
                handleUserGroupClick(
                  "TA",
                  classroomUsersList.filter(
                    (user) => user.classroom_role === ClassroomRole.TA
                  )
                )
              }
            />

            <UserGroupCard
              label="Professors"
              givenUsersList={classroomUsersList.filter(
                (user) => user.classroom_role === ClassroomRole.PROFESSOR
              )}
              onClick={() =>
                handleUserGroupClick(
                  "Professor",
                  classroomUsersList.filter(
                    (user) => user.classroom_role === ClassroomRole.PROFESSOR
                  )
                )
              }
            />
          </div>

          <Metric title="Created on">
            {formatDate(selectedClassroom.created_at ?? null)}
          </Metric>
          <Metric title="Assignments">
            {assignments.length.toString()}
          </Metric>
          <Metric title="TA to Student Ratio">
            {getTaToStudentRatio(classroomUsersList)}
          </Metric>
        </MetricPanel>
      </div>

      <div className="Dashboard__sectionWrapper">
        <div className="Dashboard__assignmentsHeader">
          <h2 style={{ marginBottom: 0 }}>Assignments</h2>
          {requireAtLeastClassroomRole(classroomUser?.classroom_role, ClassroomRole.PROFESSOR) && (
            <div className="Dashboard__createAssignmentButton">
              <Button
                variant="primary"
                size="small"
                href={`/app/assignments/create?org_name=${selectedClassroom?.org_name}`}
              >
                <MdAdd className="icon" /> Create Assignment
              </Button>
            </div>
          )}
        </div>
        {assignments.length === 0 ? (
          <EmptyDataBanner>
            <div className="emptyDataBannerMessage">
              {assignmentsLoading ? (
                <LoadingSpinner />
              ) : (
                <p>No assignments have been created yet.</p>
              )}
            </div>
            {requireAtLeastClassroomRole(classroomUser?.classroom_role, ClassroomRole.PROFESSOR) && (
              <Button variant="secondary" href={`/app/assignments/create?org_name=${selectedClassroom?.org_name}`}>
                <MdAdd /> Create Assignment
              </Button>
            )}
          </EmptyDataBanner>
        ) : (
          <Table cols={2}>
            <TableRow style={{ borderTop: "none" }}>
              <TableCell>Assignment Name</TableCell>
              <TableCell>Created Date</TableCell>
            </TableRow>
            {assignments.map((assignment: IAssignmentOutline, i: number) => (
              <TableRow key={i} className="Assignment__submission">
                <TableCell>
                  <Link
                    to={`/app/assignments/${assignment.id}`}
                    state={{ assignment }}
                    className="Dashboard__assignmentLink"
                  >
                    {assignment.name}
                  </Link>
                </TableCell>
                <TableCell>{formatDateTime(assignment.created_at)}</TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
