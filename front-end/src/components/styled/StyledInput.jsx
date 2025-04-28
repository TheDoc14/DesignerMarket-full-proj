// src/components/styled/StyledInput.jsx
import styled from 'styled-components';

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
  margin: 10px 0;
`;

const IconWrapper = styled.div`
  position: absolute;
  top: 50%;
  left: 14px;
  transform: translateY(-50%);
  color: #4CAF50;
  font-size: 1.2rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 12px 12px 45px; /* ריווח שמאלי גדול יותר בשביל האייקון */
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box; /* מאוד חשוב */
`;

const StyledInput = {
  InputWrapper,
  IconWrapper,
  Input
};

export default StyledInput;
