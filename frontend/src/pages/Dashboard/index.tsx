import "./styles.css";
import UserGroupCard from "@/components/UserGroupCard";
import { Table, TableRow, TableCell } from "@/components/Table";
import { Link, useNavigate } from "react-router-dom";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { useEffect, useState, useContext } from "react";
import { getAssignments } from "@/api/assignments";
import { formatDate } from "@/utils/date";
import { useClassroomUser } from "@/hooks/useClassroomUser";
import { useClassroomUsersList } from "@/hooks/useClassroomUsersList";
import { MdChevronRight } from "react-icons/md"

const Dashboard: React.FC = () => {
  const [assignments, setAssignments] = useState<IAssignmentOutline[]>([]);
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const { classroomUser, loading: loadingCurrentClassroomUser } =
    useClassroomUser(selectedClassroom?.id);
  const { classroomUsers: classroomUsersList } = useClassroomUsersList(
    selectedClassroom?.id
  );
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssignments = async (classroom: IClassroom) => {
      if (classroom) {
        getAssignments(classroom.id)
          .then((assignments) => {
            setAssignments(assignments);
          })
          .catch((_: unknown) => {
            // do nothing
          });
      }
    };

    if (selectedClassroom !== null && selectedClassroom !== undefined) {
      fetchAssignments(selectedClassroom).catch((_: unknown) => {
        // do nothing
      });
    }
  }, [selectedClassroom]);

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

  return (
    <div className="Dashboard">
      {selectedClassroom && (
        <>
          {loadingCurrentClassroomUser ? (
            <p>Loading...</p>
          ) : classroomUser ? (
            <p>Viewing as a {classroomUser.classroom_role}</p>
          ) : (
            <p>{`Viewing classroom you aren't in!! (Eventually, this should be impossible)`}</p>
          )}
          <div className="Dashboard__classroomNameDetailsWrapper">
            <h3 className="Dashboard__classroomNameDetails">
              {selectedClassroom?.org_name} <MdChevronRight />
              <div className="Dashboard__classroomName">
                {selectedClassroom?.name}
              </div>
            </h3>
          </div>
          <div className="Dashboard__classroomDetailsWrapper">
            <UserGroupCard
              label="Professors"
              givenUsersList={classroomUsersList.filter(
                (user) => user.classroom_role === "PROFESSOR"
              )}
              onClick={() =>
                handleUserGroupClick(
                  "Professor",
                  classroomUsersList.filter(
                    (user) => user.classroom_role === "PROFESSOR"
                  )
                )
              }
            />

            <UserGroupCard
              label="TAs"
              givenUsersList={classroomUsersList.filter(
                (user) => user.classroom_role === "TA"
              )}
              onClick={() =>
                handleUserGroupClick(
                  "TA",
                  classroomUsersList.filter(
                    (user) => user.classroom_role === "TA"
                  )
                )
              }
            />

            <UserGroupCard
              label="Students"
              givenUsersList={classroomUsersList.filter(
                (user) => user.classroom_role === "STUDENT"
              )}
              onClick={() =>
                handleUserGroupClick(
                  "Student",
                  classroomUsersList.filter(
                    (user) => user.classroom_role === "STUDENT"
                  )
                )
              }
            />
          </div>
          <Link
            to={`/app/assignments/create?org_name=${selectedClassroom?.org_name}`}
            className="Dashboard__assignmentLink"
          >
            Create Assignment
          </Link>
          <div className="Dashboard__assignmentsWrapper">
            <h2 style={{ marginBottom: 0 }}>Assignments</h2>
            <Table cols={2}>
              <TableRow style={{ borderTop: "none" }}>
                <TableCell>Assignment Name</TableCell>
                <TableCell>Created Date</TableCell>
              </TableRow>
              {assignments.map((assignment, i: number) => (
                <TableRow key={i} className="Assignment__submission">
                  <TableCell>
                    {" "}
                    <Link
                      to={`/app/assignments/${assignment.id}`}
                      state={{ assignment }}
                      className="Dashboard__assignmentLink"
                    >
                      {assignment.name}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(assignment.created_at)}</TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
