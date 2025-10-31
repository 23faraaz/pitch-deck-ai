import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/glass.css";
import Navbar from "./components/ui/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CardDetail from "./pages/CardDetail.jsx";

const Router = () => {
  const [route, setRoute] = React.useState(window.location.hash.replace('#', '') || '/');
  React.useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash.replace('#', '') || '/');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  let Page = Home;
  if (route.startsWith('/dashboard')) Page = Dashboard;
  if (route.startsWith('/detail')) Page = CardDetail;

  return (
    <>
      <Navbar
        left={
          <>
            <a href="#/" className="button">Home</a>
            <a href="#/dashboard" className="button">Dashboard</a>
            <a href="#/detail" className="button">Card Detail</a>
          </>
        }
      />
      <div className="page-enter page-enter-active">
        <Page />
      </div>
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
