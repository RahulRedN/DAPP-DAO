import { useContext, useEffect, useState } from "react";

import { ethers } from "ethers";

import classes from "./Home.module.css";
import { Link, useOutletContext } from "react-router-dom";
import DAPP from "./DAPP_Context";

const Home = () => {
  const { state, account } = useContext(DAPP);
  const { theme } = useOutletContext();

  const [isStakeholder, setIsStakeholder] = useState(false);
  const [value, setValue] = useState("");
  const [details, setDetails] = useState({ balance: 0, contribution: 0 });

  const [isLoading, setIsLoading] = useState(false);

  const [filter, setFilter] = useState({
    all: true,
    open: false,
    close: false,
  });

  const [protocols, setProtocols] = useState([]);

  const [protocolDetails, setProtocolDetails] = useState([]);

  const update = async (contract) => {
    try {
      const isStakeholdr = await contract.isStakeholder();
      const contributions = await contract.getContributions();
      const contributionInEth = ethers.formatUnits(contributions, 18);
      if (isStakeholdr) {
        setIsStakeholder(true);
        const tokenBalance = await contract.getStakeholderTokens();

        setDetails({
          balance: Math.floor(ethers.formatUnits(tokenBalance, 18)),
          contribution: contributionInEth,
        });
      } else {
        setIsStakeholder(false);
        setDetails({ balance: 0, contribution: contributionInEth });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getProtocolDetails = async (contract) => {
    try {
      const res = await contract.getProtocols();
      setProtocols(res);
      setProtocolDetails(res);
    } catch (error) {
      console.error(error);
    }
  };

  const contributeHandler = async (e) => {
    e.preventDefault();
    const { contract } = state;
    // console.log(contract);
    try {
      setIsLoading(true);
      const valueInWei = ethers.parseEther(value);

      // Send transaction to the contribute function of the contract
      const tx = await contract.contribute({ value: valueInWei });

      // Wait for the transaction to be mined
      await tx.wait();

      console.log("Contribution successful!");
      alert("Contribution Successful");

      // After a successful contribution, update the UI
      update(contract);
      setValue("");
    } catch (error) {
      alert("Contribution failed:", error.message);
      console.error("Contribution failed:" + error.reason);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const { contract } = state;

    if (contract) {
      update(contract);
      getProtocolDetails(contract);
    }
  }, [state]);

  const formatDate = (timestamp) => {
    timestamp = Number(timestamp);
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const handleCase = (protocol) => {
    console.log(protocol.decided);
    if (protocol.decided) {
      if (protocol.passed) {
        return <span className={classes.passed}>passed</span>;
      } else {
        return <span className={classes.reject}>rejected</span>;
      }
    }
  };

  return (
    <div className={classes.container}>
      <div className={classes.contributeCont}>
        <div className={classes.user}>
          {!isStakeholder ? (
            <p style={{ fontSize: "larger" }}>
              Contribute atleast <strong>0.5 Eth</strong> to become a
              stakeholder and take part in decision making.
            </p>
          ) : (
            <>
              <h2>Welcome Stakeholder!</h2>
              <p>
                Current Balance : <strong>{details.balance} GT</strong>
              </p>
            </>
          )}
          <p>
            Total Contributions : <strong>{details.contribution} Eth</strong>
          </p>
        </div>
        <hr />
        <form
          className={classes.contribute + " " + (theme ? classes.dark : "")}
        >
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Ex:- 2.3 Eth"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
            }}
          />
          <button type="submit" onClick={contributeHandler}>
            {isLoading ? (
              <img style={{ width: "20px" }} src="./Rolling.gif" />
            ) : (
              "Contribute"
            )}
          </button>
        </form>
      </div>
      <div className={classes.protocols}>
        <h1 className={classes}>
          {protocols?.filter((protocol) => !protocol.decided).length}{" "}
          protocol(s) currently open
        </h1>
        <div className={classes.filter}>
          <button
            className={filter.all ? classes.active : ""}
            onClick={() => {
              setProtocolDetails(protocols);
              setFilter({ all: true, open: false, close: false });
            }}
          >
            All
          </button>
          <button
            className={filter.open ? classes.active : ""}
            onClick={() => {
              setProtocolDetails(
                protocols.filter((protocol) => !protocol.decided)
              );
              setFilter({ all: false, open: true, close: false });
            }}
          >
            Open
          </button>
          <button
            className={filter.close ? classes.active : ""}
            onClick={() => {
              setProtocolDetails(
                protocols.filter((protocol) => protocol.decided)
              );
              setFilter({ all: false, open: false, close: true });
            }}
          >
            Closed
          </button>
        </div>
        <div className={classes.tableCont}>
          <table className={classes.table + " " + (theme ? classes.dark : "")}>
            <thead>
              <tr>
                <th>Created By</th>
                <th>Title</th>
                <th>Expires</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {protocolDetails?.length > 0 ? (
                [...protocolDetails].reverse().map((protocol) => (
                  <tr key={protocol.id}>
                    <td>{protocol.proposer}</td>
                    <td>{protocol.title}</td>
                    <td>{formatDate(protocol.duration)}</td>
                    <td>
                      <Link
                        to={`/protocol?id=${protocol.id}`}
                        className={classes.view}
                      >
                        view
                      </Link>
                      {handleCase(protocol)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>
                    No protocols available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Home;
