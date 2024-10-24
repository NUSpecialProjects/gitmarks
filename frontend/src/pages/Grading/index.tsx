import { FaChevronRight, FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";

import {
  Table,
  TableRow,
  TableCell,
  TableDiv,
} from "@/components/Table/index.tsx";

import "./styles.css";

const GradingAssignmentRow: React.FC<IGradingAssignmentRow> = ({
  assignmentId,
  children,
  //submissions,
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const navigate = useNavigate();

  return (
    <>
      <TableRow
        className={!collapsed ? "TableRow--expanded" : undefined}
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
        <TableDiv>
          <Table cols={2} className="SubmissionTable">
            <TableRow style={{ borderTop: "none" }}>
              <TableCell>Student</TableCell>
              <TableCell>Score</TableCell>
            </TableRow>
            {Array.from({ length: 20 }).map((_, i: number) => (
              <TableRow
                key={i}
                onClick={() => {
                  navigate(`assignment/${assignmentId}/student/${i + 1}`);
                }}
              >
                <TableCell>Jane Doe</TableCell>
                <TableCell>-/100</TableCell>
              </TableRow>
            ))}
          </Table>
        </TableDiv>
      )}
    </>
  );
};

const Grading: React.FC = () => {
  return (
    <div className="Grading">
      <h2 style={{ marginBottom: 0 }}>Assignments</h2>
      <Table cols={4} primaryCol={1} className="AssignmentsTable">
        <TableRow style={{ borderTop: "none" }}>
          <TableCell></TableCell>
          <TableCell>Assignment Name</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Due Date</TableCell>
        </TableRow>
        {Array.from({ length: 2 }).map((_, i: number) => (
          <GradingAssignmentRow key={i} assignmentId={i + 1}>
            <TableCell>Test Assignment</TableCell>
            <TableCell>Active</TableCell>
            <TableCell>11 Oct, 11:59pm</TableCell>
          </GradingAssignmentRow>
        ))}
      </Table>
    </div>
  );
};

export default Grading;
