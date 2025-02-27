import { useContext, useEffect } from "react";
import SimpleBar from "simplebar-react";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { useFileContents } from "@/hooks/useGrader";
import CodeLine from "./CodeLine";
import { useQueryClient } from "@tanstack/react-query";

import "@/assets/prism-vs-dark.css";
import "./styles.css";

interface ICodeBrowser extends React.HTMLProps<HTMLDivElement> {
  assignmentID: string | undefined;
  studentWorkID: string | undefined;
  file: IFileTreeNode | null;
  loading: boolean;
  error?: string;
}

const CodeBrowser: React.FC<ICodeBrowser> = ({
  assignmentID,
  studentWorkID,
  file,
  className,
  loading,
  error
}) => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const queryClient = useQueryClient();
  
  // Convert IDs to numbers
  const classroomId = selectedClassroom?.id;
  const assignmentIdNum = assignmentID ? Number(assignmentID) : undefined;
  const studentWorkIdNum = studentWorkID ? Number(studentWorkID) : undefined;
  
  // Invalidate file contents cache when studentWorkID changes
  useEffect(() => {
    // Invalidate all file content queries when student work changes
    queryClient.invalidateQueries({
      queryKey: ['fileContents', classroomId, assignmentIdNum, studentWorkIdNum]
    });
  }, [studentWorkID, queryClient, classroomId, assignmentIdNum, studentWorkIdNum]);
  
  // Use our custom hook to fetch and process file contents
  const { 
    data: fileData, 
    isLoading: isLoadingFile, 
    isError, 
    error: fileError
  } = useFileContents(
    classroomId,
    assignmentIdNum,
    studentWorkIdNum,
    file
  );

  return (
    <div className="CodeBrowser">
      <div className={"CodeBrowser" + (className ? " " + className : "")}>
        <SimpleBar className="scrollable">
          {error ? (
            <div className="CodeBrowser__message">
              <div className="CodeBrowser__error">{error}</div>
            </div>
          ) :loading ? (
            <div className="CodeBrowser__message">
              <div className="CodeBrowser__loading">Loading student assignment...</div>
            </div>
          ) : !file ? (
            <div className="CodeBrowser__message">
              Select a file to view its contents.
            </div>
          ) : (isLoadingFile) ? (
            <div className="CodeBrowser__message">
              <div className="CodeBrowser__loading">Loading file contents...</div>
            </div>
          ) : isError ? (
            <div className="CodeBrowser__message">
              <div className="CodeBrowser__error">
                Error loading file: {fileError?.message || 'Unknown error'}
              </div>
            </div>
          ) : !fileData || !fileData.lines ? (
            <div className="CodeBrowser__message">
              <div className="CodeBrowser__empty">No content available</div>
            </div>
          ) : (
            <pre>
              <code
                data-diff={JSON.stringify(file?.diff ?? "")}
                className={
                  file && fileData
                    ? "language-" + fileData.language
                    : "language-undefined"
                }
              >
                {fileData.lines.map((line, i) => (
                  <CodeLine
                    key={`${studentWorkID}-${file.path}-${i}`}
                    path={file.path}
                    line={i + 1}
                    isDiff={(file.diff && fileData.memo && fileData.memo[i] > 0) ?? false}
                    code={line}
                  />
                ))}
              </code>
            </pre>
          )}
        </SimpleBar>
      </div>
    </div>
  );
};

export default CodeBrowser;
