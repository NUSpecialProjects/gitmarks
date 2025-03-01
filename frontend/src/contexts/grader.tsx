import { createContext, useContext, useState, useEffect, useRef } from "react";
import { SelectedClassroomContext } from "./selectedClassroom";
import { gradeWork } from "@/api/grader";
import { 
  useFileTree, 
  usePaginatedStudentWork, 
  useAssignmentRubric 
} from "@/hooks/useGrader";
import { createUniqueKey, useLocalCachedState } from "@/hooks/useLocalStorage";

interface IGraderContext {
  assignmentID: string | undefined;
  studentWorkID: string | undefined;
  studentWork: IPaginatedStudentWork | null;
  selectedFile: IFileTreeNode | null;
  feedback: IGraderFeedbackMap;
  stagedFeedback: IGraderFeedbackMap;
  rubric: IFullRubric | null;
  selectedRubricItems: number[];
  fileTree: IGitTreeNode[] | null;
  loadingStudentWork: boolean;
  loadingGitTree: boolean;
  loadingRubric: boolean;
  dataRetrievalError: boolean;
  isSubmittingGrade: boolean;
  setSelectedFile: React.Dispatch<React.SetStateAction<IFileTreeNode | null>>;
  addFeedback: (feedback: IGraderFeedback[]) => void;
  editFeedback: (feedbackID: number, feedback: IGraderFeedback) => void;
  removeFeedback: (feedbackID: number) => void;
  postFeedback: () => void;
  selectRubricItem: (riID: number) => void;
  deselectRubricItem: (riID: number) => void;
}

export const GraderContext: React.Context<IGraderContext> =
  createContext<IGraderContext>({
    assignmentID: undefined,
    studentWorkID: undefined,
    studentWork: null,
    selectedFile: null,
    feedback: {},
    stagedFeedback: {},
    rubric: null,
    selectedRubricItems: [],
    fileTree: [],
    loadingStudentWork: true,
    loadingGitTree: true,
    loadingRubric: true,
    dataRetrievalError: false,
    isSubmittingGrade: false,
    setSelectedFile: () => {},
    addFeedback: () => 0,
    editFeedback: () => {},
    removeFeedback: () => {},
    postFeedback: () => {},
    selectRubricItem: () => {},
    deselectRubricItem: () => {},
  });

export const GraderProvider: React.FC<{
  assignmentID: string | undefined;
  studentWorkID: string | undefined;
  children: React.ReactNode;
}> = ({ assignmentID, studentWorkID, children }) => {
  const { selectedClassroom } = useContext(SelectedClassroomContext);

  // State variables
  const nextFeedbackID = useRef(0);
  const [feedback, setFeedback] = useState<IGraderFeedbackMap>({});
  const [selectedRubricItems, setSelectedRubricItems] = useState<number[]>([]);
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);
  
  // Persisted state with localStorage
  const [stagedFeedback, setStagedFeedback] = useLocalCachedState<IGraderFeedbackMap>({
    key: createUniqueKey('staged_feedback', assignmentID, studentWorkID),
    defaultValue: {},
  });

  const [selectedFile, setSelectedFile] = useState<IFileTreeNode | null>(null);
  
  // Convert string IDs to numbers for the queries
  const classroomId = selectedClassroom?.id;
  const assignmentIdNum = assignmentID ? Number(assignmentID) : undefined;
  const studentWorkIdNum = studentWorkID ? Number(studentWorkID) : undefined;

  // Fetch the data for the grader
  const { 
    data: fileTreeData, 
    isLoading: loadingGitTree, 
    isError: fileTreeError
  } = useFileTree(classroomId, assignmentIdNum, studentWorkIdNum);

  const { 
    data: studentWorkData, 
    isLoading: loadingStudentWork, 
    isError: studentWorkError,
    refetch: refetchStudentWork
  } = usePaginatedStudentWork(classroomId, assignmentIdNum, studentWorkIdNum);

  const { 
    data: rubricData, 
    isLoading: loadingRubric,
    isError: rubricError 
  } = useAssignmentRubric(classroomId, assignmentIdNum);

  // Derived state
  const studentWork = studentWorkData?.student_work || null;
  const fileTree = fileTreeData || null;
  const rubric = rubricData || null;
  const dataRetrievalError = fileTreeError || studentWorkError || rubricError;

  // Reset the selected file when the studentWorkID changes
  useEffect(() => {
    setSelectedFile(null);
  }, [studentWorkID]);

  // Set feedback when student work data is loaded
  useEffect(() => {
    if (studentWorkData) {
      setFeedback(studentWorkData.feedback || {});
    }
  }, [studentWorkData]);

  // Reset feedback ID counter when feedback changes
  useEffect(() => {
    nextFeedbackID.current = feedback ? Object.keys(feedback).length : 0;
  }, [feedback]);

  // Feedback management functions
  const getNextFeedbackID = () => {
    const tmp = nextFeedbackID.current;
    nextFeedbackID.current = nextFeedbackID.current + 1;
    return tmp;
  };

  const addFeedback = (feedback: IGraderFeedback[]) => {
    const newFeedback: { [id: number]: IGraderFeedback } = {};
    for (const fb of feedback) {
      newFeedback[getNextFeedbackID()] = {
        ...fb,
        action: "CREATE",
      };
    }

    setStagedFeedback((prevFeedback) => ({
      ...prevFeedback,
      ...newFeedback,
    }));
  };

  const editFeedback = (feedbackID: number, feedback: IGraderFeedback) => {
    setStagedFeedback((prevFeedback) => ({
      ...prevFeedback,
      [feedbackID]: {
        ...feedback,
        action: "EDIT",
      },
    }));
  };

  const removeFeedback = (feedbackID: number) => {
    setStagedFeedback((prevFeedback) => ({
      ...prevFeedback,
      [feedbackID]: {
        ...prevFeedback[feedbackID],
        action: "DELETE",
      },
    }));
  };

  const postFeedback = async () => {
    if (!selectedClassroom || !assignmentID || !studentWorkID) return;
    
    setIsSubmittingGrade(true);
    
    try {
      await gradeWork(
        selectedClassroom.id,
        Number(assignmentID),
        Number(studentWorkID),
        stagedFeedback
      );
      
      // Refetch the student work data
      await refetchStudentWork();
      
      // Clear staged feedback after successful submission
      setStagedFeedback({});
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  const selectRubricItem = (riID: number) => {
    setSelectedRubricItems((prevRubricItems) => [...prevRubricItems, riID]);
  };

  const deselectRubricItem = (riID: number) => {
    const deselected = selectedRubricItems.filter((ri) => ri !== riID);
    setSelectedRubricItems(deselected);
  };

  return (
    <GraderContext.Provider
      value={{
        assignmentID,
        studentWorkID,
        studentWork,
        selectedFile,
        feedback,
        stagedFeedback,
        rubric,
        selectedRubricItems,
        fileTree,
        loadingGitTree,
        loadingStudentWork,
        loadingRubric,
        dataRetrievalError,
        isSubmittingGrade,
        setSelectedFile,
        addFeedback,
        editFeedback,
        removeFeedback,
        postFeedback,
        selectRubricItem,
        deselectRubricItem,
      }}
    >
      {children}
    </GraderContext.Provider>
  );
};
