import { FaChevronRight, FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import React, { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { getAssignments } from "@/api/assignments";
import { getStudentWorks } from "@/api/student_works";
import { formatDateTime } from "@/utils/date";

import {
  Table,
  TableRow,
  TableCell,
  TableDiv,
} from "@/components/Table/index.tsx";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyDataBanner from "@/components/EmptyDataBanner";
import Button from "@/components/Button";
import { MdAdd } from "react-icons/md";
import BreadcrumbPageHeader from "@/components/PageHeader/BreadcrumbPageHeader";
import { useClassroomUser } from "@/hooks/useClassroomUser";
import { ClassroomRole, StudentWorkState } from "@/types/enums";

import "./styles.css";

interface IGradingAssignmentRow extends React.HTMLProps<HTMLDivElement> {
  assignment: IAssignmentOutline;
}

const GradingAssignmentRow: React.FC<IGradingAssignmentRow> = ({
  assignment,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const navigate = useNavigate();

  const { data: studentAssignments } = useQuery({
    queryKey: ['studentWorks', selectedClassroom?.id, assignment.id],
    queryFn: () => getStudentWorks(selectedClassroom!.id, assignment.id),
    enabled: !!selectedClassroom && !collapsed,
  });
  
  const downloadGrades = () => {
    if (!studentAssignments) return;
    const csvContent =
      "Student,Auto Grader Score,Manual Feedback Score,Overall Score\n" +
      studentAssignments
        .map((work) =>
          work.contributors
            .map((contributor) => {
              const overall_score =
                !work.auto_grader_score && !work.manual_feedback_score
                  ? null
                  : (work.auto_grader_score ?? 0) +
                    (work.manual_feedback_score ?? 0);
              return `${contributor},${work.auto_grader_score},${work.manual_feedback_score},${overall_score}`;
            })
            .join("\n")
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.setAttribute("download", "data.csv");
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <TableRow
        className={!collapsed ? "GradingAssignmentRow--expanded" : undefined}
        onClick={() => {
          setCollapsed(!collapsed);
        }}
      >
        <TableCell>
          {collapsed ? <FaChevronRight /> : <FaChevronDown />}
        </TableCell>
        {children}
      </TableRow>
      {!collapsed && (
        <TableDiv className="GradingAssignmentRow__submissions">
          {studentAssignments ? (
            <>
              <Table cols={4}>
                <TableRow style={{ borderTop: "none" }}>
                  <TableCell>Student</TableCell>
                  <TableCell>Auto Grader Score</TableCell>
                  <TableCell>Manual Feedback Score</TableCell>
                  <TableCell>Overall Score</TableCell>
                </TableRow>
                {studentAssignments
                .filter(
                  (studentAssignment) =>
                    studentAssignment.work_state !==
                    StudentWorkState.NOT_ACCEPTED
                )
                .map((studentAssignment, i: number) => (
                  <TableRow
                    key={i}
                    onClick={() => {
                      navigate(
                        `assignment/${assignment.id}/student/${studentAssignment.student_work_id}`
                      );
                    }}
                  >
                    <TableCell>
                      {studentAssignment.contributors.map(c => `${c.full_name}`).join(", ")}
                    </TableCell>
                    <TableCell style={{ justifyContent: "end" }}>
                      {studentAssignment.auto_grader_score ?? "-"}
                    </TableCell>
                    <TableCell style={{ justifyContent: "end" }}>
                      {studentAssignment.manual_feedback_score ?? "-"}
                    </TableCell>
                    <TableCell style={{ justifyContent: "end" }}>
                      {!studentAssignment.auto_grader_score &&
                      !studentAssignment.manual_feedback_score
                        ? "-"
                        : (studentAssignment.auto_grader_score ?? 0) +
                          (studentAssignment.manual_feedback_score ?? 0)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableDiv className="GradingAssignmentRow__foot">
                  <Button onClick={downloadGrades}>Download Grades</Button>
                </TableDiv>
              </Table>
            </>
          ) : (
            <div style={{ padding: "15px 20px" }}>
              No students have accepted this assignment yet.
            </div>
          )}
        </TableDiv>
      )}
    </>
  );
};

const Grading: React.FC = () => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  useClassroomUser(selectedClassroom?.id, ClassroomRole.TA, "/app/organization/select");

  const { data: assignments, isLoading, error } = useQuery({
    queryKey: ['assignments', selectedClassroom?.id],
    queryFn: () => getAssignments(selectedClassroom!.id),
    enabled: !!selectedClassroom,
  });

  return (
    <div className="Grading">
      {selectedClassroom && (
        <BreadcrumbPageHeader
          pageTitle={selectedClassroom?.org_name}
          breadcrumbItems={[selectedClassroom?.name, "Grading"]}
        />
      )}
      {isLoading ? (
        <EmptyDataBanner>
          <LoadingSpinner />
        </EmptyDataBanner>
      ) : error ? (
        <EmptyDataBanner>
          Error loading assignments: {error instanceof Error ? error.message : "Unknown error"}
        </EmptyDataBanner>
      ) : assignments && assignments.length > 0 ? (
        <Table cols={4} primaryCol={1} className="AssignmentsTable">
          <TableRow style={{ borderTop: "none" }}>
            <TableCell></TableCell>
            <TableCell>Assignment Name</TableCell>
            <TableCell>Assigned Date</TableCell>
            <TableCell>Due Date</TableCell>
          </TableRow>
          {assignments && assignments.map((assignment, i: number) => (
            <GradingAssignmentRow key={i} assignment={assignment}>
              <TableCell>{assignment.name}</TableCell>
              <TableCell>{formatDateTime(assignment.created_at)}</TableCell>
              <TableCell>{formatDateTime(assignment.main_due_date)}</TableCell>
            </GradingAssignmentRow>
          ))}
        </Table>
      ) : (
        <EmptyDataBanner>
          <div className="emptyDataBannerMessage">
            No assignments found.
          </div>
          <Button
              variant="primary"
              size="small"
              href={`/app/assignments/create?org_name=${selectedClassroom?.org_name}`}
              >
              <MdAdd className="icon" /> Create Assignment
            </Button>
        </EmptyDataBanner>
      )}
    </div>
  );
};

export default Grading;
