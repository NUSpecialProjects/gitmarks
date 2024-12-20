import "./styles.css";
import { useLocation, useParams } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import SubPageHeader from "@/components/PageHeader/SubPageHeader";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import MetricPanel from "@/components/Metrics/MetricPanel";
import Metric from "@/components/Metrics";
import Button from "@/components/Button";
import { getStudentWorkById, getStudentWorkCommitsPerDay } from "@/api/student_works";
import { getFirstCommit, getTotalCommits } from "@/api/student_works";
import { formatDate } from "@/utils/date";

import { ChartData, Chart as ChartJS, ChartOptions, Point, registerables } from "chart.js";
import { Line } from 'react-chartjs-2'
import ChartDataLabels from "chartjs-plugin-datalabels";
ChartJS.register(...registerables);
ChartJS.register(ChartDataLabels);

import { MdEditDocument } from "react-icons/md";
import { FaGithub } from "react-icons/fa";

const StudentSubmission: React.FC = () => {
  const location = useLocation();
  const [submission, setSubmission] = useState<IStudentWork>();
  const { id } = useParams();
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const assignmentID = location.state.assignmentId;
  const [firstCommit, setFirstCommit] = useState<string>("");
  const [totalCommits, setTotalCommits] = useState<string>();
  const [noCommits, setNoCommits] = useState(false)
  const [loadingAllCommits, setLoadingAllCommits] = useState(true)


  const [commitsPerDay, setCommitsPerDay] = useState<Map<Date, number>>(new Map());
  const [lineData, setLineData] = useState<ChartData<"line", (number | Point | null)[], unknown>>()
  const [lineOptions, setLineOptions] = useState<ChartOptions<"line">>()


  useEffect(() => {
    if (location.state && location.state.submission) {
      setSubmission(location.state.submission); // Use submission from state
    } else if (id && assignmentID && selectedClassroom) {
      // If state fails, use submission data as a fallback
      (async () => {
        try {
          const fetchedSubmission = await getStudentWorkById(
            selectedClassroom.id,
            assignmentID, // Use assignmentID from state
            +id // Student submission ID
          );
          if (fetchedSubmission) {
            setSubmission(fetchedSubmission);
          }
        } catch (error) {
          console.error("Failed to fetch submission:", error);
        }
      })();
    }
  }, [location.state, id, selectedClassroom]);

  useEffect(() => {
    if (
      submission !== null &&
      submission !== undefined &&
      selectedClassroom !== null &&
      selectedClassroom !== undefined
    ) {
      (async () => {
        try {
          const commitDate = await getFirstCommit(
            selectedClassroom.id,
            assignmentID,
            submission.student_work_id
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
  }, [selectedClassroom, submission]);

  useEffect(() => {
    if (
      submission !== null &&
      submission !== undefined &&
      selectedClassroom !== null &&
      selectedClassroom !== undefined
    ) {
      (async () => {
        try {
          const total = await getTotalCommits(
            selectedClassroom.id,
            assignmentID,
            submission.student_work_id
          );

          if (totalCommits !== null && totalCommits !== undefined) {
            setTotalCommits(total.toString());
          } else {
            setTotalCommits("N/A");
          }

          const cPD = await getStudentWorkCommitsPerDay(selectedClassroom.id, assignmentID, submission.student_work_id)
          if (cPD !== null && cPD !== undefined) {
            setCommitsPerDay(cPD)
          }
        } catch (_) {
          // do nothing
        }
      })();
    }
  }, [selectedClassroom, submission]);

  // useEffect for line chart 
  useEffect(() => {
    if (commitsPerDay) {
      const sortedDates = Array.from(commitsPerDay.keys()).sort((a, b) => a.valueOf() - b.valueOf())
      // end dates at today or due date, whichever is sooner
      if (submission) {
        const today = new Date()
        today.setUTCHours(0)
        today.setUTCMinutes(0)
        today.setUTCSeconds(0)
        if (sortedDates.length === 0) {
          setNoCommits(true)
        } else if (sortedDates[sortedDates.length - 1].toDateString() !== (today.toDateString())) {
          sortedDates.push(new Date())
        }
      }

      const sortedCounts: number[] = (sortedDates.map((date) => commitsPerDay.get(date) ?? 0))
      const sortedDatesStrings = sortedDates.map((date) => `${date.getMonth()+1}/${date.getDate()}`)

      //add in days with 0 commits
      const sortedDatesStringsCopy = [...sortedDatesStrings]
      let index = 0
      for (let i = 0; i < sortedDatesStringsCopy.length - 1; i++) {

        const month = Number(sortedDatesStringsCopy[i].split("/")[0])
        const day = Number(sortedDatesStringsCopy[i].split("/")[1])
        const followingDay = Number(sortedDatesStringsCopy[i + 1].split("/")[1])


        const difference = day - followingDay

        const adjacent = (difference === -1)
        const adjacentWrapped = ((difference === 30 || difference === 29 || difference === 27) && (followingDay === 1))

        if (!adjacent && !adjacentWrapped) {
          for (let j = 1; j < Math.abs(difference); j++) {
            
            const nextDay = (new Date(sortedDates[i].getUTCFullYear(), month-1, day))
            nextDay.setDate(nextDay.getDate()+j)

            sortedDatesStrings.splice(index + j, 0, `${nextDay.getUTCMonth()+1}/${nextDay.getDate()}`)
            sortedCounts.splice(index + j, 0, 0)
          }
          index += (Math.abs(difference))

        }
      }

      if (sortedDates.length > 0) {
        setLoadingAllCommits(false)
      }

      const lineData = {
        labels: sortedDatesStrings,
        datasets: [
          {
            data: sortedCounts,
            borderColor: 'rgba(13, 148, 136, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.05,
          },
        ],
      }
      setLineData(lineData)

      const lineOptions = {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: false,
          },
          datalabels: {
            display: false,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
          },
          y: {
            grid: {
              display: false,
            },
            ticks: {
              maxTicksLimit: 5,
              beginAtZero: true,
            },
          },
        },
        elements: {
          point: {
            radius: 1,
          },
          labels: {
            display: false
          }
        },
      }
      setLineOptions(lineOptions)
    }

  }, [commitsPerDay])

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
          <Metric title="First Commit Date">{firstCommit}</Metric>
          <Metric title="Total Commits">{totalCommits ?? "N/A"}</Metric>
          {lineData && lineOptions && (
            <Metric title="Commits Over Time" className="Metric__bigContent">
              <div>
                {noCommits && (
                  <div>N/A</div>
                )}

                {!noCommits && loadingAllCommits &&
                  <div>Loading...</div>
                }

                {!noCommits && !loadingAllCommits && (
                  <Line className="StudentSubmission__commitsOverTimeChart"
                    options={lineOptions}
                    data={lineData}
                  />
                )}
              </div>
            </Metric>
          )}
        </MetricPanel>

        <div>{}</div>
      </div>
    </div>
  );
};

export default StudentSubmission;
