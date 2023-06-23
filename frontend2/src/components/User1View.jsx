import { useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import useSendMessage from "../hooks/useSendMessage";
import { sendAESEncryptedMessage } from "../lib/sendAesEncriptedMessage";
import { sendAESEncryptedMessageWithShortcut } from "../lib/sendAESEncryptedMessageWithShortcut";

import { JSEncrypt } from "jsencrypt";
import CryptoJS from "crypto-js";

const User1View = ({ setActions }) => {
  const [connectionEstablished, setConnectionEstablished] = useState(false);
  const [searchPrams] = useSearchParams();
  const user1Id = searchPrams.get("user1Id");
  const user1Name = searchPrams.get("user1Name");
  const [user2Id, setUser2Id] = useState("temp user id");
  const [user2Name, setUser2Name] = useState("unknown");
  const [messages, setMessages] = useState([]);
  const [keysexchanges, setKeysexchanges] = useState(false);
  const ws = useRef();

  const user2PublicKey = useRef("");

  // ############################# encryptions

  const rsaPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
  MIICWwIBAAKBgHMQ+gd4btvb6rBRa301cyzSYaNhnP6l4jahu10LWKjVCZ84EETw
  vRfoVnfAXyX/UaF3F9lIqjCyxbEMvwt70FeciLnCcIFOT1K01o9R/QnhMRtW5U56
  5vdr3dEuv1BC90NxlNFWPnsGCu2tjbQfubiKRNuefCtDDvSnFpXUDU2DAgMBAAEC
  gYBoKcMdhiFc+BzhFiOnCf7EYYKvw0q6nvJEIG6bUQ0mcQwvzTG1JvUWsmWsLEI2
  BIYiE8xMD2K5iOw7VV2QiLnViLZ7btKgn26MlafX19fUQDM014bUOrss0//mT2oW
  me0r7wLFiU/0D03zVbuxtII481qSq5GS7ALsR8nDdipZCQJBANHvz6NsCbPhWIJ4
  QUnXgU5qdWf6PoL8qE/3ybCq20vZ734hTxrqQwd4iBzUBE5VMvpA0wdT/b8kLd8s
  G3DOtJcCQQCMUEYpBP774V3RXSM5MFM3qDNs7IWcq+KFAZItaqivhRsctFuFWy1l
  P7RP9vV3cOq8Rwd45PJp4oz7WfGeG2/1AkEAgPaDJA3jK/gbShKbcMQM7+Hf+56z
  Nf4FWxKJeJiMnFzljSLjGFKeGIHHg4YOmxwlc6vMtuy2rOuJrlXHCZZBQwJAWJ+z
  UOFY9FrqWPzM7Kg7R6IzqQ7TbZubXYsaexktJn+aGk1IqThnudW82+0OKbzmZrku
  XQuumXaAuZmb5NNLqQJASr0wvZAyaIeEA8m5rppk495uAbW5IcGCoBZS8b1d1aEd
  Up04Ra2KtCJKYA7lXNhWJtRCUa7ZYEZUKLIO9Th5Vw==
  -----END RSA PRIVATE KEY-----`;

  const rsaPublicKey = `-----BEGIN PUBLIC KEY-----
  MIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgHMQ+gd4btvb6rBRa301cyzSYaNh
  nP6l4jahu10LWKjVCZ84EETwvRfoVnfAXyX/UaF3F9lIqjCyxbEMvwt70FeciLnC
  cIFOT1K01o9R/QnhMRtW5U565vdr3dEuv1BC90NxlNFWPnsGCu2tjbQfubiKRNue
  fCtDDvSnFpXUDU2DAgMBAAE=
  -----END PUBLIC KEY-----`;
  const aes256key = "AGoQubyU+uST3nSF4LPhyl7AU3YyiZvFdNRRiqDvl6U=";

  const onStartEncriptionHandler = () => {
    setActions("Rozpoczęto wymiane kluczy.");
    ws.current.send(
      JSON.stringify({
        senderId: user1Id,
        senderName: user1Name,
        command: "request_public_key",
        publicKey: rsaPublicKey,
      })
    );
  };

  const { messageBody, sendMessage, setMessageBody } = useSendMessage(
    ws,
    user1Id,
    user1Name
  );

  useEffect(() => {
    wsConnection();
    setConnectionEstablished(true);
  }, []);

  const onSendMessageHandler = () => {
    setMessages((prev) => [...prev, { senderId: user1Id, body: messageBody }]);
    sendMessage();
  };

  // ############################# CONNECTION

  const wsConnection = () => {
    ws.current = new WebSocket(`ws://localhost:8000/chat/ws/${user1Id}`);

    ws.current.onopen = () => {
      console.log("Connection with the Web Socket server is open.");
    };

    ws.current.onmessage = async (event) => {
      let message = await event.data.text();

      const messageObj = {
        senderId: JSON.parse(message).senderId,
        senderName: JSON.parse(message).senderName,
        command: JSON.parse(message).command,
      };

      console.log("Message command field: " + messageObj.command);

      if (user2Id === "temp user id") setUser2Id(messageObj.senderId);
      if (user2Name === "unknown") setUser2Name(messageObj.senderName);

      switch (messageObj.command) {
        case "generic":
          const newMessage = {
            senderId: messageObj.senderId,
            senerName: messageObj.senderName,
            body: JSON.parse(message).body,
          };
          setMessages((prev) => [...prev, newMessage]);

          setActions("Otrzymano wiadomość bez szyfrowania.");
          setActions("---------------------");
          break;

        case "public_key":
          const publicKey = JSON.parse(message).publicKey;
          user2PublicKey.current = publicKey;
          let encrypt = new JSEncrypt();
          encrypt.setPublicKey(publicKey);
          const encryptedPublicKey = encrypt.encrypt(aes256key);

          setActions("Orzymano klucz publiczny User2.");
          setActions("Sekretny klucz AES przed szyfrowaniem RSA: " + aes256key);
          setActions(
            "Sekretny klucz AES po zaszyrowaniu RSA: " + encryptedPublicKey
          );

          setKeysexchanges(true);

          ws.current.send(
            JSON.stringify({
              senderId: user1Id,
              senderName: user1Name,
              command: "encrypted_secred_key",
              encryptedSecretKey: encryptedPublicKey,
            })
          );
          setActions("Klucz AES wysłany");
          setActions("---------------------");
          break;

        case "aes_ecrytped_mesage":
          const message2 = JSON.parse(message).aesEcryptedMessage;

          setActions("Otrzymano wiadomość zaszyfrowaną AES");
          setActions("Wiadomość przed deszyfracją: " + message2);

          let decryptedMessage = CryptoJS.AES.decrypt(message2, aes256key);
          let decryptedMessage_plantext =
            CryptoJS.enc.Utf8.stringify(decryptedMessage);

          setActions("Wiadomość po deszyfracji: " + decryptedMessage_plantext);

          const newMessage2 = {
            senderId: messageObj.senderId,
            senerName: messageObj.senderName,
            body: decryptedMessage_plantext,
          };
          setMessages((prev) => [...prev, newMessage2]);
          setActions("---------------------");
          break;

        case "aes_ecrytped_mesage_with_shortcut":
          const message3 = JSON.parse(message).aesEcryptedMessage;

          setActions(
            "Otrzymano wiadomość zaszyfrowaną AES ze sprawdzaniem skrótu"
          );
          setActions("Wiadomość przed deszyfracją AES: " + message3);

          let decryptedMessage3 = CryptoJS.AES.decrypt(message3, aes256key);
          let decryptedMessage_plantext3 =
            CryptoJS.enc.Utf8.stringify(decryptedMessage3).toString(); // to string ?

          setActions(
            "Wiadomość po deszyfracj AES: " + decryptedMessage_plantext3
          );

          const messageShortcutSHA256 = CryptoJS.SHA256(decryptedMessage_plantext3);

          setActions(
            "Skró† z wiadomości zdeszyfrowanej: " + messageShortcutSHA256
          );

          const encryptedShortcut = JSON.parse(message).encryptedShortcut;
          setActions("Zaszyfrowany RSA skrót: " + encryptedShortcut);

          let decrypt = new JSEncrypt();
          decrypt.setPrivateKey(rsaPrivateKey);
          const unencrypted3 = decrypt.decrypt(encryptedShortcut);

          setActions("Zdeszyfrowany RSA skrót: " + unencrypted3);

          const equal = messageShortcutSHA256.toString() === unencrypted3.toString();

          setActions("Czy klucze są równe? " + equal);

          if (equal) {
            const newMessage3 = {
              senderId: messageObj.senderId,
              senerName: messageObj.senderName,
              body: decryptedMessage_plantext3,
            };
            setMessages((prev) => [...prev, newMessage3]);
          }
          setActions("---------------------");
          break;

        default:
          console.log("end");
      }
    };
  };

  const contentPreConnection = <p>Loading...</p>;

  const formatedMessages = messages.map((message, i) => {
    if (message.senderId === user1Id) {
      return (
        <p key={i} style={{ textAlign: "right", marginRight: "5px" }}>
          {message.body}
        </p>
      );
    }
    return (
      <p key={i} style={{ textAlign: "left", marginLeft: "5px" }}>
        {message.body}
      </p>
    );
  });

  const contentPostConnection = (
    <>
      <div className="messages">{formatedMessages}</div>
      <div className="buttons_user1">
        <input
          type="text"
          value={messageBody}
          onChange={(e) => setMessageBody(e.target.value)}
        />
        <button style={{ marginLeft: "5px" }} onClick={onSendMessageHandler}>
          Wyślij bez szyfrowania
        </button>
        <br />
        <button type="button" onClick={onStartEncriptionHandler}>
          Rozpocznij wymianę kluczy
        </button>{" "}
        <br />
        <button
          disabled={!keysexchanges}
          onClick={() =>
            sendAESEncryptedMessage(
              ws,
              messageBody,
              aes256key,
              user1Id,
              user1Name,
              setMessages
            )
          }
        >
          Wslij wiadomosc z szyfrowaniem AES
        </button>{" "}
        <br />
        <button
          disabled={!keysexchanges}
          onClick={() =>
            sendAESEncryptedMessageWithShortcut(
              ws,
              messageBody,
              aes256key,
              user1Id,
              user1Name,
              user2PublicKey.current,
              setMessages
            )
          }
        >
          Wslij wiadomosc z szyfr. AES oraz weryfikacją skrótu
        </button>
      </div>
    </>
  );

  return (
    <>
      <div>
        <p>Your name: {user1Name}</p>
        <p>Your responder name: {user2Name}</p>
      </div>
      {!connectionEstablished && contentPreConnection}
      {connectionEstablished && contentPostConnection}
    </>
  );
};

export default User1View;
