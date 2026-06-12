
import Home from "../pages/ems/home";

import DepartmentPage from "../pages/ems/configuration/departmentDetail/departmentPage";
import CompanyList from "../pages/placement/master/company/CompanyList";

import { Outlet } from "react-router-dom";
import CompanyContactPage from "../pages/placement/master/company-contact/companyContactPage";
import ChangePasswordPage from "../pages/changepassword";

export const PLACEMENTROUTE = [
  {
    name: "Home",
    href: "/",
    element: Home,
    roles: [],
    subItems: [],
  },
  {
    name: "Change Password",
    href: "/change_password",
    element: ChangePasswordPage,
    roles: [],
    subItems: [],
  },
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
        subItems: [],
      },
      {
        name: "Configuration",
        href: "",
        element: Outlet,
        roles: [],
        subItems: [
          {
            name: "Department",
            href: "department",
            roles: [],
            element: DepartmentPage,
            subItems: [],
          },
          {
            name: "Company",
            href: "company",
            roles: [],
            element: CompanyList,
            subItems: [],
          },
        ],
      },
    ],
  },
];






