import "./styles.css";
import UserGroupCard from "@/components/UserGroupCard";
import { Table, TableRow, TableCell } from "@/components/Table";
import { MdAdd } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { formatDateTime, formatDate } from "@/utils/date";
import { useClassroomUser, useClassroomUsersList, useCurrentClassroom } from "@/hooks/useClassroomUser";
import BreadcrumbPageHeader from "@/components/PageHeader/BreadcrumbPageHeader";
import Button from "@/components/Button";
import MetricPanel from "@/components/Metrics/MetricPanel";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyDataBanner from "@/components/EmptyDataBanner";
import Metric from "@/components/Metrics";
import { ClassroomRole, requireAtLeastClassroomRole } from "@/types/enums";
import { useAssignmentsList } from "@/hooks/useAssignment";
import { ErrorToast } from "@/components/Toast";
import { useEffect } from "react";

const Dashboard: React.FC = () => {
  const { selectedClassroom } = useCurrentClassroom();
  const { classroomUser } = useClassroomUser(ClassroomRole.TA, "/app/access-denied");

  const {
    classroomUsers: classroomUsersList = [],
    error: classroomUsersError,
    loading: classroomUsersLoading
  } = useClassroomUsersList(selectedClassroom?.id);

  const {
    assignments = [],
    error: assignmentsError,
    loading: assignmentsLoading
  } = useAssignmentsList(selectedClassroom?.id);

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

  useEffect(() => {
    if (classroomUsersError) {
      ErrorToast(classroomUsersError.message, "classroom-users-error");
    }
  }, [classroomUsersError]);

  useEffect(() => {
    if (assignmentsError) {
      ErrorToast(assignmentsError.message, "assignments-error");
    }
  }, [assignmentsError]);

  if (classroomUsersError || assignmentsError) {
    return (
      <div className="Dashboard__error">
        <h2>Error Loading Dashboard</h2>
        <p>There was an error loading the dashboard data. Please try again later.</p>
        {classroomUsersError && <p>Error loading users: {classroomUsersError.message}</p>}
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
        pageTitle={selectedClassroom!.org_name}
        breadcrumbItems={[selectedClassroom!.name]}
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
            {formatDate(selectedClassroom!.created_at)}
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
