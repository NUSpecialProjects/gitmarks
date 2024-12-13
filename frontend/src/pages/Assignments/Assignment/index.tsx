import Button from "@/components/Button";

import "./styles.css";
import { useLocation, useParams, Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { Table, TableCell, TableRow } from "@/components/Table";
import SubPageHeader from "@/components/PageHeader/SubPageHeader";
import {
  getAssignmentIndirectNav,
  getAssignmentTemplate,
  postAssignmentToken,
} from "@/api/assignments";
import { getStudentWorks } from "@/api/student_works";
import { formatDate, formatDateTime } from "@/utils/date";
import CopyLink from "@/components/CopyLink";
import MetricPanel from "@/components/Metrics/MetricPanel";
import SimpleMetric from "@/components/Metrics/SimpleMetric";

import { MdEdit, MdEditDocument } from "react-icons/md";
import { FaGithub } from "react-icons/fa";

const Assignment: React.FC = () => {
  const location = useLocation();
  const [assignment, setAssignment] = useState<IAssignmentOutline>();
  const [assignmentTemplate, setAssignmentTemplate] = useState<IAssignmentTemplate>();
  const [studentWorks, setStudentAssignment] = useState<IStudentWork[]>([]);
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const { id } = useParams();
  const [inviteLink, setInviteLink] = useState<string>("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const base_url: string = import.meta.env.VITE_PUBLIC_FRONTEND_DOMAIN as string;

  useEffect(() => {
    // check if assignment has been passed through
    if (location.state) {
      setAssignment(location.state.assignment);
      const a: IAssignmentOutline = location.state.assignment;

      // sync student assignments
      if (selectedClassroom !== null && selectedClassroom !== undefined) {
        getAssignmentTemplate(selectedClassroom.id, a.id)
        .then(assignmentTemplate => {
          setAssignmentTemplate(assignmentTemplate);
        })
        .catch(_ => {
          // do nothing
        });

        (async () => {
          try {
            const studentWorks = await getStudentWorks(
              selectedClassroom.id,
              a.id
            );
            if (studentWorks !== null && studentWorks !== undefined) {
              setStudentAssignment(studentWorks);
            }
          } catch (_) {
            // do nothing
          }
        })();
      }
    } else {
      // fetch the assignment from backend
      if (id && selectedClassroom !== null && selectedClassroom !== undefined) {
        (async () => {
          try {
            const fetchedAssignment = await getAssignmentIndirectNav(
              selectedClassroom.id,
              +id
            );
            if (fetchedAssignment !== null && fetchedAssignment !== undefined) {
              setAssignment(fetchedAssignment);
              const studentWorks = await getStudentWorks(
                selectedClassroom.id,
                fetchedAssignment.id
              );
              if (studentWorks !== null && studentWorks !== undefined) {
                setStudentAssignment(studentWorks);
              }
            }
          } catch (_) {
            // do nothing
          }
        })();
      }
    }
  }, [selectedClassroom]);

  useEffect(() => {
    const generateInviteLink = async () => {
      if (!assignment) return;

      try {
        if (!selectedClassroom) return;
        const tokenData = await postAssignmentToken(
          selectedClassroom.id,
          assignment.id
        );
        const url = `${base_url}/app/token/assignment/accept?token=${tokenData.token}`;
        setInviteLink(url);
      } catch (_) {
        setLinkError("Failed to generate assignment invite link");
      }
    };

    generateInviteLink();
  }, [assignment]);


  const assignmentTemplateLink = assignmentTemplate ? `https://github.com/${assignmentTemplate.template_repo_owner}/${assignmentTemplate.template_repo_name}` : "";
  const firstCommitDate = studentWorks.reduce((earliest, work) => {
    if (!work.first_commit_date) return earliest;
    if (!earliest) return new Date(work.first_commit_date);
    return new Date(work.first_commit_date) < earliest ? new Date(work.first_commit_date) : earliest;
  }, null as Date | null);
  const totalCommits = studentWorks.reduce((total, work) => total + work.commit_amount, 0);

  return (
    <div className="Assignment">
      {assignment && (
        <>
          <SubPageHeader
            pageTitle={assignment.name}
            chevronLink={"/app/dashboard"}
          >
            <div className="Assignment__dates">
              <div className="Assignment__date">
                <div className="Assignment__date--title"> {"Released on:"}</div>
                {assignment.created_at
                  ? formatDateTime(new Date(assignment.created_at))
                  : "N/A"}
              </div>
              <div className="Assignment__date">
                <div className="Assignment__date--title"> {"Due Date:"}</div>
                {assignment.main_due_date
                  ? formatDateTime(new Date(assignment.main_due_date))
                  : "N/A"}
              </div>
            </div>
          </SubPageHeader>

          <div className="Assignment__externalButtons">
            <Button href={assignmentTemplateLink} variant="secondary" newTab>
              <FaGithub className="icon" /> View Template Repository
            </Button>
            <Button
              href={`/app/assignments/${assignment.id}/rubric`}
              variant="secondary"
              state={{ assignment }}
            >
              <MdEditDocument className="icon" /> View Rubric
            </Button>
            <Button href="#" variant="secondary" newTab>
              <MdEdit className="icon" /> Edit Assignment
            </Button>
          </div>

          <div className="Assignment__subSectionWrapper">
            <h2>Assignment Link</h2>
            <CopyLink link={inviteLink} name="invite-assignment" />
            {linkError && <p className="error">{linkError}</p>}
          </div>

          <div className="Assignment__subSectionWrapper">
            <h2 style={{ marginBottom: 10 }}>Metrics</h2>
            <MetricPanel>
              <SimpleMetric
                metricTitle="First Commit Date"
                metricValue={formatDate(firstCommitDate)}
              ></SimpleMetric>
              <SimpleMetric
                metricTitle="Total Commits"
                metricValue={totalCommits.toString()}
              ></SimpleMetric>
            </MetricPanel>
          </div>

          <div className="Assignment__subSectionWrapper">
            <h2 style={{ marginBottom: 0 }}>Student Assignments</h2>
            <Table cols={3}>
              <TableRow style={{ borderTop: "none" }}>
                <TableCell>Student Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Commit</TableCell>
              </TableRow>
              {studentWorks &&
                studentWorks.length > 0 &&
                studentWorks.map((sa, i) => (
                  <TableRow key={i} className="Assignment__submission">
                    <TableCell>
                      <Link
                          to={`/app/submissions/${sa.student_work_id}`}
                          state={{ submission: sa, assignmentId: assignment.id }}
                          className="Dashboard__assignmentLink">
                          {sa.contributors.map(c => `${c.first_name} ${c.last_name}`).join(", ")}
                      </Link>
                    </TableCell>
                    <TableCell>{sa.work_state}</TableCell>
                    <TableCell>{sa.last_commit_date ? formatDateTime(new Date(sa.last_commit_date)) : "N/A"}</TableCell>
                  </TableRow>
                ))}
            </Table>
          </div>
        </>
      )}
    </div>
  );
};

export default Assignment;
