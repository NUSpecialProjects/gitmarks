import { useContext, useEffect, useState } from "react";

import { GraderContext } from "@/contexts/grader";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";

import { CodeComment, CodeCommentForm } from "./CodeComment";
import { AuthContext } from "@/contexts/auth";

import "./styles.css";

interface ICodeLine {
  path: string;
  line: number;
  isDiff: boolean;
  code: string;
}

const CodeLine: React.FC<ICodeLine> = ({ path, line, isDiff, code }) => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const { currentUser } = useContext(AuthContext);
  const { feedback, stagedFeedback, rubric, selectedRubricItems, addFeedback } =
    useContext(GraderContext);
  const [editing, setEditing] = useState(false);
  const [feedbackExists, setFeedbackExists] = useState(false);
  const [stagedFeedbackExists, setStagedFeedbackExists] = useState(false);

  useEffect(() => {
    setEditing(false);
  }, [path]);

  useEffect(() => {
    setFeedbackExists(
      feedback &&
        Object.values(feedback).some(
          (fb) => fb.path === path && fb.line === line
        )
    );
  }, [path, feedback]);

  useEffect(() => {
    setStagedFeedbackExists(
      stagedFeedback &&
        Object.values(stagedFeedback).some(
          (fb) => fb.path === path && fb.line === line
        )
    );
  }, [path, stagedFeedback]);

  const attachRubricItems = (riIDs: number[]) => {
    if (!currentUser || !selectedClassroom || !rubric) return;

    const feedback = rubric.rubric_items.reduce(
      (selected: IGraderFeedback[], ri: IRubricItem) => {
        if (riIDs.includes(ri.id!)) {
          selected.push({
            rubric_item_id: ri.id!,
            path,
            line,
            body: ri.explanation,
            points: ri.point_value ?? 0,
            ta_username: currentUser.login,
          });
        }
        return selected;
      },
      []
    );

    addFeedback(feedback);
    setEditing(false);
  };

  return (
    <>
      <div className={`CodeLine${isDiff ? " CodeLine--diff" : ""}`}>
        <div className="CodeLine__number">
          {line}
          {isDiff && (
            <div
              className="CodeLine__newCommentButton"
              onClick={() => {
                if (selectedRubricItems.length == 0) {
                  setEditing(!editing);
                } else {
                  attachRubricItems(selectedRubricItems);
                }
              }}
            >
              +
            </div>
          )}
        </div>
        <div
          className="CodeLine__content"
          dangerouslySetInnerHTML={{ __html: code }}
        ></div>
      </div>
      {(editing || feedbackExists || stagedFeedbackExists) && (
        <div className="CodeLine__comments">
          {/************ Display any existing comments *************/}
          {feedbackExists &&
            Object.entries(feedback).map(
              ([i, fb]: [string, IGraderFeedback]) =>
                fb.path == path &&
                fb.line == line && (
                  <CodeComment
                    fb={fb}
                    localFeedbackID={Number(i)}
                    key={Number(i)}
                    pending={fb.action == "EDIT"}
                  />
                )
            )}

          {stagedFeedbackExists &&
            Object.entries(stagedFeedback).map(
              ([i, fb]: [string, IGraderFeedback]) =>
                fb.path == path &&
                fb.line == line &&
                fb.action == "CREATE" && (
                  <CodeComment
                    fb={fb}
                    localFeedbackID={Number(i)}
                    key={Number(i)}
                    pending
                  />
                )
            )}

          {/************ Display form to create new comment *************/}
          {editing && (
            <div className="CodeComment">
              <CodeCommentForm
                path={path}
                line={line}
                onCancel={() => setEditing(false)}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CodeLine;
