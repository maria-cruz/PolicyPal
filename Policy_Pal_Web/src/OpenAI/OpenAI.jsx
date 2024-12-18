import "../App.scss";
import gptLogo from "../assets/chatgpt.svg";
import addBtn from "../assets/add-30.png";
import sendBtn from "../assets/send.svg";
import userIcon from "../assets/user-icon.png";
import gptImgLogo from "../assets/chatgptLogo.svg";
import { useEffect, useState, useRef } from "react";
import { sendMsgToOpenAI_Chat } from "../server";
import pdfToText from "react-pdftotext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate, useLocation } from "react-router-dom";

function Chatgpt() {
  const msgEnd = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedUser, setSelectedUser] = useState(null);
  const [content, setContent] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      text: "Hi, I am your Client Relations Adviser! How can I assist you today?",
      isBot: true,
    },
  ]);
  // Define users with placeholders for contracts
  const userPersona = [
    {
      id: 1,
      name: "Mia",
      age: 20,
      accountType: "Student Savings Account",
      status: "Working student",
      university: "2nd-year student at Harvard University, majoring in Biology",
      livingSituation:
        "Lives 300 meters from the school and rents an apartment for $1,000 per month",
      contract: null,
    },
    {
      id: 2,
      name: "Roxy",
      age: 28,
      accountType: "Young Professional Savings Account",
      occupation: "IT Specialist, Back-End Developer(Java)",
      salary: "$95,370 annually",
      car: "Owns a car that is still under mortgage for the next 3 years",
      commuting: "Drives to the office every day, living 5 km from the office",
      contract: null,
    },
    {
      id: 3,
      name: "Chad",
      age: 62,
      accountType: "Retirement Savings Accout",
      occupation: "Retired Marine with 20 years of service",
      pension: "Receives a  pension of 50% of base pay",
      healthInsurance: "Has health insurance benefits",
      property: "Owns a  house that is fully paid",
      contract: null,
    },
  ];

  // Load PDF content dynamically from the public folder
  const loadPDFContent = async (userId) => {
    const pdfName = `USER_${userId}.pdf`;
    const pdfUrl = `${process.env.PUBLIC_URL}/PDF/${pdfName}`;
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }
      const blob = await response.blob();
      const text = await pdfToText(blob);
      setContent(text);
      if (!text) {
        throw new Error("PDF content is empty or could not be parsed.");
      }
    } catch (error) {
      console.error("Error loading PDF:", error);
      setContent(
        "Sorry, the content of the PDF file is inaccessible. Please contact customer support for clarification on the contract details or request a new copy of the relevant PDF file."
      );
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: "Sorry, the content of the PDF file is inaccessible. Please contact customer support for clarification on the contract details or request a new copy of the relevant PDF file.",
          isBot: true,
        },
      ]);
    }
  };


  useEffect(() => {
    const { username } = location.state || {};
    if (username) {
      handleUserSelect(username);
    }
  }, [location]);

  const handleUserSelect = (username) => {
    resetChat();
    const user = userPersona.find((user) => user.name === username);
    setSelectedUser(user);
    loadPDFContent(user.id);
    const greetingMessage = `Hello, ${user.name}! I have loaded your contract details. How can I assist you?`;
    console.log("Greeting Message: ", greetingMessage)
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: greetingMessage, isBot: true },
    ]);
  };

  useEffect(() => {
    msgEnd.current.scrollIntoView();
  }, [messages]);
  const handleKeyDown = (e) => {
    // If Enter is pressed without Shift, send the message
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === "Enter" && e.shiftKey) {
      // Add newline when Shift+Enter is pressed
      setInput((prevInput) => prevInput + "\n");
    }
  };
  // Handle sending a message
  const handleSend = async () => {
    const text = input;
    setInput("");
    // Add user's message to the chat
    setMessages((prevMessages) => [...prevMessages, { text, isBot: false }]);
    // Send the entire conversation to OpenAI (including user and bot messages)
    const conversation = messages.map((message) => ({
      role: message.isBot ? "system" : "user",
      content: message.text,
    }));
    // Add persona and contract context to the conversation
    const personaContext = JSON.stringify(selectedUser, null, 2);
    const combinedContext = `${personaContext}\n\nContract Details: \n${content}`;
    conversation.push({
      role: "system",
      content: `User Persona and Contract Data: ${combinedContext}`,
    });
    conversation.push({ role: "user", content: text });
    const res = await sendMsgToOpenAI_Chat(conversation, combinedContext);
    // Add the bot's response to the chat
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: res, isBot: true },
    ]);
  };
  const resetChat = () => {
    setMessages([
      {
        text: "Hi, I am your Client Relations Adviser! How can I assist you today?",
        isBot: true,
      },
    ]);
    setContent("");
    setInput("");
  };
  const [displayedText, setDisplayedText] = useState(""); // State to track the typing effect for the latest bot message
  const lastMessageRef = useRef(null); // Ref to track the last processed bot message

  useEffect(() => {
    // Get the latest message from the bot
    const lastMessage = messages.at(-1);

    // Only apply the typing effect if the last message is from the bot and it's new
    if (
      (lastMessage &&
        lastMessage.isBot &&
        lastMessage !== lastMessageRef.current) ||
      lastMessage !== ""
    ) {
      // Mark this message as processed (this ensures typing effect applies only once)
      lastMessageRef.current = lastMessage;

      setDisplayedText(""); // Reset displayed text before starting

      const text = lastMessage.text; // Get the bot's message text
      let index = 0;
      // Set the first letter immediately
      setDisplayedText(text[index]);

      // Start typing effect with an interval to append the next characters
      const typingInterval = setInterval(() => {
        if (index < text.length - 1) {
          // Only update if there are more characters to type
          setDisplayedText((prev) => prev + text[index]); // Append next character
          index++;
        } else {
          clearInterval(typingInterval); // Clear interval when typing is complete
        }
      }, 5); // Interval of ms for each character

      // Cleanup the interval when the effect is finished or the component is unmounted
      return () => clearInterval(typingInterval);
    }
  }, [messages]); // Re-run effect whenever `messages` changes


  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="App">
      <div className="sidebar">
        <div className="upperSide">
          <div className="upperSideTop">
            <img src={gptLogo} alt="logo" className="logo" />
            <span className="brand">Welcome to Buddie</span>
            <div className="description">Bank-bot that Understands your financial Dreams, Decisions, Ideas, and Expectations.</div>
            <button className="logoutBtn" onClick={handleLogout}>
              Log Out
            </button>
          </div>
          <button className="midBtn" onClick={resetChat}>
            <img src={addBtn} alt="" className="addBtn" />
            New Chat
          </button>
        </div>
      </div>
      <div className="main">
        <div className="chats">
          {messages.map((message, i) => (
            <div key={i} className={message.isBot ? "chat bot" : "chat"}>
              <img
                className="chatImg"
                src={message.isBot ? gptImgLogo : userIcon}
                alt=""
              />
              {message.isBot && message === lastMessageRef.current ? (
                <p className="txt">
                  <ReactMarkdown
                    children={displayedText.replace("HHllo", "Hello")}
                    remarkPlugins={[remarkGfm]}
                  />
                </p>
              ) : (
                <p className="txt">
                  <ReactMarkdown
                    children={message.text}
                    remarkPlugins={[remarkGfm]}
                  />
                </p>
              )}
            </div>
          ))}
          <div ref={msgEnd} />
        </div>
        <div className="chatFooter">
          <div className="inp">
            <textarea
              placeholder="Send a message"
              value={input}
              onKeyDown={handleKeyDown} 
              onChange={(e) => setInput(e.target.value)} 
              rows={3} 
              style={{
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                resize: "none",
              }} 
            />
            <button className="send" onClick={handleSend}>
              <img src={sendBtn} alt="Send" />
            </button>
          </div>
          <p>
            This GenAI template may produce inaccurate information about people,
            places, or facts. For prototyping purposes only.
          </p>
        </div>
      </div>
    </div>
  );
}
export default Chatgpt;
