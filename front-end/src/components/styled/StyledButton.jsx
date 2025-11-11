import styled from 'styled-components';

const StyledButton = styled.button`
  width: 90%;
  margin: 10px auto;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background-color: #4CAF50;
  color: white;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    background-color: #45a049;
    transform: scale(1.05);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: scale(0.98);
  }
`;

export default StyledButton;
