import { useContext, useRef, Dispatch, SetStateAction, useEffect } from "react";

import { AuthContext } from "@/contexts/auth";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { GraderContext } from "@/contexts/grader";
import Button from "@/components/Button";

import "./styles.css";

interface ICodeComment {
  fb: IGraderFeedback;
  pending?: boolean;
}

export const CodeComment: React.FC<ICodeComment> = ({
  fb,
  pending = false,
}) => {
  const { currentUser } = useContext(AuthContext);

  return (
    <div className="CodeComment">
      <div className="CodeComment__head">
        <div>
          <img src={currentUser?.avatar_url} alt="new" />
          {fb.ta_username}
          {pending && <div className="CodeComment__pendingPill">Pending</div>}
        </div>
      </div>
      <div className="CodeComment__body">
        <div
          className={`CodeComment__points CodeComment__points--${fb.points > 0 ? "positive" : fb.points < 0 ? "negative" : "neutral"}`}
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

interface ICodeCommentForm {
  path: string;
  line: number;
  setEditing: Dispatch<SetStateAction<boolean>>;
}

export const CodeCommentForm: React.FC<ICodeCommentForm> = ({
  path,
  line,
  setEditing,
}) => {
  const { addFeedback } = useContext(GraderContext);
  const { selectedClassroom } = useContext(SelectedClassroomContext);
  const { currentUser } = useContext(AuthContext);

  const form = useRef<HTMLDivElement>(null);
  const points = useRef<HTMLInputElement>(null);

  const adjustPoints = (x: number) => {
    if (!points.current) return;
    const pts = points.current.value;
    points.current.value = (parseInt(pts, 10) + x).toString();
  };

  const handleAddFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedClassroom) return;

    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const fb: IGraderFeedback = {
      path,
      line,
      body: String(data.get("comment")).trim(),
      points: Number(data.get("points")),
      ta_username: currentUser.login,
    };
    if (fb.points == 0 && fb.body == "") return;
    if (fb.body == "") fb.body = "No comment left for this point adjustment.";
    addFeedback([fb]);
    setEditing(false);
    form.reset();
  };

  useEffect(() => {
    if (form.current) {
      form.current.scrollIntoView();
    }
  }, []);

  return (
    <div className="CodeComment" ref={form}>
      <form className="CodeCommentForm" onSubmit={handleAddFeedback}>
        <div className="CodeCommentForm__points">
          <label htmlFor="points">Point Adjustment</label>
          <input
            ref={points}
            id="points"
            type="number"
            name="points"
            defaultValue={0}
          />
          <div className="CodeCommentForm__points__spinners">
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
        <div className="CodeCommentForm__buttons">
          <Button
            className="CodeCommentForm__buttons--cancel"
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
  );
};
