// src/Components/Accessibility.jsx
import { useState } from 'react';
import './componentStyle.css';

/**
 * Accessibility Component
 * * Provides a floating user interface (widget) to improve website accessibility.
 * It allows users to dynamically adjust the font size and toggle high-contrast
 * mode for better readability and visual comfort. The component is pinned
 * to the viewport, ensuring essential accessibility tools are always reachable.
 */
const Accessibility = () => {
  // State to manage the visibility of the accessibility options menu
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Toggles the 'high-contrast' class on the document body.
   * This allows the application to switch between standard and
   * high-contrast visual modes via CSS selectors.
   */
  const toggleHighContrast = () => {
    document.body.classList.toggle('high-contrast');
  };

  /**
   * Adjusts the global font size of the application.
   * It calculates the current computed font size of the body and
   * updates it by the specified delta value.
   * * @param {number} delta - The amount of pixels to add or subtract (e.g., 2 or -2).
   */
  const changeFontSize = (delta) => {
    const currentSize = parseFloat(
      window.getComputedStyle(document.body).fontSize
    );
    document.body.style.fontSize = `${currentSize + delta}px`;
  };

  return (
    <div className="wrapper-accessibility">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="button-accessibility"
      >
        ♿
      </button>

      {isOpen && (
        <div className="option-accessiblity">
          <button onClick={() => changeFontSize(2)} className="btnStyle">
            ➕ הגדל טקסט
          </button>
          <button onClick={() => changeFontSize(-2)} className="btnStyle">
            ➖ הקטן טקסט
          </button>
          <button onClick={toggleHighContrast} className="btnStyle">
            🌓 ניגודיות גבוהה
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="close-btn-accessiblity"
          >
            סגור
          </button>
        </div>
      )}
    </div>
  );
};

export default Accessibility;
