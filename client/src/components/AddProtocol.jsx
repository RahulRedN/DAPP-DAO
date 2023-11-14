import React, { useState, useContext } from "react";
import DAPP from "./DAPP_Context";

import classes from "./AddProtocol.module.css";
import { useOutletContext } from "react-router-dom";
import { ethers } from "ethers";

const AddProtocol = () => {
  const { theme } = useOutletContext();
  const { state, account } = useContext(DAPP);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [err, setError] = useState("");

  const createProtocol = async () => {
    const { contract } = state;
    try {
      // Ensure the contract is available
      if (!contract) {
        console.log("contract");
        setError("Contract not available");
        return;
      }

      // Validate title and description
      if (!title.trim() || !description.trim()) {
        setError("Title and description are required");
        console.log("fiels");
        return;
      }

      // Ensure the user is a stakeholder and has a sufficient balance
      const isStakeholder = await contract.isStakeholder();
      const balance = await contract.balanceOf(account);
      if (!isStakeholder || ethers.formatUnits(balance, 18) < 1) {
        setError(
          "Not a stakeholder or insufficient balance for protocol proposal"
        );
        return;
      }

      // Call the createProtocol function on the contract
      await contract.createProtocol(title, description);

      alert("Protocol Created!");
      console.log("Protocol created successfully!");
    } catch (error) {
      console.error("Error creating protocol:", error.message);
      alert("Error creating protocol:" + error.reason);
    }

    setError("");
  };

  return (
    <div className={`${classes.container} ${theme ? classes.dark : ""}`}>
      <div>
        <h2>Create Protocol</h2>
      </div>
      {err != "" ? (
        <div className={classes.error}>{err}</div>
      ) : (
        <div>&nbsp;</div>
      )}
      <div>
        <label>Title:</label>
      </div>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter protocol title"
      />
      <br />
      <div style={{ textAlign: "left" }}>
        <label>Description:</label>
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter protocol description"
        rows={10}
      />
      <br />
      <button onClick={createProtocol}>Create Protocol</button>
    </div>
  );
};

export default AddProtocol;
