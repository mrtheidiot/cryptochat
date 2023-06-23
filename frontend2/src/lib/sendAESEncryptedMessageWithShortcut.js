import CryptoJS from "crypto-js";
import JSEncrypt from "jsencrypt";

export const sendAESEncryptedMessageWithShortcut = (
  ws,
  messageBody,
  key,
  userId,
  userName,
  rsaPublicKey,
  setMessages
) => {
  var aesEcryptedMessage = CryptoJS.AES.encrypt(
    JSON.stringify(messageBody),
    key
  ).toString();

  var hash = CryptoJS.SHA256(`"${messageBody}"`).toString();

  console.log("hash z messageBody: " + hash);

  console.log(hash);

  var encrypt = new JSEncrypt();
  encrypt.setPublicKey(rsaPublicKey);
  var encryptedShortcut = encrypt.encrypt(hash);

  console.log("Encrypted message 1: " + encryptedShortcut);

  const newMessage = {
    senderId: userId,
    senerName: userName,
    body: messageBody
  };
  setMessages((prev) => [...prev, newMessage]);

  ws.current.send(
    JSON.stringify({
      senderId: userId,
      senderName: userName,
      command: "aes_ecrytped_mesage_with_shortcut",
      aesEcryptedMessage: aesEcryptedMessage,
      encryptedShortcut: encryptedShortcut,
    })
  );
};
