import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import StyledForm from "./styled/StyledForm";
import StyledInput from "./styled/StyledInput";
import StyledButton from "./styled/StyledButton";
import StyledError from "./styled/StyledError";
import StyledSuccess from "./styled/StyledSuccess";
import { FaEnvelope, FaLock } from "react-icons/fa";

function LoginForm({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!captchaChecked) {
      setError("Please verify the CAPTCHA");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      const { token, user } = res.data;

      if (!user.isVerified) {
        setError("Your account is not verified. Please check your email.");
        return;
      }

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("token", token);
      storage.setItem("user", JSON.stringify(user));
      setUser(user);

      setError("");
      setSuccess(`Welcome ${user.username}, you have successfully logged in.`);

      setTimeout(() => {
        navigate("/profile");
      }, 2500);
    } catch (err) {
      setSuccess("");
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg;

      if (serverMessage) {
        setError(serverMessage);
      } else if (err.response?.status === 403) {
        setError("Your email is not verified. Please check your inbox.");
      } else if (err.response?.status === 400) {
        setError("Incorrect email or password");
      } else {
        setError("Login error");
      }
    }
  };

  return (
    <StyledForm onSubmit={handleLogin}>
      <h2>Login</h2>
      {error && <StyledError>{error}</StyledError>}
      {success && <StyledSuccess>{success}</StyledSuccess>}

      <StyledInput.InputWrapper>
        <StyledInput.IconWrapper>
          <FaEnvelope />
        </StyledInput.IconWrapper>
        <StyledInput.Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
        />
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

        <label>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          Remember Me
        </label>
      </div>

      <StyledButton type="submit">Login</StyledButton>
    </StyledForm>
  );
}

export default LoginForm;
