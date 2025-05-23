import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import StyledInput from "./styled/StyledInput";
import StyledButton from "./styled/StyledButton";
import StyledForm from "./styled/StyledForm";
import StyledError from "./styled/StyledError";
import StyledSuccess from "./styled/StyledSuccess";
import { FaUser, FaEnvelope, FaLock, FaInfoCircle } from "react-icons/fa";

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [bio, setBio] = useState("");
  const [charCount, setCharCount] = useState(0);
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

    try {
      const payload = { username, email, password, role, bio };
      const res = await axios.post("http://localhost:5000/api/auth/register", payload, {
        headers: { "Content-Type": "application/json" },
      });
      setSuccess(res.data.message || "נרשמת בהצלחה!");
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

      <StyledInput.InputWrapper>
        <StyledInput.IconWrapper>
          <FaInfoCircle />
        </StyledInput.IconWrapper>
        <StyledInput.Textarea
          placeholder="Short bio (optional)"
          value={bio}
          onChange={(e) => {
            if (e.target.value.length <= 500) {
              setBio(e.target.value);
              setCharCount(e.target.value.length);
            }
          }}
          rows={3}
        />
        <div style={{ textAlign: "right", fontSize: "0.8rem", color: "#666" }}>
          {charCount}/500
        </div>
      </StyledInput.InputWrapper>

      <StyledButton type="submit">Register</StyledButton>
    </StyledForm>
  );
}

export default RegisterForm;