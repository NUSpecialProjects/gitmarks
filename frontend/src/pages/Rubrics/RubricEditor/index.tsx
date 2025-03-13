import { useEffect, useState } from "react";
import "./styles.css";
import Button from "@/components/Button";
import Input from "@/components/Input";
import RubricItem from "@/components/RubricItem";
import { ItemFeedbackType } from "@/components/RubricItem";
import { createRubric, updateRubric } from "@/api/rubrics";
import { setAssignmentRubric } from "@/api/assignments";
import { useLocation, useNavigate } from "react-router-dom";
import { FaRegTrashAlt } from "react-icons/fa";
import { ClassroomRole } from "@/types/enums";
import { useClassroomUser, useCurrentClassroom } from "@/hooks/useClassroomUser";
import SubPageHeader from "@/components/PageHeader/SubPageHeader";
import { ErrorToast, SuccessToast } from "@/components/Toast";

interface IEditableItem {
    frontFacingIndex: number;
    rubricItem: IRubricItem;
    impact: ItemFeedbackType;
    hidden: boolean;
}

interface IRubricLineItem {
    explanation: string;
    point_value: number | null;
    impact: ItemFeedbackType;
}

const RubricEditor: React.FC = () => {
    const location = useLocation()
    const navigate = useNavigate();

    const { selectedClassroom } = useCurrentClassroom();
    useClassroomUser(ClassroomRole.PROFESSOR, "/app/access-denied");

    // potential data for the assignment
    const [assignmentData, setAssignmentData] = useState<IAssignmentOutline>()
    //data for the rubric
    const [rubricData, setRubricData] = useState<IFullRubric>()
    const [rubricItemData, setRubricItemData] = useState<IEditableItem[]>([])
    const [rubricName, setRubricName] = useState<string>("")
    const [newAssignmentRubric, setNewAssignmentRubric] = useState(false)

    // if there has been any changes since last save
    const [rubricEdited, setRubricEdited] = useState(false)

    //error handling
    const [failedToSave, setFailedToSave] = useState(false)
    const [invalidPointValue, setInvalidPointValue] = useState(false)
    const [invalidExplanation, setInvalidExplanation] = useState(false)
    const [invalidPointImpact, setInvalidPointImpact] = useState(false)
    const [emptyRubric, setEmptyRubric] = useState(false)


    // front end id for each rubric item, kept track of using a counter
    const [itemCount, setitemCount] = useState(0);
    const incrementCount = () => setitemCount(itemCount + 1);

    // default item for adding new items
    const newRubricItem: IEditableItem = {
        frontFacingIndex: itemCount,
        rubricItem: {
            id: null,
            point_value: null,
            explanation: "",
            rubric_id: null,
            created_at: null,
            deleted: false
        },
        impact: ItemFeedbackType.Neutral,
        hidden: false
    }

    const backButton = () => {
        navigate(-1);
    };

    // saving the rubric, creates a rubric in the backendindex
    const saveRubric = async () => {
        if (selectedClassroom !== null && selectedClassroom !== undefined && rubricEdited) {
            let emptyIssue = false
            if (rubricItemData.filter((item) => !item.hidden).length === 0) {
                setEmptyRubric(true)
                setFailedToSave(true)
                emptyIssue = true

            } else {
                setEmptyRubric(false)
            }

            const rubricItems = (rubricItemData.map(item => item.rubricItem));

            // validate items
            let explantionIssue = false
            let pointIssue = false
            for (const item of rubricItems) {
                // check each explanation contains something
                if (item.explanation === "") {
                    setInvalidExplanation(true)
                    setFailedToSave(true)
                    explantionIssue = true
                }

                // check each point value has some data
                if (item.point_value === null || item.point_value === undefined) {
                    setInvalidPointValue(true);
                    setFailedToSave(true);
                    pointIssue = true

                }
            }
            if (!explantionIssue) {
                setInvalidExplanation(false)
            }
            if (!pointIssue) {
                setInvalidPointValue(false)
            }

            // check all non zero valued items have a selected impact
            let impactIssue = false
            for (const item of rubricItemData) {
                if (item.impact === ItemFeedbackType.Neutral && item.rubricItem.point_value !== 0 && !item.hidden) {
                    setInvalidPointImpact(true)
                    setFailedToSave(true)
                    impactIssue = true
                }
            }
            if (!impactIssue) {
                setInvalidPointImpact(false)
            }

            if (explantionIssue || pointIssue || impactIssue || emptyIssue) {
                return;
            }


            const fullRubric: IFullRubric = {
                rubric: {
                    id: null,
                    name: rubricName,
                    org_id: selectedClassroom.org_id,
                    classroom_id: selectedClassroom.id,
                    reusable: true,
                    created_at: null
                },
                rubric_items: rubricItems
            }

            // update existing rubric
            if (rubricData && !newAssignmentRubric) {
                await updateRubric(rubricData.rubric.id!, fullRubric)
                    .then((updatedRubric) => {
                        setRubricEdited(false)
                        setFailedToSave(false)
                        setRubricData(updatedRubric)
                        if (assignmentData !== null && assignmentData !== undefined) {
                            setAssignmentRubric(updatedRubric.rubric.id!, selectedClassroom.id, assignmentData.id)
                        }
                        SuccessToast("Rubric updated successfully", "rubric-updated");
                        backButton()
                    })
                    .catch((_) => {
                        ErrorToast("Failed to update rubric. Please try again.", "rubric-update-error");
                        setFailedToSave(true)
                    });

                // create new rubric
            } else {
                await createRubric(fullRubric)
                    .then((createdRubric) => {
                        setRubricEdited(false)
                        setFailedToSave(false)
                        setRubricData(createdRubric)
                        if (assignmentData !== null && assignmentData !== undefined) {
                            setAssignmentRubric(createdRubric.rubric.id!, selectedClassroom.id, assignmentData.id)
                        }
                        SuccessToast("Rubric created successfully", "rubric-created");
                        backButton()
                    })
                    .catch((_) => {
                        ErrorToast("Failed to create rubric. Please try again.", "rubric-create-error");
                        setFailedToSave(true)
                    });
            }
        } else if (invalidPointValue || invalidExplanation) {
            setFailedToSave(true)
        }
    };

    // handles when any rubric item is updated
    const handleItemChange = (id: number, updatedFields: Partial<IRubricLineItem>) => {
        setRubricEdited(true);

        setRubricItemData((prevItems) =>
            prevItems.map((item) =>
                item.frontFacingIndex === id
                    ? {
                        ...item,
                        ...updatedFields,
                        rubricItem: {
                            ...item.rubricItem,
                            ...updatedFields,
                        },
                    }
                    : item
            )
        );
    };


    // handles when the rubric's name is changed
    const handleNameChange = (newName: string) => {
        setRubricName(newName)
        setRubricEdited(true)
    }

    // handles adding another rubric item
    const addNewItem = () => {
        setRubricEdited(true)
        setRubricItemData([...rubricItemData, newRubricItem]);
        incrementCount()
    };

    const determinePointImpact = (point_value: number) => {
        if (point_value == 0) {
            return ItemFeedbackType.Neutral
        }
        return point_value > 0 ? ItemFeedbackType.Addition : ItemFeedbackType.Deduction
    }

    const deleteItem = (item_id: number) => {
            setRubricEdited(true)
            setRubricItemData((prevItems) =>
                prevItems.map((item) =>
                    item.frontFacingIndex === item_id
                        ? {
                            ...item,
                            hidden: true,
                            rubricItem: {
                                ...item.rubricItem,
                                deleted: true,
                            },
                        }
                        : item
                )
            );
        

    }

    // on startup, store an assignment if we have one 
    // Also make sure there is atleast one editable rubric item already on the screen
    useEffect(() => {
        if (location.state) {
            if (location.state.assignment && location.state.rubricData) {
                
                const assignment = location.state.assignment
                setAssignmentData(assignment)
                const rubric = location.state.rubricData
                setRubricData(rubric)
                if (location.state.newRubric) {
                    setRubricName(`${assignment.name} Rubric`)
                    setRubricEdited(true)
                    setNewAssignmentRubric(true)
                } else {
                    setRubricName(rubric.rubric.name)
                }
                

            } else if (location.state.assignment && !location.state.rubricData) {
                const assignment = location.state.assignment
                setAssignmentData(assignment)
                setRubricName(`${assignment.name} Rubric`)
                addNewItem()

            } else if (location.state.rubricData) {
                const rubric = location.state.rubricData
                setRubricData(rubric)
                setRubricName(rubric.rubric.name)

            }
        } else {
            setRubricName("New Rubric")
            addNewItem()
        }

    }, [location.state]);

    useEffect(() => {
        if (rubricData) {
            let localCount = itemCount
            const editableItems = rubricData.rubric_items.map((item) => {
                const editableItem: IEditableItem = {
                    rubricItem: item,
                    frontFacingIndex: localCount,
                    impact: determinePointImpact(item.point_value ?? 0),
                    hidden: false
                };
                localCount++;
                return editableItem;
            });
            setitemCount(localCount)
            setRubricItemData(editableItems)
        }
    }, [rubricData])

    const pageTitle = rubricData !== null && rubricData !== undefined ? "Edit Rubric" : "New Rubric"

    return (
        <>
        <SubPageHeader
            pageTitle={pageTitle}
            chevronLink={"/app/rubrics"}
        >
        </SubPageHeader>
            <div className="NewRubric__body">
                <div className="NewRubric__title">
                    {assignmentData !== null && assignmentData !== undefined ? `${assignmentData.name} > ` : ""}
                    {pageTitle}
                    {rubricEdited ? "*" : ""}
                </div>

                {failedToSave &&
                    <div className="NewRubric__title__FailedSave">
                        {"Couldn't save rubric. Please try again."}
                    </div>
                }

                {failedToSave && invalidExplanation &&
                    <div className="NewRubric__title__FailedSave">
                        {" - Item explanations cannot be empty."}
                    </div>
                }

                {failedToSave && invalidPointValue &&
                    <div className="NewRubric__title__FailedSave">
                        {" - Point values cannot be empty."}
                    </div>
                }

                {failedToSave && invalidPointImpact &&
                    <div className="NewRubric__title__FailedSave">
                        {" - Point impact cannot be empty for non-zero values."}
                    </div>
                }
                
                {failedToSave && emptyRubric &&
                    <div className="NewRubric__title__FailedSave">
                        {" - A rubric cannot have no items."}
                    </div>
                }

                <Input
                    label="Rubric name"
                    name="rubric-name"
                    placeholder="Enter a name for your classroom..."
                    required
                    value={rubricName}
                    onChange={(n) => { handleNameChange(n.target.value) }}
                />

                <div className="NewRubric__itemsTitle"> Rubric Items </div>

                {rubricItemData && rubricItemData.length > 0 &&
                    rubricItemData.map((item, i) => (
                        <div key={i}>
                            {!item.hidden && (
                                <div key={`item_display_${i}`} className="NewRubric__itemDisplay">
                                    <RubricItem
                                        key={`itemID_${item.frontFacingIndex}`}
                                        name={item.rubricItem.explanation}
                                        points={item.rubricItem.point_value !== undefined && item.rubricItem.point_value !== null
                                            ? Math.abs(item.rubricItem.point_value).toString() : ""}
                                        impact={item.impact}
                                        onChange={(newItem) => handleItemChange(item.frontFacingIndex, newItem)}
                                    />


                                    <Button
                                        key={`delete_id${item.frontFacingIndex}`}
                                        href=""
                                        variant="secondary"
                                        onClick={() => { deleteItem(item.frontFacingIndex) }}>
                                        <FaRegTrashAlt />
                                    </Button>


                                </div>
                            )}
                        </div>
                    ))
                }




                <Button href="" variant="secondary" onClick={addNewItem}> + Add a new item </Button>


                <div className="NewRubric__decisionButtons">
                    <Button href="" variant="secondary" onClick={backButton}> Cancel </Button>
                    <Button href="" onClick={saveRubric}> Save rubric </Button>
                </div>
            </div>
        </>
    );
};

export default RubricEditor;