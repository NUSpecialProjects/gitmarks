import React, { useEffect, useState } from "react";
import "./styles.css";
import Button from "../Button";
import { FaRegTrashAlt } from "react-icons/fa";
import { FiMinus } from "react-icons/fi";
import { GoPlus } from "react-icons/go";

interface IRubricItemProps {
    name: string;
    fid: number;
    points: string;
    impact: ItemFeedbackType;
    deleteItem: (rubricFrontFacingID: number) => void;
    onChange: (updatedFields: Partial<{ explanation: string; point_value: number | null; impact: ItemFeedbackType }>) => void;
}

export enum ItemFeedbackType {
    Addition = "A",
    Deduction = "D",
    Neutral = "N"
}

const RubricItem: React.FC<IRubricItemProps> = ({ name, fid, points, impact, deleteItem, onChange, }) => {
    const [selection, setSelection] = useState<ItemFeedbackType>(ItemFeedbackType.Neutral)
    const [displayPoints, setDisplayPoints] = useState(points.toString())

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ explanation: e.target.value });
    };



    const updatePointsBasedOnDeduction = (pointValue: number, feedbackType: ItemFeedbackType) => {
        if (!isNaN(pointValue)) {
            const adjustedValue = feedbackType === ItemFeedbackType.Deduction ? -1 * Math.abs(pointValue) : Math.abs(pointValue)
            onChange({ point_value: adjustedValue, impact: feedbackType });
        } else {
            onChange({ impact: feedbackType })
        }
    }

    const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "") {
            setDisplayPoints("")
            onChange({ point_value: null })
            return;
        }

        if (value === "0") {
            makeNeutral()
        }

        const pointValue = Math.abs(parseInt(value, 10));
        if (!isNaN(pointValue)) {
            setDisplayPoints(pointValue.toString())
            updatePointsBasedOnDeduction(pointValue, selection);
        }
    };

    const makeNeutral = () => {
        setSelection(ItemFeedbackType.Neutral)
    }


    const toggleAddition = () => {
        if (selection !== ItemFeedbackType.Addition) {
            setSelection(ItemFeedbackType.Addition);
            updatePointsBasedOnDeduction(parseInt(points, 10), ItemFeedbackType.Addition)
        } else {
            setSelection(ItemFeedbackType.Neutral)
            onChange({ impact: ItemFeedbackType.Neutral })
        }
    };

    const toggleDeduction = () => {
        if (selection !== ItemFeedbackType.Deduction) {
            setSelection(ItemFeedbackType.Deduction);
            updatePointsBasedOnDeduction(parseInt(points, 10), ItemFeedbackType.Deduction)
        } else {
            setSelection(ItemFeedbackType.Neutral)
            onChange({ impact: ItemFeedbackType.Neutral })
        }
    };


    // on startup
    useEffect(() => {
        setSelection(impact)
    }, [])


    return (
        <div className="RubricItem__wrapper">
            <div className="RubricItem__buttonAndPoints">

            <div className="RubricItem__Comment">
                <div style={{ fontWeight: "bold", textDecoration: "underline" }}> Comment:</div>
                <input
                    className="RubricItem__itemName"
                    id={name}
                    name={name}
                    value={name}
                    maxLength={100}
                    placeholder="Add a rubric item..."
                    onChange={handleNameChange}
                />
            </div>


                <div className="RubricItem__buttonWrap">
                    <Button
                        className={`RubricItem__button${selection === ItemFeedbackType.Addition ? "AdditionActive" : ""}`}
                        href=""
                        variant="secondary"
                        onClick={toggleAddition}>
                        <GoPlus />
                    </Button>

                    <Button
                        className={`RubricItem__button${selection === ItemFeedbackType.Deduction ? "DeductionActive" : ""}`}
                        href=""
                        variant="secondary"
                        onClick={toggleDeduction}>
                        <FiMinus />
                    </Button>
                </div>

                <div>
                    <div style={{ fontWeight: "bold", textDecoration: "underline" }}> Points:</div>

                    <input
                        className="RubricItem__itemPoints"
                        id={points}
                        name={"pointValue"}
                        value={displayPoints}
                        placeholder="Enter point value"
                        maxLength={6}
                        onChange={handlePointsChange}
                    />
                </div>
            </div>



            <Button
                className="RubricItem__deleteButton"
                href=""
                variant="secondary"
                onClick={() => deleteItem(fid) }>
                <FaRegTrashAlt />
            </Button>
            

        </div>
    );
};

export default RubricItem;
