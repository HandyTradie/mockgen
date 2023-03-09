import { Link, NavLink } from "react-router-dom";

const NavLinks = ({ links }) =>
  links.map((link) => (
    <li key={link.url}>
      <NavLink className="font-medium transition-all duration-300 hover:text-slate-blue" to={link.url}>
        <span>{link.name}</span>
      </NavLink>
    </li>
  ));

export default NavLinks;
