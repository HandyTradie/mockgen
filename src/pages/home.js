import React from "react";
import { Link } from "react-router-dom";
import { observer } from "mobx-react-lite";

import User from "../models/User";
import "../firebase";

const Homepage = () => {
  return (
    <div className="mt-[50px] md:mt-20 text-center m-auto">
      <div className="max-w-[790px] m-auto">
        <h1 className="font-medium text-slate-headline text-mobile-h1 md:text-desktop-h1">Mock Generation Simplified</h1>
        <p className="mt-[30px] text-desktop-subheading">
          Web platform for generating quizzes, paying for the generated quiz, downloading PDFs with the marking scheme or taking the test
          online.
        </p>
      </div>
      <div className="flex flex-col justify-center gap-4 mt-8 md:gap-1 md:space-x-4 md:flex-row md:mt-10">
        <Link to="/generator">
          <button className="px-8 h-[60px] w-full md:w-auto font-medium text-white rounded-lg bg-slate-blue text-desktop-paragraph filter hover:brightness-125">
            Create a Mock Exam
          </button>
        </Link>
        {!User.isLoggedIn && (
          <Link to="/auth">
            <button className="px-8 h-[60px] w-full md:w-auto font-medium transition-all duration-300 border-2 rounded-lg md:mt-0 text-slate-blue border-slate-blue hover:text-white hover:bg-slate-blue text-desktop-paragraph">
              Sign In
            </button>
          </Link>
        )}
      </div>
      {/* <div className="relative mt-[56px] md:mt-20 flex items-center justify-center h-[194px] md:h-[680px] bg-white bg-opacity-70 rounded-3xl">
        <img className="h-[188px] md:h-auto mt-8 md:mt-[100px]" src="/assets/heros/groupbanner.svg" alt="" />
      </div> */}
      <div className="pt-[143px] clear-both" />
    </div>
  );
};

export default observer(Homepage);
