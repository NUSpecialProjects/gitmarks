import { useState, useEffect, useContext } from "react";
import Prism from "prismjs";
import SimpleBar from "simplebar-react";

import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import {
  ext2lang,
  extractExtension,
  ext2langLoader,
  dependencies,
} from "@/utils/prism-lang-loader";
import { getFileBlob } from "@/api/grader";
import { GraderContext } from "@/contexts/grader";
import CodeLine from "./CodeLine";

import "@/assets/prism-vs-dark.css";
import "./styles.css";

interface ICodeBrowser extends React.HTMLProps<HTMLDivElement> {
  file: IFileTreeNode | null;
}

const CodeBrowser: React.FC<ICodeBrowser> = ({ file, className, ...props }) => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const { assignment, studentWork } = useContext(GraderContext);

  const [fileContents, setFileContents] = useState<React.ReactNode>();
  const [cachedFileContents, setCachedFileContents] = useState<
    Record<string, React.ReactNode>
  >({});

  // get file contents
  useEffect(() => {
    if (!selectedClassroom || !assignment || !studentWork || !file) return;

    // Check if the content is already cached
    if (file.sha in cachedFileContents) {
      setFileContents(cachedFileContents[file.sha]);
      return;
    }

    (async () => {
      if (!selectedClassroom || !assignment || !studentWork) return;
      let wrapped: React.ReactNode;
      try {
        const blob = await getFileBlob(
          selectedClassroom.id,
          Number(assignment.id),
          Number(studentWork.student_work_id),
          file.sha
        );

        const highlighted = await highlightCode(blob);
        wrapped = await wrapCode(highlighted);
      } catch {
        wrapped = <></>;
      } finally {
        setFileContents(wrapped);
        setCachedFileContents((prev) => ({
          ...prev,
          [file.sha]: wrapped,
        }));
      }
    })();
  }, [assignment, studentWork, file]);

  // when a new file is selected, import any necessary
  // prismjs language syntax files and trigger a rehighlight
  const highlightCode = async (code: string) => {
    if (!file) return "";

    const lang = ext2lang[extractExtension(file.name)];
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

  const wrapCode = async (code: string) => {
    if (!file) return <></>;

    const lines = code.split("\n");

    // MEMOIZATION :D
    let memo = [];
    if (file.diff) {
      memo = Array(lines.length).fill(0);
      for (const diff of file.diff) {
        memo[diff.start - 1]++;
        memo[diff.end - 1]--;
      }
    }

    const wrappedLines: React.ReactNode[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (file.diff && memo && i > 0) memo[i] += memo[i - 1];
      wrappedLines.push(
        <CodeLine
          key={i}
          path={file.path}
          line={i + 1}
          isDiff={(file.diff && memo && memo[i] > 0) ?? false}
          code={lines[i]}
        />
      );
    }

    return <>{wrappedLines}</>;
  };

  return (
    <div
      className={"CodeBrowser" + (className ? " " + className : "")}
      {...props}
    >
      <SimpleBar className="scrollable">
        <pre>
          <code
            data-diff={JSON.stringify(file?.diff ?? "")}
            className={
              file
                ? "language-" + ext2lang[extractExtension(file.name)]
                : "language-undefined"
            }
          >
            {file ? (
              fileContents
            ) : (
              <div style={{ gridColumn: "span 2" }}>
                Select a file to view its contents.
              </div>
            )}
          </code>
        </pre>
      </SimpleBar>
    </div>
  );
};

export default CodeBrowser;
