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
  const [notEnoughData, setNotEnoughData] = useState(false);
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

          if (total !== null && total !== undefined) {
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


  // retrieves commit data, fills in any days without commits with 0 commits on the day
  // returns a list of dates and a cooresponding list of counts 
  const prepLineData = () => {
    function addDays(date: Date, days: number): Date {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    }

    const dates = Array.from(commitsPerDay.keys());
    if (submission) {
      const today = new Date()
      today.setUTCHours(0)
      today.setUTCMinutes(0)
      today.setUTCSeconds(0)

      if (dates.length < 1) {
        setNoCommits(true)
        return {}
      } else if (dates.length === 1 ){
        setNotEnoughData(true)
        setLoadingAllCommits(false)
        return {}
      } else if (dates[dates.length - 1].toDateString() !== (today.toDateString())) {
        dates.push(today)
      }
    }

    const minDate = new Date(Math.min(...dates.map(date => date.getTime())));
    const maxDate = new Date(Math.max(...dates.map(date => date.getTime())));

    let currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
      if (!commitsPerDay.has(currentDate)) {
        commitsPerDay.set(currentDate, 0);
      }
      currentDate = addDays(currentDate, 1);
    }

    const sortedEntries = Array.from(commitsPerDay.entries()).sort(
      (a, b) => a[0].getTime() - b[0].getTime()
    );
    const sortedCommitsPerDay = new Map(sortedEntries);

    if (sortedEntries.keys.length > 0) {
      setLoadingAllCommits(false)
    }

    const sortedDates = Array.from(sortedCommitsPerDay.keys());
    const sortedCounts = Array.from(sortedCommitsPerDay.values());

    const sortedDatesStrings = Array.from(sortedDates.map((a) => `${a.getUTCMonth() + 1}/${a.getUTCDate()}`))
    if (sortedDatesStrings.length > 0) {
      setLoadingAllCommits(false)
    }

    return { sortedDatesStrings, sortedCounts }
  }

  // useEffect for line chart 
  useEffect(() => {
    if (commitsPerDay) {

      const lineInformation  = prepLineData()
      const dates = lineInformation.sortedDatesStrings!
      const counts = lineInformation.sortedCounts!

      if (dates && counts) {
        
        if (dates.length > 0 && counts.length > 0) {
          const lineData = {
            labels: dates,
            datasets: [
              {
                data: counts,
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
      }
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
            <Metric title="Commits Over Time" className="Metric__bigContent">

              <div>
                {noCommits && (
                  <div>N/A</div>
                )}

                {!noCommits && notEnoughData &&
                  <div> Insufficient Data </div>
                }

                {!noCommits && loadingAllCommits &&
                  <div>Loading...</div>
                }

                {lineData && lineOptions && !noCommits && !loadingAllCommits && (
                  <Line className="StudentSubmission__commitsOverTimeChart"
                    options={lineOptions}
                    data={lineData}
                    redraw={false}
                  />
                )}
              </div>

            </Metric>
        </MetricPanel>

        <div>{ }</div>
      </div>
    </div>
  );
};

export default StudentSubmission;
