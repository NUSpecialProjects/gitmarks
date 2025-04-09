import { useState, ReactNode } from "react";
import Caret from "./Caret";
import "./styles.css";

export interface IDropdownOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface IDropdownProps {
  options: IDropdownOption[];
  onChange?: (selected: string) => void;
  selectedOption: string | null;
  loading: boolean;
  labelText: string;
  captionText?: string;
  placeholder?: string;
  loadingText?: string;
  noOptionsText?: string;
  disabled?: boolean;
}

const GenericDropdown = ({
  onChange,
  options,
  selectedOption,
  loading,
  labelText,
  captionText,
  placeholder = 'Select an option',
  loadingText = 'Loading options...',
  noOptionsText = 'No options available',
  disabled = false,
}: IDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (value: string) => {
    if (onChange) {
      onChange(value);
    }
    setIsOpen(false);
  };

  const selectedLabel = options.find(opt => opt.value === selectedOption)?.label || placeholder;

  return (
    <div className="Dropdown">
      <div className="Dropdown__wrapper">
        <label className="Dropdown__label">
          {labelText}
        </label>
        <div className="Dropdown__select-wrapper">
          <button
            type="button"
            className="Dropdown__button"
            onClick={() => setIsOpen(!isOpen)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            disabled={disabled}
          >
            <span className="Dropdown__selected-text">{selectedLabel}</span>
            <Caret isUp={!isOpen} clickable={false}/>
          </button>
          
          {isOpen && !disabled && (
            <ul className="Dropdown__options-list">
              {loading ? (
                <li className="Dropdown__option Dropdown__option--disabled">{loadingText}</li>
              ) : options.length === 0 ? (
                <li className="Dropdown__option Dropdown__option--disabled">{noOptionsText}</li>
              ) : (
                options.map((option, index) => (
                  <li
                    key={index}
                    className={`Dropdown__option ${option.disabled ? 'Dropdown__option--disabled' : ''}`}
                    onClick={() => !option.disabled && handleSelect(option.value)}
                  >
                    {option.label}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        {captionText && <div className='Dropdown__caption'>{captionText}</div>}
      </div>
    </div>
  );
};

export default GenericDropdown;