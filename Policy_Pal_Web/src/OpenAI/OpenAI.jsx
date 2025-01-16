import "../App.scss";
import gptLogo from "../assets/buddyLogo.jpg";
import sendBtn from "../assets/send.svg";
import userIconMia from "../assets/Mia.png";
import userIconRoxy from "../assets/Roxy.png";
import userIconChad from "../assets/Chad.png";
import gptImgLogo from "../assets/buddyLogo2.jpg";
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState(1); // For example, user with id 1 is logged in
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
      profilePicture: userIconMia,
      accountNumber: "123-456-789"
    },
    {
      id: 2,
      name: "Roxy",
      age: 28,
      accountType: "Young Professional Savings Account",
      status: "IT Specialist, Back-End Developer(Java)",
      salary: "$95,370 annually",
      car: "Owns a car that is still under mortgage for the next 3 years",
      commuting: "Drives to the office every day, living 5 km from the office",
      contract: null,
      profilePicture: userIconRoxy,
      accountNumber: "000-425-145",
      balance:"12500.50"
    },
    {
      id: 3,
      name: "Chad",
      age: 62,
      accountType: "Retirement Savings Account",
      status: "Retired Marine with 20 years of service",
      pension: "Receives a  pension of 50% of base pay",
      healthInsurance: "Has health insurance benefits",
      property: "Owns a  house that is fully paid",
      contract: null,
      profilePicture: userIconChad,
      accountNumber: "131-056-309"
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

      // Convert response to Blob
      const blob = await response.blob();

      // Pass the Blob to pdfToText for parsing
      const text = await pdfToText(blob);

      // Store the contract text dynamically
      setContent(text);

      if (!text) {
        throw new Error("PDF content is empty or could not be parsed.");
      }
    } catch (error) {
      console.error("Error loading PDF:", error);

      // Show fallback message when PDF is not accessible
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleUserSelect = (username) => {
    resetChat();
    const user = userPersona.find((user) => user.name === username);
    setLoggedInUserId(user.id);
    setSelectedUser(user);
    loadPDFContent(user.id);
    const greetingMessage = `Hello, ${user.name}! I have loaded your contract details. How can I assist you?`;
    console.log("Greeting Message: ", greetingMessage);
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: greetingMessage, isBot: true },
    ]);
  };

  useEffect(() => {
    if (isChatOpen && msgEnd.current) {
      msgEnd.current.scrollIntoView({ behavior: "auto" });
    }
  }, [isChatOpen, messages]);

  const handleSend = async () => {
    if (!selectedUser) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: "Please select a user first to start the conversation.",
          isBot: true,
        },
      ]);
      return;
    }

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

    try {
      const res = await sendMsgToOpenAI_Chat(conversation, combinedContext);

      // Add the bot's response to the chat
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: res, isBot: true },
      ]);
    } catch (error) {
      console.error("Error sending message to OpenAI:", error);
    }
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
  }, [messages]);

  const handleLogout = () => {
    navigate("/");
  };

  const toggleChat = () => {
    //setIsChatOpen(!isChatOpen);
    setIsChatOpen((prevState) => !prevState);
  };

  // Find the logged-in user from the userPersona array
  const loggedInUser = userPersona.find((user) => user.id === loggedInUserId);

  const [isVisible, setIsVisible] = useState(false);

  // Simulate text appearing after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500); // Delay transition by 500ms

    return () => clearTimeout(timer);
  }, []);

  const clientData = {
    name: loggedInUser.name,
    accountNumber: loggedInUser.accountNumber,
    accountType: loggedInUser.accountType,
    balance: 12500.5,
    transactions: [
      { date: "2025-01-10", description: "Deposit", amount: 2000 },
      { date: "2025-01-08", description: "ATM Withdrawal", amount: -150 },
      { date: "2025-01-05", description: "Transfer to Savings", amount: -1000 },
      { date: "2025-01-01", description: "Direct Deposit", amount: 3000 },
    ],
  };

  return (
    <div className="App">
      <div className="appTitle">
        <img src={gptLogo} alt="logo" className="logo" />
        <div className={`text-container ${isVisible ? "visible" : ""}`}>
          Bank-bot that Understands financial Dreams, Decisions, Ideas, and
          Expectations
        </div>
      </div>
      <div className="sidebar">
        <div className="upperSide">
          <div className="upperSideTop">
            {loggedInUser ? (
              <div className="userborder">
                <img
                  className="userlogo"
                  src={loggedInUser.profilePicture}
                  alt="Profile"
                />
              </div>
            ) : (
              <p>Please log in to see your details.</p>
            )}
            <button className="logoutBtn" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </div>
        <div className="client-bank-info-container">
          <h2>Client Banking Information</h2>
          <div className="account-summary">
            <div className="info-group">
              <label>Account Holder:</label>
              <p>{clientData.name}</p>
            </div>
            <div className="info-group">
              <label>Age:</label>
              <p>{loggedInUser.age}</p>
            </div>
            <div className="info-group">
              <label>Account Number:</label>
              <p>{clientData.accountNumber}</p>
            </div>

            <div className="info-group">
              <label>Account Type:</label>
              <p>{clientData.accountType}</p>
            </div>

            <div className="info-group">
              <label>Account Balance:</label>
              <p>${clientData.balance.toFixed(2)}</p>
            </div>
          </div>

          <div className="transactions">
            <h3>Recent Transactions</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {clientData.transactions.map((transaction, index) => (
                  <tr key={index}>
                    <td>{transaction.date}</td>
                    <td>{transaction.description}</td>
                    <td
                      className={
                        transaction.amount < 0 ? "negative" : "positive"
                      }
                    >
                      ${transaction.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="main">
        <button className="logoutBtn" onClick={handleLogout}>
          Log Out
        </button>
        <div
          className={`chatBubble ${isChatOpen ? "open" : ""}`}
          onClick={toggleChat}
        >
          <div className="chatIcon">
            <img src={gptImgLogo} alt="Chat Icon" />
          </div>
        </div>

        {isChatOpen && (
          <div className={"chatWindow"}>
            <div className="chats">
              {messages.map((message, i) => (
                <div key={i} className={message.isBot ? "chat bot" : "chat"}>
                  <img
                    className="chatImg"
                    src={
                      message.isBot ? gptImgLogo : loggedInUser.profilePicture
                    }
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    } else if (e.key === "Enter" && e.shiftKey) {
                      setInput((prevInput) => prevInput + "\n");
                    }
                  }}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default Chatgpt;
