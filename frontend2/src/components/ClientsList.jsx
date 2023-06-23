import { useState, useEffect } from "react";
import { useNavigate, generatePath } from "react-router-dom";
import { v4 as uuid } from "uuid";

const ClientList = (props) => {
  const [clientList, setClientList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const getClientsData = async () => {
      const response = await fetch("http://localhost:8000/clients");
      const data = await response.json();
      const result = JSON.parse(data);
      setClientList(result);
    };
    getClientsData();
  }, []);

  const onOpenChatHandler = (e) => {
    const user1Id = e.target.getAttribute("data-arg1");
    const user1Name = e.target.getAttribute("data-arg2");
    const user2Id = uuid();
    const pathname = generatePath(
      `/c/chat?user1Id=${user1Id}&user2Id=${user2Id}&user1Name=${user1Name}&user2Name=${props.name}`
    );
    navigate(pathname);
  };

  const content = clientList.length ? (
    clientList
      .filter((client) => client.user1Name)
      .map((client, i) => (
        <button
          data-arg1={client.user1Id}
          data-arg2={client.user1Name}
          key={i}
          type="button"
          onClick={onOpenChatHandler}
          disabled={!props.name}
        >
          {client.user1Name}
        </button>
      ))
  ) : (
    <p>Brak dostępnych pokoi!</p>
  );

  return <div className="clientList_list">{content}</div>;
};

export default ClientList;
