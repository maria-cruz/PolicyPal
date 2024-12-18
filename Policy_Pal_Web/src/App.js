import { BrowserRouter as Router, Route, Routes } from "react-router-dom"; // Using Routes instead of Switch
import LogInPage from "./LogIn/LogInPage";  // Corrected import to match the file name
import Chatgpt from "./OpenAI/OpenAI";   // Assuming this is where the chat functionality is

function App() {
  return (
    <Router>
      <Routes>
        {/* Set the login page as the home page */}
        <Route path="/" element={<LogInPage />} />
        <Route path="/chat" element={<Chatgpt />} />
      </Routes>
    </Router>
  );
}

export default App;
