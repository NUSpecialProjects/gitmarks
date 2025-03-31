import React, { useCallback } from "react";
import Input from "@/components/Input";
import Checkbox from "@/components/Checkbox";
import "./styles.css";

const AssignmentDetails: React.FC<IStepComponentProps<IAssignmentFormData>> = ({
  data,
  onChange,
}) => {
  const handleCheckboxChange = (target: HTMLInputElement) => {
    onChange({ [target.name]: target.checked });
  };
  const handleDateChange = (target: HTMLInputElement) => {
    onChange({ [target.name]: target.value ? new Date(target.value) : null });
  };
  const handleTextChange = (target: HTMLInputElement | HTMLTextAreaElement) => {
    onChange({ [target.name]: target.value });
  };

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { type } = e.target;
      const target = e.target as HTMLInputElement;

      switch (type) {
        case "checkbox":
          handleCheckboxChange(target);
          break;
        case "date":
          handleDateChange(target);
          break;
        default:
          handleTextChange(target);
      }
    },
    [onChange]
  );

  return (
    <form className="CreateAssignmentForms">
      <h2 className="CreateAssignmentForms__header">Assignment Basics</h2>

      <div className="CreateAssignmentForms__formGroup">
        <Input
          label="Assignment Name"
          name="assignmentName"
          id="assignmentName"
          placeholder="Database Design Project"
          value={data.assignmentName}
          onChange={handleInputChange}
          required
          caption="Student assignments will have the prefix, e.g. database-design-project"
        ></Input>
      </div>

      <div className="CreateAssignmentForms__formGroup">
        <Input
          label="Due Date"
          type="date"
          name="mainDueDate"
          id="mainDueDate"
          value={
            data.mainDueDate ? data.mainDueDate.toISOString().split("T")[0] : ""
          }
          onChange={handleInputChange}
          required
          caption="Optional; if left blank the assignment will not have a deadline"
        ></Input>
      </div>

      {/* <div className="CreateAssignmentForms__formGroup">
        <Input
          label="Default Score"
          type="number"
          name="defaultScore"
          id="defaultScore"
          value={data.defaultScore}
          onChange={handleInputChange}
          required
          caption="Manual grading score will start at this value; defaults to 0 if left blank"
        ></Input>
      </div> */}

      {/* <div className="CreateAssignmentForms__checkboxGroup">
        <Checkbox
          id="groupAssignment"
          name="groupAssignment"
          label="Group Assignment"
          checked={data.groupAssignment}
          onChange={handleInputChange}
          caption="If left unchecked the assignment will be an individual submission for each student"
        ></Checkbox>
      </div> */}
    </form>
  );
};

export default AssignmentDetails;
