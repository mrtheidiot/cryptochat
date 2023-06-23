import { useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import useSendMessage from "../hooks/useSendMessage";

import { JSEncrypt } from "jsencrypt";
import CryptoJS from "crypto-js";

import { sendAESEncryptedMessage } from "../lib/sendAesEncriptedMessage";
import { sendAESEncryptedMessageWithShortcut } from "../lib/sendAESEncryptedMessageWithShortcut";

const User2View = ({ setActions }) => {
  const [connectionEstablished, setConnectionEstablished] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(false);

  const [searchPrams] = useSearchParams();
  const user1Id = searchPrams.get("user1Id");
  const user1Name = searchPrams.get("user1Name");
  const user2Name = searchPrams.get("user2Name");
  const user2Id = searchPrams.get("user2Id");
  const [messages, setMessages] = useState([]);
  const [keysexchanges, setKeysexchanges] = useState(false);
  const ws = useRef();

  const secredAESKey = useRef("demo aes key");
  const user1PublicKey = useRef("d");

  // ######################### encyprtions

  const rsaPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
    MIICXgIBAAKBgQCtw8KhcCNhdddd8Jjn3XYv3QgIuULRTodELntMYoXpsfUJjUZb
    UCGRDfQLzpumLRxWruCCS1iPH7sLbF+NS52UWd/sLiC6+RFEl1h42rYBoDRnNoQY
    hZ+hicCO3PrA8RPVIZVSe+aSSme+K4up/mY7wyLv0SJqJavA/mSiwPfB5wIDAQAB
    AoGBAK2SNgB8u1rHE3JKuvIhTcVRzIyqQgxBnOyGYbNTVuCxWktIS1c7G8yBW53P
    q7q6pOwRk0GTccrFr1khz/Cb77JsmNbgi3CTmYGmS6ffWpVU8tuY3GqWnwtQ8Vw5
    7j1NZ5q/Fs4MNBXfIZ7wUpGPOhBRjEeAf1RVGYk6l65DhkhBAkEA+1gG6g9KDobO
    nHYOYjxA5ekn3pwFouQVIpzEHLonZ5EdjuVpNeBlfGmzO6mDPtnwNoipTMVtn0mE
    Fy/k5M+UswJBALD70mVgfgcwb2k8JYoUP35qN4H75QLK7srTJubg/2qFGBcjnK15
    IxAJH/vcAyO82aj1pyrE9O/SBgOj1D8/f/0CQQDU18RzLSNfjdUlNewUUEX87Cax
    Ipq7SD6Fow+H7DQ2RfMr8SXZU/9dDf2Txoa4EMKUy8Him0WroAvVvt8szIR1AkBp
    MiUKkOIYD9gI6vE9M2/SCfxYTIsAr/JjqEIVNWNbwyRgjJBSJBCNNX9HSqyrD1Mo
    tGraZxtXeLSOcVB1D59ZAkEAp1/+AQcShYVtrnxeuSyelXPXzz+5mxlsSl385H6r
    XO5XMxWXoMwZblIVGsFy9/1P0+JrM/MI4RISlpQBQg3zSA==
    -----END RSA PRIVATE KEY-----`;

  const rsaPublicKey = `-----BEGIN PUBLIC KEY-----
    MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCtw8KhcCNhdddd8Jjn3XYv3QgI
    uULRTodELntMYoXpsfUJjUZbUCGRDfQLzpumLRxWruCCS1iPH7sLbF+NS52UWd/s
    LiC6+RFEl1h42rYBoDRnNoQYhZ+hicCO3PrA8RPVIZVSe+aSSme+K4up/mY7wyLv
    0SJqJavA/mSiwPfB5wIDAQAB
    -----END PUBLIC KEY-----`;

  // const secredAESKey = "AGoQubyU+uST3nSF4LPhyl7AU3YyiZvFdNRRiqDvl6U=";

  const { messageBody, sendMessage, setMessageBody } = useSendMessage(
    ws,
    user2Id,
    user2Name
  );

  let decrypt = new JSEncrypt();
  decrypt.setPrivateKey(rsaPrivateKey);

  const onStartConnectionHandler = async () => {
    const data = {
      user1Id,
      user2Id,
      user2Name,
    };

    const response = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    let result = await response.json();

    if (result.status === "okok") setConnectionStatus(true);
  };

  const onSendMessageHandler = () => {
    setMessages((prev) => [...prev, { senderId: user2Id, body: messageBody }]);
    sendMessage();
  };

  useEffect(() => {
    if (connectionStatus === true) {
      wsConnection();
      setConnectionEstablished(true);
    }
  }, [connectionStatus]);

  const wsConnection = () => {
    ws.current = new WebSocket(`ws://localhost:8000/chat/ws/${user2Id}`);

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

        case "request_public_key":
          setActions(
            "Otrzymano klucz publiczny, oraz prośbę o klucz publiczny."
          );

          user1PublicKey.current = JSON.parse(message).publicKey;
          console.log(user1PublicKey.current);

          setKeysexchanges(true);

          ws.current.send(
            JSON.stringify({
              senderId: user2Id,
              senderName: user2Name,
              command: "public_key",
              publicKey: rsaPublicKey,
            })
          );

          setActions("Klucz publiczny User2 został wysłany.");
          setActions("---------------------");

          break;

        case "encrypted_secred_key":
          setActions(
            "Otrzymano sekretny klucz AES zaszyfrowany moim kluczem publicznym."
          );
          const encryptedSecretKey = JSON.parse(message).encryptedSecretKey;
          const unencrypted = decrypt.decrypt(encryptedSecretKey);
          secredAESKey.current = unencrypted;

          setActions(
            "Klucz publiczny przed deszyfracją: " + encryptedSecretKey
          );
          setActions("Klucz publiczny po deszyfracji: " + unencrypted);
          setActions("---------------------");
          break;

        case "aes_ecrytped_mesage":
          const message2 = JSON.parse(message).aesEcryptedMessage;

          setActions("Otrzymano wiadomość zaszyfrowaną AES");
          setActions("Wiadomość przed deszyfracją: " + message2);

          let decryptedMessage = CryptoJS.AES.decrypt(
            message2,
            secredAESKey.current
          );
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

          let decryptedMessage3 = CryptoJS.AES.decrypt(
            message3,
            secredAESKey.current
          );
          let decryptedMessage_plantext3 =
            CryptoJS.enc.Utf8.stringify(decryptedMessage3).toString();

            setActions(
              "Wiadomość po deszyfracj AES: " + decryptedMessage_plantext3
            );

          const messageShortcutSHA256 = CryptoJS.SHA256(
            decryptedMessage_plantext3
          );

          setActions(
            "Skró† z wiadomości zdeszyfrowanej: " + messageShortcutSHA256
          );

          const encryptedShortcut = JSON.parse(message).encryptedShortcut;
          setActions("Zaszyfrowany RSA skrót: " + encryptedShortcut);

          const unencrypted3 = decrypt.decrypt(encryptedShortcut);
          setActions("Zdeszyfrowany RSA skrót: " + unencrypted3);

          console.log("unencrypted: " + unencrypted3);
          console.log(unencrypted3);

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

  const contentPreConnection = (
    <div>
      <h2>Click here to start the chat and connection:</h2>
      <button type="button" onClick={onStartConnectionHandler}>
        Start the connection
      </button>
    </div>
  );

  const formatedMessages = messages.map((message, i) => {
    if (message.senderId === user1Id) {
      return (
        <p key={i} style={{ textAlign: "left", marginLeft: "5px" }}>
          {message.body}
        </p>
      );
    }
    return (
      <p key={i} style={{ textAlign: "right", marginRight: "5px" }}>
        {message.body}
      </p>
    );
  });

  const contentPostConnection = (
    <>
      <div className="messages">{formatedMessages}</div>
      <div>Klucz AES: {secredAESKey.current}</div>
      <div className="buttons_user1">
        <input
          type="text"
          value={messageBody}
          onChange={(e) => setMessageBody(e.target.value)}
        />{" "}
        <br />
        <button onClick={onSendMessageHandler}>Wyślij bez szyfrowania</button>
        <br />
        <button
          onClick={() => {
            console.log(secredAESKey.current);
          }}
        >
          check state
        </button>
        <br />
        <button
          disabled={!keysexchanges}
          onClick={() =>
            sendAESEncryptedMessage(
              ws,
              messageBody,
              secredAESKey.current,
              user2Id,
              user2Name,
              setMessages
            )
          }
        >
          Wslij wiadomosc z szyfrowaniem AES
        </button>
        <br />
        <button
          disabled={!keysexchanges}
          onClick={() =>
            sendAESEncryptedMessageWithShortcut(
              ws,
              messageBody,
              secredAESKey.current,
              user2Id,
              user2Name,
              user1PublicKey.current,
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
        <p>Your Name: {user2Name}</p>
        <p>Your responder Name: {user1Name}</p>
      </div>
      {!connectionEstablished && contentPreConnection}
      {connectionEstablished && contentPostConnection}
    </>
  );
};

export default User2View;

// case "aes_ecrytped_mesage_with_shortcut":
//   const message3 = JSON.parse(message).aesEcryptedMessage;

//   console.log("user 2 secret key" + secredAESKey.current);

//   let decryptedMessage3 = CryptoJS.AES.decrypt(
//     message3,
//     secredAESKey.current
//   );
//   let decryptedMessage_plantext3 =
//     CryptoJS.enc.Utf8.stringify(decryptedMessage3).toString();

//   // const messageShortcut = decryptedMessage_plantext3.toString();
//   // console.log("Message shortcut:" + messageShortcut);

//   const messageShortcutSHA256 = CryptoJS.SHA256(decryptedMessage_plantext3);
//   console.log("Message shortcut SHA256:" + messageShortcutSHA256);

//   const encryptedShortcut = JSON.parse(message).encryptedShortcut;
//   console.log(encryptedShortcut);

//   const unencrypted3 = decrypt.decrypt(encryptedShortcut);

//   console.log("unencrypted: " + unencrypted3);
//   console.log(unencrypted3);

//   const equal = messageShortcutSHA256 === unencrypted3

//   setActions("Czy klucze są równe? " + equal);

//   if (equal) {
//     const newMessage3 = {
//       senderId: messageObj.senderId,
//       senerName: messageObj.senderName,
//       body: decryptedMessage_plantext3,
//     };
//     setMessages((prev) => [...prev, newMessage3]);
//   }
//   setActions("---------------------");
//   break;
