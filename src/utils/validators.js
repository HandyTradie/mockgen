function validateEmail(email) {
  var re = /^[a-z0-9_.]+@\w+(\.[a-z]{2,3})+$/;
  return re.test(email);
}

function validateName(name) {
  var re = /^([a-zA-Z ]){2,30}$/;
  return re.test(name);
}

function validatePhoneNumber(phoneNumber) {
  var re = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return re.test(phoneNumber);
}

function validatePassword(password) {
  // if (password) {
  //     var re = /((?=.*\d)(?=.*[@#$%&])(?=.*[a-z])(?=.*[A-Z]){8,})/;
  //     return re.test(password);
  // }
  // return false;
  return true;
}
function errorMessages(field) {
  if (field === "Password") {
    return `${field} must be 8 characters minimumm and contain at lease one of the following characters: a-z, A-Z, 0-9, @#$%&`;
  } else if (field === "email") {
    return "Email provided is invalid";
  }
  return "";
}

export { validateEmail, validateName, validatePassword, validatePhoneNumber, errorMessages };
