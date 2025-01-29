import { FaChevronRight, FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import React, { useContext, useEffect, useState } from "react";

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
import BreadcrumbPageHeader from "@/components/PageHeader/BreadcrumbPageHeader";
import Button from "@/components/Button";

import "./styles.css";
import { useClassroomUser } from "@/hooks/useClassroomUser";
import { ClassroomRole, StudentWorkState } from "@/types/enums";

interface IGradingAssignmentRow extends React.HTMLProps<HTMLDivElement> {
  assignment: IAssignmentOutline;
}

const GradingAssignmentRow: React.FC<IGradingAssignmentRow> = ({
  assignment,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const [studentAssignments, setStudentAssignments] = useState<IStudentWork[]>(
    []
  );
  const { selectedClassroom: selectedClassroom } = useContext(
    SelectedClassroomContext
  );
  useClassroomUser(selectedClassroom?.id, ClassroomRole.TA, "/access-denied");
  const navigate = useNavigate();

  const downloadGrades = () => {
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

  useEffect(() => {
    if (!selectedClassroom) return;
    getStudentWorks(selectedClassroom.id, assignment.id)
      .then((studentAssignments) => {
        setStudentAssignments(studentAssignments);
      })
      .catch((err: unknown) => {
        console.error("Error fetching student assignments:", err);
      });
  }, []);

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
  const [assignments, setAssignments] = useState<IAssignmentOutline[]>([]);
  const { selectedClassroom: selectedClassroom } = useContext(
    SelectedClassroomContext
  );
  useClassroomUser(selectedClassroom?.id, ClassroomRole.TA, "/app/organization/select");
  useEffect(() => {
    if (!selectedClassroom) return;
    getAssignments(selectedClassroom.id)
      .then((assignments) => {
        setAssignments(assignments);
      })
      .catch((err: unknown) => {
        console.error("Error fetching assignments:", err);
      });
  }, []);

  return (
    selectedClassroom && (
      <div className="Grading">
        <BreadcrumbPageHeader
          pageTitle={selectedClassroom?.org_name}
          breadcrumbItems={[selectedClassroom?.name, "Grading"]}
        />
        <Table cols={4} primaryCol={1} className="AssignmentsTable">
          <TableRow style={{ borderTop: "none" }}>
            <TableCell></TableCell>
            <TableCell>Assignment Name</TableCell>
            <TableCell>Assigned Date</TableCell>
            <TableCell>Due Date</TableCell>
          </TableRow>
          {assignments
            ? assignments.map((assignment, i: number) => (
                <GradingAssignmentRow key={i} assignment={assignment}>
                  <TableCell>{assignment.name}</TableCell>
                  <TableCell>{formatDateTime(assignment.created_at)}</TableCell>
                  <TableCell>
                    {formatDateTime(assignment.main_due_date)}
                  </TableCell>
                </GradingAssignmentRow>
              ))
            : "No assignments yet."}
        </Table>
      </div>
    )
  );
};

export default Grading;
