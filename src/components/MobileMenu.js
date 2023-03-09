import NavLink from "./NavLink";
import { useNavigate, Link } from "react-router-dom";
import XIcon from "@heroicons/react/outline/XIcon";
import { getAuth, signOut } from "firebase/auth";
import { observer } from "mobx-react-lite";

import UserModel from "../models/User";

const auth = getAuth();

const MobileMenu = ({ setShowMobileMenu, linkArray }) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      UserModel.clearUser();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section className="md:hidden">
      <div className="absolute top-0 w-full min-h-[295px] p-2 bg-white z-10">
        <div className="w-full p-5 bg-white rounded-2xl">
          <div className="flex items-center justify-between">
            <Link to="/">
              <img className="w-[160px] md:[100px] h-auto" src="/assets/logo.png" alt="Quizmine logo" />
            </Link>
            <div className="">
              <ul className="ml-12 space-x-12 font-medium md:flex text-slate-headline">
                <XIcon onClick={() => setShowMobileMenu(false)} className="w-6 h-6 text-slate-headline" />
              </ul>
            </div>
          </div>
          <div>
            <ul className="mt-6 space-y-4">
              <NavLink links={linkArray} />

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
          <div>
            <button
              onClick={() => (UserModel.isLoggedIn ? handleSignOut() : navigate("/auth"))}
              className="w-full mt-5 bg-slate-blue py-[10px] text-white rounded-lg px-6"
            >
              {UserModel.isLoggedIn ? "Sign Out" : "Sign In"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default observer(MobileMenu);
