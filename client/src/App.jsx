import { ethers } from "ethers";
import { useEffect, useState, createContext } from "react";

import Layout from "./components/Layout";
import Home from "./components/Home";
import AddProtocol from "./components/AddProtocol";

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

const Router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="/add" element={<AddProtocol />} />
      <Route path="/protocol" element={<ViewProtocol />} />
    </Route>
  )
);

import abi from "./contractJSON/DAO.json";
import DAPP from "./components/DAPP_Context";
import ViewProtocol from "./components/ViewProtocol";

function App() {
  const [state, setState] = useState({
    provider: null,
    signer: null,
    contract: null,
  });

  const [account, setAccount] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const contractAddress = "0x0c2475bbA6E118bFE99252AFEaA59Ad4E2E7d1f1";
      const contractABI = abi.abi;

      try {
        //Metamask
        const { ethereum } = window;
        const account = await ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(account[0]);
        window.ethereum.on("accountsChanged", (accounts) => {
          setAccount(accounts[0]);
        });

        const provider = new ethers.BrowserProvider(ethereum);

        const signer = await provider.getSigner();

        const contract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        setState({ provider, signer, contract });
      } catch (error) {
        console.error(error);
      }
    };

    loadData();
  }, [account]);

  return (
    <DAPP.Provider value={{ state, setState, account, setAccount }}>
      <RouterProvider router={Router} />
    </DAPP.Provider>
  );
}

export default App;
