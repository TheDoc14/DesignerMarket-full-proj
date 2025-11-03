import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import StyledForm from "../components/styled/StyledForm";
import StyledInput from "../components/styled/StyledInput";
import StyledButton from "../components/styled/StyledButton";
import StyledError from "../components/styled/StyledError";
import StyledSuccess from "../components/styled/StyledSuccess";
import { FaEnvelope } from "react-icons/fa";

function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      const saved = localStorage.getItem("resendCooldown");
      if (saved) {
        const timeLeft = Math.floor((parseInt(saved) - Date.now()) / 1000);
        setCooldown(timeLeft > 0 ? timeLeft : 0);
        if (timeLeft <= 0) {
          localStorage.removeItem("resendCooldown");
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleResend = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address.");
      setSuccess("");
      return;
    }

    if (cooldown > 0) {
      setError(`Please wait ${cooldown} seconds before sending again.`);
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/resend-verification", { email });
      setSuccess(res.data.message || "Verification email sent successfully!");
      setError("");

      const waitUntil = Date.now() + 5 * 60 * 1000; // 5 minutes
      localStorage.setItem("resendCooldown", waitUntil.toString());
      setCooldown(300);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to resend verification email.";
      setSuccess("");

      if (msg.toLowerCase().includes("not found")) {
        setError("Email not found. If you're sure you registered, check your spelling.");
        return;
      }

      setError(msg);
    }
  };

  return (
    <StyledForm onSubmit={handleResend}>
      <h2>Resend Verification Email</h2>
      {error && <StyledError>{error}</StyledError>}
      {success && <StyledSuccess>{success}</StyledSuccess>}

      <StyledInput.InputWrapper>
        <StyledInput.IconWrapper><FaEnvelope /></StyledInput.IconWrapper>
        <StyledInput.Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </StyledInput.InputWrapper>

      <StyledButton type="submit" disabled={cooldown > 0}>
        {cooldown > 0 ? `Wait ${cooldown}s` : "Send Verification Email"}
      </StyledButton>
    </StyledForm>
  );
}

export default ResendVerificationPage;
