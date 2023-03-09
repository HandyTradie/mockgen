/* eslint-disable jsx-a11y/anchor-is-valid */
import PropTypes from "prop-types";
import InputBase from "./InputBase";

const SelectInput = (props) => {
  const {
    name,
    label,
    bottomLabel,
    placeholder,
    ariaLabel,
    multiple,
    onChange,
    options,
    value,
  } = props;

  const handleDefaultValue = () => {
    const finder = options.filter((item) => item.selected);
    if (finder.length) return finder[0].value;
    return null;
  }

  return (
    <InputBase
      label={label}
      bottomLabel={bottomLabel}
      placeholder={placeholder}
      ariaLabel={ariaLabel}
      inputElem={
        <div className="p-3 border-2 rounded-lg bg-white">
          <select
            className="w-full focus:outline-none bg-inherit"
            name={name}
            aria-label={ariaLabel}
            multiple={multiple ? "multiple" : null}
            value={handleDefaultValue() || value}
            onChange={(evt) => {
              onChange(evt.target.value);
            }}
          >
            {options.map((item, index) => {
              return (
                <option
                  key={index}
                  disabled={item.disabled || null}
                  value={item.value}
                >
                  {item.label}
                </option>
              );
            })}
          </select>
        </div>
      }
    />
  );
};

SelectInput.defaultProps = {
  name: "",
  label: "",
  bottomLabel: "",
  placeholder: "",
  ariaLabel: "Form input",
  onChange: () => {},
  options: [],
  value: '',
};

SelectInput.propTypes = {
  name: PropTypes.string,
  label: PropTypes.string,
  bottomLabel: PropTypes.string,
  placeholder: PropTypes.string,
  ariaLabel: PropTypes.string,
  multiple: PropTypes.bool,
  onChange: PropTypes.func,
  value: PropTypes.any,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      disabled: PropTypes.bool,
      selected: PropTypes.bool,
      label: PropTypes.string,
      value: PropTypes.any.isRequired,
    })
  ),
};

export default SelectInput;
