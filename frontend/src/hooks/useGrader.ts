import { useQuery } from '@tanstack/react-query';
import { getFileBlob } from '@/api/grader';
import { getFileTree } from '@/api/grader';
import { getAssignmentRubric } from '@/api/assignments';
import { getPaginatedStudentWork } from '@/api/student_works';
import { extractExtension } from '@/utils/prism-lang-loader';
import { dependencies } from '@/utils/prism-lang-loader';
import { ext2lang, ext2langLoader } from '@/utils/prism-lang-loader';
import Prism from 'prismjs';

// Helper function to highlight code with Prism
const highlightCode = async (code: string, fileName: string) => {
  const lang = ext2lang[extractExtension(fileName)];
  try {
    const deps: string | string[] = dependencies[lang];
    if (deps) {
      if (typeof deps === "string") {
        await ext2langLoader[deps]();
      }
      if (Array.isArray(deps)) {
        for (const dep of deps) {
          await ext2langLoader[dep]();
        }
      }
    }
    await ext2langLoader[lang]();
  } catch {
    // Prism does not support language or mapping does not exist
    return code;
  }
  return Prism.highlight(code, Prism.languages[lang], lang);
};

// Hook for fetching file tree
export const useFileTree = (
  classroomId: number | undefined,
  assignmentId: number | undefined,
  studentWorkId: number | undefined
) => {
  return useQuery({
    queryKey: ['fileTree', classroomId, assignmentId, studentWorkId],
    queryFn: async () => {
      if (!classroomId || !assignmentId || !studentWorkId) {
        throw new Error('Missing required parameters for file tree');
      }
      return await getFileTree(classroomId, assignmentId, studentWorkId);
    },
    enabled: !!classroomId && !!assignmentId && !!studentWorkId,
    staleTime: 0
  });
};

// Hook for fetching student work with pagination
export const usePaginatedStudentWork = (
  classroomId: number | undefined,
  assignmentId: number | undefined,
  studentWorkId: number | undefined
) => {
  return useQuery({
    queryKey: ['paginatedStudentWork', classroomId, assignmentId, studentWorkId],
    queryFn: async () => {
      if (!classroomId || !assignmentId || !studentWorkId) {
        throw new Error('Missing required parameters for student work');
      }
      return await getPaginatedStudentWork(classroomId, assignmentId, studentWorkId);
    },
    enabled: !!classroomId && !!assignmentId && !!studentWorkId,
    staleTime: 0
  });
};

// Hook for fetching assignment rubric
export const useAssignmentRubric = (
  classroomId: number | undefined,
  assignmentId: number | undefined
) => {
  return useQuery({
    queryKey: ['assignmentRubric', classroomId, assignmentId],
    queryFn: async () => {
      if (!classroomId || !assignmentId) {
        throw new Error('Missing required parameters for assignment rubric');
      }
      return await getAssignmentRubric(classroomId, assignmentId);
    },
    enabled: !!classroomId && !!assignmentId,
    staleTime: 0
  });
};

// // Hook for fetching file contents
// export const useFileContents = (
//   classroomId: number | undefined,
//   assignmentId: number | undefined,
//   studentWorkId: number | undefined,
//   file: IFileTreeNode | null
// ) => {
//   return useQuery({
//     queryKey: ['fileContents', classroomId, assignmentId, studentWorkId, file?.sha],
//     queryFn: async () => {
//       if (!classroomId || !assignmentId || !studentWorkId || !file) {
//         throw new Error('Missing required parameters for file contents');
//       }
      
//       const blob = await getFileBlob(
//         classroomId,
//         assignmentId,
//         studentWorkId,
//         file.sha
//       );
      
//       return {
//         content: blob,
//         path: file.path,
//         sha: file.sha,
//         diff: file.diff
//       };
//     },
//     enabled: !!classroomId && !!assignmentId && !!studentWorkId && !!file,
//     staleTime: 5 * 60 * 1000, // 5 minutes
//   });
// };

// Custom hook for fetching and processing file contents
export const useFileContents = (
  classroomId: number | undefined,
  assignmentId: number | undefined,
  studentWorkId: number | undefined,
  file: IFileTreeNode | null
) => {
  return useQuery({
    queryKey: ['fileContents', classroomId, assignmentId, studentWorkId, file?.sha],
    queryFn: async () => {
      if (!classroomId || !assignmentId || !studentWorkId || !file) {
        throw new Error('Missing required parameters');
      }

      // Fetch the raw file blob
      const blob = await getFileBlob(
        classroomId,
        assignmentId,
        studentWorkId,
        file.sha
      );

      // Highlight the code
      const highlighted = await highlightCode(blob, file.name);

      // Split into lines for rendering
      const lines = highlighted.split('\n');

      // Process diff information
      let memo = [];
      if (file.diff) {
        memo = Array(lines.length).fill(0);
        for (const diff of file.diff) {
          memo[diff.start - 1]++;
          memo[diff.end - 1]--;
        }
      }

      // Return processed data
      return {
        lines,
        memo,
        language: ext2lang[extractExtension(file.name)]
      };
    },
    enabled: !!classroomId && !!assignmentId && !!studentWorkId && !!file,
    staleTime: 0,
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};
