# Fovus Coding Challenge

This project is the frontend component of the [Project Name], responsible for providing a user interface for uploading files and text data.

## Overview

The frontend application allows users to upload files and enter text data, which are then sent to the backend API for processing and storage.

## Installation

To run the frontend application locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone <repository_url>
   ```

2. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm start
   ```

## Usage

1. Access the application in your web browser.
2. Enter text data in the input field.
3. Choose a file to upload using the file input field.
4. Click the "Submit" button to send the data to the backend API for processing.

## Technologies Used

- **React**: JavaScript library for building user interfaces.
- **axios**: Promise-based HTTP client for making requests to the backend API.
- **CSS**: Styling for the user interface components.

## Folder Structure

- **src**: Source code directory
  - **App.js**: Main component file containing the form for uploading files and text.
  - **App.css**: Stylesheet for the application.
  - **index.js**: Entry point of the application.

## Configuration

- **Backend API URL**: Update the API URL in the `handleSubmit` function of `App.js` to point to the correct backend endpoint.

