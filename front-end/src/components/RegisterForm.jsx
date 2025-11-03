import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import StyledInput from "./styled/StyledInput";
import StyledButton from "./styled/StyledButton";
import StyledForm from "./styled/StyledForm";
import StyledError from "./styled/StyledError";
import StyledSuccess from "./styled/StyledSuccess";
import { FaUser, FaEnvelope, FaLock, FaUpload } from "react-icons/fa";

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [approvalDocument, setApprovalDocument] = useState(null);
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const requiresDocument = role === "student" || role === "designer";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !email || !password) {
      setError("Please fill in all required fields");
      setSuccess("");
      return;
    }

    if (!captchaChecked) {
      setError("Please verify the CAPTCHA");
      setSuccess("");
      return;
    }

    if (requiresDocument && !approvalDocument) {
      setError("Please upload an approval document");
      setSuccess("");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("role", role);
      if (approvalDocument) {
        formData.append("approvalDocument", approvalDocument);
      }

      const res = await axios.post("http://localhost:5000/api/auth/register", formData);
      setSuccess(res.data.message || "Registration successful!");
      setError("");
      navigate("/email-verification-notice");
    } catch (err) {
      const msg = err.response?.data?.error || "Registration failed";
      setSuccess("");
      setError(msg);
    }
  };

  return (
    <StyledForm onSubmit={handleSubmit}>
      <h2>Register</h2>
      {error && <StyledError>{error}</StyledError>}
      {success && <StyledSuccess>{success}</StyledSuccess>}

      <StyledInput.InputWrapper>
        <StyledInput.IconWrapper><FaUser /></StyledInput.IconWrapper>
        <StyledInput.Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </StyledInput.InputWrapper>

      <StyledInput.InputWrapper>
        <StyledInput.IconWrapper><FaEnvelope /></StyledInput.IconWrapper>
        <StyledInput.Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </StyledInput.InputWrapper>

      <StyledInput.InputWrapper>
        <StyledInput.IconWrapper><FaLock /></StyledInput.IconWrapper>
        <StyledInput.Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </StyledInput.InputWrapper>

      <StyledInput.InputWrapper>
        <StyledInput.IconWrapper><FaUser /></StyledInput.IconWrapper>
        <StyledInput.Select
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="student">Student</option>
          <option value="designer">Designer</option>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </StyledInput.Select>
      </StyledInput.InputWrapper>

      {requiresDocument && (
        <StyledInput.InputWrapper>
          <StyledInput.FileInputWrapper htmlFor="approvalDocument">
            <StyledInput.UploadIcon><FaUpload /></StyledInput.UploadIcon>
            {approvalDocument ? (
              <StyledInput.FileName>{approvalDocument.name}</StyledInput.FileName>
            ) : (
              "Upload Approval Document"
            )}
            <StyledInput.HiddenFileInput
              type="file"
              id="approvalDocument"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setApprovalDocument(e.target.files[0])}
            />
          </StyledInput.FileInputWrapper>
        </StyledInput.InputWrapper>
      )}

      <div className="form-options">
        <label>
          <input
            type="checkbox"
            checked={captchaChecked}
            onChange={(e) => setCaptchaChecked(e.target.checked)}
          />
          I'm not a robot
        </label>
      </div>

      <StyledButton type="submit">Register</StyledButton>
    </StyledForm>
  );
}

export default RegisterForm;
