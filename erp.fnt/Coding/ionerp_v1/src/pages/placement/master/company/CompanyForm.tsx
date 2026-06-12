import React from "react";
import { CompanyResponse } from "./responseInterface";
import { Schema } from "./companySchema";

type Props = {
  initial?: Partial<CompanyResponse>;
  onSubmit?: (data: Partial<CompanyResponse>) => void;
};

const CompanyForm: React.FC<Props> = ({ initial = {}, onSubmit }) => {
  const [form, setForm] = React.useState<Partial<CompanyResponse>>(initial);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Minimal client-side validation could be added here
    onSubmit?.(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Company Name</label>
        <input
          name="company_name"
          value={(form as any).company_name ?? (form as any).name ?? ""}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>Code</label>
        <input name="company_code" value={(form as any).company_code ?? ""} onChange={handleChange} />
      </div>
      <div>
        <label>Email</label>
        <input name="company_email" value={(form as any).company_email ?? (form as any).email ?? ""} onChange={handleChange} />
      </div>
      <div>
        <label>Phone</label>
        <input name="company_phone" value={(form as any).company_phone ?? (form as any).phone ?? ""} onChange={handleChange} />
      </div>
      <div>
        <label>Address</label>
        <input name="company_address" value={(form as any).company_address ?? (form as any).address ?? ""} onChange={handleChange} />
      </div>
      <button type="submit">Save</button>
    </form>
  );
};

export default CompanyForm;
