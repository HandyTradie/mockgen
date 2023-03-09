import { autorun, makeAutoObservable, set, toJS } from "mobx";

class UserStore {
  _user = null;

  constructor() {
    makeAutoObservable(this);
    saveStore(this);
  }

  setUser(user) {
    this._user = user;
  }

  clearUser() {
    this._user = null;
  }

  get user() {
    return this._user;
  }
}

const saveStore = (_this) => {
  const storedJson = localStorage.getItem("b-u");
  if (storedJson) {
    set(_this, JSON.parse(storedJson));
  }

  autorun(() => {
    const value = toJS(_this);
    localStorage.setItem("b-u", JSON.stringify(value));
  });
};

export default new UserStore();
