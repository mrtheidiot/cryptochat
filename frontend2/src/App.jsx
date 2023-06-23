import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import ChatRoom from "./components/User1View";
import Chat from "./components/User2View";
import Layout2 from "./components/Layout2";
import { useState, useRef } from "react";

function App() {
  const [actions, setActions] = useState([
    { count: 1, action: "inital cmmit" },
  ]);

  const count = useRef(1);

  const onAddAction = (newAction) => {
    const existingElement = actions.find((item) => item.action === newAction);
    if (existingElement) return;

    count.current += 1;
    const newActionObject = {
      count: count.current,
      action: newAction,
    };
    setActions((prev) => [...prev, newActionObject]);
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/c" element={<Layout2 actions={actions} />}>
            <Route path="chat" element={<Chat setActions={onAddAction} />} />
            <Route
              path="chatroom"
              element={<ChatRoom setActions={onAddAction} />}
            />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;

// secredAESKey={secredAESKey} setSecretAESKey={setSecretAESKey}
