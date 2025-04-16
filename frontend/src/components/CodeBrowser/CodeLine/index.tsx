import { useContext, useEffect, useRef, useState } from "react";

import { GraderContext } from "@/contexts/grader";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";

import "./styles.css";
import Button from "@/components/Button";
import { useAuth } from "@/contexts/auth";

interface ICodeFeedback {
  fb: IGraderFeedback;
  pending?: boolean;
}

const CodeFeedback: React.FC<ICodeFeedback> = ({ fb, pending = false }) => {
  const { currentUser } = useAuth();

  return (
    <div className="CodeLine__comment">
      <div className="CodeLine__commentHead">
        <img src={currentUser?.github_user?.avatar_url} alt="new" />
        {fb.ta_username}
        {pending && <div className="CodeLine__commentPending">Pending</div>}
      </div>
      <div className="CodeLine__commentBody">
        <div
          className={`CodeLine__commentPoints CodeLine__commentPoints--${fb.points > 0 ? "positive" : fb.points < 0 ? "negative" : "neutral"}`}
        >
          {fb.points == 0
            ? "Comment"
            : fb.points > 0
              ? `+${fb.points}`
              : fb.points}
        </div>
        {fb.body}
      </div>
    </div>
  );
};

interface ICodeLine {
  path: string;
  line: number;
  isDiff: boolean;
  code: string;
}

const CodeLine: React.FC<ICodeLine> = ({ path, line, isDiff, code }) => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const { currentUser } = useAuth();
  const {
    assignmentID,
    studentWorkID,
    feedback,
    stagedFeedback,
    rubric,
    selectedRubricItems,
    addFeedback,
  } = useContext(GraderContext);
  const [editing, setEditing] = useState(false);
  const points = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditing(false);
  }, [path]);

  const feedbackExists = feedback && Object.values(feedback).some(
    (fb) => fb.path === path && fb.line === line
  );

  const stagedFeedbackExists = stagedFeedback && Object.values(stagedFeedback).some(
    (fb) => fb.path === path && fb.line === line
  );

  const adjustPoints = (x: number) => {
    if (!points.current) return;
    const pts = points.current.value;
    points.current.value = (parseInt(pts, 10) + x).toString();
  };

  const handleAddFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedClassroom || !assignmentID || !studentWorkID)
      return;

    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const fb: IGraderFeedback = {
      path,
      line,
      body: String(data.get("comment")).trim(),
      points: Number(data.get("points")),
      ta_username: currentUser.github_user.login,
    };
    if (fb.points == 0 && fb.body == "") return;
    if (fb.body == "") fb.body = "No comment left for this point adjustment.";
    addFeedback([fb]);
    setEditing(false);
    form.reset();
  };

  const attachRubricItems = (riIDs: number[]) => {
    if (
      !currentUser ||
      !selectedClassroom ||
      !assignmentID ||
      !studentWorkID ||
      !rubric
    )
      return;

    const feedback = rubric.rubric_items.reduce(
      (selected: IGraderFeedback[], ri: IRubricItem) => {
        if (riIDs.includes(ri.id!)) {
          selected.push({
            rubric_item_id: ri.id!,
            path,
            line,
            body: ri.explanation,
            points: ri.point_value ?? 0,
            ta_username: currentUser.github_user.login,
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
          {/************ Display form to create new comment *************/}
          {editing && (
            <div className="CodeLine__comment">
              <form
                className="CodeLine__newCommentForm"
                onSubmit={handleAddFeedback}
              >
                <div className="CodeLine__newCommentPoints">
                  <label htmlFor="points">Point Adjustment</label>
                  <input
                    ref={points}
                    id="points"
                    type="number"
                    name="points"
                    defaultValue={0}
                  />
                  <div className="CodeLine__newCommentPoints__spinners">
                    <div
                      tabIndex={0}
                      onClick={() => {
                        adjustPoints(1);
                      }}
                    >
                      +
                    </div>
                    <div
                      tabIndex={0}
                      onClick={() => {
                        adjustPoints(-1);
                      }}
                    >
                      -
                    </div>
                  </div>
                </div>

                <textarea name="comment" placeholder="Leave a comment" />
                <div className="CodeLine__newCommentButtons">
                  <Button
                    className="CodeLine__newCommentCancel"
                    onClick={(e) => {
                      e.preventDefault();
                      setEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </div>
          )}

          {/************ Display any existing comments *************/}
          {stagedFeedbackExists &&
            Object.entries(stagedFeedback).reverse().map(
              ([i, fb]) =>
                fb.path == path &&
                fb.line == line && (
                  <CodeFeedback fb={fb} key={Number(i)} pending />
                )
            )}
          {feedbackExists &&
            Object.entries(feedback).reverse().map(
              ([i, fb]) =>
                fb.path == path &&
                fb.line == line && <CodeFeedback fb={fb} key={Number(i)} />
            )}
        </div>
      )}
    </>
  );
};

export default CodeLine;
