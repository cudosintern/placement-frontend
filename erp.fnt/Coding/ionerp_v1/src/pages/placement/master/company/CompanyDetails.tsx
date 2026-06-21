import React from "react";
import { CompanyResponse } from "./responseInterface";

type Props = {
  company: CompanyResponse | null;
};

const CompanyDetails: React.FC<Props> = ({ company }) => {
  if (!company) return <div>No company selected</div>;

  const name = (company as any).company_name ?? (company as any).name ?? "-";
  const code = (company as any).company_code ?? (company as any).code ?? "-";
  const email = (company as any).company_email ?? (company as any).email ?? "-";
  const phone = (company as any).company_phone ?? (company as any).phone ?? "-";
  const address = (company as any).company_address ?? (company as any).address ?? "-";
  const contactPerson =
    (company as any).company_contact_person ?? (company as any).contact_person ?? "-";
  const contactPhone =
    (company as any).company_contact_phone ?? (company as any).contact_phone ?? "-";
  const contactEmail =
    (company as any).company_contact_email ?? (company as any).contact_email ?? "-";
  const website = (company as any).company_website ?? (company as any).website ?? "-";
  const industry = (company as any).company_industry ?? (company as any).industry ?? "-";
  const established =
    (company as any).company_established_year ?? (company as any).established_year ?? "-";
  const employees = (company as any).company_employees ?? (company as any).employees ?? "-";
  const linkedin = (company as any).company_linkedin ?? (company as any).linkedin ?? "-";

  return (
    <div>
      <h3>Company Details</h3>
      <p>
        <strong>Name:</strong> {name}
      </p>
      <p>
        <strong>Code:</strong> {code}
      </p>
      <p>
        <strong>Email:</strong> {email}
      </p>
      <p>
        <strong>Phone:</strong> {phone}
      </p>
      <p>
        <strong>Address:</strong> {address}
      </p>
      <p>
        <strong>Contact Person:</strong> {contactPerson}
      </p>
      <p>
        <strong>Contact Phone:</strong> {contactPhone}
      </p>
      <p>
        <strong>Contact Email:</strong> {contactEmail}
      </p>
      <p>
        <strong>Website:</strong> {website}
      </p>
      <p>
        <strong>Industry:</strong> {industry}
      </p>
      <p>
        <strong>Established:</strong> {established}
      </p>
      <p>
        <strong>Employees:</strong> {employees}
      </p>
      <p>
        <strong>LinkedIn:</strong> {linkedin}
      </p>
    </div>
  );
};

export default CompanyDetails;
