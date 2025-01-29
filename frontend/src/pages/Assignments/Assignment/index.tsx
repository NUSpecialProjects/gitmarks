import { useLocation, useParams, Link } from "react-router-dom";
import { MdEdit, MdEditDocument } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { useContext, useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import {
  getAssignmentIndirectNav,
  getAssignmentTemplate,
  postAssignmentToken,
} from "@/api/assignments";
import {
  getAssignmentAcceptanceMetrics,
  getAssignmentGradedMetrics,
} from "@/api/metrics";
import { getStudentWorks } from "@/api/student_works";
import { formatDate, formatDateTime } from "@/utils/date";

import SubPageHeader from "@/components/PageHeader/SubPageHeader";
import CopyLink from "@/components/CopyLink";
import { Table, TableCell, TableRow } from "@/components/Table";
import Button from "@/components/Button";
import MetricPanel from "@/components/Metrics/MetricPanel";
import Metric from "@/components/Metrics";
import Pill from "@/components/Pill";
import "./styles.css";
import { StudentWorkState } from "@/types/enums";
import { removeUnderscores } from "@/utils/text";

ChartJS.register(...registerables);
ChartJS.register(ChartDataLabels);

const Assignment: React.FC = () => {
  const location = useLocation();
  const [assignment, setAssignment] = useState<IAssignmentOutline>();
  const [assignmentTemplate, setAssignmentTemplate] = useState<IAssignmentTemplate>();
  const [studentWorks, setStudentAssignment] = useState<IStudentWork[]>([]);
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const { id: assignmentID } = useParams();
  const [inviteLink, setInviteLink] = useState<string>("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const base_url: string = import.meta.env.VITE_PUBLIC_FRONTEND_DOMAIN as string;

  const [acceptanceMetrics, setAcceptanceMetrics] = useState<IChartJSData>({
    labels: ["Not Accepted", "Accepted", "Started", "Submitted", "In Grading"],
    datasets: [
      {
        backgroundColor: [
          "#f83b5c",
          "#50c878",
          "#fece5a",
          "#7895cb",
          "#219386",
        ],
        data: [],
      },
    ],
  });
  const [gradedMetrics, setGradedMetrics] = useState<IChartJSData>({
    labels: ["Graded", "Ungraded"],
    datasets: [
      {
        backgroundColor: ["#219386", "#e5e7eb"],
        data: [],
      },
    ],
  });

  useEffect(() => {
    if (!selectedClassroom || !assignmentID) return;

    // populate acceptance metrics
    getAssignmentAcceptanceMetrics(selectedClassroom.id, Number(assignmentID)).then(
      (metrics) => {
        acceptanceMetrics.datasets[0].data = [
          metrics.not_accepted,
          metrics.accepted,
          metrics.started,
          metrics.submitted,
          metrics.in_grading,
        ];
        setAcceptanceMetrics(acceptanceMetrics);
      }
    );

    // populate graded status metrics
    getAssignmentGradedMetrics(selectedClassroom.id, Number(assignmentID)).then(
      (metrics) => {
        gradedMetrics.datasets[0].data = [metrics.graded, metrics.ungraded];
        setGradedMetrics(gradedMetrics);
      }
    );
  }, [selectedClassroom]);

  useEffect(() => {
    if (!selectedClassroom || !assignmentID) return;
    getAssignmentTemplate(selectedClassroom.id, Number(assignmentID))
      .then(assignmentTemplate => {
        setAssignmentTemplate(assignmentTemplate);
      })
      .catch(_ => {
        // do nothing
      });
  }, [selectedClassroom]);

  useEffect(() => {
    // check if assignment has been passed through
    if (location.state) {
      setAssignment(location.state.assignment);
      const a: IAssignmentOutline = location.state.assignment;

      // sync student assignments
      if (selectedClassroom !== null && selectedClassroom !== undefined) {
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
      if (assignmentID && selectedClassroom !== null && selectedClassroom !== undefined) {
        (async () => {
          try {
            const fetchedAssignment = await getAssignmentIndirectNav(
              selectedClassroom.id,
              +assignmentID
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
            <CopyLink link={inviteLink} name="invite-assignment" />
            {linkError && <p className="error">{linkError}</p>}
          </div>

          <div className="Assignment__metrics">
            <h2>Metrics</h2>
            <MetricPanel>
              <Metric title="First Commit Date">
                {formatDate(firstCommitDate)}
              </Metric>
              <Metric title="Total Commits">
                {totalCommits.toString()}
              </Metric>
            </MetricPanel>

            <div className="Assignment__metricsCharts">
              <Metric
                title="Grading Status"
                className="Assignment__metricsChart Assignment__metricsChart--graded"
              >
                <Doughnut
                  redraw={true}
                  data={gradedMetrics}
                  options={{
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        onClick: () => { },
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
                      },
                      tooltip: {
                        enabled: false,
                      },
                    },
                    cutout: "65%",
                    borderColor: "transparent",
                  }}
                />
              </Metric>

              <Metric
                title="Repository Status"
                className="Assignment__metricsChart Assignment__metricsChart--acceptance"
              >
                <Bar
                  redraw={true}
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
                studentWorks.map((sa, i) => (
                  <TableRow key={i} className="Assignment__submission">
                    <TableCell>
                      {sa.work_state !== StudentWorkState.NOT_ACCEPTED ? (
                        <Link
                          to={`/app/submissions/${sa.student_work_id}`}
                          state={{ submission: sa, assignmentId: assignment.id }}
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
    )
  );
};

export default Assignment;
