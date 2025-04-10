import "./styles.css";
import { useLocation, useParams } from "react-router-dom";
import { useContext } from "react";
import SubPageHeader from "@/components/PageHeader/SubPageHeader";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import MetricPanel from "@/components/Metrics/MetricPanel";
import Metric from "@/components/Metrics";
import Button from "@/components/Button";
import { Line } from 'react-chartjs-2';
import { MdEditDocument } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { useStudentWork, useStudentWorkAnalytics } from "@/hooks/useStudentWorks";
import { ErrorToast } from "@/components/Toast";

const StudentSubmission: React.FC = () => {
  const location = useLocation();
  const { id } = useParams();
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const assignmentID = location.state.assignmentId;

  const { data: submission, error: submissionError } = useStudentWork(
    selectedClassroom?.id,
    assignmentID,
    id ? Number(id) : undefined
  );

  const {
    firstCommit,
    totalCommits,
    lineData,
    lineOptions,
    noCommits,
    notEnoughData,
    loadingAllCommits,
    error: analyticsError
  } = useStudentWorkAnalytics(
    selectedClassroom?.id,
    assignmentID,
    id ? Number(id) : undefined
  );

  if (submissionError) {
    ErrorToast("Error loading submission data", "submissionError");
  }

  if (analyticsError) {
    ErrorToast("Error loading analytics data", "analyticsError");
  }

  return (
    <div className="StudentWork">
      <SubPageHeader
        pageTitle={submission?.contributors.map((contributor) => contributor.full_name).join(", ")}
        pageSubTitle={submission?.assignment_name}
        chevronLink={`/app/assignments/${assignmentID}`}
      ></SubPageHeader>

      <div className="StudentSubmission__externalButtons">
        <Button
          href={`https://github.com/${submission?.org_name}/${submission?.repo_name}`}
          variant="secondary"
          newTab
        >
          <FaGithub className="icon" /> View Student Repository
        </Button>
        <Button
          href={`/app/grading/assignment/${assignmentID}/student/${submission?.student_work_id}`}
          variant="secondary"
        >
          <MdEditDocument className="icon" /> Grade Submission
        </Button>
      </div>


      <div className="StudentSubmission__subSectionWrapper">
        <h2 style={{ marginBottom: 10 }}>Metrics</h2>
        <MetricPanel>
          <Metric title="First Commit Date">{firstCommit ?? "N/A"}</Metric>
          <Metric title="Total Commits">{totalCommits ?? "N/A"}</Metric>
          <Metric title="Commits Over Time" className="Metric__bigContent">
            <div>
              {loadingAllCommits ? <div>Loading...</div> :
              noCommits ? <div>N/A</div> :
              notEnoughData ? <div>Insufficient Data</div> :
              lineData && lineOptions && (
                <Line
                  className="StudentSubmission__commitsOverTimeChart"
                  options={lineOptions}
                  data={lineData}
                  redraw={false}
                />
              )}
            </div>
          </Metric>
        </MetricPanel>
      </div>
    </div>
  );
};

export default StudentSubmission;
