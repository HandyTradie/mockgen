import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { observer } from "mobx-react-lite";

import UserModel from "../models/User";
import NavLinks from "./NavLink";

const auth = getAuth();

const Nav = ({ setShowMobileMenu, linkArray }) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      UserModel.clearUser();
      navigate("/auth");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <nav>
      <div className="m-auto max-w-default">
        <div className="flex items-center justify-between py-8">
          <div className="flex items-center">
            <Link to="/">
              <img className="w-[160px] md:[100px] h-auto" src="/assets/logo.png" alt="Quizmine logo" />
            </Link>
          </div>
          <div>
            <div className="hidden md:block">
              <ul className="hidden space-x-12 font-medium md:flex text-slate-headline">
                <NavLinks links={linkArray} />

                {/* Staff admin */}
                {UserModel.isLoggedIn && UserModel.isStaffAdmin && (
                  <li>
                    <Link className="font-medium transition-all duration-300 hover:text-slate-blue" to={"/admin/dashboard"}>
                      <span>{"Admin"}</span>
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
          <div className="block md:hidden">
            <img onClick={() => setShowMobileMenu(true)} className="w-6 h-6 md:w-8 md:h-8" src="/assets/heros/menu.svg" alt="Menu" />{" "}
          </div>
          <div className="hidden md:block">
            <div className="space-x-3">
              <button
                onClick={() => (UserModel.isLoggedIn ? handleSignOut() : (window.location.href = "/auth"))}
                className="px-6 py-2 font-medium transition-all duration-300 bg-transparent border-2 rounded-lg border-slate-blue text-slate-blue hover:bg-slate-blue hover:text-white"
              >
                {UserModel.isLoggedIn ? "Sign Out" : "Sign In"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default observer(Nav);
