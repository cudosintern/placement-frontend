import React from "react";
import DataTable from "../../../../components/Table/DataTable";
import ModalWithForm from "../../../../components/Modal/ModalWithForm";

import {
  Schema,
  SchemaFields,
  SchemaColumnDefs,
} from "./companyContactSchema";

const CompanyContactPage = () => {
 const [contacts, setContacts] = React.useState([
    {
      contact_id: 1,
      company_name: "Infosys",
      contact_name: "Ramesh Kumar",
      designation: "HR Manager",
      email: "ramesh@infosys.com",
      mobile: "9876543210",
      is_primary: true,
    },
    {
      contact_id: 2,
      company_name: "TCS",
      contact_name: "Krishna raj",
      designation: "Recruiter",
      email: "krishna@tcs.com",
      mobile: "9876543211",
      is_primary: false,
    },
    {
      contact_id: 3,
      company_name: "Infosys",
      contact_name: "Suresh Rao",
      designation: "Hr manager",
      email: "suresh@infosys.com",
      mobile: "9876544533",
      is_primary: false,
    },
    {
      contact_id: 5,
      company_name: "Wipro",
      contact_name: "kumar",
      designation: "Recruiter",
      email: "kumar@wipro.com",
      mobile: "9873443211",
      is_primary: true,
    },
    {
      contact_id: 6,
      company_name: "TCS",
      contact_name: "Sonny R",
      designation: "Recruiter",
      email: "suresh@tcs.com",
      mobile: "9876543211",
      is_primary: true,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedCompany, setSelectedCompany] = React.useState("All");
  const [editingContact, setEditingContact] = React.useState<any>(null);

  const OpenModalHandler = () => {
    setIsModalOpen(true);
  };

  const editContactHandler = (contact: any) => {
  setEditingContact(contact);
  setIsModalOpen(true);
};

 const deleteContactHandler = (contactId: number) => {
  const updatedContacts = contacts.filter(
    (contact) => contact.contact_id !== contactId
  );

  setContacts(updatedContacts);
};

  const closeModalHandler = () => {
     setIsModalOpen(false);
     setEditingContact(null);
  };

  const handleFormSubmit = (data: any) => {
    console.log(data);
    setIsModalOpen(false);
  };

  const makePrimaryContact = (selectedContact: any) => {
  const updatedContacts = contacts.map((contact) => {
    if (contact.company_name === selectedContact.company_name) {
      return {
        ...contact,
        is_primary: contact.contact_id === selectedContact.contact_id,
      };
    }
    return contact;
  });

  setContacts(updatedContacts);
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
          formFields={SchemaFields}
          schema={Schema}
          size={"lg"}
          columnLayout={1}
          initialValues={editingContact || {}}
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
        headerFilter={true}
        pageSize={20}
      />
    </div>
  );
};

export default CompanyContactPage;