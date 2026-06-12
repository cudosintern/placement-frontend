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
    </div>
  );
};

export default CompanyDetails;
