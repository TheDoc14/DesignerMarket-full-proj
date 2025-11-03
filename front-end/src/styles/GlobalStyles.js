import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  /* בסיס */
  body, #root {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    font-family: 'Poppins', sans-serif;
    background: linear-gradient(to right, #e0eafc, #cfdef3);
  }

  h1, h2, h3, h4, h5, h6, p {
    margin: 0;
    padding: 0;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  /* עיצוב החלק המרכזי */
  main {
    flex: 1;
    display: flex;
    flex-direction: column; /* מאוד חשוב */
    justify-content: center; /* כשאין הרבה תוכן */
    align-items: center;
    padding: 20px;
  }

  /* טפסים/קוביות */
  .form-container {
    width: 100%;
    max-width: 500px;
    margin-bottom: 20px;
  }

  .form-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 10px;
    font-size: 0.9rem;
  }

  .form-options label {
    display: flex;
    align-items: center;
  }

  .form-options input[type="checkbox"] {
    margin-right: 5px;
  }

  /* עיצוב הפוטר */
  footer {
    background-color: #4CAF50;
    padding: 15px;
    text-align: center;
    color: white;
    margin-top: auto; /* מבטיח שהפוטר ירד הכי למטה */
  }
`;

export default GlobalStyles;
