/********************
 * Grading page types
 ********************/
enum IGraderActionEnum {
  CREATE,
  EDIT,
  DELETE,
}
type IGraderAction = keyof typeof IGraderActionEnum;

interface IGraderFeedbackMap {
  [commentID: number]: IGraderFeedbackWithHistory;
}
interface IGraderFeedback {
  action?: IGraderAction;
  rubric_item_id?: number;
  feedback_comment_id?: number;
  github_comment_id?: number;
  path: string;
  line: number;
  body: string;
  points: number;
  ta_username?: string;
  created_at?: Date;
  deleted: boolean;
}
interface IGraderFeedbackWithHistory extends IGraderFeedback {
  history?: IGraderFeedbackWithHistory[];
}

/******************************
 * GitHub response object types
 ******************************/
interface IGitDiff {
  start: number;
  end: number;
}
interface IGitTreeNode {
  status: {
    status: string;
    diff: IGitDiff[] | null;
  };
  entry: {
    type: string;
    path: string;
    sha: string;
    status: string;
  };
}

interface IGitTreeResponse {
  tree: IGitTreeNode[];
}
