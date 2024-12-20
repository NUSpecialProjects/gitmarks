/********************
 * Grading page types
 ********************/
interface IGraderFeedbackMap {
  [commentID: number]: IGraderFeedback;
}
interface IGraderFeedback {
  action?: "CREATE" | "EDIT" | "DELETE";
  rubric_item_id?: number;
  feedback_comment_id?: number;
  path: string;
  line: number;
  body: string;
  points: number;
  ta_username?: string;
  history?: IGraderFeedback[];
  created_at?: Date;
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
