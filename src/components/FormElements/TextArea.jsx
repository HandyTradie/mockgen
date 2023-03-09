/* eslint-disable jsx-a11y/anchor-is-valid */
import PropTypes from "prop-types";
import InputBase from "./InputBase";

const TextArea = (props) => {
  const {
    name,
    label,
    bottomLabel,
    placeholder,
    ariaLabel,
    value,
    onChange,
  } = props;

  return (
    <InputBase
      label={label}
      bottomLabel={bottomLabel}
      placeholder={placeholder}
      ariaLabel={ariaLabel}
      inputElem={
        <div className="p-3 border-2 rounded-lg">
          <textarea
            className="w-full focus:outline-none"
            name={name}
            aria-label={ariaLabel}
            value={value}
            onChange={(evt) => {
              onChange(evt.target.value);
            }}
          />
        </div>
      }
    />
  );
};

TextArea.defaultProps = {
  name: "",
  label: "",
  bottomLabel: "",
  placeholder: "",
  ariaLabel: "Form input",
  value: '',
  onChange: () => {},
};

TextArea.propTypes = {
  name: PropTypes.string,
  label: PropTypes.string,
  bottomLabel: PropTypes.string,
  placeholder: PropTypes.string,
  ariaLabel: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
};

export default TextArea;
