/* eslint-disable jsx-a11y/anchor-is-valid */
import PropTypes from "prop-types";
import clsx from "clsx";

const InputBase = (props) => {
  const {
    name,
    label,
    bottomLabel,
    type,
    placeholder,
    ariaLabel,
    inputElem,
    value,
    disabled,
    onChange,
    inputStyleClasses,
    wrapperStyleClasses,
    children,
    min,
    max,
    onWheel,
  } = props;

  return (
    <div className={clsx(["flex flex-col space-y-2 py-2", wrapperStyleClasses])}>
      <div className="flex justify-between">
        <label className="ml-2 text-lg font-bold text-slate-body">{label}</label>
      </div>
      {!inputElem ? (
        <input
          min={min}
          max={max}
          name={name}
          className={clsx(["p-3 border-2 rounded-lg", inputStyleClasses])}
          type={type}
          placeholder={placeholder}
          aria-label={ariaLabel}
          value={value}
          disabled={disabled}
          onWheel={(e) => e.target.blur()}
          onChange={(evt) => onChange(evt.target.value)}
        />
      ) : (
        inputElem
      )}
      {children}
      {bottomLabel && (
        <label className="text-base font-medium text-slate-body">
          <a href="" className="hover:text-slate-blue">
            {bottomLabel}
          </a>
        </label>
      )}
    </div>
  );
};

InputBase.defaultProps = {
  name: "",
  label: "",
  bottomLabel: "",
  type: "text",
  placeholder: "",
  ariaLabel: "Form input",
  inputElem: null,
  value: "",
  disabled: false,
  inputStyleClasses: "",
  wrapperStyleClasses: "",
  onChange: () => {},
};

InputBase.propTypes = {
  name: PropTypes.string,
  label: PropTypes.string,
  bottomLabel: PropTypes.string,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  ariaLabel: PropTypes.string,
  inputElem: PropTypes.element,
  value: PropTypes.any,
  disabled: PropTypes.bool,
  inputStyleClasses: PropTypes.string,
  wrapperStyleClasses: PropTypes.string,
  onChange: PropTypes.func,
  min: PropTypes.number,
  max: PropTypes.number,
};

export default InputBase;
