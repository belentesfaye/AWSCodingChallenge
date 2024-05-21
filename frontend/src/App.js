import "./App.css";
import axios from "axios";
import React, { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("text", text);

    try {
      const response = await axios.post(
        "https://6vlel2ajm4.execute-api.us-east-1.amazonaws.com/prod/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      console.log(response.data);
      <h1> submitting form </h1>;
    } catch (error) {
      console.error("Error submitting form:", error);
      <h1> Error submitting form </h1>;
    }
  };
  return (
    <>
      <form onSubmit={handleSubmit}>
        <label>
          Text input:
          <input
            type="text"
            name="myInput"
            value={text}
            onChange={handleTextChange}
            style={{
              padding: "10px",
              board: "1px solid #ccc",
              width: "10%",
            }}
          />
        </label>
        <br />
        <label>
          File Upload:
          <input type="file" onChange={handleFileChange} />
        </label>
        <br />
        <button type="submit">Submit</button>
      </form>
    </>
  );
}

export default App;
