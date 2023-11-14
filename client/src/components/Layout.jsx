import React, { useContext, useState } from "react";

import classes from "./Layout.module.css";

import { BsFillSunFill, BsFillMoonFill } from "react-icons/bs";

import { Outlet, NavLink } from "react-router-dom";
import DAPP from "./DAPP_Context";

const Layout = () => {
  const { account } = useContext(DAPP);
  const [theme, setTheme] = useState(true);
  return (
    <>
      <div
        className={classes.navContainer + " " + (theme ? classes.dark : " ")}
      >
        <nav className={classes.navbar + " " + (theme ? classes.dark : " ")}>
          <NavLink to={"/"} className={classes.logo}>
            DAO
          </NavLink>
          <div className={classes.select}>
            <div
              className={classes.theme}
              onClick={() => {
                setTheme((state) => !state);
              }}
            >
              {theme ? <BsFillSunFill /> : <BsFillMoonFill />}
            </div>
            <NavLink to={"/add"}>Propose Protocol</NavLink>
            <div className={classes.account}>
              {account
                ? `${account.substring(0, 5)}...${account.substring(
                    account.length - 3
                  )}`
                : "Login using Metamask"}
            </div>
          </div>
        </nav>
      </div>
      <div className={classes.content + " " + (theme ? classes.dark : " ")}>
        <Outlet context={{ theme }} />
      </div>
    </>
  );
};

export default Layout;
