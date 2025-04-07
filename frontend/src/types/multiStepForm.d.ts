// ==============================
// MultiStepForm types
// ==============================

interface IStepComponentProps<T> {
  data: T;
  onChange: (newData: Partial<T>) => void;
}

interface IStep<T> {
  title: string;
  component: React.ComponentType<IStepComponentProps<T>>;
  onNext: (data: T) => Promise<void>;
}

interface IMultiStepFormProps<T> {
  steps: IStep<T>[];
  cancelLink: string;
  initialData: T;
}

// ==============================
// Specific form data types
// ==============================

interface IAssignmentFormData {
  assignmentName: string;
  classroomId: number;
  // groupAssignment: boolean;
  mainDueDate: Date | null;
  // defaultScore: number;
  templateRepo: ITemplateRepo | null;
}
