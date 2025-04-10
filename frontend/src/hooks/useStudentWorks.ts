import { useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { getFirstCommit, getStudentWorkById, getStudentWorkCommitsPerDay, getStudentWorks, getTotalCommits } from "@/api/student_works";
import { formatDate } from "@/utils/date";
import { ChartData, ChartOptions, Point } from "chart.js";

/**
 * Provides the student works for an assignment.
 * 
 * @param classroomId - The ID of the classroom to fetch the student works for.
 * @param assignmentId - The ID of the assignment to fetch the student works for.
 * @param enabled - Manually enable or disable the query.
 * @returns The student works for the assignment.
 */
export const useStudentWorks = (
  classroomId: number | undefined,
  assignmentId: number | undefined,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['studentWorks', classroomId, assignmentId],
    queryFn: () => getStudentWorks(classroomId!, assignmentId!),
    enabled: !!classroomId && !!assignmentId && enabled,
  });
}; 

/**
 * Fetches the student work data for a given student work id
 * @param classroomId - The id of the classroom
 * @param assignmentId - The id of the assignment
 * @param studentWorkId - The id of the student work
 * @returns The student work data
 */
export const useStudentWork = (
  classroomId: number | undefined,
  assignmentId: number | undefined,
  studentWorkId: number | undefined
): UseQueryResult<IStudentWork | null> => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['studentWork', classroomId, assignmentId, studentWorkId],
    queryFn: async () => {
      if (!classroomId || !assignmentId || !studentWorkId) return null;

      // First try to find the student work in the cached list
      const cachedWorks = queryClient.getQueryData<IStudentWork[]>(['studentWorks', classroomId, assignmentId]);
      const cachedWork = cachedWorks?.find(work => work.student_work_id === studentWorkId);
      
      if (cachedWork) {
        return cachedWork;
      }

      // If not found in cache, fetch it directly
      return await getStudentWorkById(classroomId, assignmentId, studentWorkId);
    },
    enabled: !!classroomId && !!assignmentId && !!studentWorkId
  });
};

/**
 * Fetches the analytics data for a given student work id
 * @param classroomId - The id of the classroom
 * @param assignmentId - The id of the assignment
 * @param studentWorkId - The id of the student work
 * @returns The analytics data
 */
export const useStudentWorkAnalytics = (
  classroomId: number | undefined,
  assignmentId: number | undefined,
  studentWorkId: number | undefined
) => {
  const firstCommitQuery = useQuery({
    queryKey: ['firstCommit', classroomId, assignmentId, studentWorkId],
    queryFn: async () => {
      if (!classroomId || !assignmentId || !studentWorkId) return null;
      const commitDate = await getFirstCommit(classroomId, assignmentId, studentWorkId);
      return commitDate ? formatDate(commitDate) : "N/A";
    },
    enabled: !!classroomId && !!assignmentId && !!studentWorkId
  });

  const totalCommitsQuery = useQuery({
    queryKey: ['totalCommits', classroomId, assignmentId, studentWorkId],
    queryFn: async () => {
      if (!classroomId || !assignmentId || !studentWorkId) return null;
      const total = await getTotalCommits(classroomId, assignmentId, studentWorkId);
      return total?.toString() ?? "N/A";
    },
    enabled: !!classroomId && !!assignmentId && !!studentWorkId
  });

  const commitsPerDayQuery = useQuery({
    queryKey: ['commitsPerDay', classroomId, assignmentId, studentWorkId],
    queryFn: async () => {
      if (!classroomId || !assignmentId || !studentWorkId) return null;
      return await getStudentWorkCommitsPerDay(classroomId, assignmentId, studentWorkId);
    },
    enabled: !!classroomId && !!assignmentId && !!studentWorkId
  });

  const processCommitsData = (commitsPerDay: Map<Date, number> | null) => {
    if (!commitsPerDay) return { noCommits: true, notEnoughData: false, lineData: undefined, lineOptions: undefined };

    const dates = Array.from(commitsPerDay.keys());
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (dates.length < 1) {
      return { noCommits: true, notEnoughData: false, lineData: undefined, lineOptions: undefined };
    }

    if (dates.length === 1) {
      return { noCommits: false, notEnoughData: true, lineData: undefined, lineOptions: undefined };
    }

    // Add today if not present
    if (dates[dates.length - 1].toDateString() !== today.toDateString()) {
      dates.push(today);
    }

    // Fill in missing dates
    const minDate = new Date(Math.min(...dates.map(date => date.getTime())));
    const maxDate = new Date(Math.max(...dates.map(date => date.getTime())));

    let currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
      if (!commitsPerDay.has(currentDate)) {
        commitsPerDay.set(new Date(currentDate), 0);
      }
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }

    // Sort entries
    const sortedEntries = Array.from(commitsPerDay.entries())
      .sort((a, b) => a[0].getTime() - b[0].getTime());

    const sortedDates = sortedEntries.map(([date]) => 
      `${date.getUTCMonth() + 1}/${date.getUTCDate()}`
    );
    const sortedCounts = sortedEntries.map(([_, count]) => count);

    const lineData: ChartData<"line", (number | Point | null)[], unknown> = {
      labels: sortedDates,
      datasets: [{
        data: sortedCounts,
        borderColor: 'rgba(13, 148, 136, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.05,
      }],
    };

    const lineOptions: ChartOptions<"line"> = {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: false },
        datalabels: { display: false },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          grid: { display: false },
          ticks: { maxTicksLimit: 5 },
        },
      },
      elements: {
        point: { radius: 1 }
      },
    };

    return {
      noCommits: false,
      notEnoughData: false,
      lineData,
      lineOptions
    };
  };

  const commitsData = processCommitsData(commitsPerDayQuery.data ?? null);

  return {
    firstCommit: firstCommitQuery.data,
    totalCommits: totalCommitsQuery.data,
    commitsPerDay: commitsPerDayQuery.data ?? new Map(),
    ...commitsData,
    loadingAllCommits: commitsPerDayQuery.isLoading,
    isLoading: firstCommitQuery.isLoading || totalCommitsQuery.isLoading || commitsPerDayQuery.isLoading,
    error: firstCommitQuery.error || totalCommitsQuery.error || commitsPerDayQuery.error
  };
}; 