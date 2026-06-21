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
          <div>
            <label>Contact Person</label>
            <input name="company_contact_person" value={(form as any).company_contact_person ?? (form as any).contact_person ?? ""} onChange={handleChange} />
          </div>
          <div>
            <label>Contact Phone</label>
            <input name="company_contact_phone" value={(form as any).company_contact_phone ?? (form as any).contact_phone ?? ""} onChange={handleChange} />
          </div>
          <div>
            <label>Contact Email</label>
            <input name="company_contact_email" value={(form as any).company_contact_email ?? (form as any).contact_email ?? ""} onChange={handleChange} />
          </div>
          <div>
            <label>Website</label>
            <input name="company_website" value={(form as any).company_website ?? (form as any).website ?? ""} onChange={handleChange} />
          </div>
          <div>
            <label>Industry</label>
            <input name="company_industry" value={(form as any).company_industry ?? (form as any).industry ?? ""} onChange={handleChange} />
          </div>
          <div>
            <label>Established Year</label>
            <input type="number" name="company_established_year" value={(form as any).company_established_year ?? (form as any).established_year ?? ""} onChange={handleChange} />
          </div>
          <div>
            <label>Employees</label>
            <input type="number" name="company_employees" value={(form as any).company_employees ?? (form as any).employees ?? ""} onChange={handleChange} />
          </div>
          <div>
            <label>LinkedIn</label>
            <input name="company_linkedin" value={(form as any).company_linkedin ?? (form as any).linkedin ?? ""} onChange={handleChange} />
          </div>
      <button type="submit">Save</button>
    </form>
  );
};

export default CompanyForm;
