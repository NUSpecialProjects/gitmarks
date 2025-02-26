import { useContext } from "react";
import SimpleBar from "simplebar-react";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { useFileContents } from "@/hooks/useFileContents";
import CodeLine from "./CodeLine";

import "@/assets/prism-vs-dark.css";
import "./styles.css";

interface ICodeBrowser extends React.HTMLProps<HTMLDivElement> {
  assignmentID: string | undefined;
  studentWorkID: string | undefined;
  file: IFileTreeNode | null;
}

const CodeBrowser: React.FC<ICodeBrowser> = ({
  assignmentID,
  studentWorkID,
  file,
  className,
  ...props
}) => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  
  // Use our custom hook to fetch and process file contents
  const { 
    data: fileData, 
    isLoading, 
    isError, 
    error 
  } = useFileContents(
    selectedClassroom?.id,
    assignmentID ? Number(assignmentID) : undefined,
    studentWorkID ? Number(studentWorkID) : undefined,
    file
  );

  return (
    <div
      className={"CodeBrowser" + (className ? " " + className : "")}
      {...props}
    >
      <SimpleBar className="scrollable">
        {!file ? (
          <div className="CodeBrowser__message">
            Select a file to view its contents.
          </div>
        ) : isLoading ? (
          <div className="CodeBrowser__message">
            <div className="CodeBrowser__loading">Loading file contents...</div>
          </div>
        ) : isError ? (
          <div className="CodeBrowser__message">
            <div className="CodeBrowser__error">
              Error loading file: {error?.message || 'Unknown error'}
            </div>
          </div>
        ) : !fileData ? (
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
                  key={i}
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
  );
};

export default CodeBrowser;
