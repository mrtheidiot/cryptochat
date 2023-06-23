import { useState } from "react";

const useSendMessage = (ws, userId, userName) => {
  const [messageBody, setMessageBody] = useState("");

  const sendMessage = () => {
    ws.current.send(
      JSON.stringify({
        senderId: userId,
        senderName: userName,
        command: 'generic',
        body: messageBody,
      })
    );
    setMessageBody("");
  };

  return {
    messageBody,
    sendMessage,
    setMessageBody,
  };
};

export default useSendMessage;
