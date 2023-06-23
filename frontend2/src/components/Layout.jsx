import { Outlet, useNavigate } from "react-router-dom";

const Layout = () => {
  const navigate = useNavigate();

  const onDeleteRoomsHandler = async () => {
    const response = await fetch("http://localhost:8000/deleterooms");
    await response.json().then(res => navigate('/'));
  };

  return (
    <>
      <div className="layout_topbar">
        <h3>PROJEKT ZALICZENIOWY NA PRZEDMIOT KRYPTOGRAFIA</h3>
        <h3>Piotr Ginda, 22272, Informatyka 3 rok</h3>
      </div>
      <p className="layout_paragraph">
        Aby rozpocząć połączenie, nalezy otworzyc strone na 2 przegladarkach. po
        wpisaniu imienia, oraz kliknieciu w jednej "Utworz pokoj", na drugiej
        pojawi sie imie. Na to imie nalezy kliknac aby dolaczyc do pokoju. W
        kazdej chwili mozna usunac wszystkie pokoje, klikajac{" "}
        <button onClick={onDeleteRoomsHandler}>tutaj.</button>
      </p>
      <Outlet />
    </>
  );
};
export default Layout;
