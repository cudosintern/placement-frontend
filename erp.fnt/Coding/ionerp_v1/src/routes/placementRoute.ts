import { Outlet } from "react-router-dom";
import CompanyContactPage from "../pages/placement/master/company-contact/companyContactPage";

export const PLACEMENTROUTE = [
  {
    name: "Master",
    href: "",
    element: Outlet,
    roles: [],
    subItems: [
      {
        name: "Company Contact",
        href: "company-contact",
        roles: [],
        element: CompanyContactPage,
      },
    ],
  },
];

export default PLACEMENTROUTE;
