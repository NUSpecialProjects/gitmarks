import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import {
  getAssignmentIndirectNav,
  getAssignments,
  getAssignmentTemplate,
  getAssignmentTotalCommits,
  postAssignmentToken,
} from "@/api/assignments";
import {
  getAssignmentAcceptanceMetrics,
  getAssignmentGradedMetrics,
} from "@/api/metrics";
import { getStudentWorks } from "@/api/student_works";
import { ChartData } from 'chart.js';
import { getOrganizationTemplates } from "@/api/organizations";

/**
 * Provides the list of assignments for a classroom.
 * 
 * @param classroomId - The ID of the classroom to fetch assignments for.
 * @returns The list of assignments for the classroom.
 */
export const useAssignmentsList = (classroomId: number | undefined) => {
  const {
    data: assignments = [],
    error,
    isLoading
  } = useQuery<IAssignmentOutline[]>({
    queryKey: ['assignments', classroomId],
    queryFn: () => {
      if (!classroomId) {
        throw new Error('No classroom selected');
      }
      return getAssignments(classroomId);
    },
    enabled: !!classroomId,
  });

  return {
    assignments,
    error,
    loading: isLoading
  };
};

/**
 * Provides a single assignment
 * 
 * @param classroomId - The ID of the classroom to fetch the assignment for.
 * @param assignmentId - The ID of the assignment to fetch.
 * @returns The assignment for the classroom.
 */
export const useAssignment = (classroomId: number | undefined, assignmentId: number | undefined) => {
  const location = useLocation();

  return useQuery({
    queryKey: ['assignment', classroomId, assignmentId],
    queryFn: async () => {
      if (!classroomId || !assignmentId) return null;
      if (location.state?.assignment) {
        return location.state.assignment;
      }
      return await getAssignmentIndirectNav(classroomId, assignmentId);
    },
    enabled: !!classroomId && !!assignmentId
  });
};

export const useStudentWorks = (classroomId: number | undefined, assignmentId: number | undefined) => {
  return useQuery({
    queryKey: ['studentWorks', classroomId, assignmentId],
    queryFn: async () => {
      if (!classroomId || !assignmentId) return [];
      return await getStudentWorks(classroomId, assignmentId);
    },
    enabled: !!classroomId && !!assignmentId,
  });
};

/**
 * Provides an invite link for an assignment.
 * 
 * @param classroomId - The ID of the classroom to fetch the invite link for.
 * @param assignmentId - The ID of the assignment to fetch the invite link for.
 * @param baseUrl - The base URL to use for the invite link.
 * @param expirationDuration - The expiration duration to use for the invite link.
 * @returns The invite link for the assignment.
 */
export const useAssignmentInviteLink = (classroomId: number | undefined, assignmentId: number | undefined, baseUrl: string, expirationDuration: number | undefined = undefined) => {
  return useQuery({
    queryKey: ['assignmentToken', classroomId, assignmentId, expirationDuration],
    queryFn: async () => {
      if (!classroomId || !assignmentId) return "";
      const tokenData = await postAssignmentToken(classroomId, assignmentId, expirationDuration);
      return `${baseUrl}/token/assignment/accept?token=${tokenData.token}`;
    },
    enabled: !!classroomId && !!assignmentId
  });
};

/**
 * Provides a template assignment
 * 
 * @param classroomId - The ID of the classroom to fetch the template for.
 * @param assignmentId - The ID of the assignment to fetch the template for.
 * @returns The assignment template.
 */
export const useAssignmentTemplate = (classroomId: number | undefined, assignmentId: number | undefined) => {
  return useQuery({
    queryKey: ['assignmentTemplate', classroomId, assignmentId],
    queryFn: async () => {
      if (!classroomId || !assignmentId) return null;
      return await getAssignmentTemplate(classroomId, assignmentId);
    },
    enabled: !!classroomId && !!assignmentId
  });
};

