import { useParams, Link } from "react-router-dom";
import { MdEdit, MdEditDocument } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { useContext, useEffect, useState } from "react";
import { Chart as ChartJS, registerables } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { formatDate, formatDateTime } from "@/utils/date";

import SubPageHeader from "@/components/PageHeader/SubPageHeader";
import { CopyLinkWithExpiration, IExpirationOption } from "@/components/CopyLink";
import { Table, TableCell, TableRow } from "@/components/Table";
import Button from "@/components/Button";
import MetricPanel from "@/components/Metrics/MetricPanel";
import Metric from "@/components/Metrics";
import Pill from "@/components/Pill";
import "./styles.css";
import { StudentWorkState } from "@/types/enums";
import { removeUnderscores } from "@/utils/text";
import { useAssignment, useAssignmentInviteLink, useAssignmentBaseRepo, useAssignmentMetrics, useAssignmentTotalCommits } from "@/hooks/useAssignment";
import { ErrorToast } from "@/components/Toast";
import { useStudentWorks } from "@/hooks/useStudentWorks";

ChartJS.register(...registerables);
ChartJS.register(ChartDataLabels);

const Assignment: React.FC = () => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const { id: assignmentID } = useParams();
  const base_url: string = import.meta.env.VITE_PUBLIC_FRONTEND_DOMAIN as string;

  const { data: assignment, error: assignmentError } = useAssignment(selectedClassroom?.id, Number(assignmentID));
  const { data: assignmentBaseRepo, isLoading: assignmentBaseRepoIsLoading, error: assignmentBaseRepoError } = useAssignmentBaseRepo(selectedClassroom?.id, Number(assignmentID));
  const { data: studentWorks } = useStudentWorks(
    selectedClassroom?.id, 
    Number(assignmentID)
  );

  const [expirationDuration, setExpirationDuration] = useState<IExpirationOption>({ label: "Expires: Never", value: undefined });
  const expirationOptions = [
    { label: "Expires: 6 hours", value: 360 },
    { label: "Expires: 12 hours", value: 720 },
    { label: "Expires: 1 day", value: 1440 },
    { label: "Expires: 7 days", value: 10080 },
    { label: "Expires: 1 month", value: 43200 },
    { label: "Expires: Never", value: undefined },
  ];
  const { data: inviteLink = "", isLoading: linkIsLoading, error: linkError } = useAssignmentInviteLink(selectedClassroom?.id, assignment?.id, base_url, expirationDuration.value);

  const { data: totalAssignmentCommits } = useAssignmentTotalCommits(selectedClassroom?.id, assignment?.id);
  const { acceptanceMetrics, gradedMetrics, error: metricsError } = useAssignmentMetrics(selectedClassroom?.id, Number(assignmentID));

  const assignmentBaseRepoLink = assignmentBaseRepo ? `https://github.com/${assignmentBaseRepo?.base_repo_owner}/${assignmentBaseRepo?.base_repo_name}` : "";

  useEffect(() => {
    if (linkError || assignmentError || metricsError || assignmentBaseRepoError) {
      const errorMessage = linkError?.message || assignmentError?.message || metricsError?.message || assignmentBaseRepoError?.message;
      if (errorMessage) {
        ErrorToast(errorMessage, "assignment-error");
      }
    }
  }, [linkError, assignmentError, metricsError, assignmentBaseRepoError]);

  return (
      <>
        <SubPageHeader
          pageTitle={assignment?.name}
          chevronLink={"/app/dashboard"}
        >
          <div className="Assignment__dates">
            <div className="Assignment__date">
              <div className="Assignment__date--title"> {"Released on:"}</div>
              {assignment?.created_at
                ? formatDate(assignment.created_at)
                : "N/A"}
            </div>
            <div className="Assignment__date">
              <div className="Assignment__date--title"> {"Due Date:"}</div>
              {assignment?.main_due_date
                ? formatDate(assignment.main_due_date)
                : "N/A"}
            </div>
          </div>
        </SubPageHeader>

        <div className="Assignment">
          <div className="Assignment__externalButtons">
            <Button href={assignmentBaseRepoLink} variant="secondary" disabled={!assignmentBaseRepoLink || assignmentBaseRepoIsLoading} newTab>
              <FaGithub className="icon" /> View GitHub Repository
            </Button>
            <Button
              href={`/app/assignments/${assignment?.id}/rubric`}
              variant="secondary"
              disabled={!assignment?.id}
              state={{ assignment }}
            >
              <MdEditDocument className="icon" /> View Rubric
            </Button>
            <Button href="#" variant="secondary" disabled={!assignment?.id} newTab>
              <MdEdit className="icon" /> Edit Assignment
            </Button>
          </div>

          <div className="Assignment__link">
            <h2>Assignment Link</h2>
            <CopyLinkWithExpiration 
              link={inviteLink} 
              name="invite-assignment" 
              duration={expirationDuration}
              setDuration={(newDuration: IExpirationOption) => setExpirationDuration(newDuration)}
              expirationOptions={expirationOptions}
              loading={linkIsLoading}
            />
          </div>

          <div className="Assignment__metrics">
            <h2>Metrics</h2>
            <MetricPanel>
              <Metric title="Total Commits">
                {totalAssignmentCommits ? totalAssignmentCommits.toString() : 0}
              </Metric>
            </MetricPanel>

            <div className="Assignment__metricsCharts">
              <Metric
                title="Grading Status"
                className="Assignment__metricsChart Assignment__metricsChart--graded"
              >
                {gradedMetrics && (
                  <Doughnut
                    redraw={false}
                    data={gradedMetrics}
                    options={{
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          onClick: () => {},
                          display: true,
                          position: "bottom",
                          labels: {
                            usePointStyle: true,
                            font: {
                              size: 12,
                            },
                          },
                        },
                        datalabels: {
                          color: ["#fff", "#000"],
                          font: {
                            size: 12,
                          },
                          formatter: (value) => {
                            return value === 0 ? '' : value;
                          }
                        },
                        tooltip: {
                          enabled: false,
                        },
                      },
                      cutout: "65%",
                      borderColor: "transparent",
                    }}
                  />
                )}
              </Metric>

              <Metric
                title="Repository Status"
                className="Assignment__metricsChart Assignment__metricsChart--acceptance"
              >
                {acceptanceMetrics && (
                  <Bar
                    redraw={false}
                    data={acceptanceMetrics}
                    options={{
                      maintainAspectRatio: false,
                      indexAxis: "y",
                      layout: {
                        padding: {
                          right: 50,
                        },
                      },
                      scales: {
                        x: {
                          display: false,
                        },
                        y: {
                          grid: {
                            display: false,
                          },
                          ticks: {
                            font: {
                              size: 12,
                            },
                          },
                        },
                      },
                      plugins: {
                        legend: {
                          display: false,
                        },
                        datalabels: {
                          align: "end",
                          anchor: "end",
                          color: "#000",
                          font: {
                            size: 12,
                          },
                        },
                        tooltip: {
                          enabled: false,
                        },
                      },
                    }}
                  />
                )}
              </Metric>
            </div>
          </div>

          <div>
            <h2 style={{ marginBottom: 0 }}>Student Assignments</h2>
            <Table cols={3}>
              <TableRow style={{ borderTop: "none" }}>
                <TableCell>Student Name</TableCell>
                <TableCell className="Assignment__centerAlignedCell">Status</TableCell>
                <TableCell>Last Commit</TableCell>
              </TableRow>
              {studentWorks &&
                studentWorks.length > 0 &&
                studentWorks.map((sa: IStudentWork, i: number) => (
                  <TableRow key={i} className="Assignment__submission">
                    <TableCell>
                      {sa.work_state !== StudentWorkState.NOT_ACCEPTED ? (
                        <Link
                          to={`/app/submissions/${sa.student_work_id}`}
                          state={{ submission: sa, assignmentId: assignment?.id }}
                          className="Dashboard__assignmentLink">
                          {sa.contributors.map(c => `${c.full_name  }`).join(", ")}
                        </Link>
                      ) : (
                        <div>
                          {sa.contributors.map(c => `${c.full_name}`).join(", ")}
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
        </div>
      </>
  );
};

export default Assignment;
