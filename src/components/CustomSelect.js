import React, { useState } from 'react';
import styled from 'styled-components';

const CustomSelect = ({ options, value, onChange, name }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value);
  
    const handleSelect = (value) => {
      setSelectedValue(value);
      onChange({ target: { name, value } });
      setIsOpen(false);
    };
  
    return (
      <SelectContainer>
        <SelectButton 
          type="button" 
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          {selectedValue || "Select a role (optional)"}
          <span>▼</span>
        </SelectButton>
        {isOpen && (
          <OptionsList>
            <OptionItem 
              onClick={() => handleSelect("")}
              isSelected={selectedValue === ""}
            >
              Select a role (optional)
            </OptionItem>
            {options.map((option) => (
              <OptionItem
                key={option.id}
                onClick={() => handleSelect(option.title)}
                isSelected={selectedValue === option.title}
              >
                {option.title}
              </OptionItem>
            ))}
          </OptionsList>
        )}
      </SelectContainer>
    );
  };
  
  const SelectContainer = styled.div`
    position: relative;
    width: 100%;
  `;
  
  const SelectButton = styled.button`
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
    text-align: left;
    color: #ff69b4;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1rem;
  
    &:focus {
      outline: none;
      border-color: #ffcc00;
      box-shadow: 0 0 0 3px rgba(255, 204, 0, 0.3);
    }
  `;
  
  const OptionsList = styled.ul`
    position: absolute;
    width: 100%;
    max-height: 300px;
    overflow-y: auto;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-top: 5px;
    z-index: 100;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    padding: 0;
    list-style: none;
  `;
  
  const OptionItem = styled.li`
    padding: 10px;
    background-color: ${props => props.isSelected ? '#ff69b4' : '#ffc0cb'};
    color: ${props => props.isSelected ? 'white' : '#333'};
    cursor: pointer;
    transition: all 0.2s ease;
  
    &:hover {
      background-color: #ff69b4;
      color: white;
    }
  `;

  export default CustomSelect;