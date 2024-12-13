import Button from "@/components/Button";
import "./styles.css";
import { useLocation, useParams, Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { Table, TableCell, TableRow } from "@/components/Table";
import SubPageHeader from "@/components/PageHeader/SubPageHeader";
import { getAssignmentIndirectNav, postAssignmentToken, getAssignmentFirstCommit, getAssignmentTotalCommits } from "@/api/assignments";
import { getStudentWorks } from "@/api/student_works";
import { formatDateTime, formatDate } from "@/utils/date";
import CopyLink from "@/components/CopyLink";
import MetricPanel from "@/components/Metrics/MetricPanel";
import SimpleMetric from "@/components/Metrics/SimpleMetric";
import { useQuery } from "@tanstack/react-query";

import { MdEdit, MdEditDocument } from "react-icons/md";
import { FaGithub } from "react-icons/fa";

const Assignment: React.FC = () => {
  const location = useLocation();
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const { id } = useParams();
  const base_url: string = import.meta.env.VITE_PUBLIC_FRONTEND_DOMAIN as string;
  const [firstCommit, setFirstCommit] = useState<string>("");
  const [totalCommits, setTotalCommits] = useState<string>();

  const { data: assignment } = useQuery({
    queryKey: ['assignment', selectedClassroom?.id, id],
    queryFn: async () => {
      if (!selectedClassroom?.id || !id) return null;
      if (location.state?.assignment) {
        return location.state.assignment;
      }
      return await getAssignmentIndirectNav(selectedClassroom.id, +id);
    },
    enabled: !!selectedClassroom?.id && !!id
  });

  const { data: studentWorks = [] } = useQuery({
    queryKey: ['studentWorks', selectedClassroom?.id, assignment?.id],
    queryFn: async () => {
      if (!selectedClassroom?.id || !assignment?.id) return [];
      return await getStudentWorks(selectedClassroom.id, assignment.id);
    },
    enabled: !!selectedClassroom?.id && !!assignment?.id
  });

  const { data: inviteLink = "", error: linkError } = useQuery({
    queryKey: ['assignmentToken', selectedClassroom?.id, assignment?.id],
    queryFn: async () => {
      if (!selectedClassroom?.id || !assignment?.id) return "";
      const tokenData = await postAssignmentToken(selectedClassroom.id, assignment.id);
      return `${base_url}/app/token/assignment/accept?token=${tokenData.token}`;
    },
    enabled: !!selectedClassroom?.id && !!assignment?.id
  });

  useEffect(() => {
    if (assignment !== null && assignment !== undefined && selectedClassroom !== null && selectedClassroom !== undefined) {
      (async () => {
        try {
          const commitDate = await getAssignmentFirstCommit(
            selectedClassroom.id,
            assignment.id
          );
          if (commitDate !== null && commitDate !== undefined) {
            setFirstCommit(formatDate(commitDate));
          } else {
            setFirstCommit("N/A");
          }
        } catch (_) {
          // do nothing
        }
      })();
  }
}, [selectedClassroom, assignment]);

useEffect(() => {
  if (assignment !== null && assignment !== undefined && selectedClassroom !== null && selectedClassroom !== undefined) {
    (async () => {
      try {
        const total = await getAssignmentTotalCommits (
          selectedClassroom.id,
          assignment.id
        );
        if (totalCommits !== null && totalCommits !== undefined) {
          setTotalCommits(total.toString());
        } else {
          setTotalCommits("N/A");
        }

      } catch (_) {
        // do nothing
      }
    })();
}
}, [selectedClassroom, assignment]);

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
            <Button href="#" variant="secondary" newTab>
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
            {linkError && <p className="error">Failed to generate assignment invite link</p>}
          </div>

          <div className="Assignment__subSectionWrapper">
            <h2 style={{ marginBottom: 10 }}>Metrics</h2>
            <MetricPanel>
              <SimpleMetric metricTitle="First Commit Date" metricValue={firstCommit}></SimpleMetric>
              <SimpleMetric metricTitle="Total Commits" metricValue={totalCommits ?? "N/A"}></SimpleMetric>
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
                          className="Dashboard__assignmentLink"
                        >
                          {sa.contributors.join(", ")}
                          </Link>
                          </TableCell>
                    <TableCell>Passing</TableCell>
                    <TableCell>12 Sep, 11:34pm</TableCell>
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
