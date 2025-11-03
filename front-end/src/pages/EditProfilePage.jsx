import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import StyledForm from "../components/styled/StyledForm";
import StyledInput from "../components/styled/StyledInput";
import StyledButton from "../components/styled/StyledButton";
import StyledError from "../components/styled/StyledError";
import StyledSuccess from "../components/styled/StyledSuccess";

function EditProfilePage() {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState(null);
  const [usernameError, setUsernameError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser =
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(sessionStorage.getItem("user"));
    setUser(storedUser);

    const fetchProfile = async () => {
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/profile/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsername(res.data.user.username);
        setBio(res.data.user.bio || "");
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Failed to load profile");
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const formData = new FormData();
      formData.append("bio", bio);
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const res = await axios.put(
        "http://localhost:5000/api/profile/me",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedUser = {
        ...user,
        bio: res.data.updatedUser.bio,
        profileImage: res.data.updatedUser.profileImage,
      };

      if (localStorage.getItem("token")) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } else {
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
      }

      setSuccess("Profile updated successfully!");

      if (typeof window.setUserGlobal === "function") {
        window.setUserGlobal(updatedUser);
      }

      // מעבר אוטומטי לעמוד פרופיל
      setTimeout(() => {
        navigate("/profile");
      }, 1500);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
    }
  };

  return (
    <StyledForm onSubmit={handleSubmit}>
      <h2>Edit Profile</h2>
      {error && <StyledError>{error}</StyledError>}
      {success && <StyledSuccess>{success}</StyledSuccess>}

      {/* שדה username מוצג אבל לא ניתן לעריכה */}
      <StyledInput.InputWrapper>
        <StyledInput.Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => {
            setUsernameError("לא ניתן לעדכן את שם המשתמש");
          }}
          style={{
            borderColor: usernameError ? "#ff4d4d" : "#ccc",
            backgroundColor: usernameError ? "#fff5f5" : "#fff",
          }}
        />
        {usernameError && (
          <p
            style={{ color: "#ff4d4d", fontSize: "0.85rem", marginTop: "5px" }}
          >
            {usernameError}
          </p>
        )}
      </StyledInput.InputWrapper>

      <StyledInput.InputWrapper>
        <StyledInput.Textarea
          placeholder="Your bio (max 500 chars)"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </StyledInput.InputWrapper>

      <StyledInput.InputWrapper>
        <StyledInput.FileInputWrapper>
          <StyledInput.UploadIcon>📷</StyledInput.UploadIcon>
          {profileImage ? profileImage.name : "Upload Profile Image"}
          <StyledInput.HiddenFileInput
            type="file"
            accept="image/*"
            onChange={(e) => setProfileImage(e.target.files[0])}
          />
        </StyledInput.FileInputWrapper>
      </StyledInput.InputWrapper>

      <StyledButton type="submit">Update Profile</StyledButton>
    </StyledForm>
  );
}

export default EditProfilePage;
