import styled from 'styled-components';

const StyledForm = styled.form`
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0px 4px 15px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
  margin: 20px auto;
  transition: all 0.3s ease; /* מעבר חלק לכל שינוי */

  &:hover {
    transform: scale(1.02); /* הגדלה קטנה */
    box-shadow: 0px 8px 20px rgba(0,0,0,0.15); /* צל חזק יותר */
  }
`;

export default StyledForm;