/**
 * Provides template repositories for an organization
 * 
 * @param orgName - The name of the organization to fetch templates for
 * @returns The template repositories and loading state
 */
export const useTemplateRepos = (orgName: string | undefined) => {
  return useQuery({
    queryKey: ['templateRepos', orgName],
    queryFn: async () => {
      if (!orgName) return [];
      // TODO: KHO-211 Implement dynamic pagination in template dropdown
      const response = await getOrganizationTemplates(orgName, "100", "1");
      return response.templates;
    },
    enabled: !!orgName,
    initialData: [] as ITemplateRepo[]
  });
};

/**
 * Provides the number of commits made for this assignment
 * 
 * @param classroomId - The ID of the classroom to fetch the template for.
 * @param assignmentId - The ID of the assignment to fetch the template for.
 * @returns The the number of commits made for this assignment.
 */
export const useAssignmentTotalCommits = (classroomId: number | undefined, assignmentId: number | undefined) => {
  return useQuery({
    queryKey: ['totalAssignmentCommits', classroomId, assignmentId],
    queryFn: async () => {
      if (!classroomId || !assignmentId) return null;
      console.log("called...")
      return await getAssignmentTotalCommits(classroomId, assignmentId);
    },
    enabled: !!classroomId && !!assignmentId
  });
};

/**
 * Provides the acceptance metrics for an assignment.
 * 
 * @param classroomId - The ID of the classroom to fetch the acceptance metrics for.
 * @param assignmentId - The ID of the assignment to fetch the acceptance metrics for.
 * @returns The acceptance metrics for the assignment.
 */
export const useAssignmentMetrics = (classroomId: number | undefined, assignmentId: number | undefined) => {
  const { data: acceptanceData } = useQuery({
    queryKey: ['acceptanceMetrics', classroomId, assignmentId],
    queryFn: async () => {
      if (!classroomId || !assignmentId) return { data: null, error: new Error('Missing classroom or assignment ID') };
      try {
        const metrics = await getAssignmentAcceptanceMetrics(classroomId, Number(assignmentId));
        return {
          data: {
            labels: ["Not Accepted", "Accepted", "Started", "Submitted", "Graded"],
            datasets: [{
              backgroundColor: ["#f83b5c", "#50c878", "#fece5a", "#7895cb", "#219386"],
              data: [metrics.not_accepted, metrics.accepted, metrics.started, metrics.submitted, metrics.in_grading]
            }]
          } as ChartData<'bar', number[], unknown>,
          error: null
        };
      } catch (_) {
        return { data: null, error: new Error(`Failed to fetch acceptance metrics`) };
      }
    },
    enabled: !!classroomId && !!assignmentId
  });

  const { data: gradedData } = useQuery({
    queryKey: ['gradedMetrics', classroomId, assignmentId],
    queryFn: async () => {
      if (!classroomId || !assignmentId) return { data: null, error: new Error('Missing classroom or assignment ID') };
      try {
        const metrics = await getAssignmentGradedMetrics(classroomId, Number(assignmentId));
        return {
          data: {
            labels: ["Graded", "Ungraded"],
            datasets: [{
              backgroundColor: ["#219386", "#e5e7eb"],
              data: [metrics.graded, metrics.ungraded]
            }]
          } as ChartData<'doughnut', number[], unknown>,
          error: null
        };
      } catch (_) {
        return { data: null, error: new Error('Failed to fetch graded metrics') };
      }
    },
    enabled: !!classroomId && !!assignmentId
  });

  return {
    acceptanceMetrics: acceptanceData?.data || {
      labels: [],
      datasets: [{ backgroundColor: [], data: [] }]
    } as ChartData<'bar', number[], unknown>,
    gradedMetrics: gradedData?.data || {
      labels: [],
      datasets: [{ backgroundColor: [], data: [] }]
    } as ChartData<'doughnut', number[], unknown>,
    error: acceptanceData?.error || gradedData?.error
  };
};