import './App.css';
import gptLogo from './assets/chatgpt.svg';
import addBtn from './assets/add-30.png';
import msgIcon from './assets/message.svg';
import sendBtn from './assets/send.svg';
import userIcon from './assets/user-icon.png';
import gptImgLogo from './assets/chatgptLogo.svg';
import pdf from './assets/pdf.png';
import { useEffect, useState, useRef } from 'react';
import { sendMsgToOpenAI_Chat } from './server';
import pdfToText from 'react-pdftotext';

function App() {

  const msgEnd = useRef(null);

  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      text: 'Hi Ganda, I am OpenAI! How can I help?',
      isBot: true,
    }
  ]);


  const extractText = (event) => {
    const file = event.target.files[0];
    setFileName(file.name);
    pdfToText(file)
      .then(text => setContent(text))
      .catch(error => console.error("Failed to extract text from pdf. Error = " + error));
  }

  const fileData = () => {
    if (fileName !== '') {
      return (
        <div>
          <img src={pdf} alt="home" className="listItemsImg" /><p> {fileName}</p>
        </div>
      )
    } else {
      <div>
      </div>
    }
  };


  const handleEnter = async (e) => {
    if (e.key === 'Enter') await handleSend();
  }

  useEffect(() => {
    msgEnd.current.scrollIntoView();
  }, [messages]);

  const handleSend = async () => {
    const text = input;
    setInput('');
    setMessages([
      ...messages,
      { text, isBot: false }
    ]);
    console.log("handleSend");
    const res = await sendMsgToOpenAI_Chat(text, content);
    setMessages([
      ...messages,
      { text, isBot: false },
      { text: res, isBot: true }
    ])
  }

  const handleQuery = async (e) => {

    const text = e.target.value;

    console.log("handleQuery");
    setMessages([
      ...messages,
      { text, isBot: false }
    ]);
    const res = await sendMsgToOpenAI_Chat(text, content);
    setMessages([
      ...messages,
      { text, isBot: false },
      { text: res, isBot: true }
    ])
  }

  return (
    <div className="App">
      <div className='sidebar'>
        <div className='upperSide'>
          <div className="upperSideTop">
            <img src={gptLogo} alt="logo" className="logo" /><span className="brand">Maria's GenAI Idea</span>
          </div>
          <button className="midBtn" onClick={() => { window.location.reload() }}><img src={addBtn} alt="" className="addBtn" />New Chat</button>
          <div className="upperSideBottom">
            <button className="query" onClick={handleQuery} value={"Provide a test automation out of a swagger file"}><img src={msgIcon} alt="query" />Provide a test automation out of a swagger file</button>
            <button className="query" onClick={handleQuery} value={"How to use this OpenAI template?"}><img src={msgIcon} alt="query" />How to use this OpenAI template?</button>
          </div>
        </div>
        <div className='lowerSide'>
          <div className="listItems">Use your own files</div>
          <input type="file" accept="application/pdf" onChange={extractText} className="uploadBtn" />
          {fileData()}
        </div>
      </div>
      <div className='main'>
        <div className="chats">
          {messages.map((message, i) =>
            <div key={i} className={message.isBot ? "chat bot" : "chat"}>
              <img className='chatImg' src={message.isBot ? gptImgLogo : userIcon} alt="" /><p className="txt">{message.text}</p>
            </div>
          )}
          <div ref={msgEnd} />
        </div>
        <div className="chatFooter">
          <div className="inp">
            <input type="text" placeholder='Send a message' value={input} onKeyDown={handleEnter} onChange={(e) => { setInput(e.target.value) }} /><button className="send" onClick={() => handleSend()}><img src={sendBtn} alt="Send" /></button>
          </div>
          <p>This GenAI template may produce inaccurate information about people, places or facts. For prototyping purposes only.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
