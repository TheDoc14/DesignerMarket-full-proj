import styled from 'styled-components';

export const InputWrapper = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 20px;
`;

export const IconWrapper = styled.div`
  position: absolute;
  top: 50%;
  left: 14px;
  transform: translateY(-50%);
  color: #4CAF50;
  font-size: 1.2rem;
`;

const sharedStyles = `
  width: 100%;
  padding: 12px 12px 12px 45px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  background-color: #fff;
  color: #333;
  box-sizing: border-box;

  &::placeholder {
    color: #999;
  }

  &:focus {
    outline: none;
    border-color: #6fcf97;
    box-shadow: 0 0 0 2px rgba(111, 207, 151, 0.2);
  }
`;

export const Input = styled.input`
  ${sharedStyles}
`;

export const Select = styled.select`
  ${sharedStyles}
  appearance: none;
  height: 45px;
`;

export const Textarea = styled.textarea`
  ${sharedStyles}
  resize: none;
  min-height: 100px;
  padding-top: 14px;
`;

// === סגנונות להעלאת קובץ ===

export const FileInputWrapper = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #fff;
  font-size: 1rem;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f0f0f0;
  }
`;

export const HiddenFileInput = styled.input`
  display: none;
`;

export const UploadIcon = styled.span`
  color: #4CAF50;
  font-size: 1.2rem;
`;

export const FileName = styled.span`
  font-size: 0.9rem;
  color: #555;
`;

const StyledInput = {
  InputWrapper,
  IconWrapper,
  Input,
  Select,
  Textarea,
  FileInputWrapper,
  HiddenFileInput,
  UploadIcon,
  FileName
};

export default StyledInput;
