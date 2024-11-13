import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import "./styles.css";
import Button from "@/components/Button";
import Input from "@/components/Input";
import RubricItem from "@/components/RubricItem";
import { createRubric } from "@/api/rubrics";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { setAssignmentRubric } from "@/api/assignments";

const NewRubric: React.FC = () => {
    const location = useLocation();
    const [assignment, setAssignment] = useState<IAssignmentOutline>()
    const { selectedClassroom } = useContext(SelectedClassroomContext)

    // front end only id for each rubric item, kept rack of using a counter
    const [itemCount, setitemCount] = useState(0);
    const incrementCount = () => setitemCount(itemCount + 1);

    // default item for adding new items
    const newRubricItem: IRubricItem = {
        id: itemCount,
        point_value: 0,
        explanation: "",
        rubric_id: null,
        created_at: null
    }


    //data for the rubric
    const [rubricItemData, setRubricItemData] = useState<IRubricItem[]>([])
    const [rubricName, setRubricName] = useState<string>("")

    // if there has been any changes since last save
    const [rubricEdited, setRubricEdited] = useState<boolean>(false)

    // saving the rubric, creates a rubric in the backend
    const saveRubric = async () => {

        if (selectedClassroom !== null && selectedClassroom !== undefined && rubricEdited) {
            const rubricItems = (rubricItemData.map(item => ({ ...item, id: null })));

            const rubricData: IRubric = {
                id: null,
                name: rubricName,
                org_id: selectedClassroom.org_id,
                classroom_id: selectedClassroom.id,
                reusable: true,
                created_at: null
            }

            const fullRubric: IFullRubric = {
                rubric: rubricData,
                rubric_items: rubricItems
            }
            await createRubric(fullRubric)
                .then((response) => {
                    console.log("Rubric created successfully:", response);
                    setRubricEdited(false)
                    if (assignment !== null && assignment !== undefined) {
                        setAssignmentRubric(fullRubric.rubric.id!)
                    }
                })
                .catch((error) => {
                    console.error("Error creating rubric:", error);
                });
        }

    };

    // handles when any rubric item is updated
    const handleItemChange = (id: number, updatedFields: Partial<IRubricItem>) => {
        setRubricEdited(true)
        setRubricItemData((prevItems) =>
            prevItems.map((item) =>
                item.id === id ? { ...item, ...updatedFields } : item
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
        setRubricItemData([...rubricItemData, newRubricItem]);
        incrementCount()
    };

    // on startup, store an assignment if we have one 
    // Also make sure there is atleast one editable rubric item already on the screen
    useEffect(() => {
        if (location.state !== null && location.state !== undefined) {
            setAssignment(location.state.assignment)
            console.log(assignment?.name)
        }

        if (assignment !== null && assignment !== undefined) {
            setRubricName(`${assignment.name} Rubric`)
        } else {
            setRubricName("New Rubric")
        }

        if (rubricItemData.length === 0) {
            addNewItem()
        }
    }, []);



    return (
        <div className="NewRubric__body">
            <div className="NewRubric__title">
                {assignment !== null && assignment !== undefined ? `${assignment.name} > ` : ""}
                {rubricEdited ? "New Rubric *" : "New Rubric"}
            </div>


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
                rubricItemData.map((item) => (
                    <RubricItem
                        key={item.id}
                        name={item.explanation}
                        points={Math.abs(item.point_value).toString()}
                        deduction={item.point_value > 0}
                        onChange={(newItem) => handleItemChange(item.id ? item.id : 0, newItem)}
                    />
                ))
            }

            <Button href="" variant="secondary" onClick={addNewItem}> + Add a new item </Button>


            <div className="NewRubric__decisionButtons">
                <Button href="" variant="secondary"> Cancel </Button>
                <Button href="" onClick={saveRubric}> Save rubric </Button>
            </div>
        </div>
    );
};

export default NewRubric;