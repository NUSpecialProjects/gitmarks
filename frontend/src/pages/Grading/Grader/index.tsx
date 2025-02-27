import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { GoZoomIn, GoZoomOut } from "react-icons/go";
import { useContext, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import FileTree from "@/components/CodeBrowser/FileTree";
import Button from "@/components/Button";
import CodeBrowser from "@/components/CodeBrowser";
import { GraderContext, GraderProvider } from "@/contexts/grader";

import "./styles.css";
import RubricTree from "@/components/CodeBrowser/RubricTree";

const GraderWrapper: React.FC = () => {
  const { assignmentID, studentWorkID } = useParams();
  return (
    <GraderProvider assignmentID={assignmentID} studentWorkID={studentWorkID}>
      <Grader />
    </GraderProvider>
  );
};

const Grader: React.FC = () => {
  const {
    assignmentID,
    studentWorkID,
    studentWork,
    selectedFile,
    loadingGitTree,
    loadingStudentWork,
    loadingRubric,
    dataRetrievalError,
    setSelectedFile,
  } = useContext(GraderContext);
  const [graderFontSize, setGraderFontSize] = useState(13);
  const navigate = useNavigate();

  const zoomIn = () => {
    setGraderFontSize(Math.min(graderFontSize + 1, 24));
  };

  const zoomOut = () => {
    setGraderFontSize(Math.max(graderFontSize - 1, 8));
  };

  const handlePrevious = () => {
    if (studentWork?.previous_student_work_id) {
      navigate(`/app/grading/assignment/${assignmentID}/student/${studentWork.previous_student_work_id}`);
    }
  };
  
  const handleNext = () => {
    if (studentWork?.next_student_work_id) {
      navigate(`/app/grading/assignment/${assignmentID}/student/${studentWork.next_student_work_id}`);
    }
  };

  return (
    <div className="Grader">
      <div className="Grader__head">
        <div className="Grader__title">
          <Link to="/app/grading">
            <FaChevronLeft />
          </Link>
          <div>
            {studentWork ? (
              <>
                <h2>{studentWork.contributors.map((contributor) => contributor.full_name).join(", ")}</h2>
                <span>{studentWork.assignment_name}</span>
              </>
            ) : (
              <h2>Grading</h2>
            )}
          </div>
        </div>
        {studentWork && (
          <div className="Grader__nav">
            <span>
              Student Work {studentWork.row_num}/
              {studentWork.total_student_works}
            </span>
            <div>
              <div className="Grader__navButtons">
                <Button
                  variant="secondary"
                  onClick={handlePrevious}
                  disabled={studentWork?.previous_student_work_id === null}
                >
                  <FaChevronLeft />
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleNext}
                  disabled={studentWork?.next_student_work_id === null}
                >
                  Next
                  <FaChevronRight />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="Grader__body">
        <div className="Grader__toolBar">
          <div className="Grader__toolBar__fileName">
          {(loadingGitTree || loadingStudentWork) 
            ? <span className="loading-ellipsis">Loading</span>
            : selectedFile ? selectedFile.path : "No file selected"
          }
          </div>
          <div className="Grader__toolBar__zoomButtons">
            <div className="Grader__toolBar__zoomButton" onClick={zoomIn}>
              <GoZoomIn />
            </div>
            <div className="Grader__toolBar__zoomButton" onClick={zoomOut}>
              <GoZoomOut />
            </div>
          </div>
        </div>
        <div
          className="Grader__viewPort"
          style={{ fontSize: graderFontSize }}
        >
          <FileTree
            className="Grader__files"
            selectFileCallback={setSelectedFile}
          />
          <CodeBrowser
            assignmentID={assignmentID}
            studentWorkID={studentWorkID}
            file={selectedFile}
            loading={loadingGitTree || loadingStudentWork}
            error={dataRetrievalError ? "Unable to retrieve student's work" : undefined}
          />
          <RubricTree
            loading={loadingRubric}
          />
        </div>
      </div>
    </div>
  );
};

export default GraderWrapper;
