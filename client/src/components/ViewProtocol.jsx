import React, { useContext, useEffect, useState } from "react";

import classes from "./ViewProtocol.module.css";

import DAPP from "./DAPP_Context";
import { useOutletContext, useSearchParams } from "react-router-dom";

import { BarChart } from "@mui/x-charts/BarChart";

const ViewProtocol = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const id = searchParams.get("id");

  const { state } = useContext(DAPP);
  const { theme } = useOutletContext();

  const [protocol, setProtocol] = useState({});
  const [votes, setVotes] = useState([]);

  const [vote, setVote] = useState("");

  const loadData = async (contract) => {
    try {
      const res = await contract.getProtocol(id);
      const res1 = await contract.getVotesOf(id);
      setProtocol(res);
      setVotes(res1);
    } catch (error) {
      console.error(error);
      alert("Error : " + error.message);
    }
  };

  useEffect(() => {
    const { contract } = state;

    if (contract) {
      loadData(contract);
    }
  }, [state]);

  const formatDate = (timestamp) => {
    timestamp = Number(timestamp);
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const upvoteHandler = async () => {
    const { contract } = state;
    if (vote == "") {
      alert("Please Select Votes!");
      return;
    }
    try {
      const voteValue = Number(vote);

      // Call the contract function to register an upvote
      await contract.performVote(id, true, voteValue);

      // Reload the data after voting
      loadData(contract);
      alert("Upvoting Succesful!");
    } catch (error) {
      console.log(error.message);
      alert("Error Upvoting: " + error.reason);
      if (error.reason == "Protocol duration expired") {
        alert("Please Execute Protocol");
        try {
          await contract.executeProposal(id);
          alert("Executed!");
        } catch (error) {
          alert("Not Executed");
          console.error(error);
        }
      }
    }
    setVote("");
  };

  const downvoteHandler = async () => {
    const { contract } = state;
    if (vote == "") {
      alert("Please Select Votes!");
      return;
    }
    try {
      const voteValue = Number(vote);

      // Call the contract function to register an upvote
      await contract.performVote(id, false, voteValue);

      // Reload the data after voting
      loadData(contract);
      alert("Upvoting Succesful!");
    } catch (error) {
      console.log(error.message);
      alert("Error Downvoting: " + error.reason);
      if (error.reason == "Protocol duration expired") {
        alert("Please Execute Protocol");
        try {
          await contract.executeProposal(id);
          alert("Executed!");
        } catch (error) {
          alert("Not Executed");
          console.error(error);
        }
      }
    }
    setVote("");
  };

  return (
    <div className={classes.container}>
      <div className={classes.protocolCont}>
        <p>
          <strong>Title:</strong> {protocol?.title}
        </p>
        <p>
          <strong style={{ marginBottom: "0.1rem" }}>Description: </strong>
          <br />
          {protocol?.description}
        </p>
        <div className={classes.voting + " " + (theme ? classes.dark : "")}>
          <BarChart
            series={[
              {
                data: [protocol ? Number(protocol?.upvotes) : 0],
                label: "Upvotes",
                color: "#00ff00",
              },
              {
                data: [protocol ? Number(protocol?.downvotes) : 0],
                label: "Downvotes",
                color: "red",
              },
            ]}
            height={400}
            width={500}
          />
        </div>
      </div>
      <div className={classes.vote}>
        <div className={classes.row}>
          <label>Number of Votes : </label>
          <input
            type="number"
            min={0}
            step={1}
            value={vote}
            onChange={(e) => setVote(e.target.value)}
            placeholder="Ex: 2"
          />
        </div>
        <div className={classes.choice}>
          <button className={classes.up} onClick={upvoteHandler}>
            Upvote
          </button>{" "}
          <button className={classes.down} onClick={downvoteHandler}>
            Downvote
          </button>
        </div>
      </div>
      <hr />
      <div className={classes.tableCont}>
        <table className={classes.table + " " + (theme ? classes.dark : "")}>
          <thead>
            <tr>
              <th>Voter</th>
              <th>timestamp</th>
              <th>Chosen</th>
              <th>Number Of Votes</th>
            </tr>
          </thead>
          <tbody>
            {[...votes]?.reverse().map((obj, idx) => (
              <tr key={idx}>
                <td>{obj.voter}</td>
                <td>{formatDate(obj.timestamp)}</td>
                <td style={{ color: obj.choosen ? "#00c300" : "red" }}>
                  {obj.choosen ? "Upvote" : "Downvote"}
                </td>
                <td>{Number(obj.numVotes)}</td>
              </tr>
            ))}
            {votes.length == 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center" }}>
                  ...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewProtocol;
