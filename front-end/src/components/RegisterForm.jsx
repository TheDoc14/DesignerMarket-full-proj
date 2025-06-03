import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import StyledInput from "./styled/StyledInput";
import StyledButton from "./styled/StyledButton";
import StyledForm from "./styled/StyledForm";
import StyledError from "./styled/StyledError";
import StyledSuccess from "./styled/StyledSuccess";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

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

    try {
      const payload = { username, email, password, role };
      const res = await axios.post("http://localhost:5000/api/auth/register", payload, {
        headers: { "Content-Type": "application/json" },
      });
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
        <StyledInput.IconWrapper>
          <FaUser />
        </StyledInput.IconWrapper>
        <StyledInput.Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </StyledInput.InputWrapper>

      <StyledInput.InputWrapper>
        <StyledInput.IconWrapper>
          <FaEnvelope />
        </StyledInput.IconWrapper>
        <StyledInput.Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </StyledInput.InputWrapper>

      <StyledInput.InputWrapper>
        <StyledInput.IconWrapper>
          <FaLock />
        </StyledInput.IconWrapper>
        <StyledInput.Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </StyledInput.InputWrapper>

      <StyledInput.InputWrapper>
        <StyledInput.IconWrapper>
          <FaUser />
        </StyledInput.IconWrapper>
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
