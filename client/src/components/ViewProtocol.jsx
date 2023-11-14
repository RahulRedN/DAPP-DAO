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

  useEffect(() => {
    const { contract, account } = state;
    const loadData = async () => {
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

    if (contract) {
      loadData();
    }
  }, [state]);

  const formatDate = (timestamp) => {
    timestamp = Number(timestamp);
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
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
                label: "Yes",
                color: "#00ff00",
              },
              {
                data: [protocol ? Number(protocol?.downvotes) : 0],
                label: "No",
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
            placeholder="Ex- 2"
          />
        </div>
        <div className={classes.choice}>
          <button className={classes.up}>Upvote</button>{" "}
          <button className={classes.down}>Downvote</button>
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
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {votes?.reverse().map((obj, idx) => (
              <tr key={idx}>
                <td>{obj.voter}</td>
                <td>{formatDate(obj.timestamp)}</td>
                <td>{`${obj.choosen}`}</td>
                <td>{obj.numVotes}</td>
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
