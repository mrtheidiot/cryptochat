import CryptoJS from "crypto-js";

export const sendAESEncryptedMessage = (ws, messageBody, key, userId, userName, setMessages) => {
  var aesEcryptedMessage = CryptoJS.AES.encrypt(
    JSON.stringify(messageBody),
    key
  ).toString();

  const newMessage = {
    senderId: userId,
    senerName: userName,
    body: messageBody
  };
  setMessages((prev) => [...prev, newMessage]);

  console.log(aesEcryptedMessage);
  ws.current.send(
    JSON.stringify({
      senderId: userId,
      senderName: userName,
      command: "aes_ecrytped_mesage",
      aesEcryptedMessage: aesEcryptedMessage,
    })
  );
};
