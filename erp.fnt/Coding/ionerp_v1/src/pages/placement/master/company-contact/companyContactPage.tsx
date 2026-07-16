import React from "react";
import ModalWithForm from "../../../../components/Modal/ModalWithForm";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import { PlacementApiEndpoint } from "../../../../utils/ApiEndpoint/placementApiEndpoints";
import { useAxios } from "../../../../hooks/useAxios";
import { Eye, Edit, Trash2, Plus, Phone, Mail, Building, Copy } from "lucide-react";
import { toast } from "react-toastify";

import {
  Schema,
  SchemaFields,
  SchemaColumnDefs,
} from "./companyContactSchema";

interface ViewDetailsModalProps {
  contact: any;
  isOpen: boolean;
  onClose: () => void;
}

const ViewDetailsModal: React.FC<ViewDetailsModalProps> = ({ contact, isOpen, onClose }) => {
  if (!isOpen || !contact) return null;

  const initials = `${contact.first_name?.charAt(0) || ""}${contact.last_name?.charAt(0) || ""}` || "C";

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header (Floating Close Button) */}
        <div className="flex justify-end p-3 absolute right-0 top-0 z-10">
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-50/80 hover:bg-slate-100 flex items-center justify-center text-slate-500 font-bold transition shadow-sm border border-slate-200/50 text-[10px]"
          >
            ✕
          </button>
        </div>

        {/* Profile Header Block (Vertically Compressed) */}
        <div className="px-6 pt-6 pb-4 bg-slate-50/50 border-b border-slate-100 text-center">
          {/* Circular Avatar (Smaller w-16 h-16) */}
          <div className="w-16 h-16 rounded-full mx-auto bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg flex items-center justify-center text-xl font-black uppercase tracking-wider border-4 border-white animate-in zoom-in-50 duration-300">
            {initials}
          </div>
          
          {/* Name & Designation (Tighter margins) */}
          <h3 className="text-lg font-black text-slate-800 tracking-tight mt-2">
            {contact.first_name || ""} {contact.last_name || ""}
          </h3>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full inline-block mt-1">
            {contact.designation_name || "Contact Person"}
          </span>

          {/* Quick actions (Smaller w-10 h-10 buttons) */}
          <div className="flex justify-center gap-3 mt-3">
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="w-10 h-10 rounded-full bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 shadow-md border border-slate-200/80 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                title="Call Contact"
              >
                <Phone className="w-4.5 h-4.5" />
              </a>
            )}
            {contact.email && (
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${contact.email}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-650 shadow-md border border-slate-200/80 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                title="Email Contact"
              >
                <Mail className="w-4.5 h-4.5" />
              </a>
            )}
          </div>
        </div>

        {/* Details Body (Tighter padding & spacing) */}
        <div className="p-4 space-y-3 text-left">
          <div className="space-y-3">
            {/* Company */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 flex-shrink-0">
                <Building className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Company</span>
                <span className="text-xs font-semibold text-slate-700 block truncate">{contact.company_name || "—"}</span>
              </div>
            </div>

            {/* Email with Copy Option */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 flex-shrink-0">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${contact.email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-slate-700 hover:text-indigo-600 transition block truncate"
                  >
                    {contact.email || "—"}
                  </a>
                  {contact.email && (
                    <button 
                      onClick={() => handleCopy(contact.email, "Email")}
                      className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-650 transition flex-shrink-0"
                      title="Copy Email"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Phone with Copy Option */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 flex-shrink-0">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                <div className="flex items-center gap-1.5">
                  <a href={`tel:${contact.phone}`} className="text-xs font-semibold text-slate-700 hover:text-indigo-600 transition block font-mono">{contact.phone || "—"}</a>
                  {contact.phone && (
                    <button 
                      onClick={() => handleCopy(contact.phone, "Phone number")}
                      className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-650 transition flex-shrink-0"
                      title="Copy Phone Number"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Status Card (More compact) */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl mt-3">
            <span className="text-[11px] font-bold text-slate-500">Primary Status</span>
            {contact.is_primary ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] font-extrabold tracking-wide uppercase flex items-center gap-1 shadow-sm">
                ✓ Primary
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[9px] font-bold tracking-wide uppercase">
                Standard
              </span>
            )}
          </div>
        </div>

        {/* Footer (More compact py-3) */}
        <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all duration-150"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};


const CompanyContactPage = () => {

  const { addItem, customApiCall } = useAxios(
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
    PlacementApiEndpoint.company.list,
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

  const companyOptions = ((companyData as any[]) || []).map(
    (company: any) => ({
      label: company.company_name,
      value: String(company.company_id),
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
  const [viewingContact, setViewingContact] = React.useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);

  const handleViewDetails = (contact: any) => {
    setViewingContact(contact);
    setIsViewModalOpen(true);
  };



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
        status: 1,
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
        status: 1,
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

  const makePrimaryContact = async (selectedContact: any) => {
    try {
      const payload = {
        contact_id: selectedContact.contact_id,
        company_id: selectedContact.company_id,
        first_name: selectedContact.first_name || selectedContact.name || "",
        last_name: selectedContact.last_name || "",
        email: selectedContact.email || "",
        phone: selectedContact.phone || "",
        designation_id: selectedContact.designation_id || null,
        is_primary: 1,
        status: 1,
      };

      await customApiCall(
        ApiEndpoint.placementContact.update_contact,
        "put",
        payload
      );

      // Refetch from server so UI reflects actual DB state
      await refetch();
    } catch (err) {
      console.error("Failed to set primary contact:", err);
    }
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


  const formFields = SchemaFields.map((group: any) => ({
    ...group,
    fields: group.fields.map((field: any) => {
      if (field.name === "designation") {
        return {
          ...field,
          loadOptions: async () => designationOptions,
        };
      }
      if (field.name === "company_id") {
        return {
          ...field,
          loadOptions: async () => companyOptions,
        };
      }
      return field;
    }),
  }));

  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(5);

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);

  const paginatedContacts = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredContacts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredContacts, currentPage, itemsPerPage]);

  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredContacts, itemsPerPage, totalPages]);

  return (
    <div className="p-1 space-y-6">
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

      {isViewModalOpen && (
        <ViewDetailsModal
          contact={viewingContact}
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 leading-tight">
            Company Contact Details
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage contact personnel, designations, and primary representatives for active companies.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filter Company:</label>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:border-gray-300 outline-none"
          >
            {companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={OpenModalHandler}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Add Contact
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-150 text-gray-400 bg-gray-50/20 text-xs uppercase tracking-wider font-semibold">
                <th className="px-5 py-2 w-10">#</th>
                <th className="px-5 py-2">Company</th>
                <th className="px-5 py-2">Contact Name</th>
                <th className="px-5 py-2">Designation</th>
                <th className="px-5 py-2">Email</th>
                <th className="px-5 py-2">Mobile</th>
                <th className="px-5 py-2 text-center">Primary</th>
                <th className="px-5 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-250">
              {paginatedContacts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-6 text-center text-sm text-gray-400">
                    No contacts found.
                  </td>
                </tr>
              ) : (
                paginatedContacts.map((contact, idx) => (
                  <tr key={contact.contact_id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-5 py-2 text-gray-400 text-xs">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td className="px-5 py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center justify-center uppercase flex-shrink-0">
                          {contact.company_name?.charAt(0) || "C"}
                        </div>
                        <span className="font-semibold text-gray-800">
                          {contact.company_name || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-2 font-semibold text-gray-700">
                      {`${contact.first_name || ""} ${contact.last_name || ""}`.trim()}
                    </td>
                    <td className="px-5 py-2">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                        {contact.designation_name || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-2 text-indigo-650 font-medium">{contact.email || "—"}</td>
                    <td className="px-5 py-2 text-gray-600 font-mono">{contact.phone || "—"}</td>
                    <td className="px-5 py-2 text-center">
                      {contact.is_primary ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-250 text-emerald-700 text-[10px] font-bold">
                          ✓ Primary
                        </span>
                      ) : (
                        <button
                          onClick={() => makePrimaryContact(contact)}
                          className="px-2.5 py-1 text-[10px] font-extrabold text-indigo-650 border border-indigo-200 hover:bg-indigo-50 rounded-lg transition"
                        >
                          Make Primary
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewDetails(contact)}
                          title="View Details"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => editContactHandler(contact)}
                          title="Edit"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteContactHandler(contact.contact_id)}
                          title="Delete"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-5 py-3 border-t border-gray-150 bg-gray-50/50 flex items-center justify-between gap-4 flex-wrap text-xs text-gray-500 font-semibold select-none">
          <div className="flex items-center gap-1.5">
            <span>Page Size:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-200 rounded px-1.5 py-0.5 bg-white text-gray-700 font-semibold cursor-pointer outline-none hover:border-gray-300 transition"
            >
              {[5, 10, 15, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <span>
              {filteredContacts.length === 0
                ? "0 to 0 of 0"
                : `${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(
                    currentPage * itemsPerPage,
                    filteredContacts.length
                  )} of ${filteredContacts.length}`}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer font-bold"
                title="First Page"
              >
                |&lt;
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer font-bold"
                title="Previous Page"
              >
                &lt;
              </button>
              <span>
                Page <span className="font-bold text-gray-800">{currentPage}</span> of{" "}
                <span className="font-bold text-gray-800">{totalPages || 1}</span>
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer font-bold"
                title="Next Page"
              >
                &gt;
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer font-bold"
                title="Last Page"
              >
                &gt;|
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyContactPage;


