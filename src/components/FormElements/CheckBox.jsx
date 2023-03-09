/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import PropTypes from "prop-types";
import InputBase from "./InputBase";
import CheckIcon from "@heroicons/react/outline/CheckIcon";
import { MathJax } from "better-react-mathjax";

const CheckBox = (props) => {
  const { name, label, bottomLabel, placeholder, ariaLabel, onChange, checked, disabled, latexLabel } = props;

  const [isChecked, setIsChecked] = React.useState(checked);

  return (
    <div className={`flex flex-row items-center cursor-pointer `}>
      <InputBase
        name={name}
        bottomLabel={bottomLabel}
        placeholder={placeholder}
        ariaLabel={ariaLabel}
        type="checkbox"
        disabled={disabled}
        inputStyleClasses="hidden"
        // className="hi"
      >
        <div
          className={`border-2 rounded-lg bg-white ${isChecked ? "p-1" : "p-3"} ${disabled && "cursor-not-allowed"}`}
          onClick={
            disabled
              ? null
              : () => {
                  setIsChecked(!isChecked);
                  onChange(() => !isChecked);
                }
          }
        >
          {isChecked && <CheckIcon className="w-4 h-4 text-blue-700" />}
        </div>
      </InputBase>
      {label && (
        <p className={`mt-2 ml-4 text-xl font-medium text-left line-clamp-4 ${latexLabel && disabled && "opacity-50"}`}>
          {latexLabel ? <MathJax>{label}</MathJax> : label}
        </p>
      )}
    </div>
  );
};

CheckBox.defaultProps = {
  name: "",
  label: "",
  ariaLabel: "Form input",
  onChange: () => {},
  checked: false,
};

CheckBox.propTypes = {
  name: PropTypes.string,
  label: PropTypes.string,
  ariaLabel: PropTypes.string,
  onChange: PropTypes.func,
  checked: PropTypes.bool,
};

export default CheckBox;
