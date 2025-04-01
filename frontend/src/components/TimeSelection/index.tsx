import React from "react";
import './styles.css'

type TimeSelectionProps = {
  selectedDate: string;
  handleDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSave: () => void;
  handleClose: () => void;
};

const TimeSelection: React.FC<TimeSelectionProps> = ({ selectedDate, handleDateChange, handleSave, handleClose}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>x</button>
        <h2>Select Due Date</h2>
        <input type="date" value={selectedDate} onChange={handleDateChange} />
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
};

export default TimeSelection;
