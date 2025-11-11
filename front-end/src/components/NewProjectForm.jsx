import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import StyledInput from "./styled/StyledInput";
import StyledButton from "./styled/StyledButton";
import StyledForm from "./styled/StyledForm";
import StyledError from "./styled/StyledError";
import StyledSuccess from "./styled/StyledSuccess";
import { FaUser, FaEnvelope, FaLock, FaUpload } from "react-icons/fa";


function NewProjectForm() {
      const [user, setUser]= useState("");
      const [projectName, setProjectName]= useState("");
      const [description, setDescription]= useState("");
      const [files, setFiles]= useState(null);
      const [error, setError]= useState("");
      const [success, setSuccess]= useState("");
      const navigate = useNavigate();
        const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !projectName || !description) {
        setError("Please fill in all required fields");
        setSuccess("");
        return;
        }
    try {
        const formData = new FormData();
        formData.append("user", user);
        formData.append("projectName", projectName);
        formData.append("description", description);
        if (files) {
            formData.append("files", files);
        }
        const res = await axios.post("http://localhost:5000/api/projects/new", formData);
        setSuccess(res.data.message || "Project created successfully!");
        setError("");
        navigate("/project-overview");
    } catch (err) {
        const msg = err.response?.data?.error || "Project creation failed";
        setError(msg);
        setSuccess("");
    }   
    };
    return (
    <StyledForm onSubmit={handleSubmit}>
        <h2>Create New Project</h2>
        {error && <StyledError>{error}</StyledError>}
        {success && <StyledSuccess>{success}</StyledSuccess>}
        <StyledInput.IconInput
            type="text"
            placeholder="User"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            Icon={FaUser}
        />
        <StyledInput.IconInput
            type="text"
            placeholder="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            Icon={FaEnvelope}
        />
        <StyledInput.TextArea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
        />
        <StyledInput.FileInputWrapper>
            <label htmlFor="files">
                <FaUpload /> Upload Files
            </label>
            <StyledInput.HiddenFileInput
                type="file"
                id="files"
                onChange={(e) => setFiles(e.target.files[0])}
            />
        </StyledInput.FileInputWrapper>
        <StyledButton type="submit">Create Project</StyledButton>
    </StyledForm>
    );
}
 
export default NewProjectForm;