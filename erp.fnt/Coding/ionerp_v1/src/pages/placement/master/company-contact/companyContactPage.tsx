import React from "react";
import DataTable from "../../../../components/Table/DataTable";
import ModalWithForm from "../../../../components/Modal/ModalWithForm";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import { useAxios } from "../../../../hooks/useAxios"; 

import {
  Schema,
  SchemaFields, 
  SchemaColumnDefs,
} from "./companyContactSchema";

const CompanyContactPage = () => {

const { addItem,customApiCall} = useAxios(
  ApiEndpoint.placementContact.add_contact,
  {
    method: "post",
    shouldFetch: false,
  }
);

const { responseData, refetch } = useAxios(
  ApiEndpoint.placementContact.get_contact_list,
  {
    method: "get",
    shouldFetch: true,
  }
);
console.log("responseData =", responseData);


const { responseData: companyData } = useAxios(
  ApiEndpoint.company.company_list,
  {
    method: "get",
    shouldFetch: true,
  }
);

const { responseData: designationData } = useAxios(
  ApiEndpoint.placementContact.get_designations,
  {
    method: "get",
    shouldFetch: true,
  }
);

const designationOptions = ((designationData as any[]) || []).map(
  (designation: any) => ({
    label: designation.designation_name,
    value: designation.designation_id,
  })
);

React.useEffect(() => {
  console.log("responseData =", responseData);
  if (Array.isArray(responseData)) {
    setContacts(responseData);
  }
}, [responseData]);
React.useEffect(() => {
  console.log("designationData =", designationData);
  console.log("companyData =", companyData);
}, [companyData]);


 const [contacts, setContacts] = React.useState<any[]>([]);
    console.log("First Contact =", contacts[0]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedCompany, setSelectedCompany] = React.useState("All");
  const [editingContact, setEditingContact] = React.useState<any>(null);

  const OpenModalHandler = () => {
    setIsModalOpen(true);
  };

 const editContactHandler = (contact: any) => {
  setEditingContact({
    company_id: String(contact.company_id),
    contact_name: `${contact.first_name || ""} ${contact.last_name || ""}`,
    designation: String(contact.designation_id),
    email: contact.email || "",
    mobile: contact.phone || "",
    is_primary: contact.is_primary,
    contact_id: contact.contact_id,
  }); 

  setIsModalOpen(true);
};

const deleteContactHandler = async (contactId: number) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this contact?"
  );

  if (!confirmDelete) return;

  const response = await customApiCall(
    ApiEndpoint.placementContact.delete_contact,
    "delete",
    {
      contact_id: contactId,
    }
  );

  console.log("Delete Response =", response);

  await refetch();
};

  const closeModalHandler = () => {
     setIsModalOpen(false);
     setEditingContact(null);
  };

  const handleFormSubmit = async (data: any) => {
  console.log("Submitted Data:", data);

  if (editingContact) {
    const updatePayload = {
      contact_id: editingContact.contact_id,
      company_id: data.company_id,
      first_name: data.contact_name,
      last_name: "",
      email: data.email,
      phone: data.mobile,
      designation_id: data.designation,
      is_primary: data.is_primary,
      is_active: 1,
    };

    const response = await customApiCall(
  ApiEndpoint.placementContact.update_contact,
  "put",
  updatePayload
);

    console.log("Update Response =", response);
    await refetch();
  } else {
    const payload = {
      company_id: data.company_id,
      first_name: data.contact_name,
      last_name: "",
      email: data.email,
      phone: data.mobile,
      designation_id: data.designation,
      is_primary: data.is_primary,
      is_active: 1,
    };

    const response = await addItem(
  payload,
  ApiEndpoint.placementContact.add_contact
);

  
    console.log("Add Contact Response =", response);
    await refetch();
  }

  setIsModalOpen(false);
  setEditingContact(null);
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
console.log("First Company =", (companyData as any[])?.[0]);

const contactsWithCompanyName = contacts.map((contact: any) => {
  const company = (companyData as any[])?.find(
    (c: any) => c.company_id === contact.company_id
  );

  return {
    ...contact,
    company_name: company?.company_name || "",
  };
});

console.log("contactsWithCompanyName =", contactsWithCompanyName);

const filteredContacts =
  selectedCompany === "All"
    ? contactsWithCompanyName

    : contactsWithCompanyName.filter(
      
        (contact: any) => contact.company_name === selectedCompany
      );
console.log("companyData =", companyData);

const companies = [
  "All",
  ...Array.from(
    new Set(
      ((companyData as any[]) || []).map(
        (company: any) => company.company_name
      )
    )
  ),
];

console.log("companies =", companies);
console.log("companyData =", companyData);


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
const formFields = SchemaFields.map((group: any) => ({
  ...group,
  fields: group.fields.map((field: any) =>
    field.name === "designation"
      ? {
          ...field,
          loadOptions: async () => designationOptions,
        }
      : field
  ),
}));
return (
    <div>
      {isModalOpen && (
        <ModalWithForm
          title={"Company Contact"}
          isOpen={isModalOpen}
          onSubmit={handleFormSubmit}
          onClose={closeModalHandler}
          formFields={formFields}
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
        headerFilter={false}
        pageSize={20}
      />
    </div>
  );
};

export default CompanyContactPage;

//cd "C:\Users\sound\Placement Module\placement-backend\edu.erp\Coding\backend"
//python -m uvicorn app.main:app --reload --port 8003
