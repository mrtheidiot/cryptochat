import ClientList from "../components/ClientsList";
import { useNavigate, generatePath } from "react-router-dom";
import { v4 as uuid } from "uuid";
import { useState } from "react";

const Home = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const onCreateNewRoomHandler = async () => {
    const userData = {
      user1Id: uuid(),
      user1Name: name,
    };

    const response = await fetch("http://localhost:8000/createroom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    await response.json().then((res) => {
      if (res.status === "okokok") {
        const pathname = generatePath(
          `/c/chatroom?user1Id=${userData.user1Id}&user1Name=${userData.user1Name}`
        );
        navigate(pathname);
      } else return;
    });
  };

  return (
    <>
      <div className="home_name">
        <label htmlFor="imie">Imie: </label>
        <input
          style={{ marginTop: "10px", marginBottom: "10px" }}
          type="tex"
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
      </div>
      <main className="home_main">
        <div>
          Wybierz pokoj z listy:
          <ClientList name={name} />
        </div>
        <div>
          ... lub utwórz swój! <br />
          <br />
          <button
            disabled={!name}
            type="button"
            onClick={onCreateNewRoomHandler}
          >
            Utworz pokoj:
          </button>
        </div>
      </main>
    </>
  );
};

export default Home;
