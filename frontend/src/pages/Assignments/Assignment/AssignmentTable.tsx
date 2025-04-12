import { Link } from "react-router-dom";
import { Table, TableCell, TableRow } from "@/components/Table";
import Pill from "@/components/Pill";
import { StudentWorkState } from "@/types/enums";
import { removeUnderscores } from "@/utils/text";
import { formatDateTime } from "@/utils/date";

interface AssignmentTableProps {
  title: string;
  works: IStudentWork[] | undefined;
  assignmentId: number;
}

const AssignmentTable: React.FC<AssignmentTableProps> = ({ title, works, assignmentId }) => {
  if (!works || works.length === 0) return null;

  return (
    <div>
      <h2 style={{ marginBottom: 0 }}>{title}</h2>
      <Table cols={3}>
        <TableRow style={{ borderTop: "none" }}>
          <TableCell>{title.split(" ")[0]} Name</TableCell>
          <TableCell className="Assignment__centerAlignedCell">Status</TableCell>
          <TableCell>Last Commit</TableCell>
        </TableRow>
        {works.map((sa: IStudentWork, i: number) => (
          <TableRow key={i} className="Assignment__submission">
            <TableCell>
              {sa.work_state !== StudentWorkState.NOT_ACCEPTED ? (
                <Link
                  to={`/app/submissions/${sa.student_work_id}`}
                  state={{ submission: sa, assignmentId }}
                  className="Dashboard__assignmentLink">
                  {sa.contributors.map((c: IWorkContributor) => `${c.full_name}`).join(", ")}
                </Link>
              ) : (
                <div>
                  {sa.contributors.map((c: IWorkContributor) => `${c.full_name}`).join(", ")}
                </div>
              )}
            </TableCell>
            <TableCell className="Assignment__pillCell">
              <Pill label={removeUnderscores(sa.work_state)}
                variant={(() => {
                  switch (sa.work_state) {
                    case StudentWorkState.ACCEPTED:
                      return 'green';
                    case StudentWorkState.STARTED:
                      return 'amber';
                    case StudentWorkState.SUBMITTED:
                      return 'blue';
                    case StudentWorkState.GRADING_ASSIGNED:
                      return 'teal';
                    case StudentWorkState.GRADING_COMPLETED:
                      return 'teal';
                    case StudentWorkState.GRADE_PUBLISHED:
                      return 'teal';
                    case StudentWorkState.NOT_ACCEPTED:
                      return 'rose';
                    default:
                      return 'default';
                  }
                })()}>
              </Pill>
            </TableCell>
            <TableCell>{sa.last_commit_date ? formatDateTime(new Date(sa.last_commit_date)) : "N/A"}</TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
};

export default AssignmentTable; 