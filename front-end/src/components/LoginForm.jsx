import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import StyledForm from "./styled/StyledForm";
import StyledInput from "./styled/StyledInput";
import StyledButton from "./styled/StyledButton";
import StyledError from "./styled/StyledError";
import StyledSuccess from "./styled/StyledSuccess";
import { FaEnvelope, FaLock } from "react-icons/fa";

// , FaKey(last import removed inside the brackets)
function LoginForm({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
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
      twoFACode,
    });

    const { token, user } = res.data;

    if (!user.isVerified) {
      setError("Your account is not verified. Redirecting to verification page...");
      setTimeout(() => {
        navigate("/resend-verification");
      }, 3000);
      return;
    }

    const storage = rememberMe ? localStorage : sessionStorage;
        localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
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

    const status = err.response?.status;
    const serverMessage =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.response?.data?.errors?.[0]?.msg ||
      "";

    // 🛑 סדר בדיקה מתוקן – קודם בדוק סיסמה
    if (status === 400) {
      setError("Incorrect email or password");
      return;
    }

    // ✅ רק אם זה לא סיסמה שגויה – בדוק אם זה קשור לאימות
    if (status === 403 && serverMessage.toLowerCase().includes("verify")) {
      setError("Your email is not verified. Redirecting to verification page...");
      setTimeout(() => {
        navigate("/resend-verification");
      }, 3000);
      return;
    }

    if (serverMessage) {
      setError(serverMessage);
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

      <StyledInput.InputWrapper className="primary">
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

      <StyledInput.InputWrapper>
        {/* <StyledInput.IconWrapper>
          <FaKey />
        </StyledInput.IconWrapper> */}
        {/* <StyledInput.Input
          type="text"
          placeholder="2FA Code"
          value={twoFACode}
          onChange={(e) => setTwoFACode(e.target.value)}
        /> */}
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
