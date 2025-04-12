import { useParams } from "react-router-dom";
import { MdEdit, MdEditDocument } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { useContext, useEffect, useState } from "react";
import { Chart as ChartJS, registerables } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { formatDate } from "@/utils/date";

import SubPageHeader from "@/components/PageHeader/SubPageHeader";
import { CopyLinkWithExpiration, IExpirationOption } from "@/components/CopyLink";
import Button from "@/components/Button";
import MetricPanel from "@/components/Metrics/MetricPanel";
import Metric from "@/components/Metrics";
import "./styles.css";

import { useAssignment, useStudentWorks, useAssignmentInviteLink, useAssignmentTemplate, useAssignmentMetrics, useAssignmentTotalCommits } from "@/hooks/useAssignment";
import { ErrorToast } from "@/components/Toast";
import AssignmentTable from "./AssignmentTable";

ChartJS.register(...registerables);
ChartJS.register(ChartDataLabels);

const Assignment: React.FC = () => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const { id: assignmentID } = useParams();
  const base_url: string = import.meta.env.VITE_PUBLIC_FRONTEND_DOMAIN as string;

  const { data: assignment } = useAssignment(selectedClassroom?.id, Number(assignmentID));
  const { data: studentWorkResponse } = useStudentWorks(
    selectedClassroom?.id, 
    Number(assignmentID)
  );
  const studentWorks = studentWorkResponse?.student_works;
  const nonStudentWorks = studentWorkResponse?.non_student_works;

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
  const { data: assignmentTemplate, error: templateError } = useAssignmentTemplate(selectedClassroom?.id, assignment?.id);
  const { acceptanceMetrics, gradedMetrics, error: metricsError } = useAssignmentMetrics(selectedClassroom?.id, Number(assignmentID));

  const assignmentTemplateLink = assignmentTemplate ? `https://github.com/${assignmentTemplate.template_repo_owner}/${assignmentTemplate.template_repo_name}` : "";

  useEffect(() => {
    if (linkError || templateError || metricsError) {
      const errorMessage = linkError?.message || templateError?.message || metricsError?.message;
      if (errorMessage) {
        ErrorToast(errorMessage, "assignment-error");
      }
    }
  }, [linkError, templateError, metricsError]);

  return (
    assignment && (
      <>
        <SubPageHeader
          pageTitle={assignment.name}
          chevronLink={"/app/dashboard"}
        >
          <div className="Assignment__dates">
            <div className="Assignment__date">
              <div className="Assignment__date--title"> {"Released on:"}</div>
              {assignment.created_at
                ? formatDate(assignment.created_at)
                : "N/A"}
            </div>
            <div className="Assignment__date">
              <div className="Assignment__date--title"> {"Due Date:"}</div>
              {assignment.main_due_date
                ? formatDate(assignment.main_due_date)
                : "N/A"}
            </div>
          </div>
        </SubPageHeader>

        <div className="Assignment">
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
          {studentWorks && studentWorks.length > 0 && (
            <AssignmentTable 
              title="Student Assignments" 
              works={studentWorks} 
              assignmentId={assignment.id} 
            />
          )}

          {studentWorks && studentWorks.length > 0 &&
            nonStudentWorks && nonStudentWorks.length > 0 && (
              <AssignmentTable 
                title="Administrator Assignments" 
                works={nonStudentWorks} 
                assignmentId={assignment.id} 
              />
          )}
        </div>
      </>
    )
  );
};

export default Assignment;
