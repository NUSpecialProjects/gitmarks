import { useQuery } from '@tanstack/react-query';
import { getFileBlob } from '@/api/grader';
import { ext2lang, extractExtension, ext2langLoader, dependencies } from '@/utils/prism-lang-loader';
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

// Custom hook for fetching and processing file contents
export const useFileContents = (
  classroomId: number | undefined,
  assignmentId: number | undefined,
  studentWorkId: number | undefined,
  file: IFileTreeNode | null
) => {
  // Define a query key that includes all dependencies
  const queryKey = ['fileContents', classroomId, assignmentId, studentWorkId, file?.sha];

  return useQuery({
    queryKey,
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
    staleTime: Infinity, // File contents won't change during a session
    gcTime: 30 * 60 * 1000, // Cache for 30 minutes
  });
};
