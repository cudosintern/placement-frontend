import React, { useEffect, useState } from "react";
import DataTable from "../../../../components/Table/DataTable";
import ModalWithForm from "../../../../components/Modal/ModalWithForm";
import companyContactService from "./companyContactService";

import {
  Schema,
  SchemaFields,
  SchemaColumnDefs,
} from "./companyContactSchema";

const CompanyContactPage = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [companiesOptions, setCompaniesOptions] = useState<any[]>([]);
  const [designationsOptions, setDesignationsOptions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [editingContact, setEditingContact] = useState<any>(null);

  const loadContacts = async () => {
    const response = await companyContactService.getContacts();
    const formatted = ((response as any).data || []).map((c: any) => ({
      contact_id: c.contact_id,
      company_id: String(c.company_id),
      company_name: c.company_name || "",
      contact_name: `${c.first_name} ${c.last_name || ""}`.trim(),
      designation_id: String(c.designation_id || ""),
      designation_name: c.designation_name || "",
      email: c.email || "",
      mobile: c.phone || "",
      is_primary: c.is_primary === 1 || c.is_primary === true,
    }));
    setContacts(formatted);
  };

  useEffect(() => {
    const loadData = async () => {
      await loadContacts();
      
      const compRes = await companyContactService.getCompanies();
      const compOpts = ((compRes as any).data || []).map((c: any) => ({
        label: c.company_name,
        value: String(c.company_id),
      }));
      setCompaniesOptions(compOpts);

      const desRes = await companyContactService.getDesignations();
      const desOpts = ((desRes as any).data || []).map((d: any) => ({
        label: d.designation_name,
        value: String(d.designation_id),
      }));
      setDesignationsOptions(desOpts);
    };
    loadData();
  }, []);

  const OpenModalHandler = () => {
    setIsModalOpen(true);
  };

  const editContactHandler = (contact: any) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const deleteContactHandler = async (contactId: number) => {
    try {
      // First update status to 0 (inactive), then delete
      await companyContactService.updateContact({ contact_id: contactId, status: 0 });
      await companyContactService.deleteContact(contactId);
      await loadContacts();
    } catch (error) {
      console.error(error);
    }
  };

  const closeModalHandler = () => {
    setIsModalOpen(false);
    setEditingContact(null);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      const parts = data.contact_name.trim().split(/\s+/);
      const first_name = parts[0] || "";
      const last_name = parts.slice(1).join(" ") || "";

      const payload = {
        company_id: parseInt(data.company_id),
        first_name: first_name,
        last_name: last_name,
        email: data.email,
        phone: data.mobile,
        designation_id: parseInt(data.designation_id),
        is_primary: data.is_primary ? 1 : 0,
      };

      if (editingContact) {
        await companyContactService.updateContact({
          contact_id: editingContact.contact_id,
          ...payload,
        });
      } else {
        await companyContactService.addContact(payload);
      }

      await loadContacts();
      setIsModalOpen(false);
      setEditingContact(null);
    } catch (error) {
      console.error(error);
    }
  };

  const makePrimaryContact = async (selectedContact: any) => {
    try {
      await companyContactService.updateContact({
        contact_id: selectedContact.contact_id,
        is_primary: 1,
      });
      await loadContacts();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredContacts =
    selectedCompany === "All"
      ? contacts
      : contacts.filter(
          (contact) => contact.company_name === selectedCompany
        );

  const companies = [
    "All",
    ...Array.from(new Set(contacts.map((contact) => contact.company_name))),
  ];

  const columnDefsWithAction = [
    ...SchemaColumnDefs,
    {
      headerName: "Primary Action",
      cellRenderer: (params: any) => {
        if (params.data.is_primary) {
          return "Current Primary";
        }

        return (
          <button
            onClick={() => makePrimaryContact(params.data)}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Make Primary
          </button>
        );
      },
    },
    {
      headerName: "Edit",
      cellRenderer: (params: any) => (
        <button
          onClick={() => editContactHandler(params.data)}
          className="bg-green-500 text-white px-2 py-1 rounded text-xs mr-2"
        >
          Edit
        </button>
      ),
    },
    {
      headerName: "Delete",
      cellRenderer: (params: any) => (
        <button
          onClick={() => deleteContactHandler(params.data.contact_id)}
          className="bg-red-500 text-white px-2 py-1 rounded text-xs"
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <div>
      {isModalOpen && (
        <ModalWithForm
          title={"Company Contact"}
          isOpen={isModalOpen}
          onSubmit={handleFormSubmit}
          onClose={closeModalHandler}
          formFields={SchemaFields.map((group: any) => ({
            ...group,
            fields: group.fields.map((field: any) => {
              if (field.name === "company_id") {
                return { ...field, options: companiesOptions };
              }
              if (field.name === "designation_id") {
                return { ...field, options: designationsOptions };
              }
              return field;
            }),
          }))}
          schema={Schema}
          size={"lg"}
          columnLayout={1}
          initialValues={
            editingContact
              ? {
                  ...editingContact,
                  company_id: String(editingContact.company_id),
                  designation_id: String(editingContact.designation_id),
                }
              : {}
          }
        />
      )}

      <h3 className="text-lg leading-6 font-medium pb-5">
        Company Contact Details
      </h3>

      <div className="mb-4">
        <label className="mr-2 font-medium">Company:</label>
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="border rounded px-2 py-1"
        >
          {companies.map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columnDefs={columnDefsWithAction}
        rowData={filteredContacts}
        showAddButton={true}
        addButtonHandler={OpenModalHandler}
        showExportButton={false}
        headerFilter={false}
        pageSize={20}
      />
    </div>
  );
};

export default CompanyContactPage;